'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Wrench } from 'lucide-react'
import { User, clearUserSession } from '@/lib/auth'
import Navbar from '@/components/Navbar'
import Breadcrumbs from '@/components/Breadcrumbs'

export default function SubmitMaintenancePage() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
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
    } catch (err) {
      clearUserSession()
      router.push('/login')
    }

    setIsLoading(false)
  }, [router])

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
      <Navbar user={user} />

      <main className="max-w-5xl mx-auto px-4 py-6">
        <Breadcrumbs items={[{ label: 'Maintenance', href: '/dashboard/maintenance/submit' }, { label: 'Submit Request' }]} />
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Wrench className="h-6 w-6 text-[#0066B3]" />
            Submit Maintenance Request
          </h1>
          <p className="text-sm text-gray-500 mt-1">Fill out the form below to submit a maintenance request</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <iframe
            src="https://aci.lmhosted.com/formsm/public/form/new/975dee18-714b-498a-9d1d-6fcdac49e21c"
            width="100%"
            height="700"
            style={{ border: 'none', minHeight: '700px' }}
            title="Maintenance Request Form"
          />
        </div>
      </main>
    </div>
  )
}
