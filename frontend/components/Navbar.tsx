'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Image from 'next/image'
import { LogOut, User as UserIcon, Home, Users, ChevronDown, Wrench, Menu, X, Bell, LogIn, UserPlus, ExternalLink, CheckCheck } from 'lucide-react'
import { User, clearUserSession } from '@/lib/auth'

interface NotificationPreview {
  id: number
  type: string
  title: string
  message: Record<string, any>
  is_read: boolean
  created_at: string | null
}

interface NavbarProps {
  user: User
}

export default function Navbar({ user }: NavbarProps) {
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  const handleLogout = () => {
    clearUserSession()
    router.push('/login')
  }

  const isActive = (path: string) => {
    return pathname === path
  }

  const hasUserManagementAccess = user.roles?.some((role: any) =>
    role.name === 'superuser'
  )

  const isSuperAdmin = user.roles?.some((role: any) => role.name === 'super_admin')

  const [unreadCount, setUnreadCount] = useState(0)
  const [bellDropdownOpen, setBellDropdownOpen] = useState(false)
  const [recentNotifications, setRecentNotifications] = useState<NotificationPreview[]>([])
  const [loadingNotifications, setLoadingNotifications] = useState(false)

  const fetchUnreadCount = useCallback(async () => {
    if (!isSuperAdmin) return
    try {
      const token = localStorage.getItem('accessToken')
      if (!token) return
      const res = await fetch('/api/notifications/unread-count', {
        headers: { 'Authorization': `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setUnreadCount(data.count || 0)
      }
    } catch {}
  }, [isSuperAdmin])

  const fetchRecentNotifications = useCallback(async () => {
    if (!isSuperAdmin) return
    setLoadingNotifications(true)
    try {
      const token = localStorage.getItem('accessToken')
      if (!token) return
      const res = await fetch('/api/notifications?limit=5', {
        headers: { 'Authorization': `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setRecentNotifications(data.notifications || [])
      }
    } catch {} finally {
      setLoadingNotifications(false)
    }
  }, [isSuperAdmin])

  const getTimeAgo = (dateStr: string) => {
    const now = new Date()
    const date = new Date(dateStr)
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const markAsRead = useCallback(async (id: number) => {
    try {
      const token = localStorage.getItem('accessToken')
      if (!token) return
      await fetch(`/api/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` },
      })
      setRecentNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
      fetchUnreadCount()
    } catch {}
  }, [fetchUnreadCount])

  const markAllAsRead = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken')
      if (!token) return
      await fetch('/api/notifications/mark-all-read', {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` },
      })
      setRecentNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch {}
  }, [])

  useEffect(() => {
    fetchUnreadCount()
    if (!isSuperAdmin) return
    const interval = setInterval(fetchUnreadCount, 30000)
    return () => clearInterval(interval)
  }, [fetchUnreadCount, isSuperAdmin])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('[data-dropdown]')) {
        setBellDropdownOpen(false)
        setUserDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="w-full bg-gradient-to-r from-[#003d6a] via-[#0066B3] to-[#0077CC] shadow-xl sticky top-0 z-50 relative">
      {/* PCB Circuit Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <svg className="absolute right-0 top-0 h-full w-[400px]" viewBox="0 0 400 72" fill="none" preserveAspectRatio="xMaxYMid slice">
        {/* Traces - clean 90-degree routed paths */}
        <path d="M400 18 H320 V36 H260" stroke="white" strokeWidth="1.5" opacity="0.08" />
        <path d="M400 54 H340 V36 H300" stroke="white" strokeWidth="1.5" opacity="0.06" />
        <path d="M260 12 V60" stroke="white" strokeWidth="1" opacity="0.05" />
        <path d="M180 36 H220" stroke="white" strokeWidth="1" opacity="0.05" />
        {/* Pads with annular rings */}
        <circle cx="320" cy="18" r="5" stroke="white" strokeWidth="1" opacity="0.1" fill="none" />
        <circle cx="320" cy="18" r="2" fill="white" opacity="0.12" />
        <circle cx="260" cy="36" r="6" stroke="white" strokeWidth="1" opacity="0.08" fill="none" />
        <circle cx="260" cy="36" r="2.5" fill="white" opacity="0.1" />
        <circle cx="340" cy="54" r="4" stroke="white" strokeWidth="1" opacity="0.08" fill="none" />
        <circle cx="340" cy="54" r="1.5" fill="white" opacity="0.1" />
        {/* Via holes */}
        <circle cx="300" cy="36" r="3" stroke="white" strokeWidth="0.8" opacity="0.07" fill="none" />
        <circle cx="300" cy="36" r="1" fill="white" opacity="0.08" />
        <circle cx="220" cy="36" r="2.5" stroke="white" strokeWidth="0.8" opacity="0.06" fill="none" />
        <circle cx="220" cy="36" r="0.8" fill="white" opacity="0.07" />
        <circle cx="180" cy="36" r="2" stroke="white" strokeWidth="0.8" opacity="0.05" fill="none" />
      </svg>
      </div>

      <div className="relative z-10 flex items-center justify-between h-[72px] px-4 md:px-6">
        {/* Logo and Brand */}
        <div className="flex items-center flex-shrink-0">
          <Image
            src="/aci-forge-navbar.svg"
            alt="ACI FORGE - Your Gateway to Enterprise Tools"
            width={280}
            height={60}
            className="h-[48px] md:h-[56px] w-auto"
            priority
          />
        </div>

        {/* Desktop Navigation Menu */}
        <nav className="hidden lg:flex items-center space-x-1">
          <button
            onClick={() => router.push('/dashboard')}
            className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl font-semibold transition-all duration-200 ${
              isActive('/dashboard')
                ? 'bg-white text-[#0066B3] shadow-lg transform scale-105'
                : 'text-white hover:bg-white/15 hover:shadow-md active:scale-95'
            }`}
            style={{ outline: 'none', userSelect: 'none' }}
          >
            <Home className="h-5 w-5" />
            <span>Home</span>
          </button>

          <button
            onClick={() => router.push('/dashboard/maintenance/submit')}
            className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl font-semibold transition-all duration-200 ${
              pathname?.startsWith('/dashboard/maintenance')
                ? 'bg-white text-[#0066B3] shadow-lg transform scale-105'
                : 'text-white hover:bg-white/15 hover:shadow-md active:scale-95'
            }`}
            style={{ outline: 'none', userSelect: 'none' }}
          >
            <Wrench className="h-5 w-5" />
            <span>Maintenance</span>
          </button>

          {hasUserManagementAccess && (
            <button
              onClick={() => router.push('/dashboard/users')}
              className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl font-semibold transition-all duration-200 ${
                isActive('/dashboard/users')
                  ? 'bg-white text-[#0066B3] shadow-lg transform scale-105'
                  : 'text-white hover:bg-white/15 hover:shadow-md active:scale-95'
              }`}
              style={{ outline: 'none', userSelect: 'none' }}
            >
              <Users className="h-5 w-5" />
              <span>Users</span>
            </button>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 text-white hover:bg-white/15 rounded-lg transition-all"
          style={{ outline: 'none', userSelect: 'none' }}
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>

        {/* Desktop User Profile Section */}
        <div className="hidden lg:flex items-center space-x-3">
          {/* Notification Bell with Dropdown */}
          {isSuperAdmin && (
            <div className="relative" data-dropdown>
              <button
                onClick={() => {
                  const opening = !bellDropdownOpen
                  setBellDropdownOpen(opening)
                  if (opening) {
                    setUserDropdownOpen(false)
                    fetchRecentNotifications()
                  }
                }}
                className="relative p-2 text-white hover:bg-white/15 rounded-xl transition-all duration-200 active:scale-95"
                style={{ outline: 'none', userSelect: 'none' }}
                title="Notifications"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-lg border-2 border-[#0066B3]">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Bell Dropdown */}
              {bellDropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
                  {/* Header */}
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-cyan-50">
                    <h3 className="text-sm font-bold text-gray-900">Notifications</h3>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        markAllAsRead()
                      }}
                      className="text-xs text-[#0066B3] hover:text-[#004A82] font-semibold flex items-center gap-1 hover:bg-blue-100 px-2 py-1 rounded-md transition-colors"
                      style={{ outline: 'none' }}
                    >
                      <CheckCheck className="h-3.5 w-3.5" />
                      <span>Mark all read</span>
                    </button>
                  </div>

                  {/* Notification List */}
                  <div className="max-h-[320px] overflow-y-auto">
                    {loadingNotifications ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#0066B3]"></div>
                      </div>
                    ) : recentNotifications.length === 0 ? (
                      <div className="py-8 text-center">
                        <Bell className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-400">No notifications</p>
                      </div>
                    ) : (
                      recentNotifications.map((notif) => {
                        const getIcon = () => {
                          if (notif.type === 'login' || notif.type === 'sso_login' || notif.type === 'nexus_login') return <LogIn className="h-4 w-4" />
                          if (notif.type === 'user_created') return <UserPlus className="h-4 w-4" />
                          return <Bell className="h-4 w-4" />
                        }
                        const getIconColor = () => {
                          if (notif.type === 'login') return 'bg-blue-100 text-blue-600'
                          if (notif.type === 'sso_login' || notif.type === 'nexus_login') return 'bg-indigo-100 text-indigo-600'
                          if (notif.type === 'user_created') return 'bg-green-100 text-green-600'
                          return 'bg-gray-100 text-gray-600'
                        }
                        const msg = notif.message || {}
                        const subtitle = msg.username || msg.full_name || msg.email || ''
                        const timeAgo = notif.created_at ? getTimeAgo(notif.created_at) : ''

                        return (
                          <div
                            key={notif.id}
                            className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 ${
                              !notif.is_read ? 'bg-blue-50/50' : ''
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${getIconColor()}`}>
                              {getIcon()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-xs truncate ${!notif.is_read ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                                {notif.title}
                              </p>
                              {subtitle && (
                                <p className="text-xs text-gray-500 truncate mt-0.5">{subtitle}</p>
                              )}
                              {timeAgo && (
                                <p className="text-[10px] text-gray-400 mt-1">{timeAgo}</p>
                              )}
                            </div>
                            {!notif.is_read && (
                              <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
                            )}
                          </div>
                        )
                      })
                    )}
                  </div>

                  {/* Footer - View All */}
                  <div className="border-t border-gray-100">
                    <button
                      onClick={() => {
                        setBellDropdownOpen(false)
                        router.push('/dashboard/notifications')
                      }}
                      className="w-full px-4 py-3 text-sm font-semibold text-[#0066B3] hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
                      style={{ outline: 'none' }}
                    >
                      <span>View all notifications</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="relative" data-dropdown>
          <button
            onClick={() => {
              const opening = !userDropdownOpen
              setUserDropdownOpen(opening)
              if (opening) setBellDropdownOpen(false)
            }}
            className="flex items-center space-x-3 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30 transition-all duration-200 active:scale-95"
            style={{ outline: 'none', userSelect: 'none' }}
          >
            {/* Avatar */}
            <div className="w-10 h-10 bg-gradient-to-br from-white to-gray-100 rounded-full flex items-center justify-center flex-shrink-0 shadow-md border-2 border-white/50">
              <UserIcon className="h-5 w-5 text-[#0066B3]" />
            </div>

            {/* User Info */}
            <div className="flex flex-col items-start min-w-[120px]">
              <p className="text-sm font-semibold text-white leading-tight truncate max-w-[140px]">
                {user.full_name}
              </p>
              <div className="flex flex-wrap gap-1 mt-1">
                {user.roles?.slice(0, 2).map((role) => (
                  <span
                    key={role.id}
                    className="text-[10px] bg-white/20 text-white/90 px-2 py-0.5 rounded-full font-medium uppercase tracking-wide"
                  >
                    {role.name === 'superuser' ? 'Admin' : role.name === 'super_admin' ? 'Super Admin' : role.name === 'maintenance' ? 'Maint' : role.name}
                  </span>
                ))}
              </div>
            </div>

            {/* Dropdown Arrow */}
            <ChevronDown
              className={`h-4 w-4 text-white/80 transform transition-transform duration-200 ${
                userDropdownOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* User Dropdown Menu */}
          {userDropdownOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 z-50 overflow-hidden">
              {/* User Header */}
              <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-cyan-50">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#0066B3] to-[#0077CC] rounded-full flex items-center justify-center shadow-md">
                    <UserIcon className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-bold text-gray-900 truncate">{user.full_name}</p>
                    <p className="text-sm text-gray-500 truncate">@{user.username}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {user.roles?.map((role) => (
                    <span
                      key={role.id}
                      className="text-xs bg-[#0066B3]/10 text-[#0066B3] px-2.5 py-1 rounded-full font-semibold uppercase tracking-wide"
                    >
                      {role.name === 'superuser' ? 'Super User' : role.name === 'super_admin' ? 'Super Admin' : role.name === 'maintenance' ? 'Maintenance' : role.name}
                    </span>
                  ))}
                </div>
              </div>

              {/* Menu Items */}
              <div className="py-2">
                <button
                  onClick={() => {
                    setUserDropdownOpen(false)
                    router.push('/dashboard/profile')
                  }}
                  className="w-full text-left px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-blue-50 hover:text-[#0066B3] transition-all duration-200 flex items-center space-x-3"
                  style={{ outline: 'none', userSelect: 'none' }}
                >
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <UserIcon className="h-4 w-4 text-gray-600" />
                  </div>
                  <span>View Profile</span>
                </button>

                {isSuperAdmin && (
                  <button
                    onClick={() => {
                      setUserDropdownOpen(false)
                      router.push('/dashboard/notifications')
                    }}
                    className="w-full text-left px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-amber-50 hover:text-amber-600 transition-all duration-200 flex items-center space-x-3"
                    style={{ outline: 'none', userSelect: 'none' }}
                  >
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center relative">
                      <Bell className="h-4 w-4 text-gray-600" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center px-0.5">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </div>
                    <span>Notifications</span>
                    {unreadCount > 0 && (
                      <span className="ml-auto bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                )}

                <button
                  onClick={() => {
                    setUserDropdownOpen(false)
                    router.push('/reset-password')
                  }}
                  className="w-full text-left px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-all duration-200 flex items-center space-x-3"
                  style={{ outline: 'none', userSelect: 'none' }}
                >
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <svg className="h-4 w-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                  </div>
                  <span>Reset Password</span>
                </button>
              </div>

              {/* Logout */}
              <div className="border-t border-gray-100 pt-2 pb-1 px-3">
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200 flex items-center space-x-3 rounded-lg"
                  style={{ outline: 'none', userSelect: 'none' }}
                >
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                    <LogOut className="h-4 w-4 text-red-500" />
                  </div>
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-gray-200 shadow-lg relative z-10">
          {/* Navigation Links */}
          <div className="px-4 py-3 space-y-1">
            <button
              onClick={() => {
                setMobileMenuOpen(false)
                router.push('/dashboard')
              }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg font-semibold transition-all ${
                isActive('/dashboard')
                  ? 'bg-gradient-to-r from-[#0066B3] to-[#0077CC] text-white shadow-md'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Home className="h-5 w-5" />
              <span>Home</span>
            </button>

            <button
              onClick={() => {
                setMobileMenuOpen(false)
                router.push('/dashboard/maintenance/submit')
              }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg font-semibold transition-all ${
                pathname?.startsWith('/dashboard/maintenance')
                  ? 'bg-gradient-to-r from-[#0066B3] to-[#0077CC] text-white shadow-md'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Wrench className="h-5 w-5" />
              <span>Maintenance</span>
            </button>

            {hasUserManagementAccess && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false)
                  router.push('/dashboard/users')
                }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg font-semibold transition-all ${
                  isActive('/dashboard/users')
                    ? 'bg-gradient-to-r from-[#0066B3] to-[#0077CC] text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Users className="h-5 w-5" />
                <span>Users</span>
              </button>
            )}
          </div>

          {/* Mobile User Section */}
          <div className="px-4 py-3 border-t border-gray-200 bg-gradient-to-r from-blue-50 to-cyan-50">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-[#0066B3] to-[#0077CC] rounded-full flex items-center justify-center shadow-md">
                <UserIcon className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">{user.full_name}</p>
                <p className="text-xs text-gray-500 truncate">@{user.username}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {user.roles?.map((role) => (
                <span
                  key={role.id}
                  className="text-xs bg-[#0066B3]/10 text-[#0066B3] px-2.5 py-1 rounded-full font-semibold uppercase"
                >
                  {role.name === 'superuser' ? 'Admin' : role.name === 'super_admin' ? 'Super Admin' : role.name === 'maintenance' ? 'Maint' : role.name}
                </span>
              ))}
            </div>
            <div className="space-y-1">
              <button
                onClick={() => {
                  setMobileMenuOpen(false)
                  router.push('/dashboard/profile')
                }}
                className="w-full flex items-center space-x-2 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-white rounded-lg transition-all"
              >
                <UserIcon className="h-4 w-4" />
                <span>View Profile</span>
              </button>
              {isSuperAdmin && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false)
                    router.push('/dashboard/notifications')
                  }}
                  className="w-full flex items-center space-x-2 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-white rounded-lg transition-all"
                >
                  <Bell className="h-4 w-4" />
                  <span>Notifications</span>
                  {unreadCount > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </button>
              )}
              <button
                onClick={() => {
                  setMobileMenuOpen(false)
                  handleLogout()
                }}
                className="w-full flex items-center space-x-2 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-all"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
