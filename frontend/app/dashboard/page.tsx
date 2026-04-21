'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, Activity, BarChart3, Users, ArrowLeftRight, Package, WifiOff } from 'lucide-react'
import { User, isSuperUser, getAllUsers, clearUserSession, generateSSOToken, validateSession, getSessionRemainingMs } from '@/lib/auth'
import Navbar from '@/components/Navbar'
import Image from 'next/image'
import { CardSkeleton, ToolCardSkeleton } from '@/components/Skeleton'

const LOCAL_FORGE_URL = process.env.NEXT_PUBLIC_LOCAL_FORGE_URL || 'http://acidashboard.aci.local:2005'
const LOCAL_API_URL = process.env.NEXT_PUBLIC_LOCAL_API_URL || 'http://acidashboard.aci.local:2003'

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isOnline, setIsOnline] = useState(true)
  const [adminStats, setAdminStats] = useState<{totalUsers: number, activeUsers: number, totalTools: number} | null>(null)
  const router = useRouter()

  // Safe tool name helper used everywhere
  const safeToolName = (tool: any): string => {
    if (!tool) return ''
    return String(tool.name || tool.display_name || '').toLowerCase().replace(/\s+/g, '_')
  }

  // Get user's assigned tools with custom ordering
  const userTools = (() => {
    try {
      const tools = user?.tools || []
      if (!Array.isArray(tools) || tools.length === 0) return []
      const getOrderIndex = (tool: any) => {
        const n = safeToolName(tool)
        if (n.includes('bom')) return 0
        if (n.includes('inventory') || n.includes('kosh')) return 1
        if (n.includes('suitemaster') || n.includes('suite')) return 2
        if (n.includes('nexus')) return 3
        return 999
      }
      return [...tools].sort((a, b) => getOrderIndex(a) - getOrderIndex(b))
    } catch (err) { console.error('Error sorting tools:', err);
      return user?.tools || []
    }
  })()

  useEffect(() => {
    const session = validateSession()

    if (!session.isValid || !session.user || !session.token) {
      clearUserSession()
      router.replace('/login')
      return
    }

    setUser(session.user)

    if (isSuperUser(session.user)) {
      fetchAdminStats(session.token)
    }

    setIsLoading(false)
  }, [router])

  // Periodic session expiry check - auto-redirect to login when 9-hour session expires
  useEffect(() => {
    const remainingMs = getSessionRemainingMs()
    if (remainingMs <= 0) return

    // Set a timer to redirect when session expires
    const expiryTimer = setTimeout(() => {
      clearUserSession()
      window.location.href = '/login'
    }, remainingMs)

    // Also check every 60 seconds in case of clock drift
    const intervalCheck = setInterval(() => {
      if (getSessionRemainingMs() <= 0) {
        clearUserSession()
        window.location.href = '/login'
      }
    }, 60000)

    return () => {
      clearTimeout(expiryTimer)
      clearInterval(intervalCheck)
    }
  }, [user])

  const fetchAdminStats = async (token: string) => {
    try {
      const users = await getAllUsers(token)
      const activeUsers = users.filter(u => u.is_active).length
      const allTools = new Set()
      users.forEach(u => u.tools.forEach(t => allTools.add(t.id)))

      setAdminStats({
        totalUsers: users.length,
        activeUsers: activeUsers,
        totalTools: allTools.size
      })
    } catch (error: any) {
      const message = typeof error?.message === 'string' ? error.message : String(error)
      if (message.includes('401')) {
        // Token likely expired or invalid; log out and redirect
        clearUserSession()
        router.push('/login')
        return
      }
      console.error('Failed to fetch admin stats:', error)
    }
  }

  // Detect if running on local network
  const isLocalNetwork = typeof window !== 'undefined' && (
    window.location.hostname.includes('192.168.') ||
    window.location.hostname.includes('.local') ||
    window.location.hostname === 'localhost'
  )

  // Internet connectivity detection - auto-redirect to local FORGE when offline
  const checkConnectivity = useCallback(async () => {
    // Skip connectivity check if already on local network
    if (isLocalNetwork) { setIsOnline(true); return }
    try {
      const resp = await fetch('/health', { signal: AbortSignal.timeout(5000) })
      setIsOnline(resp.ok)
    } catch {
      setIsOnline(false)
    }
  }, [isLocalNetwork])

  useEffect(() => {
    if (isLocalNetwork) return
    checkConnectivity()
    const interval = setInterval(checkConnectivity, 30000)
    const handleOffline = () => setIsOnline(false)
    const handleOnline = () => checkConnectivity()
    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)
    return () => { clearInterval(interval); window.removeEventListener('offline', handleOffline); window.removeEventListener('online', handleOnline) }
  }, [isLocalNetwork, checkConnectivity])

  // Show offline banner when internet is down (only affects public/Vercel users)
  // Local network users are unaffected since they connect directly
  useEffect(() => {
    if (!isOnline && !isLocalNetwork) {
      console.warn('Internet connectivity lost - API may be unavailable')
    }
  }, [isOnline, isLocalNetwork])

  const handleLogout = () => {
    clearUserSession()
    router.push('/login')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <div className="px-4 md:px-6 py-6 md:py-8">
          <div className="mb-8 md:mb-10 bg-gradient-to-br from-[#003d6a] via-[#0066B3] to-[#0077CC] rounded-2xl p-6 md:p-8 h-32 animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
            <CardSkeleton /><CardSkeleton /><CardSkeleton />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4 lg:gap-5">
            {[...Array(5)].map((_, i) => <ToolCardSkeleton key={i} />)}
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }


  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Top Navbar */}
      <Navbar user={user} />

      {/* Main Content */}
      <main className="px-4 md:px-6 py-6 md:py-8 pb-16 bg-white dark:bg-gray-900 min-h-screen">
          {/* Welcome Banner with PCB Circuit Pattern */}
          <div className="mb-8 md:mb-10 bg-gradient-to-br from-[#003d6a] via-[#0066B3] to-[#0077CC] text-white rounded-2xl p-6 md:p-8 shadow-xl relative overflow-hidden">
            {/* PCB Circuit Pattern */}
            <svg className="absolute right-0 top-0 h-full w-full pointer-events-none" viewBox="0 0 800 160" fill="none" preserveAspectRatio="xMaxYMid slice">
              {/* Main routed traces */}
              <path d="M800 30 H680 V70 H600 V110 H540" stroke="white" strokeWidth="1.5" opacity="0.07" />
              <path d="M800 130 H720 V90 H640" stroke="white" strokeWidth="1.5" opacity="0.06" />
              <path d="M660 20 V140" stroke="white" strokeWidth="1" opacity="0.04" />
              <path d="M560 50 H620 V70" stroke="white" strokeWidth="1" opacity="0.05" />
              <path d="M480 80 H530" stroke="white" strokeWidth="1" opacity="0.04" />
              {/* IC chip outline */}
              <rect x="670" y="55" width="40" height="30" rx="3" stroke="white" strokeWidth="1.2" opacity="0.06" fill="none" />
              <line x1="670" y1="65" x2="662" y2="65" stroke="white" strokeWidth="1" opacity="0.05" />
              <line x1="670" y1="75" x2="662" y2="75" stroke="white" strokeWidth="1" opacity="0.05" />
              <line x1="710" y1="65" x2="718" y2="65" stroke="white" strokeWidth="1" opacity="0.05" />
              <line x1="710" y1="75" x2="718" y2="75" stroke="white" strokeWidth="1" opacity="0.05" />
              {/* Pads with annular rings */}
              <circle cx="680" cy="30" r="6" stroke="white" strokeWidth="1.2" opacity="0.08" fill="none" />
              <circle cx="680" cy="30" r="2.5" fill="white" opacity="0.1" />
              <circle cx="600" cy="110" r="7" stroke="white" strokeWidth="1.2" opacity="0.07" fill="none" />
              <circle cx="600" cy="110" r="3" fill="white" opacity="0.09" />
              <circle cx="720" cy="130" r="5" stroke="white" strokeWidth="1" opacity="0.07" fill="none" />
              <circle cx="720" cy="130" r="2" fill="white" opacity="0.08" />
              <circle cx="540" cy="110" r="5" stroke="white" strokeWidth="1" opacity="0.06" fill="none" />
              <circle cx="540" cy="110" r="2" fill="white" opacity="0.07" />
              {/* Via holes */}
              <circle cx="640" cy="70" r="3.5" stroke="white" strokeWidth="0.8" opacity="0.06" fill="none" />
              <circle cx="640" cy="70" r="1.2" fill="white" opacity="0.07" />
              <circle cx="620" cy="90" r="3" stroke="white" strokeWidth="0.8" opacity="0.05" fill="none" />
              <circle cx="620" cy="90" r="1" fill="white" opacity="0.06" />
              <circle cx="530" cy="80" r="2.5" stroke="white" strokeWidth="0.8" opacity="0.05" fill="none" />
              <circle cx="530" cy="80" r="0.8" fill="white" opacity="0.06" />
              <circle cx="480" cy="80" r="2" stroke="white" strokeWidth="0.8" opacity="0.04" fill="none" />
              {/* Scattered small vias for depth */}
              <circle cx="750" cy="50" r="1.5" fill="white" opacity="0.05" />
              <circle cx="580" cy="40" r="1.5" fill="white" opacity="0.04" />
              <circle cx="500" cy="120" r="1.5" fill="white" opacity="0.04" />
            </svg>
            <div className="relative z-10">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">
                Welcome to ACI FORGE, {user.full_name}!
              </h2>
              <p className="text-white/80 text-base md:text-lg">
                Your gateway to enterprise tools
              </p>
            </div>
          </div>

          {/* Admin Summary for Super Users */}
          {isSuperUser(user) && adminStats && (
            <div className="mb-8 md:mb-12">
              <h3 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4 md:mb-6 flex items-center space-x-2">
                <Shield className="h-5 w-5 md:h-6 md:w-6 text-[#0066B3]" />
                <span>Admin Overview</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Total Users</p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">{adminStats.totalUsers}</p>
                    </div>
                    <div className="p-3 bg-gradient-to-br from-[#0066B3] to-[#0077CC] rounded-xl">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <span className="text-xs bg-blue-100 text-[#0066B3] px-2 py-1 rounded-full font-medium">
                      System-wide
                    </span>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Active Users</p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">{adminStats.activeUsers}</p>
                    </div>
                    <div className="p-3 bg-green-500 rounded-xl">
                      <Activity className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
                      Currently Active
                    </span>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Available Tools</p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">{adminStats.totalTools}</p>
                    </div>
                    <div className="p-3 bg-gradient-to-br from-[#FF6D00] to-[#FFAB00] rounded-xl">
                      <BarChart3 className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full font-medium">
                      In Use
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}


          {/* Available Tools */}
          <div className="mb-8 md:mb-12">
            <h3 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4 md:mb-6">Available Tools</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4 lg:gap-5">
              {userTools.map((tool) => {
                // Map tool names to their respective configurations
                const getToolConfig = (toolName: string) => {
                  const tn = (toolName || tool.display_name || '').toLowerCase().replace(/\s+/g, '_')
                  switch (tn) {
                    case 'bom_tool_suite':
                    case 'bom tool suite':
                      return {
                        href: 'https://bom-tool.vercel.app/',
                        localHref: 'http://acidashboard.aci.local:8081/',
                        ssoApp: null,
                        bgClass: 'bg-gradient-to-br from-orange-50 to-amber-50 hover:from-orange-100 hover:to-amber-100 dark:from-orange-950/40 dark:to-amber-950/40 dark:hover:from-orange-950/60 dark:hover:to-amber-950/60',
                        borderClass: 'border-orange-200 hover:border-orange-300 dark:border-orange-800/50 dark:hover:border-orange-700/60',
                        iconBgClass: 'bg-gradient-to-br from-orange-500 to-amber-600',
                        titleClass: 'text-gray-900 dark:text-gray-100',
                        textClass: 'text-gray-600 dark:text-gray-400',
                        buttonClass: 'bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700',
                        icon: ArrowLeftRight,
                        title: 'BOM Tool Suite',
                        description: 'BOM Tool Suite for Bill of Materials management'
                      }
                    case 'aci_inventory':
                    case 'aci inventory':
                    case 'inventory':
                      return {
                        href: 'https://aci-kosh.vercel.app/',
                        localHref: 'http://acidashboard.aci.local:5002/',
                        ssoApp: 'kosh',
                        bgClass: 'bg-gradient-to-br from-purple-50 to-violet-50 hover:from-purple-100 hover:to-violet-100 dark:from-purple-950/40 dark:to-violet-950/40 dark:hover:from-purple-950/60 dark:hover:to-violet-950/60',
                        borderClass: 'border-purple-200 hover:border-purple-300 dark:border-purple-800/50 dark:hover:border-purple-700/60',
                        iconBgClass: '',
                        titleClass: 'text-gray-900 dark:text-gray-100',
                        textClass: 'text-gray-600 dark:text-gray-400',
                        buttonClass: 'bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700',
                        icon: 'custom-kosh',
                        title: 'KOSH',
                        description: 'Inventory management system'
                      }
                    case 'suitemaster':
                    case 'suite master':
                      return {
                        href: 'https://aci.lmhosted.com/web/login?redirect=%2Fsuitemaster%3F',
                        localHref: 'https://aci.lmhosted.com/web/login?redirect=%2Fsuitemaster%3F',
                        ssoApp: null,
                        bgClass: 'bg-gradient-to-br from-blue-50 to-sky-50 hover:from-blue-100 hover:to-sky-100 dark:from-blue-950/40 dark:to-sky-950/40 dark:hover:from-blue-950/60 dark:hover:to-sky-950/60',
                        borderClass: 'border-blue-200 hover:border-blue-300 dark:border-blue-800/50 dark:hover:border-blue-700/60',
                        iconBgClass: '',
                        titleClass: 'text-gray-900 dark:text-gray-100',
                        textClass: 'text-gray-600 dark:text-gray-400',
                        buttonClass: 'bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-700 hover:to-sky-700',
                        icon: 'custom-suitemaster',
                        title: 'SuiteMaster',
                        description: 'Suite management and control system'
                      }
                    case 'nexus':
                      return {
                        href: 'https://aci-nexus.vercel.app/',
                        localHref: 'http://acidashboard.aci.local:100/',
                        ssoApp: 'nexus',
                        bgClass: 'bg-gradient-to-br from-teal-50 to-emerald-50 hover:from-teal-100 hover:to-emerald-100 dark:from-teal-950/40 dark:to-emerald-950/40 dark:hover:from-teal-950/60 dark:hover:to-emerald-950/60',
                        borderClass: 'border-teal-200 hover:border-teal-300 dark:border-teal-800/50 dark:hover:border-teal-700/60',
                        iconBgClass: '',
                        titleClass: 'text-gray-900 dark:text-gray-100',
                        textClass: 'text-gray-600 dark:text-gray-400',
                        buttonClass: 'bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700',
                        icon: 'custom-nexus',
                        title: 'NEXUS',
                        description: 'Traveler Management System'
                      }
                    default:
                      return {
                        href: '#',
                        localHref: '#',
                        ssoApp: null,
                        bgClass: 'bg-gradient-to-br from-gray-50 to-slate-50 hover:from-gray-100 hover:to-slate-100 dark:from-gray-800 dark:to-slate-800 dark:hover:from-gray-750 dark:hover:to-slate-750',
                        borderClass: 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600',
                        iconBgClass: 'bg-gradient-to-br from-gray-500 to-slate-600',
                        titleClass: 'text-gray-900 dark:text-gray-100',
                        textClass: 'text-gray-600 dark:text-gray-400',
                        buttonClass: 'bg-gradient-to-r from-gray-500 to-slate-600 hover:from-gray-600 hover:to-slate-700',
                        icon: Package,
                        title: tool.display_name || tool.name,
                        description: tool.description || 'Custom Tool'
                      }
                  }
                }

                const config = getToolConfig(tool.name)
                const IconComponent = config.icon

                const handleToolLaunch = async (e: React.MouseEvent) => {
                  e.preventDefault()

                  const fallbackHref = isLocalNetwork ? config.localHref : config.href

                  if (!config.ssoApp) {
                    window.open(fallbackHref, '_blank', 'noopener,noreferrer')
                    return
                  }

                  // Open the window synchronously during the click to preserve the
                  // user-gesture chain. Mobile browsers (iOS Safari, Android Chrome)
                  // block window.open called after an await. We intentionally omit
                  // `noopener` here because it forces window.open to return null,
                  // leaving us unable to navigate the new tab (which caused the
                  // SSO redirect to hijack the current FORGE tab and left the new
                  // tab stuck on about:blank). We null out `opener` manually below
                  // to preserve the security guarantee.
                  const win = window.open('about:blank', '_blank')
                  if (win) {
                    try { win.opener = null } catch {}
                  }

                  try {
                    let redirectUrl: string
                    if (isLocalNetwork) {
                      const token = localStorage.getItem('accessToken')
                      if (!token) throw new Error('Not authenticated')
                      const resp = await fetch(`${LOCAL_API_URL}/api/auth/sso/generate`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify({ target_app: config.ssoApp, use_local: true }),
                      })
                      if (!resp.ok) throw new Error('Local SSO failed')
                      const data = await resp.json()
                      redirectUrl = data.redirect_url
                    } else {
                      const ssoData = await generateSSOToken(config.ssoApp)
                      redirectUrl = ssoData.redirect_url
                    }

                    if (win && !win.closed) {
                      win.location.href = redirectUrl
                    } else {
                      window.location.href = redirectUrl
                    }
                  } catch (err: any) {
                    console.error('SSO failed, opening directly:', err.message)
                    if (win && !win.closed) {
                      win.location.href = fallbackHref
                    } else {
                      window.open(fallbackHref, '_blank', 'noopener,noreferrer')
                    }
                  }
                }

                return (
                  <div
                    key={tool.id}
                    className={`group ${config.bgClass} rounded-lg md:rounded-xl shadow-sm hover:shadow-lg border ${config.borderClass} p-3 md:p-4 lg:p-5 transition-all duration-300 cursor-pointer transform hover:-translate-y-1`}
                    onClick={handleToolLaunch}
                  >
                    <div className="text-center">
                      <div className={`w-14 h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 mx-auto mb-2 md:mb-3 lg:mb-4 ${config.iconBgClass} rounded-lg md:rounded-xl flex items-center justify-center shadow-sm transition-all duration-300`}>
                        {IconComponent === 'custom-nexus' ? (
                          <Image
                            src="/nexus-icon.svg"
                            alt="Nexus Icon"
                            width={80}
                            height={80}
                            className="w-14 h-14 md:w-16 md:h-16 lg:w-20 lg:h-20"
                          />
                        ) : IconComponent === 'custom-kosh' ? (
                          <Image
                            src="/kosh-logo.svg"
                            alt="Kosh Logo"
                            width={80}
                            height={80}
                            className="w-14 h-14 md:w-16 md:h-16 lg:w-20 lg:h-20"
                          />
                        ) : IconComponent === 'custom-suitemaster' ? (
                          <Image
                            src="/suitemaster-logo.svg"
                            alt="SuiteMaster Logo"
                            width={80}
                            height={80}
                            className="w-14 h-14 md:w-16 md:h-16 lg:w-20 lg:h-20"
                          />
                        ) : (
                          <IconComponent className="h-6 w-6 md:h-7 md:w-7 text-white" />
                        )}
                      </div>
                      <h4 className={`text-sm md:text-base font-bold ${config.titleClass} mb-1`}>{config.title}</h4>
                      <p className={`text-xs ${config.textClass} mb-2 md:mb-3 line-clamp-2 hidden sm:block`}>{config.description}</p>
                      <div className={`mt-auto inline-block ${config.buttonClass} text-white px-3 md:px-4 py-1.5 md:py-2 rounded-md md:rounded-lg text-xs font-semibold transition-all shadow-sm hover:shadow-md`}>
                        Launch
                      </div>
                    </div>
                  </div>
                )
              })}

              {userTools.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <Package className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600 mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 text-lg">No tools assigned to your account.</p>
                  <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">Contact your administrator to get tool access.</p>
                </div>
              )}
            </div>
          </div>
      </main>
    </div>
  )
}
