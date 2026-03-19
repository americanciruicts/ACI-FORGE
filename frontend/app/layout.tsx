import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import ClientErrorBoundary from '@/components/ClientErrorBoundary'
import ClientProviders from '@/components/ClientProviders'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ACI FORGE',
  description: 'ACI FORGE - Your Gateway to Enterprise Tools',
  icons: {
    icon: '/aci-forge-icon.svg',
    shortcut: '/aci-forge-icon.svg',
    apple: '/aci-forge-icon.svg',
  },
  openGraph: {
    title: 'ACI FORGE',
    description: 'ACI FORGE - Your Gateway to Enterprise Tools',
    siteName: 'ACI FORGE',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/aci-forge-icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/aci-forge-icon.svg" />
        <script dangerouslySetInnerHTML={{ __html: `
          try {
            if (localStorage.getItem('theme') === 'dark' || (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
              document.documentElement.classList.add('dark')
            }
          } catch(e) {}
        `}} />
      </head>
      <body className={inter.className} suppressHydrationWarning={true}>
        <ClientProviders>
          <ClientErrorBoundary>
            {children}
          </ClientErrorBoundary>
        </ClientProviders>
      </body>
    </html>
  )
}