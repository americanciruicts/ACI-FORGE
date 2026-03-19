'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { User as UserIcon, Mail, Shield, Clock, Wrench } from 'lucide-react'
import { User, clearUserSession } from '@/lib/auth'
import Navbar from '@/components/Navbar'
import Breadcrumbs from '@/components/Breadcrumbs'

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [lastLogin, setLastLogin] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    const userData = localStorage.getItem('user')

    if (!token || !userData) {
      router.push('/login')
      return
    }

    try {
      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)
      const storedLogin = localStorage.getItem('lastLogin')
      if (storedLogin) {
        setLastLogin(new Date(storedLogin).toLocaleString('en-US', {
          month: 'short', day: 'numeric', year: 'numeric',
          hour: 'numeric', minute: '2-digit', hour12: true
        }))
      }
    } catch (err) {
      clearUserSession()
      router.push('/login')
    }

    setIsLoading(false)
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0066B3]"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const formatRoleName = (name: string) => {
    if (name === 'superuser') return 'Super User'
    if (name === 'super_admin') return 'Super Admin'
    if (name === 'maintenance') return 'Maintenance'
    return name.charAt(0).toUpperCase() + name.slice(1)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar user={user} />

      <main className="max-w-4xl mx-auto px-4 py-6">
        <Breadcrumbs items={[{ label: 'Profile' }]} />
        {/* Profile Header with Gradient + PCB Pattern */}
        <div className="bg-gradient-to-br from-[#003d6a] via-[#0066B3] to-[#0077CC] rounded-2xl p-6 md:p-8 shadow-xl relative overflow-hidden mb-6">
          {/* PCB Circuit Pattern */}
          <svg className="absolute right-0 top-0 h-full w-full pointer-events-none" viewBox="0 0 600 180" fill="none" preserveAspectRatio="xMaxYMid slice">
            {/* Routed traces */}
            <path d="M600 40 H520 V90 H460" stroke="white" strokeWidth="1.5" opacity="0.07" />
            <path d="M600 140 H540 V100 H480" stroke="white" strokeWidth="1.5" opacity="0.06" />
            <path d="M500 25 V155" stroke="white" strokeWidth="1" opacity="0.04" />
            <path d="M420 90 H450" stroke="white" strokeWidth="1" opacity="0.04" />
            {/* IC chip */}
            <rect x="505" y="60" width="35" height="25" rx="2" stroke="white" strokeWidth="1" opacity="0.06" fill="none" />
            <line x1="505" y1="68" x2="498" y2="68" stroke="white" strokeWidth="0.8" opacity="0.05" />
            <line x1="505" y1="78" x2="498" y2="78" stroke="white" strokeWidth="0.8" opacity="0.05" />
            <line x1="540" y1="68" x2="547" y2="68" stroke="white" strokeWidth="0.8" opacity="0.05" />
            <line x1="540" y1="78" x2="547" y2="78" stroke="white" strokeWidth="0.8" opacity="0.05" />
            {/* Pads */}
            <circle cx="520" cy="40" r="6" stroke="white" strokeWidth="1" opacity="0.08" fill="none" />
            <circle cx="520" cy="40" r="2.5" fill="white" opacity="0.1" />
            <circle cx="460" cy="90" r="5" stroke="white" strokeWidth="1" opacity="0.07" fill="none" />
            <circle cx="460" cy="90" r="2" fill="white" opacity="0.08" />
            <circle cx="540" cy="140" r="5" stroke="white" strokeWidth="1" opacity="0.06" fill="none" />
            <circle cx="540" cy="140" r="2" fill="white" opacity="0.07" />
            {/* Vias */}
            <circle cx="480" cy="100" r="3" stroke="white" strokeWidth="0.8" opacity="0.05" fill="none" />
            <circle cx="480" cy="100" r="1" fill="white" opacity="0.06" />
            <circle cx="450" cy="90" r="2.5" stroke="white" strokeWidth="0.8" opacity="0.04" fill="none" />
            <circle cx="420" cy="90" r="2" stroke="white" strokeWidth="0.8" opacity="0.04" fill="none" />
            {/* Small scattered vias */}
            <circle cx="560" cy="55" r="1.5" fill="white" opacity="0.05" />
            <circle cx="440" cy="130" r="1.5" fill="white" opacity="0.04" />
          </svg>
          <div className="relative z-10 flex flex-col sm:flex-row items-center gap-5">
            {/* Avatar with Initials */}
            <div className="w-20 h-20 md:w-24 md:h-24 bg-white rounded-full flex items-center justify-center shadow-lg border-4 border-white/30 flex-shrink-0">
              <span className="text-2xl md:text-3xl font-bold text-[#0066B3]">
                {getInitials(user.full_name)}
              </span>
            </div>
            <div className="text-center sm:text-left">
              <h1 className="text-2xl md:text-3xl font-bold text-white">{user.full_name}</h1>
              <p className="text-white/70 text-sm mt-1">@{user.username}</p>
              <div className="flex flex-wrap gap-2 mt-3 justify-center sm:justify-start">
                {user.roles?.map((role) => (
                  <span
                    key={role.id}
                    className="text-xs bg-white/20 text-white px-3 py-1 rounded-full font-semibold uppercase tracking-wide backdrop-blur-sm"
                  >
                    {formatRoleName(role.name)}
                  </span>
                ))}
                <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                  user.is_active ? 'bg-green-400/20 text-green-100' : 'bg-red-400/20 text-red-100'
                }`}>
                  {user.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Account Info */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4 flex items-center gap-2">
              <UserIcon className="h-4 w-4" />
              Account Information
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 dark:text-gray-500 mb-1">Full Name</label>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{user.full_name}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 dark:text-gray-500 mb-1">Username</label>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">@{user.username}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 dark:text-gray-500 mb-1">Email Address</label>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-gray-400" />
                  {user.email}
                </p>
              </div>
              {lastLogin && (
                <div>
                  <label className="block text-xs font-medium text-gray-400 dark:text-gray-500 mb-1">Last Login</label>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-gray-400" />
                    {lastLogin}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Roles & Access */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4 flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Roles & Access
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 dark:text-gray-500 mb-2">System Roles</label>
                <div className="flex flex-wrap gap-2">
                  {user.roles?.map((role) => (
                    <span
                      key={role.id}
                      className="bg-[#0066B3]/10 dark:bg-blue-900/40 text-[#0066B3] dark:text-blue-300 px-3 py-1.5 rounded-lg text-xs font-semibold"
                    >
                      {formatRoleName(role.name)}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 dark:text-gray-500 mb-2">Account Status</label>
                <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold ${
                  user.is_active ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
                }`}>
                  <span className={`w-2 h-2 rounded-full mr-2 ${user.is_active ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  {user.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Assigned Tools */}
        {user.tools && user.tools.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4 flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              Assigned Tools
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {user.tools.map((tool: any) => (
                <div
                  key={tool.id}
                  className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-3 text-center hover:bg-blue-50 dark:hover:bg-gray-600 hover:border-[#0066B3]/30 transition-all"
                >
                  <Wrench className="h-5 w-5 text-[#0066B3] mx-auto mb-1.5" />
                  <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">{tool.display_name || tool.name}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
