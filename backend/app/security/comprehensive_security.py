"""
Comprehensive Security Implementation for ACI Dashboard
Implements all ACI Security Standards including OWASP Top 10 protection
"""

import time
import hashlib
import secrets
import re
import logging
from typing import Dict, List, Optional, Any, Set
from functools import wraps
from datetime import datetime, timedelta, timezone
import ipaddress
from collections import defaultdict, deque

from fastapi import Request, Response, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from jose import jwt, JWTError
from passlib.context import CryptContext
from pydantic import BaseModel
import redis
from sqlalchemy.orm import Session

from app.core.config import settings
from app.security.sql_injection_prevention import SecureSQLValidator, SQLInjectionError

logger = logging.getLogger(__name__)

# Initialize security components
security = HTTPBearer()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class SecurityConfig:
    """Security configuration constants"""
    
    # Rate limiting
    MAX_REQUESTS_PER_MINUTE = 60
    MAX_LOGIN_ATTEMPTS = 100
    LOGIN_LOCKOUT_DURATION = 15 * 60  # 15 minutes
    
    # Password policy
    MIN_PASSWORD_LENGTH = 12
    PASSWORD_REQUIRE_UPPERCASE = True
    PASSWORD_REQUIRE_LOWERCASE = True
    PASSWORD_REQUIRE_DIGIT = True
    PASSWORD_REQUIRE_SPECIAL = True
    
    # Session security
    SESSION_TIMEOUT = 30 * 60  # 30 minutes
    MAX_CONCURRENT_SESSIONS = 5
    
    # Content Security Policy
    CSP_POLICY = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; "
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
        "font-src 'self' https://fonts.gstatic.com; "
        "img-src 'self' data: https:; "
        "connect-src 'self' ws: wss:; "
        "frame-ancestors 'none'; "
        "base-uri 'self'; "
        "form-action 'self'"
    )
    
    # Security headers
    SECURITY_HEADERS = {
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "X-XSS-Protection": "1; mode=block",
        "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
        "Content-Security-Policy": CSP_POLICY
    }

class SecurityViolation(Exception):
    """Raised when a security violation is detected"""
    pass

class RateLimiter:
    """Advanced rate limiting with multiple strategies"""
    
    def __init__(self, redis_client=None):
        self.redis_client = redis_client or redis.Redis(host='localhost', port=6379, db=0)
        self.memory_cache = defaultdict(deque)
        self.blocked_ips = set()
    
    def is_rate_limited(self, identifier: str, limit: int, window: int) -> bool:
        """Check if identifier is rate limited"""
        try:
            key = f"rate_limit:{identifier}"
            
            if self.redis_client:
                # Use Redis for distributed rate limiting
                pipe = self.redis_client.pipeline()
                pipe.zremrangebyscore(key, 0, time.time() - window)
                pipe.zcard(key)
                pipe.zadd(key, {str(time.time()): time.time()})
                pipe.expire(key, window)
                results = pipe.execute()
                
                current_count = results[1]
                return current_count >= limit
            else:
                # Fallback to memory-based rate limiting
                now = time.time()
                window_start = now - window
                
                # Clean old entries
                while self.memory_cache[identifier] and self.memory_cache[identifier][0] < window_start:
                    self.memory_cache[identifier].popleft()
                
                # Check current count
                if len(self.memory_cache[identifier]) >= limit:
                    return True
                
                # Add current request
                self.memory_cache[identifier].append(now)
                return False
                
        except Exception as e:
            logger.error(f"Rate limiting error: {e}")
            return False
    
    def block_ip(self, ip_address: str, duration: int = 3600):
        """Block an IP address for a specified duration"""
        try:
            key = f"blocked_ip:{ip_address}"
            if self.redis_client:
                self.redis_client.setex(key, duration, "blocked")
            else:
                self.blocked_ips.add(ip_address)
            
            logger.warning(f"IP {ip_address} blocked for {duration} seconds")
        except Exception as e:
            logger.error(f"Error blocking IP: {e}")
    
    def is_ip_blocked(self, ip_address: str) -> bool:
        """Check if an IP address is blocked"""
        try:
            if self.redis_client:
                key = f"blocked_ip:{ip_address}"
                return self.redis_client.exists(key)
            else:
                return ip_address in self.blocked_ips
        except Exception as e:
            logger.error(f"Error checking blocked IP: {e}")
            return False

