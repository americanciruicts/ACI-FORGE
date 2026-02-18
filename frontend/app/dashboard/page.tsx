'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, Activity, BarChart3, Users, ArrowLeftRight, Package, MessageCircle } from 'lucide-react'
import { User, isSuperUser, getAllUsers, clearUserSession } from '@/lib/auth'
import Navbar from '@/components/Navbar'
import Image from 'next/image'

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [adminStats, setAdminStats] = useState<{totalUsers: number, activeUsers: number, totalTools: number} | null>(null)
  const router = useRouter()

  // Get user's assigned tools with custom ordering
  const userTools = (() => {
    const tools = user?.tools || []
    // Custom order: BOM Tool Suite, KOSH, Chat, SuiteMaster, then NEXUS at the end
    const order = ['bom_tool_suite', 'aci_inventory', 'aci_chat', 'suitemaster', 'nexus']
    return [...tools].sort((a, b) => {
      const normalizeToolName = (name: string) => name.toLowerCase().replace(/\s+/g, '_')
      const aName = normalizeToolName(a.name)
      const bName = normalizeToolName(b.name)

      // Map tool names to their order position
      const getOrderIndex = (name: string) => {
        const normalized = normalizeToolName(name)
        if (normalized.includes('bom') || normalized === 'bom_tool_suite') return order.indexOf('bom_tool_suite')
        if (normalized.includes('inventory') || normalized.includes('kosh')) return order.indexOf('aci_inventory')
        if (normalized.includes('chat')) return order.indexOf('aci_chat')
        if (normalized.includes('suitemaster') || normalized.includes('suite')) return order.indexOf('suitemaster')
        if (normalized.includes('nexus')) return order.indexOf('nexus')
        return 999 // Unknown tools go to the end
      }

      return getOrderIndex(aName) - getOrderIndex(bName)
    })
  })()

  useEffect(() => {
    console.log('ACI FORGE useEffect triggered')
    const token = localStorage.getItem('accessToken')
    const userData = localStorage.getItem('user')

    console.log('Token exists:', !!token)
    console.log('UserData exists:', !!userData)

    if (!token || !userData) {
      console.log('No token or userData found, redirecting to login')
      router.push('/login')
      return
    }

    try {
      const parsedUser = JSON.parse(userData)
      console.log('Parsed user:', parsedUser.username)
      setUser(parsedUser)

      // Skip token validation for now - just set the user and fetch admin stats if needed
      if (isSuperUser(parsedUser)) {
        console.log('User is super user, fetching admin stats')
        fetchAdminStats(token)
      }
    } catch (err) {
      console.log('Error parsing user data:', err)
      clearUserSession()
      router.push('/login')
    }

    setIsLoading(false)
  }, [router])

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

  const handleLogout = () => {
    clearUserSession()
    router.push('/login')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0066B3]"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navbar */}
      <Navbar user={user} />

      {/* Main Content */}
      <main className="px-4 md:px-6 py-6 md:py-8 pb-16 bg-white min-h-screen">
          <div className="mb-8 md:mb-10">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              Welcome to ACI FORGE, {user.full_name}!
            </h2>
            <p className="text-gray-600 text-base md:text-lg">
              Your gateway to enterprise tools
            </p>
          </div>

          {/* Admin Summary for Super Users */}
          {isSuperUser(user) && adminStats && (
            <div className="mb-8 md:mb-12">
              <h3 className="text-xl md:text-2xl font-semibold text-gray-800 mb-4 md:mb-6 flex items-center space-x-2">
                <Shield className="h-5 w-5 md:h-6 md:w-6 text-[#0066B3]" />
                <span>Admin Overview</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Total Users</p>
                      <p className="text-3xl font-bold text-gray-900">{adminStats.totalUsers}</p>
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

                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Active Users</p>
                      <p className="text-3xl font-bold text-gray-900">{adminStats.activeUsers}</p>
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

                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Available Tools</p>
                      <p className="text-3xl font-bold text-gray-900">{adminStats.totalTools}</p>
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
            <h3 className="text-xl md:text-2xl font-semibold text-gray-800 mb-4 md:mb-6">Available Tools</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4 lg:gap-5">
              {userTools.map((tool) => {
                // Map tool names to their respective configurations
                const getToolConfig = (toolName: string) => {
                  switch (toolName.toLowerCase()) {
                    case 'bom_tool_suite':
                    case 'bom tool suite':
                      return {
                        href: 'http://acidashboard.aci.local:8081/',
                        bgClass: 'bg-gradient-to-br from-orange-50 to-amber-50 hover:from-orange-100 hover:to-amber-100',
                        borderClass: 'border-orange-200 hover:border-orange-300',
                        iconBgClass: 'bg-gradient-to-br from-orange-500 to-amber-600',
                        titleClass: 'text-gray-900',
                        textClass: 'text-gray-600',
                        buttonClass: 'bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700',
                        icon: ArrowLeftRight,
                        title: 'BOM Tool Suite',
                        description: 'BOM Tool Suite for Bill of Materials management'
                      }
                    case 'aci_inventory':
                    case 'aci inventory':
                    case 'inventory':
                      return {
                        href: 'http://acidashboard.aci.local:5002/',
                        bgClass: 'bg-gradient-to-br from-purple-50 to-violet-50 hover:from-purple-100 hover:to-violet-100',
                        borderClass: 'border-purple-200 hover:border-purple-300',
                        iconBgClass: '',
                        titleClass: 'text-gray-900',
                        textClass: 'text-gray-600',
                        buttonClass: 'bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700',
                        icon: 'custom-kosh',
                        title: 'KOSH',
                        description: 'Inventory management system'
                      }
                    case 'aci_chat':
                    case 'aci chat':
                      return {
                        href: 'http://acidashboard.aci.local:4000/',
                        bgClass: 'bg-gradient-to-br from-teal-50 to-cyan-50 hover:from-teal-100 hover:to-cyan-100',
                        borderClass: 'border-teal-200 hover:border-teal-300',
                        iconBgClass: 'bg-gradient-to-br from-teal-500 to-cyan-600',
                        titleClass: 'text-gray-900',
                        textClass: 'text-gray-600',
                        buttonClass: 'bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700',
                        icon: MessageCircle,
                        title: 'ACI Chat',
                        description: 'AI-powered chat using OLLAMA (Local LLM)'
                      }
                    case 'suitemaster':
                    case 'suite master':
                      return {
                        href: 'https://aci.lmhosted.com/web/login?redirect=%2Fsuitemaster%3F',
                        bgClass: 'bg-gradient-to-br from-blue-50 to-sky-50 hover:from-blue-100 hover:to-sky-100',
                        borderClass: 'border-blue-200 hover:border-blue-300',
                        iconBgClass: '',
                        titleClass: 'text-gray-900',
                        textClass: 'text-gray-600',
                        buttonClass: 'bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-700 hover:to-sky-700',
                        icon: 'custom-suitemaster',
                        title: 'SuiteMaster',
                        description: 'Suite management and control system'
                      }
                    case 'nexus':
                      return {
                        href: 'http://acidashboard.aci.local:100',
                        bgClass: 'bg-gradient-to-br from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100',
                        borderClass: 'border-blue-200 hover:border-blue-300',
                        iconBgClass: '',
                        titleClass: 'text-gray-900',
                        textClass: 'text-gray-600',
                        buttonClass: 'bg-gradient-to-r from-[#0066B3] to-[#0077CC] hover:from-[#004A82] hover:to-[#0066B3]',
                        icon: 'custom-nexus',
                        title: 'NEXUS',
                        description: 'Traveler Management System'
                      }
                    default:
                      return {
                        href: '#',
                        bgClass: 'bg-gradient-to-br from-gray-50 to-slate-50 hover:from-gray-100 hover:to-slate-100',
                        borderClass: 'border-gray-200 hover:border-gray-300',
                        iconBgClass: 'bg-gradient-to-br from-gray-500 to-slate-600',
                        titleClass: 'text-gray-900',
                        textClass: 'text-gray-600',
                        buttonClass: 'bg-gradient-to-r from-gray-500 to-slate-600 hover:from-gray-600 hover:to-slate-700',
                        icon: Package,
                        title: tool.display_name || tool.name,
                        description: tool.description || 'Custom Tool'
                      }
                  }
                }

                const config = getToolConfig(tool.name)
                const IconComponent = config.icon

                return (
                  <div
                    key={tool.id}
                    className={`group ${config.bgClass} rounded-lg md:rounded-xl shadow-sm hover:shadow-lg border ${config.borderClass} p-3 md:p-4 lg:p-5 transition-all duration-300 cursor-pointer transform hover:-translate-y-1`}
                    onClick={(e) => {
                      e.preventDefault()
                      console.log('Opening tool:', config.title, 'URL:', config.href)
                      window.open(config.href, '_blank', 'noopener,noreferrer')
                    }}
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
                  <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-500 text-lg">No tools assigned to your account.</p>
                  <p className="text-gray-400 text-sm mt-2">Contact your administrator to get tool access.</p>
                </div>
              )}
            </div>
          </div>
      </main>
    </div>
  )
}
