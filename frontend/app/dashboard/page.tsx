'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, Activity, BarChart3, Users, ArrowLeftRight, Package, FileSpreadsheet, MessageCircle } from 'lucide-react'
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
    // Custom order: BOM Compare, KOSH, Excel Migration, Chat, then NEXUS at the end
    const order = ['bom_compare', 'aci_inventory', 'aci_excel_migration', 'aci_chat', 'nexus']
    return [...tools].sort((a, b) => {
      const normalizeToolName = (name: string) => name.toLowerCase().replace(/\s+/g, '_')
      const aName = normalizeToolName(a.name)
      const bName = normalizeToolName(b.name)

      // Map tool names to their order position
      const getOrderIndex = (name: string) => {
        const normalized = normalizeToolName(name)
        if (normalized.includes('compare') || normalized === 'bom_compare') return order.indexOf('bom_compare')
        if (normalized.includes('inventory') || normalized.includes('kosh')) return order.indexOf('aci_inventory')
        if (normalized.includes('excel') || normalized.includes('migration')) return order.indexOf('aci_excel_migration')
        if (normalized.includes('chat')) return order.indexOf('aci_chat')
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
      <main className="px-6 py-8 pb-16 bg-white min-h-screen">
          <div className="mb-10">
            <h2 className="text-4xl font-bold text-gray-900 mb-2">
              Welcome to ACI FORGE, {user.full_name}!
            </h2>
            <p className="text-gray-600 text-lg">
              Access to tools
            </p>
          </div>

          {/* Admin Summary for Super Users */}
          {isSuperUser(user) && adminStats && (
            <div className="mb-12">
              <h3 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center space-x-2">
                <Shield className="h-6 w-6 text-blue-600" />
                <span>Admin Overview</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="glass-card p-6 card-hover">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Total Users</p>
                      <p className="text-3xl font-bold text-gray-900">{adminStats.totalUsers}</p>
                    </div>
                    <div className="p-3 gradient-blue rounded-xl">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                      System-wide
                    </span>
                  </div>
                </div>

                <div className="glass-card p-6 card-hover">
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
                      Currently Online
                    </span>
                  </div>
                </div>

                <div className="glass-card p-6 card-hover">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Available Tools</p>
                      <p className="text-3xl font-bold text-gray-900">{adminStats.totalTools}</p>
                    </div>
                    <div className="p-3 bg-purple-500 rounded-xl">
                      <BarChart3 className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full font-medium">
                      In Use
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}


          {/* Available Tools */}
          <div className="mb-12">
            <h3 className="text-2xl font-semibold text-gray-800 mb-6">Available Tools</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
              {userTools.map((tool) => {
                // Map tool names to their respective configurations
                const getToolConfig = (toolName: string) => {
                  switch (toolName.toLowerCase()) {
                    case 'compare_tool':
                    case 'bom compare':
                    case 'bom_compare':
                      return {
                        href: 'http://acidashboard.aci.local:8081/',
                        bgClass: 'bg-gradient-to-br from-orange-50 to-amber-100 hover:from-orange-100 hover:to-amber-200',
                        borderClass: 'border-orange-200 hover:border-orange-300',
                        iconBgClass: 'bg-gradient-to-br from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700',
                        titleClass: 'text-orange-900 group-hover:text-orange-700',
                        textClass: 'text-amber-700 group-hover:text-amber-600',
                        buttonClass: 'bg-gradient-to-r from-orange-500 to-amber-600 group-hover:from-orange-600 group-hover:to-amber-700',
                        icon: ArrowLeftRight,
                        title: 'BOM Compare',
                        description: 'Compare and analyze Bill of Materials'
                      }
                    case 'aci_inventory':
                    case 'aci inventory':
                    case 'inventory':
                      return {
                        href: 'http://acidashboard.aci.local:5002/',
                        bgClass: 'bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200',
                        borderClass: 'border-purple-200 hover:border-purple-300',
                        iconBgClass: 'bg-white hover:bg-gray-50 rounded-full shadow-lg p-2',
                        titleClass: 'text-purple-900 group-hover:text-purple-700',
                        textClass: 'text-purple-700 group-hover:text-purple-600',
                        buttonClass: 'bg-purple-500 group-hover:bg-purple-600',
                        icon: 'custom-kosh',
                        title: 'KOSH',
                        description: 'Inventory management system'
                      }
                    case 'aci_excel_migration':
                    case 'aci excel migration':
                    case 'excel migration':
                      return {
                        href: 'http://acidashboard.aci.local:6003/',
                        bgClass: 'bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200',
                        borderClass: 'border-green-200 hover:border-green-300',
                        iconBgClass: 'bg-green-500 hover:bg-green-600',
                        titleClass: 'text-green-900 group-hover:text-green-700',
                        textClass: 'text-green-700 group-hover:text-green-600',
                        buttonClass: 'bg-green-500 group-hover:bg-green-600',
                        icon: FileSpreadsheet,
                        title: 'ACI Excel Migration',
                        description: 'Excel migration and data processing tool'
                      }
                    case 'aci_chat':
                    case 'aci chat':
                      return {
                        href: 'http://acidashboard.aci.local:4000/',
                        bgClass: 'bg-gradient-to-br from-teal-50 to-teal-100 hover:from-teal-100 hover:to-teal-200',
                        borderClass: 'border-teal-200 hover:border-teal-300',
                        iconBgClass: 'bg-teal-500 hover:bg-teal-600',
                        titleClass: 'text-teal-900 group-hover:text-teal-700',
                        textClass: 'text-teal-700 group-hover:text-teal-600',
                        buttonClass: 'bg-teal-500 group-hover:bg-teal-600',
                        icon: MessageCircle,
                        title: 'ACI Chat',
                        description: 'AI-powered chat using OLLAMA (Local LLM)'
                      }
                    case 'nexus':
                      return {
                        href: 'http://acidashboard.aci.local:100',
                        bgClass: 'bg-gradient-to-br from-blue-50 to-indigo-100 hover:from-blue-100 hover:to-indigo-200',
                        borderClass: 'border-blue-200 hover:border-blue-300',
                        iconBgClass: 'bg-white hover:bg-gray-50 rounded-full shadow-lg p-2',
                        titleClass: 'text-blue-900 group-hover:text-blue-700',
                        textClass: 'text-indigo-700 group-hover:text-indigo-600',
                        buttonClass: 'bg-gradient-to-r from-blue-500 to-indigo-600 group-hover:from-blue-600 group-hover:to-indigo-700',
                        icon: 'custom-nexus',
                        title: 'NEXUS',
                        description: 'Traveler Management System'
                      }
                    default:
                      return {
                        href: '#',
                        bgClass: 'bg-gradient-to-br from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200',
                        borderClass: 'border-gray-200 hover:border-gray-300',
                        iconBgClass: 'bg-gray-500 hover:bg-gray-600',
                        titleClass: 'text-gray-900 group-hover:text-gray-700',
                        textClass: 'text-gray-700 group-hover:text-gray-600',
                        buttonClass: 'bg-gray-500 group-hover:bg-gray-600',
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
                    className={`group ${config.bgClass} rounded-lg shadow-md hover:shadow-lg border-2 ${config.borderClass} p-4 transition-all duration-300 hover:scale-105 cursor-pointer block transform hover:-translate-y-1`}
                    onClick={(e) => {
                      e.preventDefault()
                      console.log('Opening tool:', config.title, 'URL:', config.href)
                      window.open(config.href, '_blank', 'noopener,noreferrer')
                    }}
                  >
                    <div className="text-center">
                      <div className={`w-20 h-20 mx-auto mb-3 ${config.iconBgClass} rounded-lg flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-300`}>
                        {IconComponent === 'custom-nexus' ? (
                          <Image
                            src="/nexus-icon.svg"
                            alt="Nexus Icon"
                            width={72}
                            height={72}
                            className="w-full h-full p-1"
                          />
                        ) : IconComponent === 'custom-kosh' ? (
                          <Image
                            src="/kosh-logo.svg"
                            alt="Kosh Logo"
                            width={64}
                            height={64}
                            className="w-full h-full"
                          />
                        ) : (
                          <IconComponent className="h-8 w-8 text-white" />
                        )}
                      </div>
                      <h4 className={`text-base font-bold ${config.titleClass} mb-1`}>{config.title}</h4>
                      <p className={`text-xs ${config.textClass} mb-2`}>{config.description}</p>
                      <div className={`mt-2 inline-block ${config.buttonClass} text-white px-3 py-1.5 rounded-md text-xs font-semibold transition-colors`}>
                        Launch Tool →
                      </div>
                    </div>
                  </div>
                )
              })}
              
              {userTools.length === 0 && (
                <div className="col-span-full text-center py-8">
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