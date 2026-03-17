import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center max-w-md mx-auto p-8">
        <div className="text-8xl font-bold text-[#0066B3]/20 mb-4">404</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Page Not Found</h1>
        <p className="text-gray-500 mb-8">The page you are looking for doesn't exist or has been moved.</p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/dashboard"
            className="px-6 py-2.5 bg-[#0066B3] text-white rounded-lg font-semibold hover:bg-[#004A82] transition-colors"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/login"
            className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
          >
            Go to Login
          </Link>
        </div>
      </div>
    </div>
  )
}
