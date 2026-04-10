// API URL configuration
// Uses NEXT_PUBLIC_API_URL env var, or empty string for same-origin (Vercel rewrites / nginx proxy)
const getApiBaseUrl = () => {
  return process.env.NEXT_PUBLIC_API_URL || ''
}

const API_BASE_URL = getApiBaseUrl()

// Security configuration for ACI Standards compliance
const SECURITY_CONFIG = {
  TOKEN_EXPIRY_BUFFER: 5 * 60 * 1000, // 5 minutes before expiry
  MAX_LOGIN_ATTEMPTS: 50, // 50 attempts per day
  LOGIN_ATTEMPT_WINDOW: 24 * 60 * 60 * 1000, // 24 hours
  SESSION_TIMEOUT: 14 * 60 * 60 * 1000, // 14 hours per session
}

// Security utilities
class SecurityUtils {
  static sanitizeInput(input: string): string {
    // Remove potentially dangerous characters
    return input.replace(/[<>\"';\\]/g, '').trim()
  }

  static isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      const expirationTime = payload.exp * 1000
      return Date.now() > (expirationTime - SECURITY_CONFIG.TOKEN_EXPIRY_BUFFER)
    } catch {
      return true
    }
  }

  static validateEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    return emailRegex.test(email) && email.length <= 254
  }

  static logSecurityEvent(event: string, details?: any) {
    console.log(`SECURITY_EVENT: ${event}`, details)
    // In production, this should send to a security monitoring system
  }
}

// Debug function to test API connectivity
export async function testApiConnection(): Promise<{ success: boolean, url: string, error?: string }> {
  const url = `${API_BASE_URL}/health`
  try {
    const response = await fetch(url)
    return { 
      success: response.ok, 
      url,
      error: response.ok ? undefined : `${response.status} ${response.statusText}`
    }
  } catch (error: any) {
    return { success: false, url, error: error.message }
  }
}

export interface Role {
  id: number
  name: string
  description?: string
}

export interface Tool {
  id: number
  name: string
  display_name: string
  description?: string
  route: string
  icon: string
  is_active: boolean
}

export interface User {
  id: number
  full_name: string
  username: string
  email: string
  password?: string  // Optional for display purposes only
  is_active: boolean
  roles: Role[]
  tools: Tool[]
}

export interface LoginResponse {
  access_token: string
  refresh_token?: string
  token_type: string
  user: User
}

export interface UserCreate {
  full_name: string
  username: string
  email: string
  password: string
  role_ids: number[]
  tool_ids?: number[]
}

export interface UserUpdate {
  full_name?: string
  username?: string
  email?: string
  password?: string
  role_ids?: number[]
  tool_ids?: number[]
  is_active?: boolean
}

export async function loginUser(username: string, password: string): Promise<LoginResponse> {
  // Clear any stale session data before login attempt
  clearUserSession()

  const maxRetries = 2
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout for Vercel cold starts

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Login failed' }))
        // Don't retry on auth errors (wrong password) - only on server errors
        if (response.status === 401 || response.status === 403 || response.status === 429) {
          throw new Error(error.detail || 'Invalid username or password')
        }
        lastError = new Error(error.detail || 'Login failed')
        if (attempt < maxRetries) {
          await new Promise(r => setTimeout(r, 2000))
          continue
        }
        throw lastError
      }

      return response.json()
    } catch (error: any) {
      clearTimeout(timeoutId)
      if (error.name === 'AbortError') {
        lastError = new Error('Connection timeout. Server may be starting up, retrying...')
        if (attempt < maxRetries) {
          await new Promise(r => setTimeout(r, 2000))
          continue
        }
        throw new Error('Connection timeout. Please try again in a few seconds.')
      }
      // Don't retry auth errors
      if (error.message?.includes('Invalid username') || error.message?.includes('Too many')) {
        throw error
      }
      lastError = error
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, 2000))
        continue
      }
      throw new Error(error.message || 'Failed to connect to server. Please try again.')
    }
  }

  throw lastError || new Error('Login failed after multiple attempts')
}

