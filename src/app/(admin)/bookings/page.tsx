'use client'

import { AdminSidebar } from '@/components/admin-sidebar'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Scissors, Calendar, Search, Filter, CheckCircle, XCircle, Clock,
  User, Phone, DollarSign, LogOut, RefreshCw
} from 'lucide-react'
import { format } from 'date-fns'
import { ms } from 'date-fns/locale'
import { formatCurrency } from '@/lib/utils'
import { signOut } from 'next-auth/react'
import { useToast } from '@/components/ui/use-toast'

interface Booking {
  id: string
  date: string
  startTime: string
  endTime: string
  status: string
  totalPrice: number
  notes: string | null
  customer: { name: string | null; email: string; phone: string | null }
  service: { name: string; duration: number }
  barber: { user: { name: string | null } }
}

const STATUS_CONFIG: Record<string, { label: string; color: string; badge: string }> = {
  PENDING: { label: 'Menunggu', color: 'text-yellow-400', badge: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' },
  CONFIRMED: { label: 'Disahkan', color: 'text-green-400', badge: 'bg-green-500/10 border-green-500/20 text-green-400' },
  COMPLETED: { label: 'Selesai', color: 'text-blue-400', badge: 'bg-blue-500/10 border-blue-500/20 text-blue-400' },
  CANCELLED: { label: 'Batal', color: 'text-red-400', badge: 'bg-red-500/10 border-red-500/20 text-red-400' },
}

export default function BookingsManagementPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/login'); return }
    if (status === 'authenticated') {
      if ((session?.user as any)?.role !== 'ADMIN') { router.push('/booking'); return }
      fetchBookings()
    }
  }, [status, session])

  const fetchBookings = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/bookings')
      const data = await res.json()
      setBookings(Array.isArray(data) ? data : [])
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (id: string, newStatus: string) => {
    setUpdatingId(id)
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        toast({ title: 'Status tempahan berjaya dikemaskini' })
        fetchBookings()
      } else {
        toast({ title: 'Gagal kemaskini status', variant: 'destructive' })
      }
    } finally {
      setUpdatingId(null)
    }
  }

  const filteredBookings = bookings.filter((b) => {
    const matchesSearch =
      (b.customer?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.customer?.phone || '').includes(searchTerm) ||
      (b.barber?.user?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.id.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === 'ALL' || b.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="min-h-screen bg-gray-950 text-white flex">
      {/* Sidebar Admin */}
      <AdminSidebar />

      {/* Main Content */}
      <main className="ml-64 flex-1 p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-1">Pengurusan Tempahan Pelanggan</h1>
            <p className="text-gray-400 text-sm">Semak, tapis, dan kemaskini status temujanji harian</p>
          </div>

          <button
            onClick={fetchBookings}
            className="flex items-center gap-2 bg-gray-900 border border-gray-800 hover:bg-gray-800 text-gray-300 px-4 py-2.5 rounded-xl text-sm transition-colors"
          >
            <RefreshCw className="h-4 w-4" /> Refresh Data
          </button>
        </div>

        {/* Bar Carian & Filter */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
          {/* Kotak Search */}
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input
              type="text"
              placeholder="Cari nama pelanggan, no. tel, barber..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-800/80 border border-gray-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-400 transition-colors"
            />
          </div>

          {/* Filter Status Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
            {['ALL', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                  statusFilter === st
                    ? 'bg-amber-400 text-gray-950 font-bold'
                    : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                {st === 'ALL' ? 'Semua' : STATUS_CONFIG[st]?.label || st}
              </button>
            ))}
          </div>
        </div>

        {/* Senarai Jadual Tempahan */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
          {loading ? (
            <div className="p-12 text-center text-gray-500 animate-pulse">Memuatkan senarai tempahan...</div>
          ) : filteredBookings.length === 0 ? (
            <div className="p-16 text-center">
              <Calendar className="h-12 w-12 text-gray-700 mx-auto mb-3" />
              <p className="text-gray-400 font-medium">Tiada rekod tempahan dijumpai</p>
              <p className="text-xs text-gray-600 mt-1">Cuba tukar carian atau filter status di atas</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-800 bg-gray-950/40 text-gray-400 text-xs uppercase tracking-wider">
                    <th className="p-4">Pelanggan</th>
                    <th className="p-4">Servis & Barber</th>
                    <th className="p-4">Tarikh & Masa</th>
                    <th className="p-4">Harga</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-center">Tindakan Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60">
                  {filteredBookings.map((b) => {
                    const cfg = STATUS_CONFIG[b.status] || { label: b.status, badge: 'bg-gray-800 text-gray-400' }
                    return (
                      <tr key={b.id} className="hover:bg-gray-800/30 transition-colors">
                        {/* Info Pelanggan */}
                        <td className="p-4">
                          <p className="font-bold text-white flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5 text-amber-400" /> {b.customer?.name || 'Pelanggan'}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                            <Phone className="h-3 w-3 text-gray-500" /> {b.customer?.phone || 'Tiada tel'}
                          </p>
                          {b.notes && (
                            <p className="text-[11px] text-amber-300/80 italic mt-1 line-clamp-1">
                              Nota: "{b.notes}"
                            </p>
                          )}
                        </td>

                        {/* Servis & Barber */}
                        <td className="p-4">
                          <p className="font-medium text-white">{b.service?.name}</p>
                          <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                            <Scissors className="h-3 w-3 text-gray-500" /> Barber: <span className="text-amber-400">{b.barber?.user?.name || '-'}</span>
                          </p>
                        </td>

                        {/* Tarikh & Masa */}
                        <td className="p-4">
                          <p className="font-medium text-white">
                            {format(new Date(b.date), 'dd MMM yyyy', { locale: ms })}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                            <Clock className="h-3 w-3 text-gray-500" /> {b.startTime} - {b.endTime}
                          </p>
                        </td>

                        {/* Harga */}
                        <td className="p-4 font-bold text-amber-400">
                          {formatCurrency(b.totalPrice)}
                        </td>

                        {/* Status Badge */}
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.badge}`}>
                            {cfg.label}
                          </span>
                        </td>

                        {/* Tindakan */}
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-1.5">
                            {b.status === 'PENDING' && (
                              <button
                                onClick={() => updateStatus(b.id, 'CONFIRMED')}
                                disabled={updatingId === b.id}
                                className="px-2.5 py-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 rounded-lg text-xs font-bold transition-all"
                                title="Sahkan Tempahan"
                              >
                                Sahkan
                              </button>
                            )}
                            {b.status !== 'COMPLETED' && b.status !== 'CANCELLED' && (
                              <button
                                onClick={() => updateStatus(b.id, 'COMPLETED')}
                                disabled={updatingId === b.id}
                                className="px-2.5 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 rounded-lg text-xs font-bold transition-all"
                                title="Tandakan Selesai Gunting"
                              >
                                Selesai
                              </button>
                            )}
                            {b.status !== 'CANCELLED' && (
                              <button
                                onClick={() => updateStatus(b.id, 'CANCELLED')}
                                disabled={updatingId === b.id}
                                className="px-2 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-xs font-semibold transition-all"
                                title="Batalkan Tempahan"
                              >
                                Batal
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
