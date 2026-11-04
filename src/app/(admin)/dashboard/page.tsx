'use client'

import { AdminSidebar } from '@/components/admin-sidebar'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Scissors, Calendar, Users, TrendingUp,
  Clock, CheckCircle, BarChart2, DollarSign, LogOut, ArrowRight
} from 'lucide-react'
import { format } from 'date-fns'
import { ms } from 'date-fns/locale'
import { formatCurrency } from '@/lib/utils'
import { signOut } from 'next-auth/react'

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

const STATUS_CONFIG: Record<string, { label: string; badge: string }> = {
  PENDING: { label: 'Menunggu', badge: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' },
  CONFIRMED: { label: 'Disahkan', badge: 'bg-green-500/10 text-green-400 border border-green-500/20' },
  COMPLETED: { label: 'Selesai', badge: 'bg-blue-500/10 text-blue-400 border border-blue-500/20' },
  CANCELLED: { label: 'Batal', badge: 'bg-red-500/10 text-red-400 border border-red-500/20' },
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
        <div className="text-white text-base animate-pulse">Memuatkan statistik bisnes...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex">
      {/* Sidebar Admin */}
      <AdminSidebar />

      {/* Main Content */}
      <main className="ml-64 flex-1 p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-1">Dashboard Prestasi Bisnes</h1>
            <p className="text-gray-400 text-sm">
              Ringkasan aktiviti kedai pada {format(new Date(), "EEEE, dd MMMM yyyy", { locale: ms })}
            </p>
          </div>
          
          <Link
            href="/bookings"
            className="flex items-center gap-2 bg-amber-400 text-gray-950 font-bold px-4 py-2.5 rounded-xl text-sm hover:bg-amber-300 transition-all shadow-md"
          >
            Urus Tempahan Penuh <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* 4 Kad Statistik Utama */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-8">
            {[
              { label: 'Jumlah Duit Masuk', value: formatCurrency(stats.totalRevenue), icon: DollarSign, color: 'text-green-400', bg: 'bg-green-500/10' },
              { label: 'Hasil Bulan Ini', value: formatCurrency(stats.monthlyRevenue), icon: TrendingUp, color: 'text-blue-400', bg: 'bg-blue-500/10' },
              { label: 'Tempahan Hari Ini', value: stats.todayBookings, icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10' },
              { label: 'Menunggu Sahkan', value: stats.pendingBookings, icon: Calendar, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
            ].map((card, i) => (
              <div key={i} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 hover:border-gray-700 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-gray-400 text-xs font-medium">{card.label}</span>
                  <div className={`p-2 rounded-xl ${card.bg}`}>
                    <card.icon className={`h-4 w-4 ${card.color}`} />
                  </div>
                </div>
                <p className={`text-2xl font-extrabold ${card.color}`}>{card.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Kad Jalan Pantas (Quick Shortcuts) */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Link href="/staff" className="bg-gray-900 border border-gray-800 hover:border-amber-400/40 p-5 rounded-2xl transition-all group">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-white group-hover:text-amber-400 transition-colors">✂️ Urus Staff Barber</span>
              <ArrowRight className="h-4 w-4 text-gray-500 group-hover:text-amber-400" />
            </div>
            <p className="text-xs text-gray-400">Tambah tukang gunting baru atau semak kehadiran.</p>
          </Link>

          <Link href="/services" className="bg-gray-900 border border-gray-800 hover:border-amber-400/40 p-5 rounded-2xl transition-all group">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-white group-hover:text-amber-400 transition-colors">💈 Servis & Senarai Harga</span>
              <ArrowRight className="h-4 w-4 text-gray-500 group-hover:text-amber-400" />
            </div>
            <p className="text-xs text-gray-400">Tukar harga potongan rambut, beard trim, atau servis baru.</p>
          </Link>

          <Link href="/bookings" className="bg-gray-900 border border-gray-800 hover:border-amber-400/40 p-5 rounded-2xl transition-all group">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-white group-hover:text-amber-400 transition-colors">📅 Tempahan Hari Ini</span>
              <ArrowRight className="h-4 w-4 text-gray-500 group-hover:text-amber-400" />
            </div>
            <p className="text-xs text-gray-400">Semak senarai nama pelanggan yang akan hadir hari ini.</p>
          </Link>
        </div>

        {/* 5 Tempahan Terkini */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold">5 Tempahan Terkini</h2>
              <p className="text-xs text-gray-400">Ringkasan transaksi tempahan paling baru dibuat</p>
            </div>
            <Link
              href="/bookings"
              className="text-xs text-amber-400 hover:underline font-semibold flex items-center gap-1"
            >
              Lihat Semua Tempahan ({stats?.totalBookings || 0}) →
            </Link>
          </div>

          {recentBookings.length === 0 ? (
            <div className="py-8 text-center text-gray-500 text-sm">
              Tiada tempahan dibuat lagi setakat ini.
            </div>
          ) : (
            <div className="space-y-3">
              {recentBookings.map((b) => {
                const cfg = STATUS_CONFIG[b.status] || { label: b.status, badge: 'bg-gray-800 text-gray-400' }
                return (
                  <div key={b.id} className="bg-gray-800/40 border border-gray-800 p-4 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="font-bold text-sm text-white">{b.customer?.name || 'Pelanggan'}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {b.service?.name} • Barber: <span className="text-amber-400">{b.barber?.user?.name || '-'}</span>
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="font-bold text-sm text-amber-400">{formatCurrency(b.totalPrice)}</p>
                      <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${cfg.badge}`}>
                        {cfg.label}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
