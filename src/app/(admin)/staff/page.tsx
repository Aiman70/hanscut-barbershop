'use client'

import { AdminSidebar } from '@/components/admin-sidebar'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  Scissors, Users, Plus, Phone, Mail, Award,
  RefreshCw, CheckCircle2, UserCheck
} from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Modal } from '@/components/ui/modal'
import { StatusBadge } from '@/components/ui/status-badge'
import { EmptyState } from '@/components/ui/empty-state'

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
    <div className="min-h-screen bg-gray-950 text-white flex selection:bg-amber-400 selection:text-gray-950">
      <AdminSidebar />

      {/* Main Content dengan padding responsif */}
      <main className="flex-1 md:ml-64 pt-20 md:pt-8 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full pb-20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Pengurusan Staff Barber</h1>
            <p className="text-gray-400 text-xs sm:text-sm mt-1">Urus senarai tukang gunting rambut dan tugasan harian</p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="secondary"
              size="md"
              onClick={fetchBarbers}
              leftIcon={<RefreshCw className="h-4 w-4 text-amber-400" />}
              className="min-h-[44px]"
            >
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => setShowModal(true)}
              leftIcon={<Plus className="h-4 w-4" />}
              className="min-h-[44px]"
            >
              Tambah Barber
            </Button>
          </div>
        </div>

        {/* Kad Jumlah Barber */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <Card className="p-4 sm:p-5">
            <span className="text-xs text-gray-400 font-medium">Jumlah Barber Berdaftar</span>
            <p className="text-2xl font-black text-amber-400 mt-2">{barbers.length} Orang</p>
          </Card>
          <Card className="p-4 sm:p-5">
            <span className="text-xs text-gray-400 font-medium">Barber Bertugas Hari Ini</span>
            <p className="text-2xl font-black text-emerald-400 mt-2">
              {barbers.filter((b) => b.isAvailable).length} Aktif
            </p>
            {barbers.some((b) => (b as any).isAutoOff) && (
              <span className="text-[11px] text-amber-400 font-bold block mt-1.5">
                🔒 Luar Waktu Operasi (Auto-Off Aktif)
              </span>
            )}
          </Card>
        </div>

        {/* Senarai Kad Staff Barber */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-56 bg-gray-900 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : barbers.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Tiada staff barber berdaftar setakat ini"
            description="Daftarkan tukang gunting pertama kedai anda untuk mula menerima tempahan."
            action={
              <Button variant="primary" size="sm" onClick={() => setShowModal(true)} leftIcon={<Plus className="h-4 w-4" />}>
                Daftar Barber Sekarang
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {barbers.map((barber) => {
              const isAutoOff = (barber as any).isAutoOff
              return (
                <Card
                  key={barber.id}
                  className="hover:border-gray-700 p-5 transition-all shadow-sm flex flex-col justify-between space-y-4"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-amber-400 text-gray-950 font-black text-lg rounded-2xl flex items-center justify-center shrink-0 shadow-sm">
                          {barber.user.name?.charAt(0) || 'B'}
                        </div>
                        <div>
                          <h3 className="font-bold text-base text-white">{barber.user.name}</h3>
                          <p className="text-amber-400 text-xs flex items-center gap-1 font-semibold mt-0.5">
                            <Award className="h-3 w-3" /> {barber.speciality || 'Barber Profesional'}
                          </p>
                        </div>
                      </div>

                      <StatusBadge
                        status={barber.isAvailable ? 'AVAILABLE' : isAutoOff ? 'AUTO_OFF' : 'OFF_DUTY'}
                        size="sm"
                      />
                    </div>

                    {barber.bio && (
                      <p className="text-gray-400 text-xs mb-3 line-clamp-2 italic bg-gray-950 p-2.5 rounded-xl border border-gray-800">
                        "{barber.bio}"
                      </p>
                    )}

                    <div className="space-y-1.5 border-t border-gray-800 pt-3 text-xs text-gray-400">
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

                  <div className="pt-3 border-t border-gray-800 flex items-center justify-between text-xs text-gray-500">
                    <span>ID: #{barber.id.slice(-6).toUpperCase()}</span>
                    <span className="text-emerald-400 flex items-center gap-1 font-medium">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Akaun Aktif
                    </span>
                  </div>
                </Card>
              )
            })}
          </div>
        )}

        {/* Modal Tambah Barber (Shared Modal Component) */}
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title="Tambah Staff Barber Baru"
          description="Daftarkan akaun staf barber untuk akses portal dan menerima tempahan pelanggan."
          maxWidth="lg"
        >
          <form onSubmit={handleSaveBarber} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">Nama Penuh *</label>
                <Input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Contoh: Danial Haikal"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">No Telefon</label>
                <Input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="012-3456789"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">Email Login *</label>
                <Input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="danial@barbershop.com"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">Password Sementara *</label>
                <Input
                  type="password"
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Min 6 aksara"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">Kepakaran / Speciality</label>
              <Input
                value={form.speciality}
                onChange={(e) => setForm({ ...form, speciality: e.target.value })}
                placeholder="Contoh: Skin Fade & Beard Specialist"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">Bio / Penerangan Ringkas</label>
              <Textarea
                rows={2}
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                placeholder="Pengalaman 4 tahun, pakar potongan moden..."
              />
            </div>

            <div className="flex gap-2.5 pt-3 border-t border-gray-800">
              <Button type="button" variant="secondary" onClick={() => setShowModal(false)} className="flex-1">
                Batal
              </Button>
              <Button type="submit" variant="primary" isLoading={submitting} className="flex-1">
                Simpan Barber
              </Button>
            </div>
          </form>
        </Modal>
      </main>
    </div>
  )
}
