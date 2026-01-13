'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { User } from '@/lib/auth'
import { ArrowLeft, Upload, X, Wrench, Info, AlertCircle } from 'lucide-react'

export default function SubmitMaintenanceRequest() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isMaintenanceUser, setIsMaintenanceUser] = useState(false)
  const router = useRouter()

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    equipment_name: '',
    location: '',
    requested_completion_date: '',
    last_maintenance_date: '',
    maintenance_cycle_days: '',
    warranty_status: 'not_applicable',
    warranty_expiry_date: '',
    part_order_list: ''
  })

  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Load user from localStorage
  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)

      // Check if user has maintenance role
      const hasMaintenance = parsedUser.roles?.some((role: any) =>
        role.name === 'superuser' || role.name === 'maintenance'
      )
      setIsMaintenanceUser(hasMaintenance)
    } else {
      router.push('/login')
    }
  }, [router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setSelectedFiles(prev => [...prev, ...files])
  }

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const token = localStorage.getItem('accessToken')

      // Prepare request body - only include maintenance fields if user is maintenance personnel
      const requestBody: any = {
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        equipment_name: formData.equipment_name || null,
        location: formData.location || null,
        requested_completion_date: formData.requested_completion_date || null
      }

      // Add maintenance-specific fields only if user has maintenance role
      if (isMaintenanceUser) {
        requestBody.last_maintenance_date = formData.last_maintenance_date || null
        requestBody.maintenance_cycle_days = formData.maintenance_cycle_days ? parseInt(formData.maintenance_cycle_days) : null
        requestBody.warranty_status = formData.warranty_status
        requestBody.warranty_expiry_date = formData.warranty_expiry_date || null
        requestBody.part_order_list = formData.part_order_list || null
      }

      // First, create the maintenance request
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/maintenance-requests`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to create maintenance request')
      }

      const createdRequest = await response.json()

      // If there are files, upload them
      if (selectedFiles.length > 0) {
        const formDataFiles = new FormData()
        selectedFiles.forEach(file => {
          formDataFiles.append('files', file)
        })

        const uploadResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/maintenance-requests/${createdRequest.id}/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formDataFiles
        })

        if (!uploadResponse.ok) {
          console.error('File upload failed, but request was created')
        }
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/dashboard/maintenance/my-requests')
      }, 2000)

    } catch (err: any) {
      setError(err.message || 'Failed to submit request')
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />

      <div className="px-6 py-8">
        <div className="max-w-full mx-auto">
          {/* Header */}
          <div className="flex items-center space-x-4 mb-6">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-lg hover:bg-purple-100 text-purple-600 transition-colors"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
                <Wrench className="h-8 w-8 text-purple-600" />
                <span>Submit Maintenance Request</span>
              </h1>
              <p className="text-gray-600 mt-1">
                {isMaintenanceUser
                  ? 'Fill out the comprehensive form with all maintenance details'
                  : 'Report an issue or request maintenance for equipment'}
              </p>
            </div>
          </div>

          {/* Info Banner */}
          {!isMaintenanceUser && (
            <div className="mb-6 glass-card p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-indigo-500">
              <div className="flex items-start space-x-3">
                <Info className="h-5 w-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-indigo-900">Quick Submit Form</h3>
                  <p className="text-sm text-indigo-700">
                    Just describe the issue - maintenance personnel will handle scheduling and warranty details.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-6 glass-card p-4 bg-green-50 border-l-4 border-green-500">
              <div className="flex items-center space-x-3">
                <AlertCircle className="h-5 w-5 text-green-600" />
                <span className="text-green-800 font-semibold">Request submitted successfully! Redirecting...</span>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 glass-card p-4 bg-red-50 border-l-4 border-red-500">
              <div className="flex items-center space-x-3">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <span className="text-red-800 font-semibold">{error}</span>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="glass-card p-8 space-y-8">
            {/* Basic Information */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 border-b-2 border-purple-200 pb-2 flex items-center space-x-2">
                <span className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold">1</span>
                <span>Basic Information</span>
              </h2>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                  placeholder="Brief description of the issue (e.g., 'Reflow Oven Temperature Issue')"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows={5}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                  placeholder="Detailed description of what's wrong or what maintenance is needed..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Priority <span className="text-red-500">*</span></label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                >
                  <option value="low">Low - Can wait for regular maintenance</option>
                  <option value="medium">Medium - Should be addressed soon</option>
                  <option value="high">High - Affecting operations</option>
                  <option value="urgent">Urgent - Critical issue, immediate attention needed</option>
                </select>
              </div>
            </div>

            {/* Equipment Details */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 border-b-2 border-purple-200 pb-2 flex items-center space-x-2">
                <span className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold">2</span>
                <span>Equipment Details</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Equipment Name</label>
                  <input
                    type="text"
                    name="equipment_name"
                    value={formData.equipment_name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                    placeholder="e.g., Reflow Oven #3, CNC Machine A2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                    placeholder="e.g., Production Floor, Building A, Bay 3"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Requested Completion Date</label>
                <input
                  type="date"
                  name="requested_completion_date"
                  value={formData.requested_completion_date}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                />
              </div>
            </div>

            {/* Maintenance Details - Only for Maintenance Users */}
            {isMaintenanceUser && (
              <div className="space-y-4 bg-purple-50 p-6 rounded-lg border-2 border-purple-200">
                <h2 className="text-xl font-semibold text-gray-900 border-b-2 border-purple-300 pb-2 flex items-center space-x-2">
                  <span className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold">3</span>
                  <span>Maintenance Schedule & Details</span>
                  <span className="text-xs bg-purple-600 text-white px-2 py-1 rounded-full">Maintenance Only</span>
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Last Maintenance Date</label>
                    <input
                      type="date"
                      name="last_maintenance_date"
                      value={formData.last_maintenance_date}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Maintenance Cycle (Days)</label>
                    <input
                      type="number"
                      name="maintenance_cycle_days"
                      value={formData.maintenance_cycle_days}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                      placeholder="e.g., 90"
                      min="1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Warranty Status</label>
                    <select
                      name="warranty_status"
                      value={formData.warranty_status}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                    >
                      <option value="not_applicable">Not Applicable</option>
                      <option value="under_warranty">Under Warranty</option>
                      <option value="expired">Expired</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Warranty Expiry Date</label>
                    <input
                      type="date"
                      name="warranty_expiry_date"
                      value={formData.warranty_expiry_date}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Part Order List / Tracking</label>
                  <textarea
                    name="part_order_list"
                    value={formData.part_order_list}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                    placeholder="Parts needed, order numbers, tracking info..."
                  />
                </div>
              </div>
            )}

            {/* File Attachments */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 border-b-2 border-purple-200 pb-2 flex items-center space-x-2">
                <span className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold">{isMaintenanceUser ? '4' : '3'}</span>
                <span>Attachments (Optional)</span>
              </h2>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-400 transition-colors">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <label className="cursor-pointer">
                  <span className="text-purple-600 hover:text-purple-700 font-semibold">Click to upload</span>
                  <span className="text-gray-600"> or drag and drop</span>
                  <input
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                    accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                  />
                </label>
                <p className="text-xs text-gray-500 mt-2">PDF, Images, Documents (Max 10MB each)</p>
              </div>

              {selectedFiles.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-gray-700">Selected Files:</p>
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
                      <span className="text-sm text-gray-700 truncate flex-1">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="ml-3 p-1 hover:bg-purple-200 rounded transition-colors"
                      >
                        <X className="h-4 w-4 text-red-600" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex items-center justify-between pt-6 border-t-2 border-gray-200">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
