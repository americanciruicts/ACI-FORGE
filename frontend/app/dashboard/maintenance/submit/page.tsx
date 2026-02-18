'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { User } from '@/lib/auth'
import { ArrowLeft, Wrench } from 'lucide-react'

export default function SubmitMaintenanceRequest() {
  const [user, setUser] = useState<User | null>(null)
  const router = useRouter()

  // Load user from localStorage
  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)
    } else {
      router.push('/login')
    }
  }, [router])

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

      <div className="px-4 md:px-6 py-6 md:py-8">
        <div className="max-w-full mx-auto">
          {/* Header */}
          <div className="flex items-center space-x-3 md:space-x-4 mb-6">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-lg hover:bg-blue-100 text-[#0066B3] transition-colors flex-shrink-0"
            >
              <ArrowLeft className="h-5 w-5 md:h-6 md:w-6" />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 flex items-center space-x-2 md:space-x-3">
                <Wrench className="h-6 w-6 md:h-8 md:w-8 text-[#0066B3]" />
                <span>Submit Maintenance Request</span>
              </h1>
              <p className="text-gray-600 mt-1 text-sm md:text-base">
                Complete the form below to submit your maintenance request
              </p>
            </div>
          </div>

          {/* Iframe Form */}
          <div className="glass-card p-2 md:p-4 flex justify-center" style={{ overflow: 'hidden' }}>
            <iframe
              src="http://aci.lmhosted.com/formsm/public/form/new/975dee18-714b-498a-9d1d-6fcdac49e21c?wmode=opaque&embed=1"
              sandbox="allow-same-origin allow-scripts allow-top-navigation"
              width="100%"
              height="650px"
              data-embed="true"
              className="border-0 max-w-7xl"
              title="Maintenance Request Form"
            />
          </div>

          {/* Commented out original form
          <form onSubmit={handleSubmit} className="glass-card p-8 space-y-8">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 border-b-2 border-purple-200 pb-2 flex items-center space-x-2">
                <span className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold">1</span>
                <span>Basic Information</span>
              </h2>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Your Name
                </label>
                <input
                  type="text"
                  value={user?.full_name || user?.username || ''}
                  disabled
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Subject <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                  placeholder="Brief description of the issue"
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
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Company
                </label>
                <input
                  type="text"
                  value="American Circuits, Inc."
                  disabled
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Team
                </label>
                <input
                  type="text"
                  value="Internal Maintenance"
                  disabled
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed"
                />
              </div>
            </div>

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
          */}
        </div>
      </div>
    </div>
  )
}
