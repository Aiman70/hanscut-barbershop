'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import {
  Scissors, LayoutDashboard, Calendar, Users, Sparkles,
  Settings, FileText, ArrowLeft, KeyRound, LogOut, ShieldCheck,
  Menu, X
} from 'lucide-react'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard Ringkasan', icon: LayoutDashboard },
  { href: '/bookings', label: 'Pengurusan Tempahan', icon: Calendar },
  { href: '/staff', label: 'Staff & Barber', icon: Users },
  { href: '/services', label: 'Servis & Harga', icon: Sparkles },
  { href: '/settings', label: 'Tetapan & Kuota', icon: Settings },
  { href: '/audit-logs', label: 'Log Audit Keselamatan', icon: FileText },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [mobileOpen, setMobileOpen] = useState(false)

  // Tutup mobile drawer secara automatik apabila bertukar halaman
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  // Halang scrolling pada background bila mobile drawer dibuka
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [mobileOpen])

  return (
    <>
      {/* 📱 1. MOBILE TOP NAVIGATION BAR (Hanya di skrin telefon < 768px) */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-gray-900/95 backdrop-blur-md border-b border-gray-800 px-4 flex items-center justify-between z-40 select-none shadow-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2.5 rounded-xl bg-gray-800/80 text-gray-300 hover:text-white border border-gray-700/80 active:scale-95 transition-all"
            aria-label="Buka Menu Admin"
          >
            {mobileOpen ? <X className="h-5 w-5 text-amber-400" /> : <Menu className="h-5 w-5 text-amber-400" />}
          </button>

          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="p-1.5 bg-amber-400/10 border border-amber-400/20 rounded-lg">
              <Scissors className="h-4 w-4 text-amber-400" />
            </div>
            <div>
              <span className="font-black text-sm tracking-tight text-white">
                Hanscut <span className="text-amber-400">Admin</span>
              </span>
            </div>
          </Link>
        </div>

        <Link
          href="/"
          className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-400/10 hover:bg-amber-400/20 px-2.5 py-1.5 rounded-lg border border-amber-400/20 font-bold transition-all"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Laman Web</span>
        </Link>
      </header>

      {/* 📱 2. MOBILE DRAWER OVERLAY & SIDE PANEL */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop gelap untuk dismiss */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileOpen(false)}
          />

          <aside className="relative w-72 max-w-[85vw] bg-gray-900 border-r border-gray-800 p-5 flex flex-col justify-between z-50 h-full shadow-2xl overflow-y-auto">
            <div className="space-y-5">
              {/* Header Drawer */}
              <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-amber-400/10 border border-amber-400/20 rounded-xl">
                    <Scissors className="h-5 w-5 text-amber-400" />
                  </div>
                  <div>
                    <div className="font-black text-base text-white">
                      Hanscut <span className="text-amber-400">Admin</span>
                    </div>
                    <div className="text-[10px] text-amber-400/80 font-bold tracking-wider uppercase flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3 text-amber-400" />
                      Panel Kawalan
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Tagline */}
              <div className="px-2.5 py-1 bg-amber-400/5 border border-amber-400/10 rounded-lg text-center">
                <span className="text-[10px] font-extrabold text-amber-400/90 tracking-wider">
                  #REZEKI DI KONGSI BERSAMA
                </span>
              </div>

              {/* Senarai Navigasi Mobile */}
              <nav className="space-y-1.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500 px-3 mb-2">
                  Menu Utama
                </div>
                {NAV_ITEMS.map((item) => {
                  const isActive = pathname === item.href
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition-all min-h-[44px] ${
                        isActive
                          ? 'bg-amber-400 text-gray-950 font-black shadow-lg shadow-amber-400/10'
                          : 'text-gray-300 hover:text-white hover:bg-gray-800/80'
                      }`}
                    >
                      <Icon className={`h-4 w-4 ${isActive ? 'text-gray-950' : 'text-amber-400'}`} />
                      <span>{item.label}</span>
                    </Link>
                  )
                })}
              </nav>
            </div>

            {/* Profil & Logout Drawer */}
            <div className="pt-4 border-t border-gray-800 space-y-2.5">
              <Link
                href="/profile"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center gap-2 text-xs text-amber-400 bg-amber-400/10 hover:bg-amber-400/20 px-3 py-2.5 rounded-xl font-bold border border-amber-400/20 transition-all min-h-[44px]"
              >
                <KeyRound className="h-4 w-4" />
                <span>Tukar Password</span>
              </Link>

              <button
                onClick={async () => {
                  await signOut({ redirect: false })
                  window.location.href = '/login'
                }}
                className="w-full flex items-center justify-center gap-2 bg-red-950/20 hover:bg-red-900/30 text-red-400 border border-red-900/30 py-2.5 rounded-xl text-xs font-bold transition-all min-h-[44px]"
              >
                <LogOut className="h-4 w-4" />
                <span>Log Keluar</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* 💻 3. DESKTOP PERSISTENT SIDEBAR (Hanya di skrin >= 768px) */}
      <aside className="hidden md:flex w-64 min-h-screen bg-gray-900 border-r border-gray-800 p-5 fixed left-0 top-0 bottom-0 flex-col justify-between z-40 select-none shadow-2xl">
        <div className="space-y-6">
          <div className="border-b border-gray-800/80 pb-5">
            <Link href="/dashboard" className="flex items-center gap-3 group">
              <div className="p-2.5 bg-amber-400/10 border border-amber-400/20 rounded-2xl group-hover:bg-amber-400/20 transition-all group-hover:rotate-12 duration-300">
                <Scissors className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <div className="font-black text-base tracking-tight text-white group-hover:text-amber-400 transition-colors">
                  Hanscut <span className="text-amber-400">Barbershop</span>
                </div>
                <div className="text-[10px] font-bold text-amber-400/80 tracking-wider uppercase flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3 text-amber-400" />
                  Panel Admin
                </div>
              </div>
            </Link>

            <div className="mt-3 px-2.5 py-1 bg-amber-400/5 border border-amber-400/10 rounded-lg text-center">
              <span className="text-[10px] font-extrabold text-amber-400/90 tracking-wider">
                #REZEKI DI KONGSI BERSAMA
              </span>
            </div>
          </div>

          <nav className="space-y-1.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500 px-3 mb-2">
              Menu Utama
            </div>
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-amber-400 text-gray-950 font-black shadow-lg shadow-amber-400/10 translate-x-1'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-gray-950' : 'text-amber-400'}`} />
                  <span>{item.label}</span>
                </Link>
              )
            })}

            <div className="pt-3 mt-3 border-t border-gray-800/80 space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500 px-3 mb-1">
                Pintasan
              </div>
              <Link
                href="/"
                className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-gray-400 hover:text-amber-400 hover:bg-gray-800/40 rounded-xl transition-all"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Laman Pelanggan</span>
              </Link>
            </div>
          </nav>
        </div>

        <div className="pt-4 border-t border-gray-800/80 space-y-2.5">
          <Link
            href="/profile"
            className="flex items-center justify-center gap-2 text-xs text-amber-400 hover:text-amber-300 bg-amber-400/10 hover:bg-amber-400/20 px-3 py-2 rounded-xl font-bold border border-amber-400/20 transition-all active:scale-95"
          >
            <KeyRound className="h-3.5 w-3.5" />
            <span>Tukar Password</span>
          </Link>

          <div className="bg-gray-950/70 p-3 rounded-2xl border border-gray-800 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-400 text-gray-950 font-black text-xs flex items-center justify-center shrink-0 shadow-sm">
              {session?.user?.name ? session.user.name.charAt(0).toUpperCase() : 'A'}
            </div>
            <div className="overflow-hidden min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate">
                {session?.user?.name || 'Administrator'}
              </p>
              <p className="text-[10px] text-amber-400 font-semibold truncate">
                {session?.user?.email || 'admin@hanscut.my'}
              </p>
            </div>
          </div>

          <button
            onClick={async () => {
              await signOut({ redirect: false })
              window.location.href = '/login'
            }}
            className="w-full flex items-center justify-center gap-2 bg-red-950/20 hover:bg-red-900/30 text-red-400 border border-red-900/30 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Log Keluar</span>
          </button>
        </div>
      </aside>
    </>
  )
}
