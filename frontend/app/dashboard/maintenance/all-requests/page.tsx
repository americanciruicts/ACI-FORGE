'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, Search, Filter, ArrowUpDown, Eye, CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react'
import { User, isSuperUser, clearUserSession } from '@/lib/auth'
import Navbar from '@/components/Navbar'
import StatusBadge from '@/components/maintenance/StatusBadge'
import PriorityBadge from '@/components/maintenance/PriorityBadge'

interface MaintenanceRequest {
  id: number
  title: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  equipment_name?: string
  location?: string
  requested_completion_date?: string
  created_at: string
  submitter: {
    id: number
    username: string
    full_name: string
  }
}

interface Statistics {
  total_requests: number
  pending_count: number
  in_progress_count: number
  completed_count: number
  cancelled_count: number
  high_priority_count: number
  urgent_count: number
}

export default function AllRequestsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [requests, setRequests] = useState<MaintenanceRequest[]>([])
  const [filteredRequests, setFilteredRequests] = useState<MaintenanceRequest[]>([])
  const [statistics, setStatistics] = useState<Statistics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'date' | 'priority'>('date')
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

      // Check if user has maintenance access
      const hasMaintenanceAccess = parsedUser.roles?.some((role: any) =>
        role.name === 'superuser' || role.name === 'maintenance'
      )

      if (!hasMaintenanceAccess) {
        router.push('/dashboard')
        return
      }

      setUser(parsedUser)
      fetchAllRequests(token)
      fetchStatistics(token)
    } catch (err) {
      console.error('Error parsing user data:', err)
      clearUserSession()
      router.push('/login')
    }
  }, [router])

  useEffect(() => {
    let filtered = [...requests]

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(req =>
        req.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.equipment_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.submitter.full_name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(req => req.status === statusFilter)
    }

    // Apply priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(req => req.priority === priorityFilter)
    }

    // Apply sorting
    if (sortBy === 'date') {
      filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    } else if (sortBy === 'priority') {
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 }
      filtered.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
    }

    setFilteredRequests(filtered)
  }, [requests, searchTerm, statusFilter, priorityFilter, sortBy])

  const fetchAllRequests = async (token: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/maintenance-requests`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        if (response.status === 401) {
          clearUserSession()
          router.push('/login')
          return
        }
        throw new Error('Failed to fetch requests')
      }

      const data = await response.json()
      setRequests(data)
    } catch (error) {
      console.error('Error fetching requests:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchStatistics = async (token: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/maintenance-requests/statistics`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setStatistics(data)
      }
    } catch (error) {
      console.error('Error fetching statistics:', error)
    }
  }

  const handleViewRequest = (requestId: number) => {
    router.push(`/dashboard/maintenance/requests/${requestId}`)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />

      <main className="px-6 py-8 pb-16 bg-white min-h-screen">
        <div className="max-w-full mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-3">
              <Shield className="h-8 w-8 text-purple-600" />
              <h1 className="text-4xl font-bold text-gray-900">All Maintenance Requests</h1>
            </div>
            <p className="text-gray-600 text-lg">
              View and manage all maintenance requests from all users
            </p>
          </div>

          {/* Statistics Cards */}
          {statistics && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="glass-card p-5 card-hover">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-500">Total Requests</p>
                  <AlertCircle className="h-5 w-5 text-blue-500" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{statistics.total_requests}</p>
              </div>

              <div className="glass-card p-5 card-hover">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-500">Pending</p>
                  <Clock className="h-5 w-5 text-yellow-500" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{statistics.pending_count}</p>
              </div>

              <div className="glass-card p-5 card-hover">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-500">In Progress</p>
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{statistics.in_progress_count}</p>
              </div>

              <div className="glass-card p-5 card-hover">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-500">Completed</p>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{statistics.completed_count}</p>
              </div>
            </div>
          )}

          {/* Filters and Search */}
          <div className="glass-card p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Search className="h-4 w-4 inline mr-2" />
                  Search
                </label>
                <input
                  type="text"
                  placeholder="Search by title, description, equipment, or user..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Filter className="h-4 w-4 inline mr-2" />
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {/* Priority Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Filter className="h-4 w-4 inline mr-2" />
                  Priority
                </label>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="all">All Priorities</option>
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>

            {/* Sort Options */}
            <div className="mt-4 flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">
                <ArrowUpDown className="h-4 w-4 inline mr-2" />
                Sort by:
              </label>
              <button
                onClick={() => setSortBy('date')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  sortBy === 'date'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Date
              </button>
              <button
                onClick={() => setSortBy('priority')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  sortBy === 'priority'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Priority
              </button>
            </div>
          </div>

          {/* Results Count */}
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              Showing <span className="font-semibold">{filteredRequests.length}</span> of{' '}
              <span className="font-semibold">{requests.length}</span> requests
            </p>
          </div>

          {/* Requests List */}
          {filteredRequests.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <XCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Requests Found</h3>
              <p className="text-gray-600">
                {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all'
                  ? 'Try adjusting your filters to see more results.'
                  : 'No maintenance requests have been submitted yet.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRequests.map((request) => (
                <div
                  key={request.id}
                  className="glass-card p-6 hover:shadow-lg transition-all duration-200 cursor-pointer border-l-4 border-purple-500"
                  onClick={() => handleViewRequest(request.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">{request.title}</h3>
                        <StatusBadge status={request.status} />
                        <PriorityBadge priority={request.priority} />
                      </div>

                      <p className="text-gray-600 mb-3 line-clamp-2">{request.description}</p>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Submitted by:</span>
                          <p className="text-gray-900">{request.submitter.full_name}</p>
                        </div>

                        {request.equipment_name && (
                          <div>
                            <span className="font-medium text-gray-700">Equipment:</span>
                            <p className="text-gray-900">{request.equipment_name}</p>
                          </div>
                        )}

                        {request.location && (
                          <div>
                            <span className="font-medium text-gray-700">Location:</span>
                            <p className="text-gray-900">{request.location}</p>
                          </div>
                        )}

                        <div>
                          <span className="font-medium text-gray-700">Submitted:</span>
                          <p className="text-gray-900">
                            {new Date(request.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleViewRequest(request.id)
                      }}
                      className="ml-4 flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                      <Eye className="h-4 w-4" />
                      <span>View</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
