'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import {
  Scissors, Calendar, Clock, Award, Shield, KeyRound,
  LogOut, Sparkles, User, LayoutDashboard
} from 'lucide-react'

export function CustomerNav() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const userRole = (session?.user as any)?.role

  const navLinks = [
    { href: '/booking', label: 'Buat Tempahan', icon: Calendar },
    { href: '/my-appointments', label: 'Tempahan Saya', icon: Clock },
    { href: '/membership', label: 'Kad Membership', icon: Award, highlight: true },
    { href: '/profile', label: 'Profil / Password', icon: KeyRound },
  ]

  return (
    <nav className="border-b border-gray-800/80 bg-gray-950/80 backdrop-blur-md px-4 sm:px-6 py-3.5 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3 sm:gap-4">
        {/* Logo Rasmi Hanscut Barbershop */}
        <Link href="/" className="flex items-center gap-2.5 group shrink-0">
          <div className="p-2 bg-amber-400/10 border border-amber-400/20 rounded-xl group-hover:bg-amber-400/20 transition-all group-hover:rotate-12 duration-300">
            <Scissors className="h-5 w-5 text-amber-400" />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-base sm:text-lg tracking-tight leading-tight">
              Hanscut <span className="text-amber-400">Barbershop</span>
            </span>
            <span className="text-[9px] font-extrabold text-amber-400/80 tracking-wider hidden sm:block">
              #REZEKI DI KONGSI BERSAMA
            </span>
          </div>
        </Link>

        {/* Menu Navigation Pelanggan (Desktop) */}
        <div className="hidden md:flex items-center gap-1.5 bg-gray-900/90 border border-gray-800 p-1.5 rounded-2xl">
          {navLinks.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-amber-400 to-yellow-400 text-gray-950 shadow-md font-black'
                    : item.highlight
                    ? 'text-amber-400 hover:bg-amber-400/10'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {item.label}
                {item.highlight && !isActive && (
                  <span className="flex h-1.5 w-1.5 rounded-full bg-amber-400 animate-ping ml-0.5" />
                )}
              </Link>
            )
          })}
        </div>

        {/* User Badge, Admin/Barber Shortcut & Log Out */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Admin Portal Shortcut jika role ADMIN */}
          {userRole === 'ADMIN' && (
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 text-xs bg-amber-400 text-gray-950 px-3 py-1.5 rounded-xl font-black hover:bg-amber-300 transition-all shadow-md active:scale-95"
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Panel Admin</span>
            </Link>
          )}

          {/* Barber Portal Shortcut jika role BARBER */}
          {userRole === 'BARBER' && (
            <Link
              href="/barber"
              className="flex items-center gap-1.5 text-xs bg-amber-400 text-gray-950 px-3 py-1.5 rounded-xl font-black hover:bg-amber-300 transition-all shadow-md active:scale-95"
            >
              <Scissors className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Portal Barber</span>
            </Link>
          )}

          {session ? (
            <>
              <div className="hidden sm:flex items-center gap-2 bg-gray-900 border border-gray-800 px-3 py-1.5 rounded-xl">
                <div className="w-5 h-5 bg-gradient-to-br from-amber-400 to-yellow-500 text-gray-950 font-black text-xs rounded-full flex items-center justify-center">
                  {session.user?.name?.charAt(0) || 'U'}
                </div>
                <span className="text-xs font-bold text-gray-300 truncate max-w-[120px]">
                  {session.user?.name}
                </span>
              </div>

              <button
                onClick={async () => {
                  await signOut({ redirect: false })
                  window.location.href = '/'
                }}
                className="flex items-center gap-1 text-xs text-red-400 bg-red-950/30 hover:bg-red-900/40 border border-red-900/40 px-3 py-1.5 rounded-xl transition-all font-bold active:scale-95"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Keluar</span>
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="bg-gradient-to-r from-amber-400 to-yellow-400 text-gray-950 font-black px-4 py-1.5 rounded-xl text-xs hover:from-amber-300 hover:to-yellow-300 transition-all shadow-md active:scale-95"
            >
              Log Masuk
            </Link>
          )}
        </div>
      </div>

      {/* Mobile Submenu Bar */}
      <div className="flex md:hidden items-center justify-between gap-1 overflow-x-auto pt-3 border-t border-gray-800/60 mt-2 text-xs">
        {navLinks.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-bold transition-colors ${
                isActive ? 'bg-amber-400 text-gray-950' : 'text-gray-400 hover:text-white'
              }`}
            >
              {item.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