class InputValidator:
    """Advanced input validation and sanitization"""
    
    # XSS patterns
    XSS_PATTERNS = [
        r'<script[^>]*>.*?</script>',
        r'javascript:',
        r'vbscript:',
        r'onload\s*=',
        r'onerror\s*=',
        r'onclick\s*=',
        r'onmouseover\s*=',
        r'<iframe[^>]*>',
        r'<embed[^>]*>',
        r'<object[^>]*>',
        r'<applet[^>]*>',
        r'<meta[^>]*>',
        r'<link[^>]*>',
        r'<form[^>]*>',
        r'<input[^>]*>',
    ]
    
    # Command injection patterns
    COMMAND_INJECTION_PATTERNS = [
        r'[;&|`$(){}[\]\\]',
        r'\.\./+',
        r'/etc/',
        r'/proc/',
        r'/sys/',
        r'\\\\',
        r'cmd\.exe',
        r'powershell',
        r'/bin/',
        r'/usr/',
    ]
    
    @classmethod
    def validate_and_sanitize(cls, input_data: Any, field_name: str = "input") -> Any:
        """Comprehensive input validation and sanitization"""
        if isinstance(input_data, str):
            return cls._validate_string(input_data, field_name)
        elif isinstance(input_data, dict):
            return {k: cls.validate_and_sanitize(v, f"{field_name}.{k}") for k, v in input_data.items()}
        elif isinstance(input_data, list):
            return [cls.validate_and_sanitize(item, f"{field_name}[{i}]") for i, item in enumerate(input_data)]
        else:
            return input_data
    
    @classmethod
    def _validate_string(cls, input_str: str, field_name: str) -> str:
        """Validate and sanitize string input"""
        if not input_str:
            return input_str
        
        # Check for SQL injection
        try:
            SecureSQLValidator.validate_input(input_str, field_name)
        except SQLInjectionError as e:
            raise SecurityViolation(f"SQL injection attempt in {field_name}: {str(e)}")
        
        # Check for XSS
        for pattern in cls.XSS_PATTERNS:
            if re.search(pattern, input_str, re.IGNORECASE):
                raise SecurityViolation(f"XSS attempt detected in {field_name}")
        
        # Check for command injection
        for pattern in cls.COMMAND_INJECTION_PATTERNS:
            if re.search(pattern, input_str, re.IGNORECASE):
                raise SecurityViolation(f"Command injection attempt detected in {field_name}")
        
        # Sanitize HTML
        import html
        sanitized = html.escape(input_str)
        
        # Remove null bytes
        sanitized = sanitized.replace('\x00', '')
        
        # Limit length to prevent DoS
        if len(sanitized) > 10000:
            raise SecurityViolation(f"Input too long in {field_name}")
        
        return sanitized

