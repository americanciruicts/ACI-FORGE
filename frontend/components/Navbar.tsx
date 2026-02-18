'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Image from 'next/image'
import { LogOut, User as UserIcon, Home, Users, ChevronDown, Wrench, Menu, X } from 'lucide-react'
import { User, clearUserSession } from '@/lib/auth'

interface NavbarProps {
  user: User
}

export default function Navbar({ user }: NavbarProps) {
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  const handleLogout = () => {
    clearUserSession()
    router.push('/login')
  }

  const isActive = (path: string) => {
    return pathname === path
  }

  const hasUserManagementAccess = user.roles?.some((role: any) =>
    role.name === 'superuser'
  )

  const hasMaintenanceAccess = user.roles?.some((role: any) =>
    role.name === 'superuser' || role.name === 'maintenance'
  )

  return (
    <div className="w-full bg-gradient-to-r from-[#003d6a] via-[#0066B3] to-[#0077CC] shadow-xl sticky top-0 z-50">
      <div className="flex items-center justify-between h-[72px] px-4 md:px-6">
        {/* Logo and Brand */}
        <div className="flex items-center flex-shrink-0">
          <Image
            src="/aci-forge-navbar.svg"
            alt="ACI FORGE - Your Gateway to Enterprise Tools"
            width={280}
            height={60}
            className="h-[48px] md:h-[56px] w-auto"
            priority
          />
        </div>

        {/* Desktop Navigation Menu */}
        <nav className="hidden lg:flex items-center space-x-1">
          <button
            onClick={() => router.push('/dashboard')}
            className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl font-semibold transition-all duration-200 ${
              isActive('/dashboard')
                ? 'bg-white text-[#0066B3] shadow-lg transform scale-105'
                : 'text-white hover:bg-white/15 hover:shadow-md active:scale-95'
            }`}
            style={{ outline: 'none', userSelect: 'none' }}
          >
            <Home className="h-5 w-5" />
            <span>Home</span>
          </button>

          {/* Maintenance Button */}
          <button
            onClick={() => router.push('/dashboard/maintenance/submit')}
            className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl font-semibold transition-all duration-200 ${
              pathname?.startsWith('/dashboard/maintenance')
                ? 'bg-white text-[#0066B3] shadow-lg transform scale-105'
                : 'text-white hover:bg-white/15 hover:shadow-md active:scale-95'
            }`}
            style={{ outline: 'none', userSelect: 'none' }}
          >
            <Wrench className="h-5 w-5" />
            <span>Maintenance</span>
          </button>

          {hasUserManagementAccess && (
            <button
              onClick={() => router.push('/dashboard/users')}
              className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl font-semibold transition-all duration-200 ${
                isActive('/dashboard/users')
                  ? 'bg-white text-[#0066B3] shadow-lg transform scale-105'
                  : 'text-white hover:bg-white/15 hover:shadow-md active:scale-95'
              }`}
              style={{ outline: 'none', userSelect: 'none' }}
            >
              <Users className="h-5 w-5" />
              <span>Users</span>
            </button>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 text-white hover:bg-white/15 rounded-lg transition-all"
          style={{ outline: 'none', userSelect: 'none' }}
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>

        {/* Desktop User Profile Section */}
        <div className="hidden lg:block relative">
          <button
            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
            className="flex items-center space-x-3 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30 transition-all duration-200 active:scale-95"
            style={{ outline: 'none', userSelect: 'none' }}
          >
            {/* Avatar */}
            <div className="w-10 h-10 bg-gradient-to-br from-white to-gray-100 rounded-full flex items-center justify-center flex-shrink-0 shadow-md border-2 border-white/50">
              <UserIcon className="h-5 w-5 text-[#0066B3]" />
            </div>

            {/* User Info */}
            <div className="flex flex-col items-start min-w-[120px]">
              <p className="text-sm font-semibold text-white leading-tight truncate max-w-[140px]">
                {user.full_name}
              </p>
              <div className="flex flex-wrap gap-1 mt-1">
                {user.roles?.slice(0, 2).map((role) => (
                  <span
                    key={role.id}
                    className="text-[10px] bg-white/20 text-white/90 px-2 py-0.5 rounded-full font-medium uppercase tracking-wide"
                  >
                    {role.name === 'superuser' ? 'Admin' : role.name === 'maintenance' ? 'Maint' : role.name}
                  </span>
                ))}
              </div>
            </div>

            {/* Dropdown Arrow */}
            <ChevronDown
              className={`h-4 w-4 text-white/80 transform transition-transform duration-200 ${
                userDropdownOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* User Dropdown Menu */}
          {userDropdownOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 z-50 overflow-hidden">
              {/* User Header */}
              <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-cyan-50">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#0066B3] to-[#0077CC] rounded-full flex items-center justify-center shadow-md">
                    <UserIcon className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-bold text-gray-900 truncate">{user.full_name}</p>
                    <p className="text-sm text-gray-500 truncate">@{user.username}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {user.roles?.map((role) => (
                    <span
                      key={role.id}
                      className="text-xs bg-[#0066B3]/10 text-[#0066B3] px-2.5 py-1 rounded-full font-semibold uppercase tracking-wide"
                    >
                      {role.name === 'superuser' ? 'Super User' : role.name === 'maintenance' ? 'Maintenance' : role.name}
                    </span>
                  ))}
                </div>
              </div>

              {/* Menu Items */}
              <div className="py-2">
                <button
                  onClick={() => {
                    setUserDropdownOpen(false)
                    router.push('/dashboard/profile')
                  }}
                  className="w-full text-left px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-blue-50 hover:text-[#0066B3] transition-all duration-200 flex items-center space-x-3"
                  style={{ outline: 'none', userSelect: 'none' }}
                >
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <UserIcon className="h-4 w-4 text-gray-600" />
                  </div>
                  <span>View Profile</span>
                </button>

                <button
                  onClick={() => {
                    setUserDropdownOpen(false)
                    router.push('/reset-password')
                  }}
                  className="w-full text-left px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-all duration-200 flex items-center space-x-3"
                  style={{ outline: 'none', userSelect: 'none' }}
                >
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <svg className="h-4 w-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                  </div>
                  <span>Reset Password</span>
                </button>
              </div>

              {/* Logout */}
              <div className="border-t border-gray-100 pt-2 pb-1 px-3">
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200 flex items-center space-x-3 rounded-lg"
                  style={{ outline: 'none', userSelect: 'none' }}
                >
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                    <LogOut className="h-4 w-4 text-red-500" />
                  </div>
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-gray-200 shadow-lg">
          {/* Navigation Links */}
          <div className="px-4 py-3 space-y-1">
            <button
              onClick={() => {
                setMobileMenuOpen(false)
                router.push('/dashboard')
              }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg font-semibold transition-all ${
                isActive('/dashboard')
                  ? 'bg-gradient-to-r from-[#0066B3] to-[#0077CC] text-white shadow-md'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Home className="h-5 w-5" />
              <span>Home</span>
            </button>

            <button
              onClick={() => {
                setMobileMenuOpen(false)
                router.push('/dashboard/maintenance/submit')
              }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg font-semibold transition-all ${
                pathname?.startsWith('/dashboard/maintenance')
                  ? 'bg-gradient-to-r from-[#0066B3] to-[#0077CC] text-white shadow-md'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Wrench className="h-5 w-5" />
              <span>Submit Maintenance Request</span>
            </button>

            {hasUserManagementAccess && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false)
                  router.push('/dashboard/users')
                }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg font-semibold transition-all ${
                  isActive('/dashboard/users')
                    ? 'bg-gradient-to-r from-[#0066B3] to-[#0077CC] text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Users className="h-5 w-5" />
                <span>Users</span>
              </button>
            )}
          </div>

          {/* Mobile User Section */}
          <div className="px-4 py-3 border-t border-gray-200 bg-gradient-to-r from-blue-50 to-cyan-50">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-[#0066B3] to-[#0077CC] rounded-full flex items-center justify-center shadow-md">
                <UserIcon className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">{user.full_name}</p>
                <p className="text-xs text-gray-500 truncate">@{user.username}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {user.roles?.map((role) => (
                <span
                  key={role.id}
                  className="text-xs bg-[#0066B3]/10 text-[#0066B3] px-2.5 py-1 rounded-full font-semibold uppercase"
                >
                  {role.name === 'superuser' ? 'Admin' : role.name === 'maintenance' ? 'Maint' : role.name}
                </span>
              ))}
            </div>
            <div className="space-y-1">
              <button
                onClick={() => {
                  setMobileMenuOpen(false)
                  router.push('/dashboard/profile')
                }}
                className="w-full flex items-center space-x-2 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-white rounded-lg transition-all"
              >
                <UserIcon className="h-4 w-4" />
                <span>View Profile</span>
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false)
                  handleLogout()
                }}
                className="w-full flex items-center space-x-2 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-all"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
