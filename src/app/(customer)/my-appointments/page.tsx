// src/app/(customer)/my-appointments/page.tsx - Hanscut Online Customer Appointments
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Scissors, Calendar, Clock, User, ArrowLeft, RefreshCw } from 'lucide-react'
import { format } from 'date-fns'
import { ms } from 'date-fns/locale'
import { useToast } from '@/components/ui/use-toast'
import { formatCurrency } from '@/lib/utils'
import { CustomerNav } from '@/components/customer-nav'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/status-badge'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { ConfirmModal } from '@/components/ui/confirm-modal'

interface Booking {
  id: string
  date: string
  startTime: string
  endTime: string
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED'
  totalPrice: number
  notes: string | null
  service: { name: string; duration: number }
  barber: { user: { name: string | null } }
}

export default function MyAppointmentsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  // Pencegahan Ralat: Modal Pengesahan Pembatalan Temujanji
  const [cancelModal, setCancelModal] = useState<{ isOpen: boolean; booking: Booking | null }>({
    isOpen: false,
    booking: null,
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }
    if (status === 'authenticated') {
      fetchBookings()
    }
  }, [status])

  const fetchBookings = async () => {
    try {
      const res = await fetch('/api/bookings')
      const data = await res.json()
      setBookings(Array.isArray(data) ? data : [])
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async () => {
    if (!cancelModal.booking) return
    const bookingId = cancelModal.booking.id
    setCancellingId(bookingId)

    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED' }),
      })
      if (res.ok) {
        toast({ title: '✅ Tempahan berjaya dibatalkan' })
        fetchBookings()
      } else {
        toast({ title: 'Gagal membatalkan tempahan', variant: 'destructive' })
      }
    } finally {
      setCancellingId(null)
      setCancelModal({ isOpen: false, booking: null })
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-28 md:pb-16 selection:bg-amber-400 selection:text-gray-950">
      <CustomerNav />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <div className="mb-6 sm:mb-8 pb-4 sm:pb-6 border-b border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-400/10 border border-amber-400/20 rounded-full text-xs font-bold text-amber-400 mb-2">
              <Scissors className="h-3.5 w-3.5" />
              <span>Hanscut Barbershop • #REZEKI DI KONGSI BERSAMA</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">Tempahan Saya</h1>
            <p className="text-gray-400 text-xs sm:text-sm mt-1">
              Semak rekod temujanji, status pengesahan, dan urus jadual potongan rambut anda.
            </p>
          </div>

          <Link href="/booking" className="self-start sm:self-auto">
            <Button variant="primary" size="md">
              + Tempah Slot Baru
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3.5">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-36 bg-gray-900 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="Tiada Rekod Tempahan"
            description="Anda belum membuat sebarang tempahan temujanji gunting rambut lagi."
            action={
              <Link href="/booking">
                <Button variant="primary" size="md">
                  Buat Tempahan Sekarang
                </Button>
              </Link>
            }
          />
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => {
              const bookingDate = new Date(booking.date)
              const isPast = bookingDate < new Date()
              const canCancel = ['PENDING', 'CONFIRMED'].includes(booking.status) && !isPast

              return (
                <Card key={booking.id} className="p-4 sm:p-5 shadow-sm space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <h3 className="text-base sm:text-lg font-bold text-white">{booking.service.name}</h3>
                        <StatusBadge status={booking.status} showIcon size="md" />
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                        <div className="bg-gray-950 p-2.5 rounded-xl border border-gray-800">
                          <span className="text-[11px] text-gray-500 block">Tarikh</span>
                          <span className="font-semibold text-white block mt-0.5">
                            {format(bookingDate, 'dd MMM yyyy', { locale: ms })}
                          </span>
                        </div>
                        <div className="bg-gray-950 p-2.5 rounded-xl border border-gray-800">
                          <span className="text-[11px] text-gray-500 block">Masa Slot</span>
                          <span className="font-semibold text-amber-400 block mt-0.5">
                            {booking.startTime} - {booking.endTime}
                          </span>
                        </div>
                        <div className="bg-gray-950 p-2.5 rounded-xl border border-gray-800">
                          <span className="text-[11px] text-gray-500 block">Barber Pilihan</span>
                          <span className="font-semibold text-white block mt-0.5">
                            {booking.barber.user.name || '-'}
                          </span>
                        </div>
                        <div className="bg-gray-950 p-2.5 rounded-xl border border-gray-800">
                          <span className="text-[11px] text-gray-500 block">Jumlah Harga</span>
                          <span className="font-bold text-emerald-400 block mt-0.5">
                            {formatCurrency(booking.totalPrice)}
                          </span>
                        </div>
                      </div>

                      {booking.notes && (
                        <p className="text-xs text-amber-300/80 bg-amber-500/10 border border-amber-500/20 p-2 rounded-xl italic">
                          Nota Anda: "{booking.notes}"
                        </p>
                      )}
                    </div>

                    {canCancel && (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => setCancelModal({ isOpen: true, booking })}
                        className="self-end sm:self-start min-h-[38px]"
                      >
                        Batalkan
                      </Button>
                    )}
                  </div>

                  <div className="pt-2 border-t border-gray-800 flex items-center justify-between text-[11px] text-gray-500">
                    <span>ID Tempahan: #{booking.id.slice(-8).toUpperCase()}</span>
                    <span>Anggaran Tempoh: {booking.service.duration} Minit</span>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </main>

      {/* 🛡️ Modal Pengesahan Pembatalan Pelanggan */}
      {cancelModal.isOpen && cancelModal.booking && (
        <ConfirmModal
          isOpen={cancelModal.isOpen}
          onClose={() => setCancelModal({ isOpen: false, booking: null })}
          onConfirm={handleCancel}
          title="Batalkan Temujanji Ini?"
          description="Adakah anda pasti mahu membatalkan slot tempahan ini? Slot akan dibuka semula kepada pelanggan lain."
          confirmText="Ya, Batalkan Tempahan"
          cancelText="Kembali"
          variant="danger"
          isLoading={cancellingId === cancelModal.booking.id}
        >
          <div className="space-y-1">
            <p>
              <span className="text-gray-400">Servis:</span>{' '}
              <span className="text-white font-medium">{cancelModal.booking.service.name}</span>
            </p>
            <p>
              <span className="text-gray-400">Masa:</span>{' '}
              <span className="text-amber-400 font-medium">
                {cancelModal.booking.startTime} ({format(new Date(cancelModal.booking.date), 'dd MMM yyyy')})
              </span>
            </p>
          </div>
        </ConfirmModal>
      )}
    </div>
  )
}