class PasswordValidator:
    """Advanced password validation and security"""
    
    # Common weak passwords
    WEAK_PASSWORDS = {
        "password", "123456", "123456789", "qwerty", "abc123", "password123",
        "admin", "root", "user", "guest", "test", "demo", "temp", "welcome",
        "login", "master", "secret", "super", "letmein", "dragon", "monkey",
        "princess", "sunshine", "shadow", "football", "baseball", "superman"
    }
    
    @classmethod
    def validate_password_strength(cls, password: str) -> Dict[str, Any]:
        """Comprehensive password strength validation"""
        issues = []
        score = 0
        
        # Length check
        if len(password) < SecurityConfig.MIN_PASSWORD_LENGTH:
            issues.append(f"Password must be at least {SecurityConfig.MIN_PASSWORD_LENGTH} characters long")
        else:
            score += min(len(password) - SecurityConfig.MIN_PASSWORD_LENGTH, 10)
        
        # Character requirements
        if SecurityConfig.PASSWORD_REQUIRE_UPPERCASE and not re.search(r'[A-Z]', password):
            issues.append("Password must contain at least one uppercase letter")
        else:
            score += 5
        
        if SecurityConfig.PASSWORD_REQUIRE_LOWERCASE and not re.search(r'[a-z]', password):
            issues.append("Password must contain at least one lowercase letter")
        else:
            score += 5
        
        if SecurityConfig.PASSWORD_REQUIRE_DIGIT and not re.search(r'[0-9]', password):
            issues.append("Password must contain at least one digit")
        else:
            score += 5
        
        if SecurityConfig.PASSWORD_REQUIRE_SPECIAL and not re.search(r'[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]', password):
            issues.append("Password must contain at least one special character")
        else:
            score += 5
        
        # Check for common patterns
        if re.search(r'(.)\1{3,}', password):
            issues.append("Password contains too many repeated characters")
            score -= 10
        
        if re.search(r'(123|abc|qwe|asd|zxc)', password, re.IGNORECASE):
            issues.append("Password contains common sequences")
            score -= 10
        
        # Check against weak password list
        if password.lower() in cls.WEAK_PASSWORDS:
            issues.append("Password is too common")
            score -= 20
        
        # Calculate strength
        strength = "weak"
        if score >= 20:
            strength = "strong"
        elif score >= 10:
            strength = "medium"
        
        return {
            "valid": len(issues) == 0,
            "issues": issues,
            "score": max(0, score),
            "strength": strength
        }
    
    @classmethod
    def generate_secure_password(cls, length: int = 16) -> str:
        """Generate a cryptographically secure password"""
        if length < SecurityConfig.MIN_PASSWORD_LENGTH:
            length = SecurityConfig.MIN_PASSWORD_LENGTH
        
        # Character sets
        uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
        lowercase = "abcdefghijklmnopqrstuvwxyz"
        digits = "0123456789"
        special = "!@#$%^&*()_+-=[]{}|;:,.<>?"
        
        # Ensure at least one character from each required set
        password_chars = []
        if SecurityConfig.PASSWORD_REQUIRE_UPPERCASE:
            password_chars.append(secrets.choice(uppercase))
        if SecurityConfig.PASSWORD_REQUIRE_LOWERCASE:
            password_chars.append(secrets.choice(lowercase))
        if SecurityConfig.PASSWORD_REQUIRE_DIGIT:
            password_chars.append(secrets.choice(digits))
        if SecurityConfig.PASSWORD_REQUIRE_SPECIAL:
            password_chars.append(secrets.choice(special))
        
        # Fill remaining length
        all_chars = uppercase + lowercase + digits + special
        for _ in range(length - len(password_chars)):
            password_chars.append(secrets.choice(all_chars))
        
        # Shuffle the characters
        secrets.SystemRandom().shuffle(password_chars)
        
        return ''.join(password_chars)

