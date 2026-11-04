'use client'

import { AdminSidebar } from '@/components/admin-sidebar'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Scissors, Users, Plus, X, Save, Phone, Mail, Award,
  LogOut, RefreshCw, Trash2, CheckCircle2, UserCheck
} from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { signOut } from 'next-auth/react'

interface Barber {
  id: string
  bio: string | null
  speciality: string | null
  isAvailable: boolean
  user: {
    id: string
    name: string | null
    email: string
    phone: string | null
  }
}

export default function AdminStaffPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  const [barbers, setBarbers] = useState<Barber[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Form state
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    speciality: '',
    bio: '',
  })

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/login'); return }
    if (status === 'authenticated') {
      if ((session?.user as any)?.role !== 'ADMIN') { router.push('/booking'); return }
      fetchBarbers()
    }
  }, [status, session])

  const fetchBarbers = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/staff')
      const data = await res.json()
      setBarbers(Array.isArray(data) ? data : [])
    } finally {
      setLoading(false)
    }
  }

  const handleSaveBarber = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const res = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await res.json()

      if (!res.ok) {
        toast({ title: 'Gagal', description: data.error, variant: 'destructive' })
      } else {
        toast({ title: 'Berjaya! 🎉', description: 'Barber baru telah didaftarkan' })
        setShowModal(false)
        setForm({ name: '', email: '', password: '', phone: '', speciality: '', bio: '' })
        fetchBarbers()
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex">
      {/* Sidebar Admin (Selaras dengan Dashboard & Bookings) */}
      <AdminSidebar />

      {/* Main Content */}
      <main className="ml-64 flex-1 p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-1">Pengurusan Staff Barber</h1>
            <p className="text-gray-400 text-sm">Urus senarai tukang gunting rambut dan tugasan harian</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchBarbers}
              className="flex items-center gap-2 bg-gray-900 border border-gray-800 hover:bg-gray-800 text-gray-300 px-4 py-2.5 rounded-xl text-sm transition-colors"
            >
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 bg-amber-400 text-gray-950 font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-amber-300 transition-all shadow-md active:scale-95"
            >
              <Plus className="h-4 w-4" /> Tambah Barber Baru
            </button>
          </div>
        </div>

        {/* Kad Jumlah Barber */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-5 mb-8">
          <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl">
            <span className="text-xs text-gray-400 font-medium">Jumlah Barber Berdaftar</span>
            <p className="text-2xl font-extrabold text-amber-400 mt-2">{barbers.length} Orang</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl">
            <span className="text-xs text-gray-400 font-medium">Barber Bertugas Hari Ini</span>
            <p className="text-2xl font-extrabold text-green-400 mt-2">
              {barbers.filter(b => b.isAvailable).length} Aktif
            </p>
            {barbers.some(b => (b as any).isAutoOff) && (
              <span className="text-[11px] text-amber-400 font-bold block mt-1.5 flex items-center gap-1">
                🔒 Luar Waktu Operasi (Auto-Off Aktif)
              </span>
            )}
          </div>
        </div>

        {/* Senarai Kad Staff Barber */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-56 bg-gray-900 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : barbers.length === 0 ? (
          <div className="p-16 text-center bg-gray-900 border border-gray-800 rounded-2xl">
            <Users className="h-12 w-12 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">Tiada staff barber berdaftar setakat ini.</p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-4 inline-flex items-center gap-1.5 text-xs text-amber-400 hover:underline font-bold"
            >
              <Plus className="h-4 w-4" /> Daftar barber pertama sekarang
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {barbers.map((barber) => {
              const isAutoOff = (barber as any).isAutoOff
              return (
                <div
                  key={barber.id}
                  className="bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-2xl p-6 transition-all shadow-lg flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 bg-amber-400 text-gray-950 font-black text-lg rounded-full flex items-center justify-center shrink-0 shadow-md">
                          {barber.user.name?.charAt(0) || 'B'}
                        </div>
                        <div>
                          <h3 className="font-bold text-base text-white">{barber.user.name}</h3>
                          <p className="text-amber-400 text-xs flex items-center gap-1 font-semibold mt-0.5">
                            <Award className="h-3 w-3" /> {barber.speciality || 'Barber Profesional'}
                          </p>
                        </div>
                      </div>

                      <span className={`text-[11px] px-2.5 py-1 rounded-full font-bold border shrink-0 ${
                        barber.isAvailable
                          ? 'bg-green-500/10 border-green-500/20 text-green-400'
                          : isAutoOff
                          ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                          : 'bg-red-500/10 border-red-500/20 text-red-400'
                      }`}>
                        {barber.isAvailable ? '🟢 Bertugas' : isAutoOff ? '🔒 Auto-Off' : '🔴 Cuti'}
                      </span>
                    </div>

                  {barber.bio && (
                    <p className="text-gray-400 text-xs mb-4 line-clamp-2 italic bg-gray-800/40 p-2.5 rounded-xl border border-gray-800/60">
                      "{barber.bio}"
                    </p>
                  )}

                  <div className="space-y-2 border-t border-gray-800/80 pt-3 text-xs text-gray-400">
                    <div className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 text-gray-500 shrink-0" />
                      <span className="truncate">{barber.user.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-gray-500 shrink-0" />
                      <span>{barber.user.phone || 'Tiada No Tel'}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-gray-800 flex items-center justify-between text-xs text-gray-500">
                  <span>ID: #{barber.id.slice(-6).toUpperCase()}</span>
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Akaun Aktif
                  </span>
                </div>
              </div>
            )
          })}
          </div>
        )}

        {/* Modal Popup Tambah Barber */}
        {showModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl">
              <div className="flex items-center justify-between mb-5 border-b border-gray-800 pb-3">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Scissors className="h-5 w-5 text-amber-400" /> Tambah Barber Baru
                </h2>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSaveBarber} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">Nama Penuh *</label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Contoh: Danial Haikal"
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">No Telefon</label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="012-3456789"
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">Email Login *</label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="danial@barbershop.com"
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">Password Sementara *</label>
                    <input
                      type="password"
                      required
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      placeholder="Min 6 aksara"
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Kepakaran / Speciality</label>
                  <input
                    type="text"
                    value={form.speciality}
                    onChange={(e) => setForm({ ...form, speciality: e.target.value })}
                    placeholder="Contoh: Skin Fade & Beard Specialist"
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Bio / Penerangan Ringkas</label>
                  <textarea
                    rows={2}
                    value={form.bio}
                    onChange={(e) => setForm({ ...form, bio: e.target.value })}
                    placeholder="Pengalaman 4 tahun, pakar potongan moden..."
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="flex gap-3 pt-3 border-t border-gray-800">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-amber-400 hover:bg-amber-300 text-gray-950 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 disabled:opacity-50 transition-colors shadow-md"
                  >
                    <Save className="h-4 w-4" /> {submitting ? 'Menyimpan...' : 'Simpan Barber'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
