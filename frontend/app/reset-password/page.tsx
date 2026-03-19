'use client'

import { useState } from 'react'
import { resetPasswordWithCurrentPassword, validatePasswordStrength } from '@/lib/auth'
import { Eye, EyeOff } from 'lucide-react'

export default function ResetPasswordPage() {
  const [formData, setFormData] = useState({
    username: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [passwordErrors, setPasswordErrors] = useState<string[]>([])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')

    // Validate passwords match
    if (formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match')
      setIsLoading(false)
      return
    }

    // Validate password strength
    const validation = validatePasswordStrength(formData.newPassword)
    if (!validation.isValid) {
      setPasswordErrors(validation.errors)
      setError('Password does not meet security requirements')
      setIsLoading(false)
      return
    }

    try {
      await resetPasswordWithCurrentPassword(
        formData.username,
        formData.currentPassword,
        formData.newPassword
      )
      setSuccess('Password successfully reset! You can now login with your new password.')
      setFormData({ username: '', currentPassword: '', newPassword: '', confirmPassword: '' })
      setPasswordErrors([])
    } catch (err: any) {
      setError(err.message || 'Failed to reset password')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordChange = (value: string) => {
    setFormData(prev => ({ ...prev, newPassword: value }))
    if (value) {
      const validation = validatePasswordStrength(value)
      setPasswordErrors(validation.isValid ? [] : validation.errors)
    } else {
      setPasswordErrors([])
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="w-full max-w-[500px] p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <h1 className="text-center text-2xl font-bold mb-8 text-gray-900 dark:text-white">
          RESET PASSWORD
        </h1>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-md text-sm border border-red-200 dark:border-red-800">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-md text-sm border border-green-200 dark:border-green-800">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mb-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Username
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
              required
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your username"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Current Password
            </label>
            <div className="relative">
              <input
                type={showCurrentPassword ? "text" : "password"}
                value={formData.currentPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, currentPassword: e.target.value }))}
                required
                className="w-full p-3 pr-10 border border-gray-300 dark:border-gray-600 rounded-md text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your current password"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              >
                {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              New Password
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                value={formData.newPassword}
                onChange={(e) => handlePasswordChange(e.target.value)}
                required
                className="w-full p-3 pr-10 border border-gray-300 dark:border-gray-600 rounded-md text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your new password"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              >
                {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {/* Password Requirements */}
            {formData.newPassword && (
              <div className="mt-2 text-xs space-y-0.5">
                <div className={formData.newPassword.length >= 8 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                  At least 8 characters
                </div>
                <div className={/[A-Z]/.test(formData.newPassword) ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                  One uppercase letter
                </div>
                <div className={/[a-z]/.test(formData.newPassword) ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                  One lowercase letter
                </div>
                <div className={/\d/.test(formData.newPassword) ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                  One number
                </div>
                <div className={/[!@#$%^&*(),.?":{}|<>]/.test(formData.newPassword) ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                  One special character
                </div>
              </div>
            )}
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                required
                className="w-full p-3 pr-10 border border-gray-300 dark:border-gray-600 rounded-md text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Confirm your new password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {formData.confirmPassword && formData.newPassword !== formData.confirmPassword && (
              <div className="mt-1 text-xs text-red-600 dark:text-red-400">
                Passwords do not match
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isLoading || passwordErrors.length > 0 || !formData.username || !formData.currentPassword || !formData.newPassword || !formData.confirmPassword || formData.newPassword !== formData.confirmPassword}
              className="flex-1 p-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 text-white border-none rounded-md text-base font-semibold cursor-pointer disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Resetting...' : 'Reset Password'}
            </button>

            <button
              type="button"
              onClick={() => window.location.href = '/login'}
              className="flex-1 p-3 bg-gray-500 dark:bg-gray-600 hover:bg-gray-600 dark:hover:bg-gray-500 text-white border-none rounded-md text-base font-semibold cursor-pointer transition-colors"
            >
              Back to Login
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
