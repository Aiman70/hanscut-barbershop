// src/app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
// @ts-ignore Next.js processes global CSS imports at build time.
import './globals.css'
import { Toaster } from '@/components/ui/toaster'
import { SessionProvider } from '@/components/providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Hanscut Barbershop - Tempahan Online | #REZEKI DI KONGSI BERSAMA',
  description: 'Tempah temujanji barbershop anda dengan mudah dan cepat',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ms">
      <body className={inter.className}>
        <SessionProvider>
          {children}
          <Toaster />
        </SessionProvider>
      </body>
    </html>
  )
}