class SecurityMiddleware(BaseHTTPMiddleware):
    """Comprehensive security middleware"""
    
    def __init__(self, app, rate_limiter: RateLimiter = None):
        super().__init__(app)
        self.rate_limiter = rate_limiter or RateLimiter()
        self.suspicious_ips = defaultdict(int)
    
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        
        try:
            # Get client IP
            client_ip = self._get_client_ip(request)
            
            # Check if IP is blocked
            if self.rate_limiter.is_ip_blocked(client_ip):
                logger.warning(f"Blocked IP attempt: {client_ip}")
                return JSONResponse(
                    status_code=429,
                    content={"detail": "Access denied"}
                )
            
            # Rate limiting
            if self.rate_limiter.is_rate_limited(
                client_ip, 
                SecurityConfig.MAX_REQUESTS_PER_MINUTE, 
                60
            ):
                logger.warning(f"Rate limit exceeded for IP: {client_ip}")
                self.suspicious_ips[client_ip] += 1
                
                # Block IP if too many rate limit violations
                if self.suspicious_ips[client_ip] >= 5:
                    self.rate_limiter.block_ip(client_ip, 3600)  # Block for 1 hour
                
                return JSONResponse(
                    status_code=429,
                    content={"detail": "Rate limit exceeded"}
                )
            
            # Validate request size
            content_length = request.headers.get('content-length')
            if content_length and int(content_length) > 1024 * 1024:  # 1MB limit
                logger.warning(f"Request too large from IP: {client_ip}")
                return JSONResponse(
                    status_code=413,
                    content={"detail": "Request too large"}
                )
            
            # Security headers check
            self._validate_security_headers(request)
            
            # Input validation
            await self._validate_request_input(request)
            
            # Process request
            response = await call_next(request)
            
            # Add security headers to response
            self._add_security_headers(response)
            
            # Log request
            process_time = time.time() - start_time
            logger.info(
                f"Request processed - IP: {client_ip}, "
                f"Method: {request.method}, "
                f"Path: {request.url.path}, "
                f"Status: {response.status_code}, "
                f"Time: {process_time:.3f}s"
            )
            
            return response
            
        except SecurityViolation as e:
            logger.warning(f"Security violation from {client_ip}: {str(e)}")
            self.suspicious_ips[client_ip] += 1
            
            return JSONResponse(
                status_code=400,
                content={"detail": "Invalid request"}
            )
        except Exception as e:
            logger.error(f"Security middleware error: {str(e)}")
            return JSONResponse(
                status_code=500,
                content={"detail": "Internal server error"}
            )
    
    def _get_client_ip(self, request: Request) -> str:
        """Extract client IP from request"""
        # Check for forwarded headers
        forwarded_for = request.headers.get('x-forwarded-for')
        if forwarded_for:
            return forwarded_for.split(',')[0].strip()
        
        real_ip = request.headers.get('x-real-ip')
        if real_ip:
            return real_ip
        
        # Fallback to client host
        return request.client.host if request.client else "unknown"
    
    def _validate_security_headers(self, request: Request):
        """Validate security-related headers"""
        # Check for suspicious user agents
        user_agent = request.headers.get('user-agent', '').lower()
        suspicious_agents = ['sqlmap', 'nikto', 'nmap', 'masscan', 'dirb', 'gobuster', 'wfuzz']
        
        if any(agent in user_agent for agent in suspicious_agents):
            raise SecurityViolation(f"Suspicious user agent: {user_agent}")
    
    async def _validate_request_input(self, request: Request):
        """Validate request input for security issues"""
        # Validate query parameters
        for key, value in request.query_params.items():
            InputValidator.validate_and_sanitize(value, f"query.{key}")
        
        # Validate headers
        for key, value in request.headers.items():
            if key.lower() not in ['authorization', 'cookie', 'content-type', 'content-length']:
                InputValidator.validate_and_sanitize(value, f"header.{key}")
        
        # Validate JSON body if present
        if request.method in ['POST', 'PUT', 'PATCH'] and 'application/json' in request.headers.get('content-type', ''):
            try:
                body = await request.body()
                if body:
                    import json
                    json_data = json.loads(body)
                    InputValidator.validate_and_sanitize(json_data, "body")
            except json.JSONDecodeError:
                pass  # Invalid JSON will be handled by FastAPI
    
    def _add_security_headers(self, response: Response):
        """Add security headers to response"""
        for header, value in SecurityConfig.SECURITY_HEADERS.items():
            response.headers[header] = value

