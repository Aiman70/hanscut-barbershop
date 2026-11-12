'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import {
  Scissors, Calendar, Clock, Award, KeyRound,
  LogOut, LayoutDashboard, Home, User
} from 'lucide-react'

export function CustomerNav() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const userRole = (session?.user as any)?.role

  const navLinks = [
    { href: '/', label: 'Utama', icon: Home },
    { href: '/booking', label: 'Tempah Slot', icon: Calendar },
    { href: '/my-appointments', label: 'Tempahan', icon: Clock },
    { href: '/membership', label: 'Membership', icon: Award },
    { href: '/profile', label: 'Profil', icon: User },
  ]

  return (
    <>
      {/* 🧭 TOP NAVBAR (Desktop & Mobile Header) */}
      <header className="border-b border-gray-800 bg-gray-950/90 backdrop-blur-md px-4 sm:px-6 py-3 sticky top-0 z-40 select-none">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          {/* Logo Rasmi Hanscut Barbershop */}
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="p-2 bg-amber-400/10 border border-amber-400/20 rounded-xl group-hover:bg-amber-400/20 transition-all group-hover:rotate-12 duration-300">
              <Scissors className="h-5 w-5 text-amber-400" />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-base sm:text-lg tracking-tight leading-tight text-white">
                Hanscut <span className="text-amber-400">Barbershop</span>
              </span>
              <span className="text-[9px] font-extrabold text-amber-400/80 tracking-wider hidden sm:block">
                #REZEKI DI KONGSI BERSAMA
              </span>
            </div>
          </Link>

          {/* Navigasi Desktop (>= 768px) */}
          <nav className="hidden md:flex items-center gap-1 bg-gray-900 border border-gray-800 p-1 rounded-2xl">
            {navLinks.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-amber-400 text-gray-950 shadow-md font-black'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* Kanan: Shortcut Portal Staf / Admin & Profil */}
          <div className="flex items-center gap-2">
            {userRole === 'ADMIN' && (
              <Link
                href="/dashboard"
                className="flex items-center gap-1 text-xs bg-amber-400 text-gray-950 px-3 py-1.5 rounded-xl font-bold hover:bg-amber-300 transition-all shadow-sm active:scale-95"
              >
                <LayoutDashboard className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Panel Admin</span>
              </Link>
            )}

            {userRole === 'BARBER' && (
              <Link
                href="/barber"
                className="flex items-center gap-1 text-xs bg-amber-400 text-gray-950 px-3 py-1.5 rounded-xl font-bold hover:bg-amber-300 transition-all shadow-sm active:scale-95"
              >
                <Scissors className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Portal Barber</span>
              </Link>
            )}

            {session ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/profile"
                  className="flex items-center gap-2 bg-gray-900 border border-gray-800 px-2.5 py-1.5 rounded-xl hover:border-gray-700 transition-all"
                  title="Lihat Profil"
                >
                  <div className="w-5 h-5 bg-amber-400 text-gray-950 font-black text-xs rounded-full flex items-center justify-center shrink-0">
                    {session.user?.name?.charAt(0) || 'U'}
                  </div>
                  <span className="text-xs font-semibold text-gray-300 truncate max-w-[100px] hidden sm:inline">
                    {session.user?.name}
                  </span>
                </Link>

                <button
                  onClick={async () => {
                    await signOut({ redirect: false })
                    window.location.href = '/'
                  }}
                  className="flex items-center gap-1 text-xs text-red-400 bg-red-950/20 hover:bg-red-900/30 border border-red-900/30 px-2.5 py-1.5 rounded-xl transition-all font-semibold active:scale-95"
                  title="Log Keluar"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Keluar</span>
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="bg-amber-400 text-gray-950 font-bold px-3.5 py-1.5 rounded-xl text-xs hover:bg-amber-300 transition-all shadow-sm active:scale-95"
              >
                Log Masuk
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* 📱 BOTTOM NAVIGATION BAR UNTUK HANDPHONE (< 768px) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-gray-950/95 backdrop-blur-lg border-t border-gray-800/90 px-2 py-1.5 flex items-center justify-around shadow-2xl">
        {navLinks.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all min-w-[56px] min-h-[46px] ${
                isActive
                  ? 'text-amber-400 font-extrabold'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <div className={`p-1 rounded-lg ${isActive ? 'bg-amber-400/10' : ''}`}>
                <Icon className={`h-4 w-4 ${isActive ? 'text-amber-400' : 'text-gray-400'}`} />
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight font-medium">
                {item.label}
              </span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
