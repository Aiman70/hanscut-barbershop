// src/app/barber/page.tsx - Hanscut Staff Portal Standardized Interface
'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Scissors, Calendar, Clock, CheckCircle, XCircle, User,
  LogOut, KeyRound, Power, AlertCircle, RefreshCw, Phone,
  ArrowLeft, FileText, Check
} from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
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
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  // Pencegahan Ralat: Modal Pengesahan Batal / No-Show
  const [cancelModal, setCancelModal] = useState<{ isOpen: boolean; booking: Booking | null }>({
    isOpen: false,
    booking: null,
  })

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
            ? 'Pelanggan kini boleh membuat tempahan slot dengan anda.'
            : 'Kad profil anda kini dikunci (unavailable) di paparan pelanggan.',
        })
      } else {
        toast({ title: 'Gagal mengemaskini status', variant: 'destructive' })
      }
    } finally {
      setToggling(false)
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
          title: `Status dikemaskini: ${newStatus}`,
          description: 'Rekod temujanji telah dikemaskini.',
        })
        fetchMyBookings()
      } else {
        toast({ title: 'Gagal mengemaskini status', variant: 'destructive' })
      }
    } finally {
      setUpdatingId(null)
      setCancelModal({ isOpen: false, booking: null })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-sm text-gray-400 font-semibold animate-pulse flex items-center gap-2">
          <RefreshCw className="h-4 w-4 animate-spin text-amber-400" />
          <span>Memuatkan Portal Barber...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-16 selection:bg-amber-400 selection:text-gray-950">
      {/* 🧭 NAVBAR KHAS STAF / BARBER (Unified Design Language) */}
      <nav className="border-b border-gray-800 bg-gray-950/90 backdrop-blur-md px-4 sm:px-6 py-3 sticky top-0 z-40 select-none">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Link
              href="/"
              className="p-2 bg-amber-400/10 border border-amber-400/20 rounded-xl hover:bg-amber-400/20 transition-all hover:rotate-12 duration-300 shrink-0"
              title="Laman Utama"
            >
              <Scissors className="h-5 w-5 text-amber-400" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-sm sm:text-base leading-tight text-white">
                  Hanscut <span className="text-amber-400">Barbershop</span>
                </span>
                <Badge variant="amber" size="sm">
                  Portal Barber
                </Badge>
              </div>
              <p className="text-[11px] text-gray-400 truncate">
                Tukang Gunting: <span className="text-amber-400 font-bold">{session?.user?.name || 'Barber'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white bg-gray-900 hover:bg-gray-800 px-3 py-2 rounded-xl border border-gray-800 transition-colors min-h-[38px]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Laman Web</span>
            </Link>

            <Link
              href="/profile"
              className="inline-flex items-center gap-1.5 text-xs text-amber-400 bg-amber-400/10 hover:bg-amber-400/20 px-3 py-2 rounded-xl border border-amber-400/30 font-bold transition-all active:scale-95 min-h-[38px]"
              title="Tukar Kata Laluan"
            >
              <KeyRound className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Tukar Password</span>
            </Link>

            <Button
              variant="danger"
              size="sm"
              onClick={async () => {
                await signOut({ redirect: false })
                window.location.href = '/login'
              }}
              leftIcon={<LogOut className="h-3.5 w-3.5" />}
              className="min-h-[38px]"
            >
              <span className="hidden sm:inline">Keluar</span>
            </Button>
          </div>
        </div>
      </nav>

      {/* 📱 KANDUNGAN UTAMA PORTAL BARBER */}
      <main className="max-w-4xl mx-auto px-4 mt-6 space-y-6">
        {/* 🟢 SUIS KETERSEDIAAN HARI INI (SHARED CARD COMPONENT) */}
        <Card className="rounded-3xl p-5 sm:p-6 shadow-md border-gray-800">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                Status Ketersediaan Anda Hari Ini
              </span>
              <div className="flex items-center gap-2.5">
                <span
                  className={`flex h-3 w-3 rounded-full shrink-0 ${
                    isAutoOff
                      ? 'bg-amber-400'
                      : isAvailable
                      ? 'bg-emerald-400 animate-ping'
                      : 'bg-red-500'
                  }`}
                />
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {isAutoOff ? (
                    <span className="text-amber-400">🔒 Auto-Off (Kedai Tutup)</span>
                  ) : isAvailable ? (
                    <span className="text-emerald-400">🟢 Sedang Bertugas (Available)</span>
                  ) : (
                    <span className="text-red-400">🔴 Sedang Cuti / Rehat (Unavailable)</span>
                  )}
                </h2>
              </div>
              <p className="text-xs text-gray-400 max-w-xl leading-relaxed">
                {isAutoOff ? (
                  <span className="text-amber-300 font-medium">
                    ⚠️ {autoOffReason || 'Di luar waktu operasi kedai.'} Status ditukar ke <strong>Auto-Off</strong> dan akan aktif semula sebaik kedai dibuka.
                  </span>
                ) : isAvailable ? (
                  'Kad profil anda aktif dan boleh dipilih oleh pelanggan di halaman booking sekarang.'
                ) : (
                  'Kad profil anda dikunci (hanya untuk paparan sahaja) di telefon pelanggan.'
                )}
              </p>
            </div>

            <Button
              variant={isAvailable ? 'danger' : 'success'}
              size="md"
              onClick={toggleAvailability}
              isLoading={toggling}
              leftIcon={<Power className="h-4 w-4" />}
              className="w-full sm:w-auto shrink-0 min-h-[44px]"
            >
              {isAvailable ? 'Tukar ke Mod Cuti' : 'Tukar ke Mod Bertugas'}
            </Button>
          </div>
        </Card>

        {/* 📋 SENARAI TEMPAHAN PELANGGAN */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-amber-400" />
              <h2 className="text-lg sm:text-xl font-bold text-white">Senarai Pelanggan Tempahan</h2>
            </div>
            <Badge variant="amber" size="md">
              {bookings.length} Tempahan
            </Badge>
          </div>

          {bookings.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="Tiada temujanji pelanggan buat masa ini"
              description="Apabila ada pelanggan menempah slot masa dengan anda, senarai akan dipaparkan di sini."
              action={
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={fetchMyBookings}
                  leftIcon={<RefreshCw className="h-3.5 w-3.5 text-amber-400" />}
                >
                  Segarkan Senarai
                </Button>
              }
            />
          ) : (
            <div className="space-y-3.5">
              {bookings.map((booking) => {
                const isUpdating = updatingId === booking.id
                return (
                  <Card key={booking.id} className="p-4 sm:p-5 shadow-sm space-y-3">
                    {/* Header Kad Tempahan */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-800 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-amber-400 shrink-0" />
                          <h3 className="text-base sm:text-lg font-bold text-white">
                            {booking.customer?.name || 'Pelanggan'}
                          </h3>
                        </div>

                        {booking.customer?.phone ? (
                          <a
                            href={`tel:${booking.customer.phone}`}
                            className="text-xs text-amber-400 hover:underline inline-flex items-center gap-1.5 mt-1 font-semibold min-h-[32px]"
                          >
                            <Phone className="h-3.5 w-3.5" />
                            <span>{booking.customer.phone} (Tekan untuk telefon)</span>
                          </a>
                        ) : (
                          <span className="text-xs text-gray-500 mt-1 block">Tiada No Tel</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <StatusBadge status={booking.status} showIcon size="md" />
                      </div>
                    </div>

                    {/* Ringkasan Servis & Masa */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                      <div className="bg-gray-950 p-2.5 rounded-xl border border-gray-800/80">
                        <span className="text-[11px] text-gray-500 block">Pakej Servis</span>
                        <span className="font-bold text-white truncate block mt-0.5">
                          {booking.service?.name}
                        </span>
                      </div>

                      <div className="bg-gray-950 p-2.5 rounded-xl border border-gray-800/80">
                        <span className="text-[11px] text-gray-500 block">Masa Slot</span>
                        <span className="font-bold text-amber-400 block mt-0.5">
                          {booking.startTime} - {booking.endTime}
                        </span>
                      </div>

                      <div className="bg-gray-950 p-2.5 rounded-xl border border-gray-800/80 col-span-2 sm:col-span-1">
                        <span className="text-[11px] text-gray-500 block">Harga Bayaran</span>
                        <span className="font-bold text-emerald-400 block mt-0.5">
                          {formatCurrency(booking.totalPrice)}
                        </span>
                      </div>
                    </div>

                    {booking.notes && (
                      <div className="text-xs text-amber-300/90 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-xl italic">
                        Nota Pelanggan: "{booking.notes}"
                      </div>
                    )}

                    {/* Butang Tindakan Barber (Ergonomik Telefon >= 44px) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {booking.status !== 'COMPLETED' && booking.status !== 'CANCELLED' && (
                        <Button
                          variant="success"
                          size="md"
                          onClick={() => updateStatus(booking.id, 'COMPLETED')}
                          isLoading={isUpdating}
                          leftIcon={<CheckCircle className="h-4 w-4" />}
                          className="w-full min-h-[44px]"
                        >
                          Selesai Gunting
                        </Button>
                      )}

                      {booking.status !== 'CANCELLED' && booking.status !== 'COMPLETED' && (
                        <Button
                          variant="danger"
                          size="md"
                          onClick={() => setCancelModal({ isOpen: true, booking })}
                          disabled={isUpdating}
                          leftIcon={<XCircle className="h-4 w-4" />}
                          className="w-full min-h-[44px]"
                        >
                          Batal / No-Show
                        </Button>
                      )}
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </main>

      {/* 🛡️ MODAL PENGESAHAN NO-SHOW / BATAL (Pencegahan Ralat / Error Prevention) */}
      {cancelModal.isOpen && cancelModal.booking && (
        <ConfirmModal
          isOpen={cancelModal.isOpen}
          onClose={() => setCancelModal({ isOpen: false, booking: null })}
          onConfirm={() => updateStatus(cancelModal.booking!.id, 'CANCELLED')}
          title="Tandakan Batal / No-Show?"
          description={`Adakah anda pasti mahu membatalkan slot tempahan untuk ${cancelModal.booking.customer?.name || 'pelanggan ini'}?`}
          confirmText="Ya, Batalkan Slot"
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
                {cancelModal.booking.startTime} - {cancelModal.booking.endTime}
              </span>
            </p>
          </div>
        </ConfirmModal>
      )}
    </div>
  )
}
