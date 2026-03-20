'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { validateSession } from '@/lib/auth'

export default function HomePage() {
  const router = useRouter()
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (isClient) {
      const session = validateSession()
      if (session.isValid) {
        router.replace('/dashboard')
      } else {
        router.replace('/login')
      }
    }
  }, [router, isClient])

  // Show dark background matching login page to avoid any flash
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0f1c' }}>
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  )
}