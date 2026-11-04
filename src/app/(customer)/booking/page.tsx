// src/app/(customer)/booking/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { DayPicker as Calendar } from 'react-day-picker'
import { format, addDays, isBefore, startOfDay } from 'date-fns'
import { ms } from 'date-fns/locale'
import { Scissors, Clock, ChevronRight, CheckCircle, User, Star, RefreshCw, AlertTriangle, X } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { formatCurrency, formatTime } from '@/lib/utils'
import Link from 'next/link'
import { CustomerNav } from '@/components/customer-nav'
import 'react-day-picker/dist/style.css'

interface Service {
  id: string; name: string; description: string | null;
  duration: number; price: number;
}
interface Barber {
  id: string; bio: string | null; speciality: string | null;
  isAvailable: boolean;
  user: { name: string | null; image: string | null };
}
interface TimeSlot { time: string; available: boolean; isBooked?: boolean; isPast?: boolean }

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

  const handleRefreshBarbers = async () => {
    setRefreshingBarbers(true)
    try {
      const res = await fetch('/api/staff')
      const data = await res.json()
      if (Array.isArray(data)) {
        setBarbers(data)
        toast({ title: 'Status ketersediaan barber dikemaskini! 🔄' })
      }
    } finally {
      setRefreshingBarbers(false)
    }
  }

  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>()
  const [selectedTime, setSelectedTime] = useState<string>('')
  const [notes, setNotes] = useState('')
  const [closedModal, setClosedModal] = useState<{ isOpen: boolean; reason: string }>({ isOpen: false, reason: '' })

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
        toast({ title: 'Gagal', description: data.error, variant: 'destructive' })
      } else {
        toast({ title: '✅ Tempahan berjaya!', description: 'Email pengesahan telah dihantar' })
        router.push('/my-appointments')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const tomorrow = addDays(new Date(), 0)

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-16">
      <CustomerNav />

      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-gray-800/80">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-400/10 border border-amber-400/20 rounded-full text-xs font-bold text-amber-400 mb-2">
              <Scissors className="h-3.5 w-3.5" />
              Hanscut Barbershop • #REZEKI DI KONGSI BERSAMA
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight">Tempahan Temujanji</h1>
            <p className="text-gray-400 text-sm mt-1">Pilih servis kegemaran, barber pakar dan masa slot yang ideal untuk anda</p>
          </div>

          <div className="bg-gray-900 border border-gray-800 p-3.5 rounded-2xl text-xs text-gray-400 shrink-0">
            <div className="font-bold flex items-center gap-1.5 mb-1 text-amber-400">
              <Clock className="h-3.5 w-3.5" /> Waktu Operasi:
            </div>
            <div>Sabtu - Khamis: <span className="text-white font-medium">3.00 PM - 11.00 PM</span></div>
            <div>Jumaat: <span className="text-white font-medium">8.30 PM - 11.00 PM</span> (Malam)</div>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 mb-10 overflow-x-auto pb-2">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center gap-2 shrink-0">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                i === step ? 'bg-amber-400 text-gray-950' :
                i < step ? 'bg-green-500 text-white' : 'bg-gray-800 text-gray-400'
              }`}>
                {i < step ? <CheckCircle className="h-4 w-4" /> : <span>{i + 1}</span>}
                {s}
              </div>
              {i < STEPS.length - 1 && <ChevronRight className="h-4 w-4 text-gray-600 shrink-0" />}
            </div>
          ))}
        </div>

        {/* Step 0: Pilih Servis */}
        {step === 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-6">Pilih Servis</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {services.map((service) => (
                <button
                  key={service.id}
                  onClick={() => { setSelectedService(service); setStep(1) }}
                  className={`text-left p-6 rounded-xl border transition-all ${
                    selectedService?.id === service.id
                      ? 'border-amber-400 bg-amber-400/10'
                      : 'border-gray-800 bg-gray-900 hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">{service.name}</h3>
                      {service.description && (
                        <p className="text-gray-400 text-sm mt-1">{service.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-3">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-400">{service.duration} minit</span>
                      </div>
                    </div>
                    <span className="text-amber-400 font-bold text-xl">
                      {formatCurrency(service.price)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 1: Pilih Barber */}
        {step === 1 && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <h2 className="text-xl font-bold">Langkah 2: Pilih Barber</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Servis dipilih: <span className="text-amber-400 font-bold">{selectedService?.name}</span> ({formatCurrency(selectedService?.price || 0)})
                </p>
              </div>

              {/* Butang Refresh Live Status Barber */}
              <button
                type="button"
                onClick={handleRefreshBarbers}
                disabled={refreshingBarbers}
                className="inline-flex items-center gap-2 bg-gray-900 border border-gray-800 hover:border-amber-400/40 text-gray-300 hover:text-white px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shadow-sm active:scale-95 disabled:opacity-50 shrink-0 self-start sm:self-auto"
              >
                <RefreshCw className={`h-3.5 w-3.5 text-amber-400 ${refreshingBarbers ? 'animate-spin' : ''}`} />
                {refreshingBarbers ? 'Menyemak status...' : 'Refresh Status Barber'}
              </button>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {barbers.map((barber) => {
                const isAutoOff = !!(barber as any).isAutoOff
                // Boleh pilih jika barber bertugas SEKARANG atau jika auto-off luar waktu operasi (untuk tempah slot petang/malam)
                const canSelect = barber.isAvailable || (isAutoOff && (barber as any).manualAvailability !== false)

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
                    className={`text-left p-6 rounded-2xl border transition-all relative ${
                      !canSelect
                        ? 'border-gray-800/50 bg-gray-900/30 opacity-55 cursor-not-allowed'
                        : selectedBarber?.id === barber.id
                        ? 'border-amber-400 bg-amber-400/10 shadow-lg shadow-amber-500/5'
                        : 'border-gray-800 bg-gray-900 hover:border-gray-700 hover:bg-gray-900/90'
                    }`}
                  >
                    {/* Status Badge Ketersediaan & Auto-Off */}
                    <div className="absolute top-4 right-4">
                      {barber.isAvailable ? (
                        <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                          🟢 Bertugas
                        </span>
                      ) : isAutoOff ? (
                        <span className="text-[11px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">
                          🕒 Auto-Off (Buka 3.00 PM)
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-full">
                          🔴 Cuti / Rehat
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center font-black text-xl shrink-0 ${
                        barber.isAvailable
                          ? 'bg-amber-400 text-gray-950 shadow-md'
                          : isAutoOff
                          ? 'bg-amber-400/20 text-amber-400 border border-amber-400/30'
                          : 'bg-gray-800 text-gray-500'
                      }`}>
                        {barber.user.name?.charAt(0) || 'B'}
                      </div>
                      <div>
                        <h3 className={`font-bold text-lg ${canSelect ? 'text-white' : 'text-gray-400'}`}>
                          {barber.user.name}
                        </h3>
                        {barber.speciality && (
                          <p className="text-amber-400 text-xs font-semibold mt-0.5">{barber.speciality}</p>
                        )}
                        {barber.bio && (
                          <p className="text-gray-400 text-xs mt-1.5 line-clamp-1 italic">{barber.bio}</p>
                        )}

                        {isAutoOff && canSelect && (
                          <p className="text-[11px] text-amber-400/90 font-medium mt-2 flex items-center gap-1">
                            🕒 Kedai belum buka sekarang. Boleh tempah slot bermula 3.00 PM.
                          </p>
                        )}

                        {!canSelect && (
                          <p className="text-[11px] text-red-400/90 font-medium mt-2">
                            ⚠️ Tidak menerima tempahan buat masa ini (Cuti)
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
            <button onClick={() => setStep(0)} className="mt-6 text-gray-400 hover:text-white text-sm">
              ← Kembali
            </button>
          </div>
        )}

        {/* Step 2: Pilih Tarikh & Masa */}
        {step === 2 && (
          <div>
            <h2 className="text-xl font-semibold mb-6">Pilih Tarikh & Masa</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <h3 className="font-medium mb-4 text-gray-300">Pilih Tarikh</h3>
                <style>{`
                  .rdp { --rdp-accent-color: #f59e0b; --rdp-background-color: rgba(245,158,11,0.1); }
                  .rdp-day_selected { color: #1a1a1a !important; }
                  .rdp { color: white; }
                  .rdp-head_cell { color: #9ca3af; }
                  .rdp-nav_button { color: #9ca3af; }
                  .rdp-day:hover:not(.rdp-day_disabled) { background: rgba(255,255,255,0.1) !important; }
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

              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-white flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-amber-400" />
                    Pilih Masa
                    {selectedDate && (
                      <span className="text-amber-400 text-xs font-semibold ml-1">
                        ({format(selectedDate, 'dd MMM', { locale: ms })})
                      </span>
                    )}
                  </h3>

                  {quotaInfo && !quotaInfo.isFull && selectedDate && (
                    <span className="text-[11px] font-bold text-gray-400 bg-gray-800/80 px-2.5 py-1 rounded-lg border border-gray-700">
                      Kuota: <span className="text-amber-400">{quotaInfo.total}/{quotaInfo.max}</span>
                    </span>
                  )}
                </div>

                {!selectedDate ? (
                  <div className="text-center py-12 text-gray-500 text-xs">
                    👈 Sila klik salah satu tarikh di kalendar sebelah
                  </div>
                ) : loading ? (
                  <div className="grid grid-cols-3 gap-2">
                    {[...Array(9)].map((_, i) => (
                      <div key={i} className="h-11 bg-gray-800/60 rounded-xl animate-pulse" />
                    ))}
                  </div>
                ) : quotaInfo?.isFull ? (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-300 p-5 rounded-2xl text-center">
                    <p className="font-bold text-sm">🔴 Kuota Tarikh Ini Penuh!</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Kedai ini mengehadkan maksimum 20 pelanggan sehari untuk menjaga kualiti servis. Sila pilih tarikh lain.
                    </p>
                  </div>
                ) : slots.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 text-xs">
                    {quotaInfo?.msg || 'Tiada slot tersedia pada tarikh ini.'}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-2 max-h-72 overflow-y-auto pr-1">
                      {slots.map((slot) => {
                        const isSelected = selectedTime === slot.time
                        return (
                          <button
                            key={slot.time}
                            disabled={!slot.available}
                            onClick={() => setSelectedTime(slot.time)}
                            className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center relative ${
                              isSelected
                                ? 'bg-amber-400 text-gray-950 font-black shadow-lg shadow-amber-400/20 scale-105'
                                : slot.available
                                ? 'bg-gray-800/90 hover:bg-gray-700 text-white border border-gray-700 hover:border-amber-400/50'
                                : slot.isBooked
                                ? 'bg-gray-950/80 border border-red-950/30 text-gray-600 opacity-40 line-through cursor-not-allowed'
                                : 'bg-gray-950/60 border border-gray-900 text-gray-700 opacity-30 cursor-not-allowed line-through'
                            }`}
                          >
                            <span>{slot.time}</span>
                            {slot.isBooked && (
                              <span className="text-[9px] text-red-400/80 font-semibold no-underline">
                                ❌ Penuh
                              </span>
                            )}
                          </button>
                        )
                      })}
                    </div>

                    <div className="pt-2 border-t border-gray-800/80 flex items-center justify-center gap-4 text-[10px] text-gray-400">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-gray-700 border border-gray-600" /> Sedia Ada
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-amber-400" /> Dipilih
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-red-900/40 border border-red-800/40" /> Ditempah (Penuh)
                      </span>
                    </div>

                    <div className="p-2.5 bg-gray-950/70 border border-gray-800/90 rounded-xl text-center">
                      <p className="text-[11px] text-gray-400">
                        ☕ <span className="text-amber-400 font-semibold">Masa Rehat & Sanitasi (10 Minit):</span> Setiap slot automatik disusuli 10 minit rehat & pembersihan sebelum pelanggan seterusnya.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex items-center gap-4">
              <button onClick={() => setStep(1)} className="text-gray-400 hover:text-white text-sm">
                ← Kembali
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!selectedDate || !selectedTime}
                className="bg-amber-400 text-gray-950 px-6 py-3 rounded-lg font-semibold hover:bg-amber-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Seterusnya →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Sahkan */}
        {step === 3 && (
          <div>
            <h2 className="text-xl font-semibold mb-6">Sahkan Tempahan</h2>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
              <h3 className="font-medium text-gray-300 mb-4">Ringkasan Tempahan</h3>
              <div className="space-y-3">
                {[
                  { label: 'Servis', value: selectedService?.name },
                  { label: 'Barber', value: selectedBarber?.user.name },
                  { label: 'Tarikh', value: selectedDate ? format(selectedDate, 'dd MMMM yyyy', { locale: ms }) : '-' },
                  { label: 'Masa', value: selectedTime },
                  { label: 'Tempoh', value: `${selectedService?.duration} minit` },
                  { label: 'Jumlah', value: selectedService ? formatCurrency(selectedService.price) : '-', highlight: true },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between py-2 border-b border-gray-800 last:border-0">
                    <span className="text-gray-400">{item.label}</span>
                    <span className={item.highlight ? 'text-amber-400 font-bold text-lg' : 'font-medium'}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">Nota (pilihan)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Contoh: Saya nak style macam dalam gambar..."
                rows={3}
                className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-amber-400 transition-colors"
              />
            </div>

            {!session && (
              <div className="bg-amber-400/10 border border-amber-400/30 rounded-lg p-4 mb-6">
                <p className="text-amber-400 text-sm">
                  ⚠️ Sila{' '}
                  <Link href="/login" className="underline font-semibold">log masuk</Link>
                  {' '}untuk mengesahkan tempahan anda.
                </p>
              </div>
            )}

            <div className="flex items-center gap-4">
              <button onClick={() => setStep(2)} className="text-gray-400 hover:text-white text-sm">
                ← Kembali
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="bg-amber-400 text-gray-950 px-8 py-3 rounded-lg font-bold text-lg hover:bg-amber-300 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {submitting ? 'Memproses...' : (
                  <><CheckCircle className="h-5 w-5" /> Sahkan Tempahan</>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Popup Notis Kedai Ditutup */}
      {closedModal.isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-gray-900 border border-red-500/30 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative text-center">
            <button
              onClick={() => {
                setClosedModal({ isOpen: false, reason: '' })
                setSelectedDate(undefined)
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-8 w-8 animate-bounce" />
            </div>

            <h3 className="text-xl font-black text-white mb-1">
              ⚠️ Notis Penutupan Kedai
            </h3>

            {selectedDate && (
              <p className="text-amber-400 text-xs font-bold uppercase tracking-wider mb-4">
                {format(selectedDate, 'EEEE, dd MMMM yyyy', { locale: ms })}
              </p>
            )}

            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 mb-6 text-left">
              <p className="text-xs text-red-200 font-medium leading-relaxed">
                {closedModal.reason}
              </p>
            </div>

            <p className="text-xs text-gray-400 mb-6">
              Maaf atas sebarang kesulitan. Sila pilih tarikh lain yang masih dibuka untuk membuat tempahan gunting rambut anda.
            </p>

            <button
              type="button"
              onClick={() => {
                setClosedModal({ isOpen: false, reason: '' })
                setSelectedDate(undefined)
              }}
              className="w-full bg-amber-400 hover:bg-amber-500 text-gray-950 font-black py-3 rounded-xl text-sm transition-all shadow-lg shadow-amber-400/10 active:scale-95"
            >
              Pilih Tarikh Lain
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
