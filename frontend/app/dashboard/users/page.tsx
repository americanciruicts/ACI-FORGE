'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Edit, Search, Trash2, Key, Eye, EyeOff, User as UserIcon, X } from 'lucide-react'
import { User, clearUserSession } from '@/lib/auth'
import Navbar from '@/components/Navbar'

interface Role {
  id: number
  name: string
  description: string
}

interface Tool {
  id: number
  name: string
  display_name: string
  description: string
}

interface UserData {
  id: number
  full_name: string
  username: string
  email: string
  is_active: boolean
  created_at: string
  roles: Role[]
  tools: Tool[]
}

interface CreateUserForm {
  full_name: string
  username: string
  email: string
  password: string
  role_ids: number[]
  tool_ids: number[]
  send_email: boolean
}

interface UpdateUserForm {
  full_name: string
  email: string
  role_ids: number[]
  tool_ids: number[]
  is_active: boolean
}

export default function UserManagementPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [users, setUsers] = useState<UserData[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [tools, setTools] = useState<Tool[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [toolsExpanded, setToolsExpanded] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null)
  const [createForm, setCreateForm] = useState<CreateUserForm>({
    full_name: '',
    username: '',
    email: '',
    password: '',
    role_ids: [],
    tool_ids: [],
    send_email: true
  })
  const [updateForm, setUpdateForm] = useState<UpdateUserForm>({
    full_name: '',
    email: '',
    role_ids: [],
    tool_ids: [],
    is_active: true
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSendingEmails, setIsSendingEmails] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const initializePage = async () => {
      const token = localStorage.getItem('accessToken')
      const userData = localStorage.getItem('user')

      if (!token) {
        router.push('/login')
        return
      }

      if (userData) {
        try {
          const parsedUser = JSON.parse(userData)
          setCurrentUser(parsedUser)
          
          // Check if user is superuser only
          const hasUserManagementAccess = parsedUser.roles?.some((role: any) => role.name === 'superuser')
          if (!hasUserManagementAccess) {
            router.push('/dashboard')
            return
          }
        } catch {
          clearUserSession()
          router.push('/login')
          return
        }
      }

      await loadData()
      setIsLoading(false)
    }

    initializePage()
  }, [router])

  const loadData = async () => {
    try {
      const token = localStorage.getItem('accessToken')

      if (!token) {
        console.error('No access token found')
        clearUserSession()
        router.push('/login')
        return
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }

      // Load users
      const usersResponse = await fetch(`/api/users`, { headers })
      if (usersResponse.status === 401) {
        console.error('Authentication failed - redirecting to login')
        clearUserSession()
        router.push('/login')
        return
      }
      if (usersResponse.ok) {
        const usersData = await usersResponse.json()
        setUsers(usersData)
      }

      // Load roles
      const rolesResponse = await fetch(`/api/roles`, { headers })
      if (rolesResponse.status === 401) {
        console.error('Authentication failed - redirecting to login')
        clearUserSession()
        router.push('/login')
        return
      }
      if (rolesResponse.ok) {
        const rolesData = await rolesResponse.json()
        setRoles(rolesData)
      }

      // Load tools
      const toolsResponse = await fetch(`/api/tools`, { headers })
      if (toolsResponse.status === 401) {
        console.error('Authentication failed - redirecting to login')
        clearUserSession()
        router.push('/login')
        return
      }
      if (toolsResponse.ok) {
        const toolsData = await toolsResponse.json()
        setTools(toolsData)
      }
    } catch (error) {
      console.error('Error loading data:', error)
      setError('Failed to load data')
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')
    setSuccess('')

    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/users`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(createForm)
      })

      if (response.ok) {
        const userData = await response.json()
        
        if (createForm.send_email) {
          setSuccess(`🎉 User "${userData.full_name}" created successfully! 
          📧 Profile creation notification sent to ${userData.email}
          📧 Login credentials will be sent shortly`)
        } else {
          setSuccess(`🎉 User "${userData.full_name}" created successfully!`)
        }
        
        setShowCreateModal(false)
        setCreateForm({
          full_name: '',
          username: '',
          email: '',
          password: '',
          role_ids: [],
          tool_ids: [],
          send_email: true
        })
        await loadData()
      } else {
        const errorData = await response.json()
        setError(errorData.detail || 'Failed to create user')
      }
    } catch (error) {
      setError('Network error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser) return

    setIsSubmitting(true)
    setError('')
    setSuccess('')

    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateForm)
      })

      if (response.ok) {
        setSuccess('User updated successfully!')
        setShowEditModal(false)
        setSelectedUser(null)
        await loadData()
      } else {
        const errorData = await response.json()
        setError(errorData.detail || 'Failed to update user')
      }
    } catch (error) {
      setError('Network error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteUser = async () => {
    if (!selectedUser) return

    setIsSubmitting(true)
    setError('')
    setSuccess('')

    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        setSuccess('User deleted successfully!')
        setShowDeleteModal(false)
        setSelectedUser(null)
        await loadData()
      } else {
        const errorData = await response.json()
        setError(errorData.detail || 'Failed to delete user')
      }
    } catch (error) {
      setError('Network error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*'
    let password = ''
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setCreateForm(prev => ({ ...prev, password }))
  }

  const openEditModal = (user: UserData) => {
    setSelectedUser(user)
    setUpdateForm({
      full_name: user.full_name,
      email: user.email,
      role_ids: user.roles.map(r => r.id),
      tool_ids: user.tools.map(t => t.id),
      is_active: user.is_active
    })
    setShowEditModal(true)
  }

  const openDeleteModal = (user: UserData) => {
    setSelectedUser(user)
    setShowDeleteModal(true)
  }

  const handleSendCredentialsToAll = async () => {
    setIsSendingEmails(true)
    setError('')
    setSuccess('')
    
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/users/send-credentials-to-all`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const result = await response.json()
        setSuccess(`🎉 Credentials sent to all users! 
        ✅ Successfully sent: ${result.successful_sends}/${result.total_users}
        ${result.failed_sends > 0 ? `❌ Failed: ${result.failed_sends}` : ''}`)
      } else {
        const errorData = await response.json()
        setError(errorData.detail || 'Failed to send credentials to users')
      }
    } catch (error) {
      setError('Network error occurred while sending credentials')
    } finally {
      setIsSendingEmails(false)
    }
  }

  const handleSendCredentialsToUser = async (userId: number) => {
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/users/send-credentials/${userId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const result = await response.json()
        setSuccess(`📧 Credentials sent successfully to ${result.user_email}!`)
      } else {
        const errorData = await response.json()
        setError(errorData.detail || 'Failed to send credentials')
      }
    } catch (error) {
      setError('Network error occurred while sending credentials')
    }
  }

  const filteredUsers = users.filter(user =>
    user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!currentUser) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navbar */}
      <Navbar user={currentUser} />

      {/* Main Content */}
      <main className="px-4 md:px-6 py-6 md:py-8 pb-16 bg-white min-h-screen">
          <div className="mb-6 md:mb-10">
            <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
              <div>
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-1 md:mb-2">User Management</h2>
                <p className="text-gray-600 text-sm md:text-base lg:text-lg">Manage users, roles, and permissions</p>
              </div>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-gradient-to-r from-[#0066B3] to-[#0077CC] hover:from-[#004A82] hover:to-[#0066B3] text-white px-4 md:px-6 py-2.5 md:py-3 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl font-semibold text-sm md:text-base"
                >
                  <Plus className="h-4 w-4 md:h-5 md:w-5" />
                  <span>Add User</span>
                </button>

                <button
                  onClick={handleSendCredentialsToAll}
                  disabled={isSendingEmails}
                  className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white px-4 md:px-6 py-2.5 md:py-3 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm md:text-base"
                >
                  <svg className="h-4 w-4 md:h-5 md:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="hidden sm:inline">{isSendingEmails ? 'Sending...' : 'Email All Users'}</span>
                  <span className="sm:hidden">{isSendingEmails ? 'Sending...' : 'Email All'}</span>
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 shadow-sm">
              {error}
            </div>
          )}
          
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 shadow-sm">
              {success}
            </div>
          )}

          {/* Search */}
          <div className="mb-6 md:mb-10">
            <div className="relative max-w-full md:max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 md:h-5 md:w-5" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 md:pl-10 pr-4 py-2.5 md:py-3 text-sm md:text-base border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066B3] focus:border-[#0066B3] shadow-sm transition-all"
              />
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-lg md:rounded-xl shadow-lg border-2 border-gray-200 overflow-hidden">
            {/* Mobile scroll hint */}
            <div className="lg:hidden px-4 py-2 bg-blue-50 border-b border-blue-100 text-xs text-blue-600 text-center">
              Swipe left to see more →
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-blue-50 to-cyan-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">User Information</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Roles</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Assigned Tools</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-gradient-to-br from-[#0066B3] to-[#0077CC] rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                            <UserIcon className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-900">{user.full_name}</div>
                            <div className="text-sm text-gray-500">@{user.username}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {user.roles.map((role) => (
                            <span key={role.id} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-[#0066B3]">
                              {role.name === 'superuser' ? 'SUPER USER' : role.name.toUpperCase()}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {user.tools.map((tool) => (
                            <span key={tool.id} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                              {tool.display_name}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                          user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openEditModal(user)}
                            className="text-[#0066B3] hover:text-[#004A82] p-2 rounded-lg hover:bg-blue-50 transition-all"
                            title="Edit User"
                          >
                            <Edit className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => handleSendCredentialsToUser(user.id)}
                            className="text-green-600 hover:text-green-900 p-2 rounded-lg hover:bg-green-50 transition-all"
                            title="Send Account Credentials"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                          </button>

                          {currentUser.id !== user.id && (
                            <button
                              onClick={() => openDeleteModal(user)}
                              className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50 transition-all"
                              title="Delete User"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filteredUsers.length === 0 && (
                <div className="text-center py-12">
                  <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-semibold text-gray-900">No users found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {searchTerm ? 'Try adjusting your search terms.' : 'Get started by adding a new user.'}
                  </p>
                </div>
              )}
            </div>
          </div>
      </main>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg md:rounded-xl shadow-2xl max-w-2xl w-full max-h-[95vh] md:max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6 md:p-8">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-gray-900">Create New User</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-all"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                    <input
                      type="text"
                      required
                      value={createForm.full_name}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, full_name: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Username</label>
                    <input
                      type="text"
                      required
                      value={createForm.username}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, username: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      required
                      value={createForm.email}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={createForm.password}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, password: e.target.value }))}
                        className="w-full px-4 py-3 pr-20 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                        placeholder="Enter password or generate"
                      />
                      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex space-x-1">
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                          title={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                        <button
                          type="button"
                          onClick={generatePassword}
                          className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                          title="Generate password"
                        >
                          <Key className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Roles</label>
                  <div className="space-y-3 max-h-36 overflow-y-auto border border-gray-300 rounded-lg p-4 bg-gray-50">
                    {roles.map((role) => (
                      <label key={role.id} className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={createForm.role_ids.includes(role.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setCreateForm(prev => ({ ...prev, role_ids: [...prev.role_ids, role.id] }))
                            } else {
                              setCreateForm(prev => ({ ...prev, role_ids: prev.role_ids.filter(id => id !== role.id) }))
                            }
                          }}
                          className="mr-3 h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <div>
                          <span className="text-sm font-medium text-gray-900">{role.name === 'superuser' ? 'SUPER USER' : role.name.toUpperCase()}</span>
                          <p className="text-xs text-gray-500">{role.description}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Tools</label>
                  <div className="space-y-3 max-h-36 overflow-y-auto border border-gray-300 rounded-lg p-4 bg-gray-50">
                    {tools.map((tool) => (
                      <label key={tool.id} className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={createForm.tool_ids.includes(tool.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setCreateForm(prev => ({ ...prev, tool_ids: [...prev.tool_ids, tool.id] }))
                            } else {
                              setCreateForm(prev => ({ ...prev, tool_ids: prev.tool_ids.filter(id => id !== tool.id) }))
                            }
                          }}
                          className="mr-3 h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <div>
                          <span className="text-sm font-medium text-gray-900">{tool.display_name}</span>
                          <p className="text-xs text-gray-500">{tool.description}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={createForm.send_email}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, send_email: e.target.checked }))}
                      className="mr-3 h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Send credentials via email</span>
                  </label>
                </div>

                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-3 bg-gradient-to-r from-[#0066B3] to-[#0077CC] hover:from-[#004A82] hover:to-[#0066B3] text-white rounded-lg transition-all disabled:opacity-50 font-semibold shadow-lg hover:shadow-xl"
                  >
                    {isSubmitting ? 'Creating...' : 'Create User'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg md:rounded-xl shadow-2xl max-w-2xl w-full max-h-[95vh] md:max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6 md:p-8">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-gray-900">Edit User: {selectedUser.full_name}</h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-all"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleUpdateUser} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={updateForm.full_name}
                      onChange={(e) => setUpdateForm(prev => ({ ...prev, full_name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      required
                      value={updateForm.email}
                      onChange={(e) => setUpdateForm(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Roles</label>
                  <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2">
                    {roles.map((role) => (
                      <label key={role.id} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={updateForm.role_ids.includes(role.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setUpdateForm(prev => ({ ...prev, role_ids: [...prev.role_ids, role.id] }))
                            } else {
                              setUpdateForm(prev => ({ ...prev, role_ids: prev.role_ids.filter(id => id !== role.id) }))
                            }
                          }}
                          className="mr-2"
                        />
                        <span className="text-sm">{role.name === 'superuser' ? 'SUPER USER' : role.name.toUpperCase()} - {role.description}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tools</label>
                  <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2">
                    {tools.map((tool) => (
                      <label key={tool.id} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={updateForm.tool_ids.includes(tool.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setUpdateForm(prev => ({ ...prev, tool_ids: [...prev.tool_ids, tool.id] }))
                            } else {
                              setUpdateForm(prev => ({ ...prev, tool_ids: prev.tool_ids.filter(id => id !== tool.id) }))
                            }
                          }}
                          className="mr-2"
                        />
                        <span className="text-sm">{tool.display_name} - {tool.description}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={updateForm.is_active}
                      onChange={(e) => setUpdateForm(prev => ({ ...prev, is_active: e.target.checked }))}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Active</span>
                  </label>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-3 bg-gradient-to-r from-[#0066B3] to-[#0077CC] hover:from-[#004A82] hover:to-[#0066B3] text-white rounded-lg transition-all disabled:opacity-50 font-semibold shadow-lg hover:shadow-xl"
                  >
                    {isSubmitting ? 'Updating...' : 'Update User'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Modal */}
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg md:rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6 md:p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Delete User</h2>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-all"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="mb-8">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="h-8 w-8 text-red-600" />
                </div>
                <p className="text-gray-700 text-center text-lg">
                  Are you sure you want to delete <strong className="text-gray-900">{selectedUser.full_name}</strong>?
                </p>
                <p className="text-red-600 text-center text-sm mt-2">This action cannot be undone.</p>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteUser}
                  disabled={isSubmitting}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all disabled:opacity-50 font-semibold shadow-lg hover:shadow-xl"
                >
                  {isSubmitting ? 'Deleting...' : 'Delete User'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}