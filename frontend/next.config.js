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
            // SAMEORIGIN instead of DENY so the maintenance page can embed
            // the reverse-proxied rithomiq form iframe (same-origin path).
            // External sites still cannot frame FORGE.
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
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
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https://forge.americancircuits.net https://api-forge.americancircuits.net https://*.trycloudflare.com http://*:2003 http://*:2005 http://acidashboard.aci.local http://acidashboard.aci.local:* http://localhost:* http://localhost:8082; frame-src 'self' http://acidashboard.aci.local:* https://aci.rithomiq.com http://aci.rithomiq.com https://vercel.live;",
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
  // API proxy rewrites for local development
  // In production (Vercel), vercel.json handles rewrites to the Cloudflare tunnel
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:2003/api/:path*',
      },
      {
        source: '/health',
        destination: 'http://localhost:2003/health',
      },
      // Reverse-proxy the rithomiq Odoo formio service so the embedded
      // maintenance form is served same-origin. This avoids cross-origin
      // cookie/session blocking that was causing silent submission failures.
      {
        source: '/formsm/:path*',
        destination: 'https://aci.rithomiq.com/formsm/:path*',
      },
      {
        source: '/formio/:path*',
        destination: 'https://aci.rithomiq.com/formio/:path*',
      },
      {
        source: '/web/:path*',
        destination: 'https://aci.rithomiq.com/web/:path*',
      },
      {
        source: '/longpolling/:path*',
        destination: 'https://aci.rithomiq.com/longpolling/:path*',
      },
    ]
  },
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

