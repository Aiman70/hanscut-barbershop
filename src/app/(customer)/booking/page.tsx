// src/app/(customer)/booking/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { DayPicker as Calendar } from 'react-day-picker'
import { format, addDays, isBefore, startOfDay } from 'date-fns'
import { ms } from 'date-fns/locale'
import {
  Scissors, Clock, ChevronRight, CheckCircle, User,
  RefreshCw, AlertTriangle, X, ArrowLeft, Calendar as CalendarIcon
} from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { formatCurrency, formatTime } from '@/lib/utils'
import Link from 'next/link'
import { CustomerNav } from '@/components/customer-nav'
import 'react-day-picker/dist/style.css'

interface Service {
  id: string
  name: string
  description: string | null
  duration: number
  price: number
}

interface Barber {
  id: string
  bio: string | null
  speciality: string | null
  isAvailable: boolean
  user: { name: string | null; image: string | null }
}

interface TimeSlot {
  time: string
  available: boolean
  isBooked?: boolean
  isPast?: boolean
}

const STEPS = ['Pilih Servis', 'Pilih Barber', 'Pilih Tarikh & Masa', 'Sahkan']

export default function BookingPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  const [step, setStep] = useState(0)
  const [services, setServices] = useState<Service[]>([])
  const [barbers, setBarbers] = useState<Barber[]>([])
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [refreshingBarbers, setRefreshingBarbers] = useState(false)
  const [quotaInfo, setQuotaInfo] = useState<{ total: number; max: number; isFull: boolean; msg?: string } | null>(null)

  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>()
  const [selectedTime, setSelectedTime] = useState<string>('')
  const [notes, setNotes] = useState('')
  const [closedModal, setClosedModal] = useState<{ isOpen: boolean; reason: string }>({ isOpen: false, reason: '' })

  const handleRefreshBarbers = async () => {
    setRefreshingBarbers(true)
    try {
      const res = await fetch('/api/staff')
      const data = await res.json()
      if (Array.isArray(data)) {
        setBarbers(data)
        toast({ title: 'Status ketersediaan barber dikemaskini!' })
      }
    } finally {
      setRefreshingBarbers(false)
    }
  }

  useEffect(() => {
    fetch('/api/services').then(r => r.json()).then(setServices)
    fetch('/api/staff').then(r => r.json()).then(setBarbers)
  }, [])

  useEffect(() => {
    if (selectedBarber && selectedDate && selectedService) {
      setLoading(true)
      setSlots([])
      setSelectedTime('')
      setQuotaInfo(null)
      const dateStr = format(selectedDate, 'yyyy-MM-dd')
      fetch(`/api/slots?barberId=${selectedBarber.id}&date=${dateStr}&duration=${selectedService.duration}`)
        .then(r => r.json())
        .then(data => {
          if (data.isClosedToday) {
            setClosedModal({
              isOpen: true,
              reason: data.closeReason || data.message || 'Kedai ditutup pada tarikh ini.',
            })
            setSlots([])
            return
          }
          setSlots(data.slots || [])
          setQuotaInfo({
            total: data.totalBookingsToday || 0,
            max: data.maxBookings || 20,
            isFull: !!data.isFull,
            msg: data.message
          })
        })
        .finally(() => setLoading(false))
    }
  }, [selectedBarber, selectedDate, selectedService])

  const handleSubmit = async () => {
    if (!session) {
      toast({ title: 'Sila log masuk untuk membuat tempahan', variant: 'destructive' })
      router.push('/login')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: selectedService!.id,
          barberId: selectedBarber!.id,
          date: format(selectedDate!, 'yyyy-MM-dd'),
          startTime: selectedTime,
          notes,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        toast({ title: 'Gagal membuat tempahan', description: data.error, variant: 'destructive' })
      } else {
        toast({ title: '✅ Tempahan berjaya!', description: 'Temujanji anda telah disahkan' })
        router.push('/my-appointments')
      }
    } catch {
      toast({ title: 'Ralat sambungan rangkaian', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-32 md:pb-16 selection:bg-amber-400 selection:text-gray-950">
      <CustomerNav />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* Header Seksyen Tempahan */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8 pb-4 sm:pb-6 border-b border-gray-800">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-400/10 border border-amber-400/20 rounded-full text-xs font-bold text-amber-400 mb-2">
              <Scissors className="h-3.5 w-3.5" />
              <span>Hanscut Barbershop • #REZEKI DI KONGSI BERSAMA</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">Tempahan Temujanji</h1>
            <p className="text-gray-400 text-xs sm:text-sm mt-1">Pilih servis, barber kegemaran, dan slot masa yang ideal</p>
          </div>

          <div className="bg-gray-900 border border-gray-800 p-3 rounded-2xl text-xs text-gray-400 shrink-0">
            <div className="font-bold flex items-center gap-1.5 mb-1 text-amber-400">
              <Clock className="h-3.5 w-3.5" /> Waktu Operasi:
            </div>
            <div>Sabtu - Khamis: <span className="text-white font-medium">3.00 PM - 11.00 PM</span></div>
            <div>Jumaat: <span className="text-white font-medium">8.30 PM - 11.00 PM</span></div>
          </div>
        </div>

        {/* 🧭 Step Progress Tracker (Responsif: Ringkas di Mobile, Penuh di Desktop) */}
        <div className="mb-8">
          {/* Mobile Step Indicator */}
          <div className="md:hidden flex items-center justify-between bg-gray-900 border border-gray-800 px-4 py-2.5 rounded-xl">
            <div className="text-xs font-bold text-white">
              <span className="text-amber-400">Langkah {step + 1} daripada 4:</span> {STEPS[step]}
            </div>
            <div className="flex gap-1.5">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    i === step
                      ? 'bg-amber-400 w-5'
                      : i < step
                      ? 'bg-emerald-500'
                      : 'bg-gray-800'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Desktop Step Tracker */}
          <div className="hidden md:flex items-center gap-2">
            {STEPS.map((s, i) => (
              <div key={i} className="flex items-center gap-2 flex-1">
                <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all w-full ${
                  i === step
                    ? 'bg-amber-400 text-gray-950 shadow-md shadow-amber-400/10'
                    : i < step
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-gray-900 border border-gray-800 text-gray-500'
                }`}>
                  {i < step ? <CheckCircle className="h-4 w-4 shrink-0" /> : <span className="w-4 h-4 rounded-full bg-gray-950/20 flex items-center justify-center text-[10px]">{i + 1}</span>}
                  <span className="truncate">{s}</span>
                </div>
                {i < STEPS.length - 1 && <ChevronRight className="h-4 w-4 text-gray-700 shrink-0" />}
              </div>
            ))}
          </div>
        </div>

        {/* -------------------- LANGKAH 0: PILIH SERVIS -------------------- */}
        {step === 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg sm:text-xl font-bold text-white">Langkah 1: Pilih Pakej Servis</h2>
              <span className="text-xs text-gray-400">{services.length} servis disediakan</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {services.map((service) => {
                const isSelected = selectedService?.id === service.id
                return (
                  <button
                    key={service.id}
                    onClick={() => {
                      setSelectedService(service)
                      setStep(1)
                    }}
                    className={`text-left p-4 sm:p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-3 min-h-[100px] active:scale-[0.98] ${
                      isSelected
                        ? 'border-amber-400 bg-amber-400/10 shadow-lg shadow-amber-400/5'
                        : 'border-gray-800 bg-gray-900 hover:border-gray-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-bold text-base text-white">{service.name}</h3>
                        {service.description && (
                          <p className="text-gray-400 text-xs mt-1 leading-relaxed">{service.description}</p>
                        )}
                      </div>
                      <span className="text-amber-400 font-black text-lg shrink-0">
                        {formatCurrency(service.price)}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-gray-800/80 flex items-center justify-between text-xs text-gray-400">
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-amber-400" /> {service.duration} minit
                      </span>
                      <span className="text-amber-400 font-bold flex items-center gap-1">
                        Pilih Servis →
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* -------------------- LANGKAH 1: PILIH BARBER -------------------- */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white">Langkah 2: Pilih Tukang Gunting</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Servis dipilih: <span className="text-amber-400 font-bold">{selectedService?.name}</span> ({formatCurrency(selectedService?.price || 0)})
                </p>
              </div>

              <button
                type="button"
                onClick={handleRefreshBarbers}
                disabled={refreshingBarbers}
                className="inline-flex items-center gap-1.5 bg-gray-900 border border-gray-800 hover:border-amber-400/40 text-gray-300 hover:text-white px-3.5 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95 disabled:opacity-50 self-start sm:self-auto min-h-[40px]"
              >
                <RefreshCw className={`h-3.5 w-3.5 text-amber-400 ${refreshingBarbers ? 'animate-spin' : ''}`} />
                <span>{refreshingBarbers ? 'Menyemak...' : 'Semak Status Barber'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {barbers.map((barber) => {
                const isAutoOff = !!(barber as any).isAutoOff
                const canSelect = barber.isAvailable || (isAutoOff && (barber as any).manualAvailability !== false)
                const isSelected = selectedBarber?.id === barber.id

                return (
                  <button
                    key={barber.id}
                    disabled={!canSelect}
                    onClick={() => {
                      if (canSelect) {
                        setSelectedBarber(barber)
                        setStep(2)
                      }
                    }}
                    className={`text-left p-4 sm:p-5 rounded-2xl border transition-all relative flex flex-col justify-between space-y-3 active:scale-[0.98] ${
                      !canSelect
                        ? 'border-gray-800/40 bg-gray-900/40 opacity-50 cursor-not-allowed'
                        : isSelected
                        ? 'border-amber-400 bg-amber-400/10 shadow-lg shadow-amber-400/5'
                        : 'border-gray-800 bg-gray-900 hover:border-gray-700'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg shrink-0 ${
                        barber.isAvailable
                          ? 'bg-amber-400 text-gray-950 shadow-sm'
                          : isAutoOff
                          ? 'bg-amber-400/20 text-amber-400 border border-amber-400/30'
                          : 'bg-gray-800 text-gray-500'
                      }`}>
                        {barber.user.name?.charAt(0) || 'B'}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className={`font-bold text-base truncate ${canSelect ? 'text-white' : 'text-gray-400'}`}>
                            {barber.user.name}
                          </h3>

                          {/* Badge Status Barber */}
                          {barber.isAvailable ? (
                            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full shrink-0">
                              🟢 Bertugas
                            </span>
                          ) : isAutoOff ? (
                            <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full shrink-0">
                              🕒 Buka 3 PM
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full shrink-0">
                              🔴 Cuti
                            </span>
                          )}
                        </div>

                        {barber.speciality && (
                          <p className="text-amber-400 text-xs font-medium mt-0.5">{barber.speciality}</p>
                        )}
                        {barber.bio && (
                          <p className="text-gray-400 text-xs mt-1 line-clamp-1 italic">{barber.bio}</p>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-gray-800/80 flex items-center justify-between text-xs">
                      <span className="text-gray-400">
                        {canSelect ? 'Sedia menerima tempahan' : 'Tidak bertugas'}
                      </span>
                      {canSelect && (
                        <span className="text-amber-400 font-bold flex items-center gap-1">
                          Pilih Barber →
                        </span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>

            <div className="pt-4">
              <button
                onClick={() => setStep(0)}
                className="inline-flex items-center gap-2 text-xs text-gray-400 hover:text-white font-semibold py-2 px-3 rounded-xl hover:bg-gray-900 transition-all min-h-[44px]"
              >
                <ArrowLeft className="h-4 w-4" /> Kembali ke Pilihan Servis
              </button>
            </div>
          </div>
        )}

        {/* -------------------- LANGKAH 2: PILIH TARIKH & MASA -------------------- */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white">Langkah 3: Pilih Tarikh & Slot Masa</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Barber: <span className="text-amber-400 font-bold">{selectedBarber?.user.name}</span> • Servis:{' '}
                <span className="text-white font-semibold">{selectedService?.name}</span> ({selectedService?.duration} minit)
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Kalendar Pemilihan Tarikh */}
              <div className="bg-gray-900 border border-gray-800 rounded-3xl p-5 shadow-sm">
                <h3 className="font-bold text-sm text-gray-200 mb-3 flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-amber-400" /> Pilih Tarikh Kehadiran
                </h3>
                <style>{`
                  .rdp { --rdp-accent-color: #f59e0b; --rdp-background-color: rgba(245,158,11,0.15); margin: 0 auto; }
                  .rdp-day_selected { color: #0a0a0c !important; font-weight: 800; border-radius: 12px; }
                  .rdp { color: white; }
                  .rdp-head_cell { color: #9ca3af; font-size: 0.75rem; font-weight: 700; }
                  .rdp-nav_button { color: #d1d5db; }
                  .rdp-day:hover:not(.rdp-day_disabled) { background: rgba(245,158,11,0.2) !important; border-radius: 12px; }
                  .rdp-day_disabled { color: #4b5563 !important; }
                `}</style>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  locale={ms}
                  disabled={(date) => isBefore(date, startOfDay(new Date()))}
                  fromDate={new Date()}
                  toDate={addDays(new Date(), 30)}
                />
              </div>

              {/* Slot Masa */}
              <div className="bg-gray-900 border border-gray-800 rounded-3xl p-5 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-sm text-white flex items-center gap-2">
                      <Clock className="h-4 w-4 text-amber-400" />
                      Slot Waktu Tersedia
                      {selectedDate && (
                        <span className="text-amber-400 text-xs font-semibold">
                          ({format(selectedDate, 'dd MMM', { locale: ms })})
                        </span>
                      )}
                    </h3>

                    {quotaInfo && !quotaInfo.isFull && selectedDate && (
                      <span className="text-[11px] font-bold text-gray-400 bg-gray-950 px-2.5 py-1 rounded-xl border border-gray-800">
                        Kuota: <span className="text-amber-400">{quotaInfo.total}/{quotaInfo.max}</span>
                      </span>
                    )}
                  </div>

                  {!selectedDate ? (
                    <div className="text-center py-16 text-gray-500 text-xs sm:text-sm">
                      📅 Sila pilih salah satu tarikh di kalendar sebelah dahulu.
                    </div>
                  ) : loading ? (
                    <div className="grid grid-cols-3 gap-2">
                      {[...Array(9)].map((_, i) => (
                        <div key={i} className="h-11 bg-gray-950 rounded-xl animate-pulse" />
                      ))}
                    </div>
                  ) : quotaInfo?.isFull ? (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-300 p-5 rounded-2xl text-center">
                      <p className="font-bold text-sm">🔴 Kuota Tarikh Ini Penuh!</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Kedai mengehadkan maksimum 20 pelanggan sehari untuk mengekalkan kualiti servis. Sila pilih tarikh lain.
                      </p>
                    </div>
                  ) : slots.length === 0 ? (
                    <div className="text-center py-10 text-gray-500 text-xs sm:text-sm">
                      {quotaInfo?.msg || 'Tiada slot dibuka pada tarikh ini.'}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-2 max-h-72 overflow-y-auto pr-1">
                        {slots.map((slot) => {
                          const isSelected = selectedTime === slot.time
                          return (
                            <button
                              key={slot.time}
                              disabled={!slot.available}
                              onClick={() => setSelectedTime(slot.time)}
                              className={`py-3 px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center min-h-[44px] ${
                                isSelected
                                  ? 'bg-amber-400 text-gray-950 font-black shadow-lg shadow-amber-400/20 scale-105'
                                  : slot.available
                                  ? 'bg-gray-950 hover:bg-gray-800 text-white border border-gray-800 hover:border-amber-400/40'
                                  : 'bg-gray-950/60 border border-gray-900 text-gray-600 opacity-40 line-through cursor-not-allowed'
                              }`}
                            >
                              <span>{slot.time}</span>
                              {slot.isBooked && (
                                <span className="text-[9px] text-red-400 font-semibold no-underline">
                                  Penuh
                                </span>
                              )}
                            </button>
                          )
                        })}
                      </div>

                      <div className="pt-2 border-t border-gray-800 flex items-center justify-center gap-4 text-[10px] text-gray-400">
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-gray-700" /> Tersedia
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-amber-400" /> Dipilih
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-red-900" /> Penuh
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-gray-800 flex items-center justify-between gap-3 mt-4">
                  <button
                    onClick={() => setStep(1)}
                    className="inline-flex items-center gap-2 text-xs text-gray-400 hover:text-white font-semibold py-2.5 px-3 rounded-xl hover:bg-gray-900 transition-all min-h-[44px]"
                  >
                    <ArrowLeft className="h-4 w-4" /> Tukar Barber
                  </button>

                  <button
                    onClick={() => setStep(3)}
                    disabled={!selectedDate || !selectedTime}
                    className="bg-amber-400 text-gray-950 px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm hover:bg-amber-300 transition-all shadow-md disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px]"
                  >
                    Seterusnya: Sahkan →
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* -------------------- LANGKAH 3: SAHKAN TEMPAHAN -------------------- */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white">Langkah 4: Sahkan Maklumat Temujanji</h2>
              <p className="text-xs text-gray-400 mt-0.5">Sila semak semula butiran tempahan sebelum membuat pengesahan akhir.</p>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-gray-300 border-b border-gray-800 pb-3">Ringkasan Tempahan</h3>

              <div className="space-y-3 text-xs sm:text-sm">
                {[
                  { label: 'Servis Dipilih', value: selectedService?.name },
                  { label: 'Tukang Gunting (Barber)', value: selectedBarber?.user.name },
                  { label: 'Tarikh Temujanji', value: selectedDate ? format(selectedDate, 'EEEE, dd MMMM yyyy', { locale: ms }) : '-' },
                  { label: 'Masa Slot', value: selectedTime },
                  { label: 'Anggaran Tempoh', value: `${selectedService?.duration} Minit` },
                  { label: 'Jumlah Perlu Dibayar', value: selectedService ? formatCurrency(selectedService.price) : '-', highlight: true },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between items-center py-2 border-b border-gray-800/80 last:border-0">
                    <span className="text-gray-400">{item.label}</span>
                    <span className={item.highlight ? 'text-amber-400 font-black text-base sm:text-lg' : 'font-semibold text-white'}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Input Nota Tambahan */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Nota untuk Barber (Pilihan)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Contoh: Saya nak potongan skin fade tepi nipis dan rapikan jambang..."
                rows={3}
                className="w-full bg-gray-900 border border-gray-800 rounded-2xl px-4 py-3 text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-400 transition-colors"
              />
            </div>

            {!session && (
              <div className="bg-amber-400/10 border border-amber-400/30 rounded-2xl p-4 text-xs text-amber-300">
                ⚠️ Anda perlu{' '}
                <Link href="/login" className="underline font-bold text-amber-400">log masuk</Link>{' '}
                untuk mengesahkan tempahan ini.
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                onClick={() => setStep(2)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-xs text-gray-400 hover:text-white font-semibold py-3 px-4 rounded-xl hover:bg-gray-900 transition-all min-h-[48px]"
              >
                <ArrowLeft className="h-4 w-4" /> Tukar Tarikh & Masa
              </button>

              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full sm:flex-1 bg-amber-400 text-gray-950 font-black py-3.5 px-6 rounded-2xl text-sm sm:text-base hover:bg-amber-300 transition-all shadow-lg shadow-amber-400/10 disabled:opacity-50 flex items-center justify-center gap-2 min-h-[48px] active:scale-95"
              >
                <CheckCircle className="h-5 w-5" />
                <span>{submitting ? 'Memproses Pengesahan...' : 'Sahkan Tempahan Sekarang'}</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* 🧠 STICKY SELECTION PILL (Reduce Short-Term Memory Load di Skrin Telefon) */}
      {selectedService && step > 0 && step < 3 && (
        <aside className="md:hidden fixed bottom-16 left-3 right-3 z-30 bg-gray-900/95 backdrop-blur-md border border-amber-400/30 p-2.5 rounded-2xl shadow-xl flex items-center justify-between gap-2 text-xs">
          <div className="min-w-0 flex-1">
            <p className="text-white font-bold truncate">
              {selectedService.name} • <span className="text-amber-400">{formatCurrency(selectedService.price)}</span>
            </p>
            <p className="text-[11px] text-gray-400 truncate">
              {selectedBarber ? `Barber: ${selectedBarber.user.name}` : 'Pilih barber anda'}
              {selectedDate && ` • ${format(selectedDate, 'dd MMM')}`}
              {selectedTime && ` @ ${selectedTime}`}
            </p>
          </div>

          <button
            onClick={() => setStep(step + 1)}
            disabled={step === 1 ? !selectedBarber : (!selectedDate || !selectedTime)}
            className="bg-amber-400 text-gray-950 font-bold px-3 py-1.5 rounded-xl text-xs hover:bg-amber-300 disabled:opacity-40 disabled:cursor-not-allowed shrink-0 min-h-[36px]"
          >
            Lanjut →
          </button>
        </aside>
      )}

      {/* ⚠️ MODAL PENUTUPAN KEDAI (Pencegahan Ralat / Error Prevention) */}
      {closedModal.isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-gray-900 border border-red-500/30 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative text-center space-y-4">
            <button
              onClick={() => {
                setClosedModal({ isOpen: false, reason: '' })
                setSelectedDate(undefined)
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="h-7 w-7" />
            </div>

            <div>
              <h3 className="text-lg sm:text-xl font-black text-white">Notis Penutupan Kedai</h3>
              {selectedDate && (
                <p className="text-amber-400 text-xs font-bold uppercase tracking-wider mt-1">
                  {format(selectedDate, 'EEEE, dd MMMM yyyy', { locale: ms })}
                </p>
              )}
            </div>

            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-3.5 text-left text-xs text-red-200 font-medium leading-relaxed">
              {closedModal.reason}
            </div>

            <p className="text-xs text-gray-400">
              Sila pilih tarikh lain yang dibuka untuk tempahan potongan rambut anda.
            </p>

            <button
              type="button"
              onClick={() => {
                setClosedModal({ isOpen: false, reason: '' })
                setSelectedDate(undefined)
              }}
              className="w-full bg-amber-400 hover:bg-amber-300 text-gray-950 font-black py-3 rounded-xl text-xs sm:text-sm transition-all shadow-md active:scale-95 min-h-[44px]"
            >
              Pilih Tarikh Lain
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
