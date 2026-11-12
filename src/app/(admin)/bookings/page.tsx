'use client'

import { AdminSidebar } from '@/components/admin-sidebar'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  Calendar, Search, Filter, CheckCircle, XCircle, Clock,
  User, Phone, DollarSign, RefreshCw, X, Scissors, FileText
} from 'lucide-react'
import { format } from 'date-fns'
import { ms } from 'date-fns/locale'
import { formatCurrency } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { StatusBadge, STATUS_MAP } from '@/components/ui/status-badge'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { ConfirmModal } from '@/components/ui/confirm-modal'

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

export default function BookingsManagementPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  // Pencegahan Ralat: Modal Pengesahan Pembatalan (Error Prevention)
  const [cancelModal, setCancelModal] = useState<{ isOpen: boolean; booking: Booking | null }>({
    isOpen: false,
    booking: null,
  })

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
    } catch {
      toast({ title: 'Ralat mendapatkan data tempahan', variant: 'destructive' })
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
        toast({
          title: `Status dikemaskini: ${STATUS_MAP[newStatus]?.label || newStatus}`,
          description: 'Rekod telah dikemas kini dalam pangkalan data.',
        })
        fetchBookings()
      } else {
        toast({ title: 'Gagal mengemaskini status', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Ralat sambungan rangkaian', variant: 'destructive' })
    } finally {
      setUpdatingId(null)
      setCancelModal({ isOpen: false, booking: null })
    }
  }

  // Tapisan & Carian Pintar
  const filteredBookings = bookings.filter((b) => {
    const matchesStatus = statusFilter === 'ALL' || b.status === statusFilter
    const q = searchTerm.toLowerCase()
    const matchesSearch =
      !searchTerm ||
      (b.customer?.name || '').toLowerCase().includes(q) ||
      (b.customer?.phone || '').toLowerCase().includes(q) ||
      (b.barber?.user?.name || '').toLowerCase().includes(q) ||
      (b.service?.name || '').toLowerCase().includes(q)
    return matchesStatus && matchesSearch
  })

  // Pengiraan Statistik Pantas (Dialog Closure)
  const statsCount = {
    ALL: bookings.length,
    PENDING: bookings.filter((b) => b.status === 'PENDING').length,
    CONFIRMED: bookings.filter((b) => b.status === 'CONFIRMED').length,
    COMPLETED: bookings.filter((b) => b.status === 'COMPLETED').length,
    CANCELLED: bookings.filter((b) => b.status === 'CANCELLED').length,
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex selection:bg-amber-400 selection:text-gray-950">
      <AdminSidebar />

      {/* Main Content dengan padding responsif */}
      <main className="flex-1 md:ml-64 pt-20 md:pt-8 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full pb-20">
        {/* Header Seksyen */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Pengurusan Tempahan</h1>
            <p className="text-gray-400 text-xs sm:text-sm mt-1">
              Semak, tapis, dan kendalikan status temujanji pelanggan dengan mudah.
            </p>
          </div>

          <Button
            variant="secondary"
            size="md"
            onClick={fetchBookings}
            isLoading={loading}
            leftIcon={<RefreshCw className="h-4 w-4 text-amber-400" />}
            className="self-start sm:self-auto min-h-[44px]"
          >
            <span>Segarkan Senarai</span>
          </Button>
        </div>

        {/* 🔍 Bar Carian & Tapisan Status (Shared Card & Input Primitives) */}
        <Card className="p-3 sm:p-4 mb-6 space-y-3">
          <Input
            placeholder="Cari nama, nombor telefon, servis, atau barber..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
            rightIcon={
              searchTerm ? (
                <button
                  onClick={() => setSearchTerm('')}
                  className="p-1 text-gray-400 hover:text-white"
                  title="Kosongkan Carian"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : undefined
            }
          />

          {/* Chips Filter dengan Indikator Kiraan */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {(['ALL', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'] as const).map((st) => {
              const isSelected = statusFilter === st
              return (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 min-h-[38px] ${
                    isSelected
                      ? 'bg-amber-400 text-gray-950 shadow-md shadow-amber-400/10'
                      : 'bg-gray-950 border border-gray-800 text-gray-400 hover:text-white hover:border-gray-700'
                  }`}
                >
                  <span>{st === 'ALL' ? 'Semua' : STATUS_MAP[st]?.label || st}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                      isSelected ? 'bg-gray-950/20 text-gray-950' : 'bg-gray-800 text-gray-400'
                    }`}
                  >
                    {statsCount[st]}
                  </span>
                </button>
              )
            })}
          </div>
        </Card>

        {/* 📱💻 Kandungan Tempahan: Card View di Mobile & Table di Desktop */}
        {loading ? (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center text-gray-400 animate-pulse text-sm">
            Memuatkan rekod tempahan...
          </div>
        ) : filteredBookings.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="Tiada rekod tempahan ditemui"
            description={
              searchTerm
                ? 'Cuba ubah kata kunci carian atau tetapkan semula penapis status.'
                : 'Belum ada rekod tempahan untuk kategori status yang dipilih.'
            }
            action={
              searchTerm ? (
                <Button variant="secondary" size="sm" onClick={() => setSearchTerm('')}>
                  Kosongkan Carian
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            {/* 📱 1. CARD VIEW UNTUK PENGGUNA HANDPHONE (< 768px) */}
            <div className="md:hidden space-y-3.5">
              {filteredBookings.map((b) => {
                const isUpdating = updatingId === b.id

                return (
                  <Card key={b.id} className="p-4 shadow-sm space-y-3 border-l-4 border-l-amber-400">
                    {/* Header Kad: Pelanggan & Status */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-bold text-base text-white flex items-center gap-1.5">
                          <User className="h-4 w-4 text-amber-400 shrink-0" />
                          <span>{b.customer?.name || 'Pelanggan'}</span>
                        </div>
                        {b.customer?.phone ? (
                          <a
                            href={`tel:${b.customer.phone}`}
                            className="text-xs text-amber-400 hover:underline flex items-center gap-1 mt-1 font-medium min-h-[30px]"
                          >
                            <Phone className="h-3 w-3" /> {b.customer.phone}
                          </a>
                        ) : (
                          <span className="text-xs text-gray-500 mt-1 block">Tiada no. telefon</span>
                        )}
                      </div>

                      <StatusBadge status={b.status} size="sm" />
                    </div>

                    {/* Perincian Servis & Masa */}
                    <div className="bg-gray-950 p-3 rounded-xl border border-gray-800 space-y-1.5 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 flex items-center gap-1">
                          <Scissors className="h-3.5 w-3.5 text-gray-500" /> Servis:
                        </span>
                        <span className="font-semibold text-white">{b.service?.name}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 flex items-center gap-1">
                          <User className="h-3.5 w-3.5 text-gray-500" /> Barber:
                        </span>
                        <span className="font-semibold text-amber-400">{b.barber?.user?.name || '-'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-gray-500" /> Waktu:
                        </span>
                        <span className="font-semibold text-gray-200">
                          {format(new Date(b.date), 'dd MMM yyyy', { locale: ms })} ({b.startTime})
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-1 border-t border-gray-800">
                        <span className="text-gray-400 font-medium">Jumlah Bayaran:</span>
                        <span className="font-black text-amber-400 text-sm">{formatCurrency(b.totalPrice)}</span>
                      </div>

                      {b.notes && (
                        <div className="pt-1.5 border-t border-gray-800 text-[11px] text-amber-300/90 italic">
                          Nota: "{b.notes}"
                        </div>
                      )}
                    </div>

                    {/* Tindakan Pantas (Shared Button Primitives >= 44px) */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      {b.status === 'PENDING' && (
                        <Button
                          variant="success"
                          size="md"
                          onClick={() => updateStatus(b.id, 'CONFIRMED')}
                          isLoading={isUpdating}
                          leftIcon={<CheckCircle className="h-4 w-4" />}
                          className="w-full"
                        >
                          Sahkan
                        </Button>
                      )}

                      {b.status !== 'COMPLETED' && b.status !== 'CANCELLED' && (
                        <Button
                          variant="secondary"
                          size="md"
                          onClick={() => updateStatus(b.id, 'COMPLETED')}
                          isLoading={isUpdating}
                          leftIcon={<CheckCircle className="h-4 w-4 text-blue-400" />}
                          className="w-full"
                        >
                          Selesai
                        </Button>
                      )}

                      {b.status !== 'CANCELLED' && (
                        <Button
                          variant="danger"
                          size="md"
                          onClick={() => setCancelModal({ isOpen: true, booking: b })}
                          disabled={isUpdating}
                          leftIcon={<XCircle className="h-4 w-4" />}
                          className="w-full col-span-2 sm:col-span-1"
                        >
                          Batal
                        </Button>
                      )}
                    </div>
                  </Card>
                )
              })}
            </div>

            {/* 💻 2. TABLE VIEW UNTUK DESKTOP (>= 768px) */}
            <Card className="hidden md:block overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-800 bg-gray-950/70 text-gray-400 text-xs uppercase tracking-wider font-bold">
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
                      const isUpdating = updatingId === b.id

                      return (
                        <tr key={b.id} className="hover:bg-gray-800/40 transition-colors">
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

                          <td className="p-4">
                            <p className="font-semibold text-white">{b.service?.name}</p>
                            <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                              <Scissors className="h-3 w-3 text-gray-500" /> Barber:{' '}
                              <span className="text-amber-400 font-medium">{b.barber?.user?.name || '-'}</span>
                            </p>
                          </td>

                          <td className="p-4">
                            <p className="font-medium text-white">
                              {format(new Date(b.date), 'dd MMM yyyy', { locale: ms })}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                              <Clock className="h-3 w-3 text-gray-500" /> {b.startTime} - {b.endTime}
                            </p>
                          </td>

                          <td className="p-4 font-bold text-amber-400">
                            {formatCurrency(b.totalPrice)}
                          </td>

                          <td className="p-4">
                            <StatusBadge status={b.status} size="sm" />
                          </td>

                          <td className="p-4">
                            <div className="flex items-center justify-center gap-2">
                              {b.status === 'PENDING' && (
                                <Button
                                  variant="success"
                                  size="sm"
                                  onClick={() => updateStatus(b.id, 'CONFIRMED')}
                                  isLoading={isUpdating}
                                >
                                  Sahkan
                                </Button>
                              )}
                              {b.status !== 'COMPLETED' && b.status !== 'CANCELLED' && (
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => updateStatus(b.id, 'COMPLETED')}
                                  isLoading={isUpdating}
                                >
                                  Selesai
                                </Button>
                              )}
                              {b.status !== 'CANCELLED' && (
                                <Button
                                  variant="danger"
                                  size="sm"
                                  onClick={() => setCancelModal({ isOpen: true, booking: b })}
                                  disabled={isUpdating}
                                >
                                  Batal
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}
      </main>

      {/* 🛡️ MODAL PENGESAHAN PEMBATALAN (Shared ConfirmModal Primitive) */}
      {cancelModal.isOpen && cancelModal.booking && (
        <ConfirmModal
          isOpen={cancelModal.isOpen}
          onClose={() => setCancelModal({ isOpen: false, booking: null })}
          onConfirm={() => updateStatus(cancelModal.booking!.id, 'CANCELLED')}
          title="Sahkan Pembatalan Tempahan?"
          description={`Adakah anda pasti mahu membatalkan rekod tempahan untuk ${cancelModal.booking.customer?.name || 'pelanggan ini'}?`}
          confirmText="Ya, Batalkan"
          cancelText="Kembali"
          variant="danger"
          isLoading={updatingId === cancelModal.booking.id}
        >
          <div className="space-y-1">
            <p>
              <span className="text-gray-400">Servis:</span>{' '}
              <span className="text-white font-medium">{cancelModal.booking.service?.name}</span>
            </p>
            <p>
              <span className="text-gray-400">Masa:</span>{' '}
              <span className="text-amber-400 font-medium">
                {cancelModal.booking.startTime} ({format(new Date(cancelModal.booking.date), 'dd MMM', { locale: ms })})
              </span>
            </p>
          </div>
        </ConfirmModal>
      )}
    </div>
  )
}
