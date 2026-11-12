'use client'

import { AdminSidebar } from '@/components/admin-sidebar'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Calendar, Users, TrendingUp, Clock, DollarSign,
  ArrowRight, Scissors, Sparkles, RefreshCw
} from 'lucide-react'
import { format } from 'date-fns'
import { ms } from 'date-fns/locale'
import { formatCurrency } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/status-badge'
import { EmptyState } from '@/components/ui/empty-state'

interface Stats {
  totalBookings: number
  todayBookings: number
  pendingBookings: number
  totalRevenue: number
  monthlyRevenue: number
}

interface Booking {
  id: string
  date: string
  startTime: string
  status: string
  totalPrice: number
  customer: { name: string | null; phone: string | null }
  service: { name: string }
  barber: { user: { name: string | null } }
}

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentBookings, setRecentBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/login'); return }
    if (status === 'authenticated') {
      if ((session?.user as any)?.role !== 'ADMIN') { router.push('/booking'); return }
      fetchDashboardData()
    }
  }, [status, session])

  const fetchDashboardData = async () => {
    try {
      const [statsRes, bookingsRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/bookings'),
      ])
      const [statsData, bookingsData] = await Promise.all([
        statsRes.json(), bookingsRes.json(),
      ])
      setStats(statsData)
      setRecentBookings(Array.isArray(bookingsData) ? bookingsData.slice(0, 5) : [])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-white text-sm font-semibold animate-pulse flex items-center gap-2">
          <RefreshCw className="h-4 w-4 animate-spin text-amber-400" />
          <span>Memuatkan data dashboard...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex selection:bg-amber-400 selection:text-gray-950">
      <AdminSidebar />

      {/* Main Content dengan margin responsif untuk telefon pintar */}
      <main className="flex-1 md:ml-64 pt-20 md:pt-8 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full pb-20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Dashboard Ringkasan</h1>
            <p className="text-gray-400 text-xs sm:text-sm mt-1">
              Prestasi kedai pada {format(new Date(), "EEEE, dd MMMM yyyy", { locale: ms })}
            </p>
          </div>

          <Link href="/bookings">
            <Button
              variant="primary"
              size="md"
              rightIcon={<ArrowRight className="h-4 w-4" />}
              className="self-start sm:self-auto min-h-[44px]"
            >
              Urus Tempahan Penuh
            </Button>
          </Link>
        </div>

        {/* 4 Kad Statistik Utama (Card Primitives) */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
            {[
              { label: 'Jumlah Duit Masuk', value: formatCurrency(stats.totalRevenue), icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
              { label: 'Hasil Bulan Ini', value: formatCurrency(stats.monthlyRevenue), icon: TrendingUp, color: 'text-blue-400', bg: 'bg-blue-500/10' },
              { label: 'Tempahan Hari Ini', value: stats.todayBookings, icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10' },
              { label: 'Menunggu Sahkan', value: stats.pendingBookings, icon: Calendar, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
            ].map((card, i) => (
              <Card key={i} className="p-4 sm:p-5 hover:border-gray-700 transition-all">
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <span className="text-gray-400 text-[11px] sm:text-xs font-medium truncate">{card.label}</span>
                  <div className={`p-2 rounded-xl ${card.bg} shrink-0`}>
                    <card.icon className={`h-4 w-4 ${card.color}`} />
                  </div>
                </div>
                <p className={`text-xl sm:text-2xl font-black ${card.color}`}>{card.value}</p>
              </Card>
            ))}
          </div>
        )}

        {/* Kad Jalan Pantas (Quick Actions) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <Link href="/staff">
            <Card className="hover:border-amber-400/40 p-4 sm:p-5 transition-all group flex flex-col justify-between h-full">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-sm sm:text-base text-white group-hover:text-amber-400 transition-colors flex items-center gap-2">
                  <Users className="h-4 w-4 text-amber-400" /> Urus Staff Barber
                </span>
                <ArrowRight className="h-4 w-4 text-gray-500 group-hover:text-amber-400 transition-transform group-hover:translate-x-1" />
              </div>
              <p className="text-xs text-gray-400">Semak kehadiran dan status rehat tukang gunting.</p>
            </Card>
          </Link>

          <Link href="/services">
            <Card className="hover:border-amber-400/40 p-4 sm:p-5 transition-all group flex flex-col justify-between h-full">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-sm sm:text-base text-white group-hover:text-amber-400 transition-colors flex items-center gap-2">
                  <Scissors className="h-4 w-4 text-amber-400" /> Servis & Harga
                </span>
                <ArrowRight className="h-4 w-4 text-gray-500 group-hover:text-amber-400 transition-transform group-hover:translate-x-1" />
              </div>
              <p className="text-xs text-gray-400">Kemas kini harga pakej gunting rambut dan janggut.</p>
            </Card>
          </Link>

          <Link href="/bookings">
            <Card className="hover:border-amber-400/40 p-4 sm:p-5 transition-all group flex flex-col justify-between h-full">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-sm sm:text-base text-white group-hover:text-amber-400 transition-colors flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-amber-400" /> Senarai Tempahan
                </span>
                <ArrowRight className="h-4 w-4 text-gray-500 group-hover:text-amber-400 transition-transform group-hover:translate-x-1" />
              </div>
              <p className="text-xs text-gray-400">Sahkan pelanggan atau kemas kini status gunting.</p>
            </Card>
          </Link>
        </div>

        {/* 5 Tempahan Terkini */}
        <Card className="p-4 sm:p-6 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">5 Tempahan Terkini</h2>
              <p className="text-xs text-gray-400">Ringkasan transaksi tempahan paling baharu</p>
            </div>
            <Link
              href="/bookings"
              className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 min-h-[36px]"
            >
              Lihat Semua ({stats?.totalBookings || 0}) →
            </Link>
          </div>

          {recentBookings.length === 0 ? (
            <div className="py-8 text-center text-gray-500 text-xs sm:text-sm">
              Tiada tempahan dibuat lagi setakat ini.
            </div>
          ) : (
            <div className="space-y-2.5">
              {recentBookings.map((b) => (
                <div
                  key={b.id}
                  className="bg-gray-950/70 border border-gray-800/80 p-3.5 rounded-xl flex items-center justify-between gap-3 hover:border-gray-700 transition-all"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-xs sm:text-sm text-white truncate">
                      {b.customer?.name || 'Pelanggan'}
                    </p>
                    <p className="text-[11px] sm:text-xs text-gray-400 mt-0.5 truncate">
                      {b.service?.name} • Barber:{' '}
                      <span className="text-amber-400 font-medium">{b.barber?.user?.name || '-'}</span>
                    </p>
                  </div>

                  <div className="text-right shrink-0 flex flex-col items-end gap-1">
                    <p className="font-bold text-xs sm:text-sm text-amber-400">{formatCurrency(b.totalPrice)}</p>
                    <StatusBadge status={b.status} size="sm" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </main>
    </div>
  )
}
