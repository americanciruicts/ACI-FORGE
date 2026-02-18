/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // Enable standalone output for production
  images: {
    unoptimized: true, // Security: prevent image optimization vulnerabilities
  },
  // Security headers according to ACI Security Standards
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' http://*:2003 http://*:2005 http://acidashboard.aci.local http://acidashboard.aci.local:* http://localhost:* http://localhost:8082; frame-src 'self' http://acidashboard.aci.local:* https://aci.lmhosted.com http://aci.lmhosted.com;",
          },
          {
            key: 'Permissions-Policy',
            value: 'geolocation=(), microphone=(), camera=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
        ],
      },
    ]
  },
  // Removed rewrites to let nginx handle API routing
  // Security: Disable powered-by header
  poweredByHeader: false,
  // Security: Enable compression
  compress: true,
  // Security: Disable X-Powered-By header
  generateEtags: false,
  
  // Prevent hydration warnings from browser extensions
  reactStrictMode: true,
  
  // Experimental features to help with hydration
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react'],
  },
}

module.exports = nextConfig