export async function getCurrentUser(token: string): Promise<User> {
  const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error('Failed to get user information')
  }

  return response.json()
}

export async function getAllUsers(token: string): Promise<User[]> {
  const response = await fetch(`${API_BASE_URL}/api/users/`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to get users: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

export async function getAllRoles(token: string): Promise<Role[]> {
  const response = await fetch(`${API_BASE_URL}/api/roles`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to get roles: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

export async function getAllTools(token: string): Promise<Tool[]> {
  const response = await fetch(`${API_BASE_URL}/api/tools`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to get tools: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

export async function createUser(token: string, userData: UserCreate): Promise<User> {
  const response = await fetch(`${API_BASE_URL}/api/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(userData),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'Failed to create user')
  }

  return response.json()
}

export async function updateUser(token: string, userId: number, userData: UserUpdate): Promise<User> {
  const response = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(userData),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'Failed to update user')
  }

  return response.json()
}

export function hasRole(user: User, roleName: string): boolean {
  return user.roles.some(role => role.name === roleName)
}

export function isSuperUser(user: User): boolean {
  return hasRole(user, 'superuser')
}

export function validatePasswordStrength(password: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number')
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

export async function resetPasswordWithCurrentPassword(username: string, currentPassword: string, newPassword: string): Promise<{message: string}> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: username,
        current_password: currentPassword,
        new_password: newPassword,
      }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Failed to reset password' }))
      throw new Error(error.detail || 'Failed to reset password')
    }

    return { message: 'Password reset successfully' }
  } catch (error: any) {
    throw new Error(error.message || 'Failed to reset password')
  }
}

export async function deleteUser(token: string, userId: number): Promise<{message: string}> {
  const response = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'Failed to delete user')
  }

  return response.json()
}

export async function generateSSOToken(targetApp: string, useLocal: boolean = false): Promise<{ sso_token: string; redirect_url: string }> {
  const token = localStorage.getItem('accessToken')
  if (!token) {
    throw new Error('Not authenticated')
  }

  const response = await fetch(`${API_BASE_URL}/api/auth/sso/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ target_app: targetApp, use_local: useLocal }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'SSO token generation failed' }))
    throw new Error(error.detail || 'Failed to generate SSO token')
  }

  return response.json()
}

export function clearUserSession(): void {
  if (typeof window === 'undefined') return

  try {
    // Clear all localStorage items related to user session
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    localStorage.removeItem('userSettings')
    localStorage.removeItem('lastLogin')
    localStorage.removeItem('currentUser')

    // Clear sessionStorage completely
    sessionStorage.clear()

  } catch (error) {
    console.error('Error clearing session:', error)
  }
}

export function getSessionRemainingMs(): number {
  try {
    const lastLogin = localStorage.getItem('lastLogin')
    if (!lastLogin) return 0
    const elapsed = Date.now() - new Date(lastLogin).getTime()
    return Math.max(0, SECURITY_CONFIG.SESSION_TIMEOUT - elapsed)
  } catch {
    return 0
  }
}

export function validateSession(): { isValid: boolean, user: User | null, token: string | null } {
  try {
    const token = localStorage.getItem('accessToken')
    const userData = localStorage.getItem('user')
    const lastLogin = localStorage.getItem('lastLogin')

    if (!token || !userData) {
      return { isValid: false, user: null, token: null }
    }

    const user = JSON.parse(userData)
    const loginTime = lastLogin ? new Date(lastLogin) : null
    const now = new Date()

    // Check if session is older than 9 hours
    if (loginTime && (now.getTime() - loginTime.getTime()) > SECURITY_CONFIG.SESSION_TIMEOUT) {
      console.warn('Session expired after 14 hours')
      clearUserSession()
      return { isValid: false, user: null, token: null }
    }

    return { isValid: true, user, token }
  } catch (error) {
    console.error('Session validation failed:', error)
    return { isValid: false, user: null, token: null }
  }
}