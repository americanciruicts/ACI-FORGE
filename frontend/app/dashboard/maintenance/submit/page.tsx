'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Wrench, ExternalLink } from 'lucide-react'
import { User, clearUserSession, validateSession } from '@/lib/auth'
import Navbar from '@/components/Navbar'
import Breadcrumbs from '@/components/Breadcrumbs'

export default function SubmitMaintenancePage() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const session = validateSession()

    if (!session.isValid || !session.user || !session.token) {
      clearUserSession()
      router.replace('/login')
      return
    }

    setUser(session.user)

    setIsLoading(false)
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0066B3]"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar user={user} />

      <main className="max-w-5xl mx-auto px-4 py-6">
        <Breadcrumbs items={[{ label: 'Maintenance', href: '/dashboard/maintenance/submit' }, { label: 'Submit Request' }]} />
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Wrench className="h-6 w-6 text-[#0066B3]" />
            Submit Maintenance Request
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Fill out the form below to submit a maintenance request</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
          <div className="flex flex-col items-center text-center gap-4 py-8">
            <div className="h-16 w-16 rounded-full bg-[#0066B3]/10 flex items-center justify-center">
              <Wrench className="h-8 w-8 text-[#0066B3]" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Open the Maintenance Request Form
            </h2>
            <p className="max-w-md text-sm text-gray-500 dark:text-gray-400">
              Click the button below to open the maintenance request form in a new
              tab. When you&apos;re finished, you can close that tab and return here.
            </p>
            <a
              href="http://aci.lmhosted.com/formsm/public/form/new/975dee18-714b-498a-9d1d-6fcdac49e21c"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-[#0066B3] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#005299] focus:outline-none focus:ring-2 focus:ring-[#0066B3] focus:ring-offset-2"
            >
              <ExternalLink className="h-4 w-4" />
              Open Maintenance Form
            </a>
            <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
              Opens in a new tab at aci.lmhosted.com
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
