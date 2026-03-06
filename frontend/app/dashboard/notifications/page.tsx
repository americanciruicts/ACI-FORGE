'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, CheckCheck, LogIn, UserPlus, Eye, ExternalLink, Filter, Trash2, ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { User } from '@/lib/auth'
import Navbar from '@/components/Navbar'

interface NotificationData {
  id: number
  type: string
  title: string
  message: Record<string, any>
  is_read: boolean
  created_at: string | null
}

const TYPE_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'login', label: 'Logins' },
  { value: 'sso_login', label: 'SSO Logins' },
  { value: 'nexus_login', label: 'Nexus Logins' },
  { value: 'user_created', label: 'User Created' },
]

export default function NotificationsPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [notifications, setNotifications] = useState<NotificationData[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [readFilter, setReadFilter] = useState<'all' | 'unread'>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [perPage, setPerPage] = useState(20)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const fetchNotifications = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken')
      if (!token) {
        router.push('/login')
        return
      }

      const params = new URLSearchParams({ limit: '500' })
      if (readFilter === 'unread') params.set('unread_only', 'true')

      const res = await fetch(`/api/notifications?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      })

      if (res.status === 403) {
        router.push('/dashboard')
        return
      }

      if (!res.ok) throw new Error('Failed to fetch notifications')

      const data = await res.json()
      setNotifications(data.notifications || [])
      setTotal(data.total || 0)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [readFilter, router])

  useEffect(() => {
    try {
      const userData = localStorage.getItem('user')
      if (userData) {
        const parsed = JSON.parse(userData)
        setUser(parsed)
        const isSuperAdmin = parsed.roles?.some((r: any) => r.name === 'super_admin')
        if (!isSuperAdmin) {
          router.push('/dashboard')
          return
        }
      } else {
        router.push('/login')
        return
      }
    } catch {
      router.push('/login')
      return
    }

    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [fetchNotifications, router])

  const markAsRead = async (id: number) => {
    try {
      const token = localStorage.getItem('accessToken')
      await fetch(`/api/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` },
      })
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      )
    } catch {}
  }

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      await fetch('/api/notifications/mark-all-read', {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` },
      })
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    } catch {}
  }

  const clearAllRead = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      await fetch('/api/notifications/clear-read', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      })
      setNotifications(prev => prev.filter(n => !n.is_read))
    } catch {}
  }

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const mins = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  // Filter notifications by type and date range
  const filteredNotifications = notifications.filter(n => {
    if (typeFilter !== 'all' && n.type !== typeFilter) return false
    if (dateFrom && n.created_at) {
      const nDate = new Date(n.created_at).toISOString().split('T')[0]
      if (nDate < dateFrom) return false
    }
    if (dateTo && n.created_at) {
      const nDate = new Date(n.created_at).toISOString().split('T')[0]
      if (nDate > dateTo) return false
    }
    return true
  })

  // Pagination
  const totalPages = Math.ceil(filteredNotifications.length / perPage)
  const startIndex = (currentPage - 1) * perPage
  const paginatedNotifications = filteredNotifications.slice(startIndex, startIndex + perPage)

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [typeFilter, readFilter, dateFrom, dateTo])

  const renderNotificationContent = (n: NotificationData) => {
    const msg = n.message || {}

    if (n.type === 'login') {
      return (
        <div>
          <p className="text-sm text-gray-800">
            <span className="font-semibold">{msg.full_name || msg.username}</span> logged in
          </p>
          <div className="mt-1 text-xs text-gray-500 space-y-0.5">
            <p>Username: <span className="font-medium text-gray-700">{msg.username}</span></p>
            {msg.login_time && <p>Time: <span className="font-medium text-gray-700">{msg.login_time}</span></p>}
          </div>
        </div>
      )
    }

    if (n.type === 'sso_login') {
      return (
        <div>
          <p className="text-sm text-gray-800">
            <span className="font-semibold">{msg.full_name || msg.username}</span> logged into <span className="font-semibold text-amber-700">{msg.target_app}</span> via SSO
          </p>
          <div className="mt-1 text-xs text-gray-500 space-y-0.5">
            <p>Username: <span className="font-medium text-gray-700">{msg.username}</span></p>
            <p>Target App: <span className="font-medium text-amber-700">{msg.target_app}</span></p>
            {msg.login_time && <p>Time: <span className="font-medium text-gray-700">{msg.login_time}</span></p>}
          </div>
        </div>
      )
    }

    if (n.type === 'nexus_login') {
      return (
        <div>
          <p className="text-sm text-gray-800">
            <span className="font-semibold">{msg.full_name || msg.username}</span> logged into <span className="font-semibold text-indigo-700">NEXUS</span>
          </p>
          <div className="mt-1 text-xs text-gray-500 space-y-0.5">
            <p>Username: <span className="font-medium text-gray-700">{msg.username}</span></p>
            {msg.login_time && <p>Time: <span className="font-medium text-gray-700">{msg.login_time}</span></p>}
          </div>
        </div>
      )
    }

    if (n.type === 'user_created') {
      return (
        <div>
          <p className="text-sm text-gray-800">
            New user <span className="font-semibold">{msg.full_name || msg.username}</span> created
          </p>
          <div className="mt-1 text-xs text-gray-500 space-y-0.5">
            <p>Username: <span className="font-medium text-gray-700">{msg.username}</span></p>
            <p>Email: <span className="font-medium text-gray-700">{msg.email}</span></p>
            {msg.password && (
              <p>Password: <span className="font-medium text-red-600 bg-red-50 px-1 rounded">{msg.password}</span></p>
            )}
            {msg.roles && <p>Roles: <span className="font-medium text-gray-700">{Array.isArray(msg.roles) ? msg.roles.join(', ') : msg.roles}</span></p>}
            {msg.tools && <p>Tools: <span className="font-medium text-gray-700">{Array.isArray(msg.tools) ? msg.tools.join(', ') : msg.tools}</span></p>}
            {msg.created_by && <p>Created by: <span className="font-medium text-gray-700">{msg.created_by}</span></p>}
            {msg.sync_results && (
              <p>Sync: <span className="font-medium text-gray-700">
                {typeof msg.sync_results === 'object'
                  ? Object.entries(msg.sync_results).map(([k, v]) => `${k}: ${v}`).join(', ')
                  : String(msg.sync_results)}
              </span></p>
            )}
          </div>
        </div>
      )
    }

    // Fallback for unknown types
    return (
      <div>
        <p className="text-sm text-gray-800">{n.title}</p>
        <pre className="mt-1 text-xs text-gray-500 whitespace-pre-wrap">{JSON.stringify(msg, null, 2)}</pre>
      </div>
    )
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'login': return { bg: 'bg-green-100', icon: <LogIn className="h-5 w-5 text-green-600" /> }
      case 'sso_login': return { bg: 'bg-amber-100', icon: <ExternalLink className="h-5 w-5 text-amber-600" /> }
      case 'nexus_login': return { bg: 'bg-indigo-100', icon: <LogIn className="h-5 w-5 text-indigo-600" /> }
      case 'user_created': return { bg: 'bg-blue-100', icon: <UserPlus className="h-5 w-5 text-blue-600" /> }
      default: return { bg: 'bg-gray-100', icon: <Bell className="h-5 w-5 text-gray-600" /> }
    }
  }

  const unreadCount = filteredNotifications.filter(n => !n.is_read).length
  const readCount = filteredNotifications.filter(n => n.is_read).length

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0066B3]"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Bell className="h-6 w-6 text-[#0066B3]" />
              Notifications
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {filteredNotifications.length} total {unreadCount > 0 && `· ${unreadCount} unread`}
            </p>
          </div>

          <div className="flex items-center space-x-2">
            {readCount > 0 && (
              <button
                onClick={clearAllRead}
                className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-all"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Clear read</span>
              </button>
            )}
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-[#0066B3] bg-blue-50 hover:bg-blue-100 rounded-lg transition-all"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>
        </div>

        {/* Filters Row */}
        <div className="flex flex-col gap-3 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Read/Unread Filter */}
            <div className="flex bg-gray-100 rounded-lg p-0.5">
              <button
                onClick={() => setReadFilter('all')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  readFilter === 'all'
                    ? 'bg-white text-[#0066B3] shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setReadFilter('unread')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  readFilter === 'unread'
                    ? 'bg-white text-[#0066B3] shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Unread
              </button>
            </div>

            {/* Type Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <div className="flex bg-gray-100 rounded-lg p-0.5 flex-wrap gap-0.5">
                {TYPE_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setTypeFilter(opt.value)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
                      typeFilter === opt.value
                        ? 'bg-white text-[#0066B3] shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Date Range Filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <Calendar className="h-4 w-4 text-gray-400" />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="text-xs border border-gray-300 rounded-lg px-2.5 py-1.5 focus:border-[#0066B3] focus:ring-1 focus:ring-[#0066B3]/20"
              placeholder="From"
            />
            <span className="text-xs text-gray-400">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="text-xs border border-gray-300 rounded-lg px-2.5 py-1.5 focus:border-[#0066B3] focus:ring-1 focus:ring-[#0066B3]/20"
            />
            {(dateFrom || dateTo) && (
              <button
                onClick={() => { setDateFrom(''); setDateTo('') }}
                className="text-xs text-gray-400 hover:text-gray-600 underline"
              >
                Clear dates
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Notifications List */}
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-16">
            <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No notifications found</p>
            <p className="text-gray-400 text-sm mt-1">
              {typeFilter !== 'all' || dateFrom || dateTo ? 'Try changing the filters' : 'Login events, SSO logins, and new user creations will appear here'}
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {paginatedNotifications.map(n => {
                const typeIcon = getTypeIcon(n.type)
                return (
                  <div
                    key={n.id}
                    className={`relative flex items-start space-x-3 p-4 rounded-xl border transition-all duration-200 hover:shadow-md ${
                      n.is_read
                        ? 'bg-white border-gray-200'
                        : 'bg-blue-50/50 border-blue-200 shadow-sm'
                    }`}
                  >
                    {/* Unread dot */}
                    {!n.is_read && (
                      <div className="absolute top-4 left-2 w-2 h-2 bg-[#0066B3] rounded-full"></div>
                    )}

                    {/* Icon */}
                    <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${typeIcon.bg}`}>
                      {typeIcon.icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          {renderNotificationContent(n)}
                        </div>
                        <div className="flex items-center space-x-2 ml-3 flex-shrink-0">
                          <span className="text-xs text-gray-400">{formatTime(n.created_at)}</span>
                          {!n.is_read && (
                            <button
                              onClick={() => markAsRead(n.id)}
                              className="p-1 hover:bg-white rounded transition-all"
                              title="Mark as read"
                            >
                              <Eye className="h-3.5 w-3.5 text-gray-400 hover:text-[#0066B3]" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">
                    Showing {startIndex + 1}-{Math.min(startIndex + perPage, filteredNotifications.length)} of {filteredNotifications.length}
                  </span>
                  <select
                    value={perPage}
                    onChange={(e) => { setPerPage(Number(e.target.value)); setCurrentPage(1) }}
                    className="text-xs border border-gray-300 rounded-lg px-2 py-1"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="px-2 py-1 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    First
                  </button>
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="px-3 py-1 text-xs font-semibold text-[#0066B3]">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="px-2 py-1 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Last
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