class SessionManager:
    """Secure session management"""
    
    def __init__(self, redis_client=None):
        self.redis_client = redis_client or redis.Redis(host='localhost', port=6379, db=1)
        self.active_sessions = {}
    
    def create_session(self, user_id: int, user_data: Dict[str, Any]) -> str:
        """Create a secure session"""
        session_id = secrets.token_urlsafe(32)
        
        session_data = {
            'user_id': user_id,
            'user_data': user_data,
            'created_at': datetime.now(timezone.utc).isoformat(),
            'last_activity': datetime.now(timezone.utc).isoformat(),
            'ip_address': user_data.get('ip_address'),
            'user_agent': user_data.get('user_agent')
        }
        
        try:
            if self.redis_client:
                key = f"session:{session_id}"
                self.redis_client.setex(
                    key, 
                    SecurityConfig.SESSION_TIMEOUT,
                    json.dumps(session_data)
                )
            else:
                self.active_sessions[session_id] = {
                    **session_data,
                    'expires_at': datetime.now(timezone.utc) + timedelta(seconds=SecurityConfig.SESSION_TIMEOUT)
                }
            
            # Enforce concurrent session limit
            self._enforce_session_limit(user_id)
            
        except Exception as e:
            logger.error(f"Session creation error: {e}")
            raise
        
        return session_id
    
    def validate_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Validate and refresh session"""
        try:
            if self.redis_client:
                key = f"session:{session_id}"
                session_data = self.redis_client.get(key)
                if session_data:
                    data = json.loads(session_data)
                    # Refresh session
                    self.redis_client.expire(key, SecurityConfig.SESSION_TIMEOUT)
                    return data
            else:
                session_data = self.active_sessions.get(session_id)
                if session_data and session_data['expires_at'] > datetime.now(timezone.utc):
                    # Refresh session
                    session_data['expires_at'] = datetime.now(timezone.utc) + timedelta(seconds=SecurityConfig.SESSION_TIMEOUT)
                    return session_data
            
        except Exception as e:
            logger.error(f"Session validation error: {e}")
        
        return None
    
    def invalidate_session(self, session_id: str):
        """Invalidate a session"""
        try:
            if self.redis_client:
                key = f"session:{session_id}"
                self.redis_client.delete(key)
            else:
                self.active_sessions.pop(session_id, None)
        except Exception as e:
            logger.error(f"Session invalidation error: {e}")
    
    def _enforce_session_limit(self, user_id: int):
        """Enforce maximum concurrent sessions per user"""
        try:
            if self.redis_client:
                pattern = f"session:*"
                sessions = []
                for key in self.redis_client.scan_iter(match=pattern):
                    data = self.redis_client.get(key)
                    if data:
                        session_data = json.loads(data)
                        if session_data.get('user_id') == user_id:
                            sessions.append({
                                'key': key.decode(),
                                'created_at': session_data.get('created_at')
                            })
                
                # Remove oldest sessions if limit exceeded
                if len(sessions) > SecurityConfig.MAX_CONCURRENT_SESSIONS:
                    sessions.sort(key=lambda x: x['created_at'])
                    for session in sessions[:-SecurityConfig.MAX_CONCURRENT_SESSIONS]:
                        self.redis_client.delete(session['key'])
            
        except Exception as e:
            logger.error(f"Session limit enforcement error: {e}")

# Security decorators
def require_permissions(permissions: List[str]):
    """Decorator to require specific permissions"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Extract current user from kwargs
            current_user = kwargs.get('current_user')
            if not current_user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication required"
                )
            
            # Check permissions
            user_permissions = set()
            for role in current_user.roles:
                user_permissions.update(getattr(role, 'permissions', []))
            
            required_permissions = set(permissions)
            if not required_permissions.issubset(user_permissions):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Insufficient permissions"
                )
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator

def audit_log(action: str):
    """Decorator to log security-sensitive actions"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            start_time = time.time()
            
            try:
                result = await func(*args, **kwargs)
                
                # Log successful action
                logger.info(
                    f"Audit: {action} - Success - "
                    f"Function: {func.__name__} - "
                    f"Duration: {time.time() - start_time:.3f}s"
                )
                
                return result
                
            except Exception as e:
                # Log failed action
                logger.warning(
                    f"Audit: {action} - Failed - "
                    f"Function: {func.__name__} - "
                    f"Error: {str(e)} - "
                    f"Duration: {time.time() - start_time:.3f}s"
                )
                raise
                
        return wrapper
    return decorator

# Initialize global security components
rate_limiter = RateLimiter()
session_manager = SessionManager()

# Export main components
__all__ = [
    'SecurityConfig',
    'SecurityViolation', 
    'RateLimiter',
    'InputValidator',
    'PasswordValidator',
    'SecurityMiddleware',
    'SessionManager',
    'require_permissions',
    'audit_log',
    'rate_limiter',
    'session_manager'
]