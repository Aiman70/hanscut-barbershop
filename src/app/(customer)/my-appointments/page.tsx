// src/app/(customer)/my-appointments/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Scissors, Calendar, Clock, User, AlertCircle, CheckCircle, XCircle } from 'lucide-react'
import { format } from 'date-fns'
import { ms } from 'date-fns/locale'
import { useToast } from '@/components/ui/use-toast'
import { formatCurrency } from '@/lib/utils'
import { CustomerNav } from '@/components/customer-nav'

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

const STATUS_CONFIG = {
  PENDING: { label: 'Menunggu', color: 'bg-yellow-500/20 text-yellow-400', icon: Clock },
  CONFIRMED: { label: 'Disahkan', color: 'bg-green-500/20 text-green-400', icon: CheckCircle },
  CANCELLED: { label: 'Dibatalkan', color: 'bg-red-500/20 text-red-400', icon: XCircle },
  COMPLETED: { label: 'Selesai', color: 'bg-blue-500/20 text-blue-400', icon: CheckCircle },
}

export default function MyAppointmentsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState<string | null>(null)

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
      setBookings(data)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async (bookingId: string) => {
    if (!confirm('Adakah anda pasti nak batalkan tempahan ini?')) return
    setCancelling(bookingId)
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED' }),
      })
      if (res.ok) {
        toast({ title: 'Tempahan dibatalkan' })
        fetchBookings()
      }
    } finally {
      setCancelling(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-12">
      <CustomerNav />

      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-400/10 border border-amber-400/20 rounded-full text-xs font-bold text-amber-400 mb-2">
            <Scissors className="h-3.5 w-3.5" />
            Hanscut Barbershop • #REZEKI DI KONGSI BERSAMA
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">Tempahan Saya</h1>
          <p className="text-gray-400 text-sm mt-1">Semak rekod temujanji, status pengesahan dan urus jadual potongan rambut anda</p>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-900 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-20">
            <Calendar className="h-16 w-16 text-gray-700 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-400 mb-4">Tiada Tempahan</h2>
            <p className="text-gray-600 mb-8">Anda belum ada sebarang tempahan lagi</p>
            <Link
              href="/booking"
              className="bg-amber-400 text-gray-950 px-8 py-3 rounded-lg font-bold hover:bg-amber-300"
            >
              Buat Tempahan Sekarang
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => {
              const config = STATUS_CONFIG[booking.status]
              const StatusIcon = config.icon
              const bookingDate = new Date(booking.date)
              const isPast = bookingDate < new Date()
              const canCancel = ['PENDING', 'CONFIRMED'].includes(booking.status) && !isPast

              return (
                <div key={booking.id} className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-semibold">{booking.service.name}</h3>
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${config.color}`}>
                          <StatusIcon className="h-3 w-3" />
                          {config.label}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2 text-gray-400">
                          <Calendar className="h-4 w-4" />
                          <span>{format(bookingDate, 'dd MMM yyyy', { locale: ms })}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-400">
                          <Clock className="h-4 w-4" />
                          <span>{booking.startTime} - {booking.endTime}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-400">
                          <User className="h-4 w-4" />
                          <span>{booking.barber.user.name}</span>
                        </div>
                        <div className="text-amber-400 font-bold">
                          {formatCurrency(booking.totalPrice)}
                        </div>
                      </div>

                      {booking.notes && (
                        <p className="text-gray-500 text-sm mt-3 italic">"{booking.notes}"</p>
                      )}
                    </div>

                    {canCancel && (
                      <button
                        onClick={() => handleCancel(booking.id)}
                        disabled={cancelling === booking.id}
                        className="ml-4 px-4 py-2 border border-red-800 text-red-400 rounded-lg text-sm hover:bg-red-900/30 transition-colors disabled:opacity-50"
                      >
                        {cancelling === booking.id ? 'Membatalkan...' : 'Batalkan'}
                      </button>
                    )}
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-800 flex items-center justify-between">
                    <span className="text-xs text-gray-600">ID: #{booking.id.slice(-8).toUpperCase()}</span>
                    <span className="text-xs text-gray-600">{booking.service.duration} minit</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
