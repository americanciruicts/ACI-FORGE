'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Wrench } from 'lucide-react'
import { User, clearUserSession, validateSession } from '@/lib/auth'
import Navbar from '@/components/Navbar'
import Breadcrumbs from '@/components/Breadcrumbs'

// The form is served by the lmhosted Odoo formio service, but reverse-proxied
// through FORGE so the iframe loads same-origin. This avoids the cross-origin
// cookie/session blocking that was causing silent submission failures with a
// direct https://aci.lmhosted.com iframe src.
const MAINTENANCE_FORM_SRC =
  '/formsm/public/form/new/975dee18-714b-498a-9d1d-6fcdac49e21c'

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
        <Breadcrumbs
          items={[
            { label: 'Maintenance', href: '/dashboard/maintenance/submit' },
            { label: 'Submit Request' },
          ]}
        />
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Wrench className="h-6 w-6 text-[#0066B3]" />
            Submit Maintenance Request
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Fill out the form below to submit a maintenance request
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <iframe
            src={MAINTENANCE_FORM_SRC}
            width="100%"
            height="900"
            style={{ border: 'none', minHeight: '900px', display: 'block' }}
            title="Maintenance Request Form"
          />
        </div>
      </main>
    </div>
  )
}
