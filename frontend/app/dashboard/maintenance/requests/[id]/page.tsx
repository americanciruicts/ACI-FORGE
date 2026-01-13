'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Calendar, MapPin, Wrench, FileText, Download, Clock, User as UserIcon, Edit, Save, X, Package } from 'lucide-react'
import { User, clearUserSession } from '@/lib/auth'
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
  last_maintenance_date?: string
  maintenance_cycle_days?: number
  warranty_status?: 'under_warranty' | 'expired' | 'not_applicable'
  warranty_expiry_date?: string
  part_order_list?: string
  attachments?: string[]
  created_at: string
  updated_at: string
  completed_at?: string
  submitter: {
    id: number
    username: string
    full_name: string
  }
  completed_by?: {
    id: number
    username: string
    full_name: string
  }
}

export default function RequestDetailPage() {
  const [user, setUser] = useState<User | null>(null)
  const [request, setRequest] = useState<MaintenanceRequest | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [newStatus, setNewStatus] = useState<string>('')
  const [isSaving, setIsSaving] = useState(false)
  const router = useRouter()
  const params = useParams()
  const requestId = params.id

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
      fetchRequest(token)
    } catch (err) {
      console.error('Error parsing user data:', err)
      clearUserSession()
      router.push('/login')
    }
  }, [requestId, router])

  const fetchRequest = async (token: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/maintenance-requests/${requestId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      )

      if (!response.ok) {
        if (response.status === 401) {
          clearUserSession()
          router.push('/login')
          return
        }
        if (response.status === 403) {
          router.push('/dashboard')
          return
        }
        throw new Error('Failed to fetch request')
      }

      const data = await response.json()
      setRequest(data)
      setNewStatus(data.status)
    } catch (error) {
      console.error('Error fetching request:', error)
      router.push('/dashboard/maintenance/my-requests')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateStatus = async () => {
    if (!newStatus || newStatus === request?.status) {
      setIsEditing(false)
      return
    }

    setIsSaving(true)
    const token = localStorage.getItem('accessToken')

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/maintenance-requests/${requestId}/status`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: newStatus }),
        }
      )

      if (response.ok) {
        const updatedRequest = await response.json()
        setRequest(updatedRequest)
        setIsEditing(false)
      } else {
        alert('Failed to update status')
      }
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Error updating status')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDownloadAttachment = (filename: string) => {
    const token = localStorage.getItem('accessToken')
    const url = `${process.env.NEXT_PUBLIC_API_URL}/api/maintenance-requests/${requestId}/attachments/${filename}`

    window.open(`${url}?token=${token}`, '_blank')
  }

  const hasMaintenanceAccess = user?.roles?.some((role: any) =>
    role.name === 'superuser' || role.name === 'maintenance'
  )

  const canEditStatus = hasMaintenanceAccess || user?.id === request?.submitter.id

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!user || !request) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />

      <main className="px-6 py-8 pb-16 bg-white min-h-screen">
        <div className="max-w-full mx-auto">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="flex items-center space-x-2 text-purple-600 hover:text-purple-700 font-semibold mb-6 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back</span>
          </button>

          {/* Header */}
          <div className="glass-card p-8 mb-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-3">{request.title}</h1>
                <div className="flex items-center space-x-3 mb-4">
                  <StatusBadge status={request.status} />
                  <PriorityBadge priority={request.priority} />
                </div>
              </div>
            </div>

            {/* Status Update Section */}
            {canEditStatus && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                    <span>Update Status</span>
                  </button>
                ) : (
                  <div className="flex items-center space-x-4">
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      disabled={isSaving}
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    <button
                      onClick={handleUpdateStatus}
                      disabled={isSaving}
                      className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
                    >
                      <Save className="h-4 w-4" />
                      <span>{isSaving ? 'Saving...' : 'Save'}</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false)
                        setNewStatus(request.status)
                      }}
                      disabled={isSaving}
                      className="flex items-center space-x-2 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg font-semibold transition-colors disabled:opacity-50"
                    >
                      <X className="h-4 w-4" />
                      <span>Cancel</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Description */}
          <div className="glass-card p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-3 flex items-center space-x-2">
              <FileText className="h-5 w-5 text-purple-600" />
              <span>Description</span>
            </h2>
            <p className="text-gray-700 whitespace-pre-wrap">{request.description}</p>
          </div>

          {/* Request Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Equipment & Location */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <Wrench className="h-5 w-5 text-purple-600" />
                <span>Equipment & Location</span>
              </h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-500">Equipment Name</span>
                  <p className="text-gray-900">{request.equipment_name || 'Not specified'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Location</span>
                  <p className="text-gray-900">{request.location || 'Not specified'}</p>
                </div>
              </div>
            </div>

            {/* Submitter Info */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <UserIcon className="h-5 w-5 text-purple-600" />
                <span>Submitted By</span>
              </h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-500">Name</span>
                  <p className="text-gray-900">{request.submitter.full_name}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Username</span>
                  <p className="text-gray-900">@{request.submitter.username}</p>
                </div>
              </div>
            </div>

            {/* Dates */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-purple-600" />
                <span>Important Dates</span>
              </h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-500">Submitted</span>
                  <p className="text-gray-900">
                    {new Date(request.created_at).toLocaleString()}
                  </p>
                </div>
                {request.requested_completion_date && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">Requested Completion</span>
                    <p className="text-gray-900">
                      {new Date(request.requested_completion_date).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {request.last_maintenance_date && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">Last Maintenance</span>
                    <p className="text-gray-900">
                      {new Date(request.last_maintenance_date).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {request.completed_at && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">Completed</span>
                    <p className="text-gray-900">
                      {new Date(request.completed_at).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Maintenance Info */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <Clock className="h-5 w-5 text-purple-600" />
                <span>Maintenance Schedule</span>
              </h3>
              <div className="space-y-3">
                {request.maintenance_cycle_days && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">Regular Cycle</span>
                    <p className="text-gray-900">Every {request.maintenance_cycle_days} days</p>
                  </div>
                )}
                <div>
                  <span className="text-sm font-medium text-gray-500">Warranty Status</span>
                  <p className="text-gray-900">
                    {request.warranty_status === 'under_warranty' && (
                      <span className="text-green-600 font-semibold">Under Warranty</span>
                    )}
                    {request.warranty_status === 'expired' && (
                      <span className="text-red-600 font-semibold">Expired</span>
                    )}
                    {request.warranty_status === 'not_applicable' && (
                      <span className="text-gray-600">Not Applicable</span>
                    )}
                    {!request.warranty_status && 'Not specified'}
                  </p>
                </div>
                {request.warranty_expiry_date && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">Warranty Expiry</span>
                    <p className="text-gray-900">
                      {new Date(request.warranty_expiry_date).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Part Order List */}
          {request.part_order_list && (
            <div className="glass-card p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <Package className="h-5 w-5 text-purple-600" />
                <span>Part Order List / Tracking</span>
              </h3>
              <p className="text-gray-700 whitespace-pre-wrap">{request.part_order_list}</p>
            </div>
          )}

          {/* Attachments */}
          {request.attachments && request.attachments.length > 0 && (
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <Download className="h-5 w-5 text-purple-600" />
                <span>Attachments</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {request.attachments.map((filename, index) => (
                  <button
                    key={index}
                    onClick={() => handleDownloadAttachment(filename)}
                    className="flex items-center space-x-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors text-left"
                  >
                    <Download className="h-5 w-5 text-purple-600 flex-shrink-0" />
                    <span className="text-sm text-gray-900 truncate">{filename}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Completion Info */}
          {request.completed_by && (
            <div className="glass-card p-6 mt-6 bg-green-50 border-2 border-green-200">
              <h3 className="text-lg font-semibold text-green-900 mb-3">Completion Details</h3>
              <p className="text-green-800">
                Completed by <strong>{request.completed_by.full_name}</strong> on{' '}
                {request.completed_at && new Date(request.completed_at).toLocaleString()}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
