'use client'

import { AdminSidebar } from '@/components/admin-sidebar'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Scissors, Plus, Edit2, Trash2, X, Save, Clock, DollarSign,
  LogOut, RefreshCw
} from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { formatCurrency } from '@/lib/utils'
import { signOut } from 'next-auth/react'

interface Service {
  id: string
  name: string
  description: string | null
  duration: number
  price: number
  isActive: boolean
}

export default function AdminServicesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [form, setForm] = useState({ name: '', description: '', duration: 30, price: 15 })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/login'); return }
    if (status === 'authenticated') {
      if ((session?.user as any)?.role !== 'ADMIN') { router.push('/booking'); return }
      fetchServices()
    }
  }, [status, session])

  const fetchServices = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/services')
      const data = await res.json()
      setServices(Array.isArray(data) ? data : [])
    } finally {
      setLoading(false)
    }
  }

  const openCreate = () => {
    setEditingService(null)
    setForm({ name: '', description: '', duration: 30, price: 15 })
    setShowModal(true)
  }

  const openEdit = (service: Service) => {
    setEditingService(service)
    setForm({
      name: service.name,
      description: service.description || '',
      duration: service.duration,
      price: service.price,
    })
    setShowModal(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const url = editingService ? `/api/services/${editingService.id}` : '/api/services'
      const method = editingService ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          duration: Number(form.duration),
          price: Number(form.price),
        }),
      })

      if (res.ok) {
        toast({ title: editingService ? 'Servis dikemaskini!' : 'Servis ditambah!' })
        setShowModal(false)
        fetchServices()
      } else {
        toast({ title: 'Ralat menyimpan servis', variant: 'destructive' })
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Padam servis ini daripada senarai kedai?')) return
    const res = await fetch(`/api/services/${id}`, { method: 'DELETE' })
    if (res.ok) {
      toast({ title: 'Servis berjaya dipadamkan' })
      fetchServices()
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex">
      {/* Sidebar Admin */}
      <AdminSidebar />

      {/* Main Content */}
      <main className="ml-64 flex-1 p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-1">Senarai Servis & Harga</h1>
            <p className="text-gray-400 text-sm">Tetapkan pakej gunting rambut, harga, dan anggaran masa</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchServices}
              className="flex items-center gap-2 bg-gray-900 border border-gray-800 hover:bg-gray-800 text-gray-300 px-4 py-2.5 rounded-xl text-sm transition-colors"
            >
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>
            <button
              onClick={openCreate}
              className="flex items-center gap-2 bg-amber-400 text-gray-950 font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-amber-300 transition-all shadow-md active:scale-95"
            >
              <Plus className="h-4 w-4" /> Tambah Servis Baru
            </button>
          </div>
        </div>

        {/* Senarai Kad Servis */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-900 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : services.length === 0 ? (
          <div className="p-16 text-center bg-gray-900 border border-gray-800 rounded-2xl">
            <Scissors className="h-12 w-12 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">Tiada servis aktif buat masa ini.</p>
            <button
              onClick={openCreate}
              className="mt-4 inline-flex items-center gap-1.5 text-xs text-amber-400 hover:underline font-bold"
            >
              <Plus className="h-4 w-4" /> Tambah servis pertama anda
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <div
                key={service.id}
                className="bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-2xl p-6 transition-all shadow-lg flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h3 className="font-bold text-lg text-white">{service.name}</h3>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => openEdit(service)}
                        className="p-1.5 text-gray-400 hover:text-amber-400 hover:bg-gray-800 rounded-lg transition-colors"
                        title="Edit Servis"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(service.id)}
                        className="p-1.5 text-red-400 hover:bg-red-950/40 rounded-lg transition-colors"
                        title="Padam Servis"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {service.description && (
                    <p className="text-gray-400 text-xs mb-4 line-clamp-2">
                      {service.description}
                    </p>
                  )}
                </div>

                <div className="pt-4 border-t border-gray-800 flex items-center justify-between">
                  <span className="text-xs text-gray-400 flex items-center gap-1 font-medium bg-gray-800/80 px-2.5 py-1 rounded-lg">
                    <Clock className="h-3.5 w-3.5 text-amber-400" /> {service.duration} Minit
                  </span>
                  <span className="text-amber-400 font-black text-xl">
                    {formatCurrency(service.price)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal Popup Tambah/Edit Servis */}
        {showModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between mb-5 border-b border-gray-800 pb-3">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Scissors className="h-5 w-5 text-amber-400" />
                  {editingService ? 'Kemaskini Servis' : 'Tambah Servis Baru'}
                </h2>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Nama Servis *</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Contoh: Skin Fade + Beard Trim"
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Penerangan Ringkas</label>
                  <input
                    type="text"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Contoh: Termasuk basuh rambut dan minyak rambut"
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">Tempoh (Minit) *</label>
                    <input
                      type="number"
                      min="10"
                      step="5"
                      required
                      value={form.duration}
                      onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })}
                      placeholder="30"
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">Harga (RM) *</label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      required
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                      placeholder="25"
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
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
                    disabled={saving}
                    className="flex-1 bg-amber-400 hover:bg-amber-300 text-gray-950 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 disabled:opacity-50 transition-colors shadow-md"
                  >
                    <Save className="h-4 w-4" /> {saving ? 'Menyimpan...' : 'Simpan Servis'}
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
