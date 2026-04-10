'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { loginUser, generateSSOToken, resetPasswordWithCurrentPassword, validatePasswordStrength } from '@/lib/auth'
import { Eye, EyeOff } from 'lucide-react'

function LoginForm() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [showResetModal, setShowResetModal] = useState(false)
  const [resetForm, setResetForm] = useState({ username: '', currentPassword: '', newPassword: '', confirmPassword: '' })
  const [resetError, setResetError] = useState('')
  const [resetSuccess, setResetSuccess] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [showResetCurrentPw, setShowResetCurrentPw] = useState(false)
  const [showResetNewPw, setShowResetNewPw] = useState(false)
  const [showResetConfirmPw, setShowResetConfirmPw] = useState(false)
  const searchParams = useSearchParams()

  useEffect(() => {
    setMounted(true)
  }, [])

  const passwordValidation = validatePasswordStrength(resetForm.newPassword)
  const passwordsMatch = resetForm.newPassword === resetForm.confirmPassword && resetForm.confirmPassword.length > 0

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setResetError('')
    setResetSuccess('')

    if (!resetForm.username || !resetForm.currentPassword || !resetForm.newPassword || !resetForm.confirmPassword) {
      setResetError('All fields are required')
      return
    }
    if (!passwordValidation.isValid) {
      setResetError(passwordValidation.errors[0])
      return
    }
    if (resetForm.newPassword !== resetForm.confirmPassword) {
      setResetError('New passwords do not match')
      return
    }
    if (resetForm.newPassword === resetForm.currentPassword) {
      setResetError('New password must be different from current password')
      return
    }

    setResetLoading(true)
    try {
      await resetPasswordWithCurrentPassword(resetForm.username, resetForm.currentPassword, resetForm.newPassword)
      setResetSuccess('Password reset successfully! You can now login with your new password.')
      setResetForm({ username: '', currentPassword: '', newPassword: '', confirmPassword: '' })
      setTimeout(() => { setShowResetModal(false); setResetSuccess('') }, 3000)
    } catch (err: any) {
      setResetError(err.message || 'Failed to reset password')
    } finally {
      setResetLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const data = await loginUser(username, password)

      // Store tokens and session data
      localStorage.setItem('accessToken', data.access_token)
      if (data.refresh_token) {
        localStorage.setItem('refreshToken', data.refresh_token)
      }
      localStorage.setItem('user', JSON.stringify(data.user))
      localStorage.setItem('lastLogin', new Date().toISOString())

      // Check if this login was triggered by an SSO redirect from another app
      const redirectApp = searchParams?.get('redirect')
      if (redirectApp && ['nexus', 'kosh', 'bom'].includes(redirectApp.toLowerCase())) {
        try {
          // Detect if we're on local network
          const isLocal = typeof window !== 'undefined' && (
            window.location.hostname.includes('.local') ||
            window.location.hostname.startsWith('192.168.') ||
            window.location.hostname === 'localhost'
          )
          // Use the token we just received directly instead of reading from localStorage
          const token = data.access_token
          const API_BASE = process.env.NEXT_PUBLIC_API_URL || ''
          const ssoResponse = await fetch(`${API_BASE}/api/auth/sso/generate`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ target_app: redirectApp.toLowerCase(), use_local: isLocal }),
          })

          if (ssoResponse.ok) {
            const ssoData = await ssoResponse.json()
            window.location.href = ssoData.redirect_url
            return
          } else {
            const errData = await ssoResponse.json().catch(() => ({ detail: 'Unknown error' }))
            console.error('SSO generate failed:', errData)
            setError(`SSO redirect failed: ${errData.detail || 'Unknown error'}. Redirecting to dashboard...`)
            setTimeout(() => { window.location.href = '/dashboard' }, 2000)
            return
          }
        } catch (ssoErr: any) {
          console.error('SSO redirect failed:', ssoErr.message)
          setError(`SSO redirect failed: ${ssoErr.message}. Redirecting to dashboard...`)
          setTimeout(() => { window.location.href = '/dashboard' }, 2000)
          return
        }
      }

      window.location.href = '/dashboard'
    } catch (err: any) {
      console.error('Login error:', err)
      setError(err.message || 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="login-container">
      {/* Animated background */}
      <div className="background-animation">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
      </div>

      {/* Circuit grid overlay for depth */}
      <div className="grid-overlay"></div>

      {/* PCB circuit decoration */}
      <svg className="circuit-decoration" viewBox="0 0 500 500" fill="none">
        {/* Trace paths */}
        <path d="M0 120 H150 V200 H250" stroke="rgba(0,136,204,0.06)" strokeWidth="1.5" />
        <path d="M500 80 H380 V160 H300" stroke="rgba(0,136,204,0.05)" strokeWidth="1.5" />
        <path d="M200 0 V100 H280 V180" stroke="rgba(0,136,204,0.04)" strokeWidth="1" />
        <path d="M0 380 H120 V320 H200" stroke="rgba(0,136,204,0.05)" strokeWidth="1.5" />
        <path d="M500 420 H400 V350 H320" stroke="rgba(0,136,204,0.04)" strokeWidth="1.5" />
        <path d="M350 500 V430 H280" stroke="rgba(0,136,204,0.04)" strokeWidth="1" />
        {/* Pads */}
        <circle cx="150" cy="120" r="5" stroke="rgba(0,136,204,0.07)" strokeWidth="1" fill="none" />
        <circle cx="150" cy="120" r="2" fill="rgba(0,136,204,0.08)" />
        <circle cx="380" cy="80" r="5" stroke="rgba(0,136,204,0.06)" strokeWidth="1" fill="none" />
        <circle cx="380" cy="80" r="2" fill="rgba(0,136,204,0.07)" />
        <circle cx="120" cy="380" r="5" stroke="rgba(0,136,204,0.06)" strokeWidth="1" fill="none" />
        <circle cx="120" cy="380" r="2" fill="rgba(0,136,204,0.07)" />
        <circle cx="400" cy="420" r="4" stroke="rgba(0,136,204,0.05)" strokeWidth="1" fill="none" />
        <circle cx="400" cy="420" r="1.5" fill="rgba(0,136,204,0.06)" />
        {/* Vias */}
        <circle cx="250" cy="200" r="3" stroke="rgba(0,136,204,0.05)" strokeWidth="0.8" fill="none" />
        <circle cx="300" cy="160" r="3" stroke="rgba(0,136,204,0.05)" strokeWidth="0.8" fill="none" />
        <circle cx="200" cy="320" r="3" stroke="rgba(0,136,204,0.04)" strokeWidth="0.8" fill="none" />
        <circle cx="320" cy="350" r="3" stroke="rgba(0,136,204,0.04)" strokeWidth="0.8" fill="none" />
      </svg>

      {/* Floating particles */}
      <div className="particles">
        {[...Array(8)].map((_, i) => (
          <div key={i} className={`particle particle-${i + 1}`}></div>
        ))}
      </div>

      {/* Login card */}
      <div className={`login-card ${mounted ? 'visible' : ''}`}>
        {/* Logo section - using SVG logo */}
        <div className="logo-section">
          <Image
            src="/aci-forge-logo.svg"
            alt="ACI FORGE - Your Gateway to Enterprise Tools"
            width={280}
            height={200}
            className="main-logo"
            priority
          />
        </div>

        {/* Error message */}
        {error && (
          <div className="error-message">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="2"/>
              <path d="M10 6v5M10 13.5v.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            {error}
          </div>
        )}

        {/* Login form */}
        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <label htmlFor="username">Username</label>
            <div className="input-wrapper">
              <svg className="input-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="6" r="4" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M2 18c0-4 4-6 8-6s8 2 8 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="Enter your username"
                autoComplete="username"
              />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="password">Password</label>
            <div className="input-wrapper">
              <svg className="input-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
                <rect x="3" y="8" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M6 8V6a4 4 0 118 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="10" cy="13" r="1.5" fill="currentColor"/>
              </svg>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="password-toggle"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`submit-button ${isLoading ? 'loading' : ''}`}
          >
            {isLoading ? (
              <>
                <svg className="spinner" width="20" height="20" viewBox="0 0 20 20">
                  <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" fill="none" strokeDasharray="50" strokeLinecap="round"/>
                </svg>
                Signing In...
              </>
            ) : (
              <>
                Sign In
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M4 10h12M12 6l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="card-footer">
          <button type="button" className="forgot-password" onClick={() => { setShowResetModal(true); setResetError(''); setResetSuccess('') }}>
            Reset Password
          </button>
        </div>
      </div>

      {/* Reset Password Modal */}
      {showResetModal && (
        <div className="reset-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowResetModal(false) }}>
          <div className="reset-modal">
            <div className="reset-header">
              <h3>Reset Password</h3>
              <button onClick={() => setShowResetModal(false)} className="reset-close">&times;</button>
            </div>

            {resetSuccess && (
              <div className="reset-success">{resetSuccess}</div>
            )}
            {resetError && (
              <div className="reset-error">{resetError}</div>
            )}

            <form onSubmit={handleResetPassword} className="reset-form">
              <div className="reset-field">
                <label>Username</label>
                <input
                  type="text"
                  value={resetForm.username}
                  onChange={(e) => setResetForm({ ...resetForm, username: e.target.value })}
                  placeholder="Enter your username"
                  autoComplete="username"
                />
              </div>

              <div className="reset-field">
                <label>Current Password</label>
                <div className="reset-input-wrapper">
                  <input
                    type={showResetCurrentPw ? "text" : "password"}
                    value={resetForm.currentPassword}
                    onChange={(e) => setResetForm({ ...resetForm, currentPassword: e.target.value })}
                    placeholder="Enter current password"
                    autoComplete="current-password"
                  />
                  <button type="button" onClick={() => setShowResetCurrentPw(!showResetCurrentPw)} className="pw-toggle">
                    {showResetCurrentPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="reset-field">
                <label>New Password</label>
                <div className="reset-input-wrapper">
                  <input
                    type={showResetNewPw ? "text" : "password"}
                    value={resetForm.newPassword}
                    onChange={(e) => setResetForm({ ...resetForm, newPassword: e.target.value })}
                    placeholder="Enter new password"
                    autoComplete="new-password"
                  />
                  <button type="button" onClick={() => setShowResetNewPw(!showResetNewPw)} className="pw-toggle">
                    {showResetNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {resetForm.newPassword && (
                  <div className="pw-rules">
                    <div className={resetForm.newPassword.length >= 8 ? 'rule-pass' : 'rule-fail'}>8+ characters</div>
                    <div className={/[A-Z]/.test(resetForm.newPassword) ? 'rule-pass' : 'rule-fail'}>Uppercase letter</div>
                    <div className={/[a-z]/.test(resetForm.newPassword) ? 'rule-pass' : 'rule-fail'}>Lowercase letter</div>
                    <div className={/\d/.test(resetForm.newPassword) ? 'rule-pass' : 'rule-fail'}>Number</div>
                    <div className={/[!@#$%^&*(),.?":{}|<>]/.test(resetForm.newPassword) ? 'rule-pass' : 'rule-fail'}>Special character</div>
                  </div>
                )}
              </div>

              <div className="reset-field">
                <label>Confirm New Password</label>
                <div className="reset-input-wrapper">
                  <input
                    type={showResetConfirmPw ? "text" : "password"}
                    value={resetForm.confirmPassword}
                    onChange={(e) => setResetForm({ ...resetForm, confirmPassword: e.target.value })}
                    placeholder="Confirm new password"
                    autoComplete="new-password"
                  />
                  <button type="button" onClick={() => setShowResetConfirmPw(!showResetConfirmPw)} className="pw-toggle">
                    {showResetConfirmPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {resetForm.confirmPassword && (
                  <div className={passwordsMatch ? 'match-pass' : 'match-fail'}>
                    {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={resetLoading || !passwordValidation.isValid || !passwordsMatch || !resetForm.username || !resetForm.currentPassword}
                className="reset-submit"
              >
                {resetLoading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .login-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          position: relative;
          overflow: hidden;
          background: linear-gradient(135deg, #0a0f1c 0%, #101828 50%, #0d1220 100%);
        }

        /* Animated gradient orbs */
        .background-animation {
          position: absolute;
          inset: 0;
          overflow: hidden;
          z-index: 0;
        }

        .gradient-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(100px);
          opacity: 0.5;
          animation: float 25s ease-in-out infinite;
        }

        .orb-1 {
          width: 700px;
          height: 700px;
          background: radial-gradient(circle, rgba(0, 102, 179, 0.35) 0%, transparent 70%);
          top: -25%;
          left: -15%;
          animation-delay: 0s;
        }

        .orb-2 {
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(230, 81, 0, 0.25) 0%, transparent 70%);
          bottom: -20%;
          right: -15%;
          animation-delay: -6s;
        }

        @keyframes float {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          25% {
            transform: translate(40px, -40px) scale(1.05);
          }
          50% {
            transform: translate(-30px, 30px) scale(0.95);
          }
          75% {
            transform: translate(-40px, -30px) scale(1.02);
          }
        }

        /* Circuit decoration SVG */
        .circuit-decoration {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          z-index: 1;
          pointer-events: none;
        }

        /* Grid overlay */
        .grid-overlay {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(0, 102, 179, 0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 102, 179, 0.04) 1px, transparent 1px);
          background-size: 60px 60px;
          z-index: 1;
        }

        /* Floating particles */
        .particles {
          position: absolute;
          inset: 0;
          z-index: 2;
          pointer-events: none;
        }

        .particle {
          position: absolute;
          width: 4px;
          height: 4px;
          background: rgba(0, 136, 204, 0.6);
          border-radius: 50%;
          animation: particleFloat 15s ease-in-out infinite;
        }

        .particle:nth-child(odd) {
          background: rgba(255, 109, 0, 0.5);
        }

        .particle-1 { left: 10%; top: 20%; animation-delay: 0s; }
        .particle-2 { left: 25%; top: 75%; animation-delay: -2s; }
        .particle-3 { left: 40%; top: 40%; animation-delay: -4s; }
        .particle-4 { left: 55%; top: 65%; animation-delay: -6s; }
        .particle-5 { left: 70%; top: 30%; animation-delay: -8s; }
        .particle-6 { left: 85%; top: 55%; animation-delay: -10s; }
        .particle-7 { left: 15%; top: 85%; animation-delay: -12s; }
        .particle-8 { left: 60%; top: 10%; animation-delay: -1s; }

        @keyframes particleFloat {
          0%, 100% {
            transform: translateY(0) translateX(0);
            opacity: 0.6;
          }
          25% {
            transform: translateY(-20px) translateX(10px);
            opacity: 0.8;
          }
          50% {
            transform: translateY(-10px) translateX(-15px);
            opacity: 0.4;
          }
          75% {
            transform: translateY(-30px) translateX(5px);
            opacity: 0.7;
          }
        }

        /* Login card */
        .login-card {
          width: 100%;
          max-width: 480px;
          padding: 48px 44px;
          background: rgba(255, 255, 255, 0.98);
          border-radius: 28px;
          box-shadow:
            0 30px 60px -12px rgba(0, 0, 0, 0.5),
            0 0 0 1px rgba(255, 255, 255, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(20px);
          position: relative;
          z-index: 10;
          opacity: 0;
          transform: translateY(30px);
          transition: opacity 0.7s ease, transform 0.7s ease;
        }

        .login-card.visible {
          opacity: 1;
          transform: translateY(0);
        }

        /* Logo section */
        .logo-section {
          text-align: center;
          margin-bottom: 36px;
          display: flex;
          justify-content: center;
        }

        .logo-section :global(.main-logo) {
          max-width: 100%;
          height: auto;
        }

        /* Error message */
        .error-message {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 14px 16px;
          background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
          color: #dc2626;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 24px;
          border: 1px solid rgba(220, 38, 38, 0.2);
        }

        /* Form styles */
        .login-form {
          display: flex;
          flex-direction: column;
          gap: 22px;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .input-group label {
          font-size: 14px;
          font-weight: 600;
          color: #374151;
        }

        .input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-icon {
          position: absolute;
          left: 16px;
          color: #9ca3af;
          pointer-events: none;
          transition: color 0.2s;
        }

        .input-wrapper input {
          width: 100%;
          padding: 16px 50px 16px 48px;
          background: #f8fafc;
          border: 2px solid #e2e8f0;
          border-radius: 14px;
          font-size: 15px;
          color: #1a202c;
          outline: none;
          transition: all 0.25s;
        }

        .input-wrapper input:focus {
          background: #ffffff;
          border-color: #0066B3;
          box-shadow: 0 0 0 4px rgba(0, 102, 179, 0.12);
        }

        .input-wrapper input:focus + .input-icon,
        .input-wrapper:focus-within .input-icon {
          color: #0066B3;
        }

        .input-wrapper input::placeholder {
          color: #94a3b8;
        }

        .password-toggle {
          position: absolute;
          right: 16px;
          background: none;
          border: none;
          color: #9ca3af;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          transition: color 0.2s;
        }

        .password-toggle:hover {
          color: #0066B3;
        }

        /* Submit button */
        .submit-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          width: 100%;
          padding: 18px 24px;
          background: linear-gradient(135deg, #0077CC 0%, #004A82 100%);
          color: white;
          border: none;
          border-radius: 14px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          box-shadow: 0 4px 16px rgba(0, 102, 179, 0.4);
          margin-top: 8px;
          position: relative;
          overflow: hidden;
        }

        .submit-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          transition: left 0.5s;
        }

        .submit-button:hover:not(:disabled)::before {
          left: 100%;
        }

        .submit-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 102, 179, 0.5);
          background: linear-gradient(135deg, #0088DD 0%, #005599 100%);
        }

        .submit-button:active:not(:disabled) {
          transform: translateY(0);
        }

        .submit-button:disabled {
          background: #94a3b8;
          cursor: not-allowed;
          box-shadow: none;
        }

        .submit-button.loading {
          background: linear-gradient(135deg, #64748b 0%, #475569 100%);
        }

        .spinner {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* Footer */
        .card-footer {
          text-align: center;
          margin-top: 28px;
          padding-top: 24px;
          border-top: 1px solid #e2e8f0;
        }

        .forgot-password {
          background: none;
          border: none;
          color: #0066B3;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          padding: 8px 16px;
          border-radius: 8px;
        }

        .forgot-password:hover {
          color: #004A82;
          background: rgba(0, 102, 179, 0.08);
        }

        /* Reset Password Modal */
        .reset-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
          padding: 20px;
        }
        .reset-modal {
          background: white;
          border-radius: 20px;
          padding: 32px;
          width: 100%;
          max-width: 420px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        .reset-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        .reset-header h3 {
          font-size: 20px;
          font-weight: 700;
          color: #1a202c;
          margin: 0;
        }
        .reset-close {
          background: none;
          border: none;
          font-size: 28px;
          color: #9ca3af;
          cursor: pointer;
          line-height: 1;
          padding: 0 4px;
        }
        .reset-close:hover { color: #374151; }
        .reset-form {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }
        .reset-field label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 6px;
        }
        .reset-field input {
          width: 100%;
          padding: 12px 14px;
          background: #f8fafc;
          border: 2px solid #e2e8f0;
          border-radius: 10px;
          font-size: 14px;
          color: #1a202c;
          outline: none;
          transition: all 0.2s;
        }
        .reset-field input:focus {
          border-color: #0066B3;
          background: white;
          box-shadow: 0 0 0 3px rgba(0,102,179,0.1);
        }
        .reset-input-wrapper {
          position: relative;
        }
        .reset-input-wrapper input {
          padding-right: 40px;
        }
        .pw-toggle {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #9ca3af;
          cursor: pointer;
          padding: 2px;
        }
        .pw-toggle:hover { color: #0066B3; }
        .pw-rules {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 8px;
        }
        .rule-pass, .rule-fail {
          font-size: 11px;
          padding: 2px 8px;
          border-radius: 4px;
          font-weight: 500;
        }
        .rule-pass { background: #ecfdf5; color: #059669; }
        .rule-fail { background: #fef2f2; color: #dc2626; }
        .match-pass, .match-fail {
          font-size: 12px;
          margin-top: 6px;
          font-weight: 500;
        }
        .match-pass { color: #059669; }
        .match-fail { color: #dc2626; }
        .reset-submit {
          width: 100%;
          padding: 14px;
          background: linear-gradient(135deg, #0077CC, #004A82);
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          margin-top: 4px;
        }
        .reset-submit:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0,102,179,0.4);
        }
        .reset-submit:disabled {
          background: #94a3b8;
          cursor: not-allowed;
        }
        .reset-error {
          background: #fef2f2;
          color: #dc2626;
          padding: 10px 14px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          border: 1px solid rgba(220,38,38,0.2);
          margin-bottom: 8px;
        }
        .reset-success {
          background: #ecfdf5;
          color: #059669;
          padding: 10px 14px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          border: 1px solid rgba(5,150,105,0.2);
          margin-bottom: 8px;
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .content-wrapper {
            max-width: 500px;
            padding: 20px;
          }
        }

        @media (max-width: 768px) {
          .page-container {
            padding: 16px;
          }

          .content-wrapper {
            max-width: 100%;
            padding: 16px;
          }

          .login-card {
            padding: 40px 32px;
            border-radius: 28px;
          }

          .logo-section :global(.main-logo) {
            width: 240px;
          }

          .form-title {
            font-size: 24px;
          }

          .form-subtitle {
            font-size: 13px;
          }

          .form-input {
            padding: 12px 14px;
            font-size: 14px;
          }

          .submit-button {
            padding: 13px 20px;
            font-size: 15px;
          }
        }

        @media (max-width: 520px) {
          .login-card {
            padding: 32px 24px;
            margin: 0;
            border-radius: 24px;
          }

          .logo-section :global(.main-logo) {
            width: 200px;
          }

          .form-title {
            font-size: 22px;
          }

          .form-subtitle {
            font-size: 12px;
            margin-bottom: 24px;
          }

          .form-group {
            gap: 6px;
          }

          .form-label {
            font-size: 13px;
          }

          .form-input {
            padding: 11px 12px;
            font-size: 14px;
          }

          .password-input {
            padding-right: 44px;
          }

          .password-toggle {
            right: 10px;
          }

          .icon {
            width: 18px;
            height: 18px;
          }

          .submit-button {
            padding: 12px 18px;
            font-size: 14px;
          }

          .forgot-password {
            font-size: 13px;
          }

          .error-message {
            padding: 12px 14px;
            font-size: 13px;
          }

          .copyright {
            font-size: 11px;
            margin-top: 20px;
          }

          .background-orb {
            filter: blur(80px);
          }

          .orb-1 {
            width: 400px;
            height: 400px;
          }

          .orb-2 {
            width: 350px;
            height: 350px;
          }

          .orb-3 {
            width: 300px;
            height: 300px;
          }
        }

        @media (max-width: 375px) {
          .login-card {
            padding: 28px 20px;
          }

          .logo-section :global(.main-logo) {
            width: 180px;
          }

          .form-title {
            font-size: 20px;
          }
        }
      `}</style>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#0a0f1c' }} />}>
      <LoginForm />
    </Suspense>
  )
}
