'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { User, clearUserSession, validateSession } from '@/lib/auth'
import Navbar from '@/components/Navbar'

// The form is served by the lmhosted Odoo formio service, but reverse-proxied
// through FORGE so the iframe loads same-origin. This avoids the cross-origin
// cookie/session blocking that was causing silent submission failures with a
// direct https://aci.lmhosted.com iframe src.
const MAINTENANCE_FORM_SRC =
  '/formsm/public/form/new/864c8594-4dfc-4658-b403-c0b2bceecd77'

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
    <div className="flex flex-col h-screen bg-white dark:bg-gray-900">
      <Navbar user={user} />

      <iframe
        src={MAINTENANCE_FORM_SRC}
        className="flex-1 w-full"
        style={{ border: 'none', display: 'block' }}
        title="Maintenance Request Form"
      />
    </div>
  )
}
