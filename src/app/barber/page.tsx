'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Scissors, Calendar, Clock, CheckCircle, XCircle, User,
  LogOut, KeyRound, Power, AlertCircle, RefreshCw
} from 'lucide-react'
import { signOut } from 'next-auth/react'
import { useToast } from '@/components/ui/use-toast'

interface Booking {
  id: string
  date: string
  startTime: string
  endTime: string
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED'
  totalPrice: number
  notes: string | null
  customer: { name: string; phone: string; email: string }
  service: { name: string; duration: number }
}

export default function BarberPortal() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [isAvailable, setIsAvailable] = useState<boolean>(true)
  const [isAutoOff, setIsAutoOff] = useState<boolean>(false)
  const [autoOffReason, setAutoOffReason] = useState<string | null>(null)
  const [toggling, setToggling] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      fetchMyBookings()
      fetchMyStatus()
    }
  }, [status])

  const fetchMyStatus = async () => {
    try {
      const res = await fetch('/api/staff')
      const barbers = await res.json()
      if (Array.isArray(barbers) && session?.user?.email) {
        const myProfile = barbers.find((b: any) => b.user?.email === session.user?.email)
        if (myProfile) {
          setIsAvailable(myProfile.isAvailable)
          setIsAutoOff(!!myProfile.isAutoOff)
          setAutoOffReason(myProfile.autoOffReason || null)
        }
      }
    } catch (e) {
      console.error(e)
    }
  }

  const fetchMyBookings = async () => {
    try {
      const res = await fetch('/api/bookings')
      const data = await res.json()
      setBookings(Array.isArray(data) ? data : [])
    } finally {
      setLoading(false)
    }
  }

  const toggleAvailability = async () => {
    setToggling(true)
    const newStatus = !isAvailable

    try {
      const res = await fetch('/api/staff/availability', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable: newStatus }),
      })

      if (res.ok) {
        setIsAvailable(newStatus)
        toast({
          title: newStatus ? '🟢 Status: Bertugas' : '🔴 Status: Cuti / Rehat',
          description: newStatus
            ? 'Pelanggan kini boleh membuat tempahan dengan anda.'
            : 'Kad anda kini dikunci (disabled) di paparan pelanggan.',
        })
      } else {
        toast({ title: 'Gagal mengemaskini status', variant: 'destructive' })
      }
    } finally {
      setToggling(false)
    }
  }

  const updateStatus = async (id: string, newStatus: string) => {
    await fetch(`/api/bookings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    fetchMyBookings()
  }

  if (loading) {
    return <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">Memuatkan...</div>
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-10">
      {/* Header Barber */}
      <nav className="border-b border-gray-800/80 bg-gray-950/80 backdrop-blur-md px-6 py-3.5 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-2 bg-amber-400/10 border border-amber-400/20 rounded-xl hover:bg-amber-400/20 transition-all hover:rotate-12 duration-300">
              <Scissors className="h-5 w-5 text-amber-400" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-black text-base leading-tight text-white">
                  Hanscut <span className="text-amber-400">Barbershop</span>
                </h1>
                <span className="text-[10px] bg-amber-400/10 text-amber-400 border border-amber-400/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  Portal Barber
                </span>
              </div>
              <p className="text-[11px] text-gray-400">
                Bertugas: <span className="text-amber-400 font-bold">{session?.user?.name || 'Barber'}</span> • <span className="text-amber-400/80 font-semibold">#REZEKI DI KONGSI BERSAMA</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="hidden sm:flex items-center gap-1.5 text-xs text-gray-400 hover:text-white bg-gray-900 hover:bg-gray-800 px-3 py-2 rounded-xl border border-gray-800 transition-colors"
            >
              ← Laman Utama
            </Link>

            <Link
              href="/profile"
              className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-400/10 hover:bg-amber-400/20 px-3 py-2 rounded-xl border border-amber-400/30 font-bold transition-all active:scale-95"
            >
              <KeyRound className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Tukar Password</span>
            </Link>

            <button 
              onClick={async () => {
                await signOut({ redirect: false })
                window.location.href = '/login'
              }}
              className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 bg-red-950/20 hover:bg-red-900/30 px-3 py-2 rounded-xl border border-red-900/30 transition-all font-bold active:scale-95"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Keluar</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Kandungan Utama */}
      <div className="max-w-4xl mx-auto px-4 mt-6">
        {/* 🟢 SUIS KETERSEDIAAN HARI INI (AVAILABILITY TOGGLE & AUTO-OFF) */}
        <div className="bg-gray-900 border border-gray-800 rounded-3xl p-5 sm:p-6 mb-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
              Status Ketersediaan Anda Hari Ini
            </span>
            <div className="flex items-center gap-2.5">
              <span className={`flex h-3 w-3 rounded-full ${
                isAutoOff
                  ? 'bg-amber-400'
                  : isAvailable
                  ? 'bg-emerald-400 animate-ping'
                  : 'bg-red-500'
              }`} />
              <h2 className="text-xl font-black text-white">
                {isAutoOff ? (
                  <span className="text-amber-400">🔒 Auto-Off (Kedai Tutup)</span>
                ) : isAvailable ? (
                  <span className="text-emerald-400">🟢 Sedang Bertugas (Available)</span>
                ) : (
                  <span className="text-red-400">🔴 Sedang Cuti / Rehat (Unavailable)</span>
                )}
              </h2>
            </div>
            <p className="text-xs text-gray-400 mt-1.5 max-w-xl">
              {isAutoOff ? (
                <span className="text-amber-300/90 font-medium">
                  ⚠️ {autoOffReason || 'Di luar waktu operasi kedai.'} Status anda ditukar ke <strong>Auto-Off</strong> secara automatik dan akan aktif semula sebaik kedai dibuka.
                </span>
              ) : isAvailable ? (
                'Kad anda aktif dan boleh dipilih oleh pelanggan di halaman booking sekarang.'
              ) : (
                'Kad anda dikunci (hanya untuk paparan sahaja) di telefon pelanggan.'
              )}
            </p>
          </div>

          <button
            onClick={toggleAvailability}
            disabled={toggling}
            className={`px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg active:scale-95 disabled:opacity-50 shrink-0 ${
              isAvailable
                ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30'
                : 'bg-emerald-400 hover:bg-emerald-300 text-gray-950 shadow-emerald-400/20'
            }`}
          >
            <Power className="h-4 w-4" />
            {toggling ? 'Menukar...' : isAvailable ? 'Tukar ke Mod Cuti' : 'Tukar ke Mod Bertugas'}
          </button>
        </div>

        {/* Senarai Booking */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">📋 Senarai Pelanggan Tempahan</h2>
          <span className="text-sm bg-amber-400/10 border border-amber-400/30 text-amber-400 px-3 py-1 rounded-full">
            {bookings.length} Tempahan
          </span>
        </div>

        {bookings.length === 0 ? (
          <div className="text-center py-16 bg-gray-900 border border-gray-800 rounded-2xl">
            <Calendar className="h-12 w-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">Tiada temujanji pelanggan buat masa ini.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div key={booking.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-lg">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-gray-800 pb-3">
                  <div>
                    <span className="text-xs text-gray-500 uppercase tracking-wider">Pelanggan</span>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <User className="h-4 w-4 text-amber-400" /> {booking.customer?.name || 'Customer'}
                    </h3>
                    <p className="text-sm text-gray-400">📞 {booking.customer?.phone || 'Tiada No Tel'}</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                      booking.status === 'COMPLETED' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                      booking.status === 'CONFIRMED' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                      booking.status === 'CANCELLED' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                      'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                    }`}>
                      {booking.status}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 my-3 text-sm">
                  <div className="bg-gray-800/50 p-2.5 rounded-xl border border-gray-800">
                    <span className="text-xs text-gray-500 block">Servis</span>
                    <span className="font-semibold text-amber-300">{booking.service?.name}</span>
                  </div>
                  <div className="bg-gray-800/50 p-2.5 rounded-xl border border-gray-800">
                    <span className="text-xs text-gray-500 block">Masa Slot</span>
                    <span className="font-semibold text-white">{booking.startTime} - {booking.endTime}</span>
                  </div>
                  <div className="bg-gray-800/50 p-2.5 rounded-xl border border-gray-800 col-span-2 md:col-span-1">
                    <span className="text-xs text-gray-500 block">Harga</span>
                    <span className="font-semibold text-green-400">RM {booking.totalPrice}</span>
                  </div>
                </div>

                {booking.notes && (
                  <p className="text-xs text-amber-200/80 bg-amber-500/10 border border-amber-500/20 p-2 rounded-lg mb-3">
                    📝 Nota: "{booking.notes}"
                  </p>
                )}

                {/* Butang Tindakan Barber */}
                <div className="flex gap-2 pt-2">
                  {booking.status !== 'COMPLETED' && booking.status !== 'CANCELLED' && (
                    <button
                      onClick={() => updateStatus(booking.id, 'COMPLETED')}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95"
                    >
                      <CheckCircle className="h-4 w-4" /> Selesai Gunting
                    </button>
                  )}
                  {booking.status !== 'CANCELLED' && booking.status !== 'COMPLETED' && (
                    <button
                      onClick={() => updateStatus(booking.id, 'CANCELLED')}
                      className="bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 py-2.5 px-3 rounded-xl text-xs font-semibold"
                    >
                      Batal / No-Show
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
