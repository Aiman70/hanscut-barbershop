'use client'

import { AdminSidebar } from '@/components/admin-sidebar'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  Scissors, Plus, Edit2, Trash2, Clock, RefreshCw
} from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { ConfirmModal } from '@/components/ui/confirm-modal'
import { EmptyState } from '@/components/ui/empty-state'

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

  // Modal Pengesahan Padam (Shared ConfirmModal Primitive)
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; service: Service | null }>({
    isOpen: false,
    service: null,
  })

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
      const method = editingService ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
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

  const handleDelete = async () => {
    if (!deleteModal.service) return
    const id = deleteModal.service.id
    try {
      const res = await fetch(`/api/services/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast({ title: 'Servis berjaya dipadamkan' })
        fetchServices()
      } else {
        toast({ title: 'Gagal memadam servis', variant: 'destructive' })
      }
    } finally {
      setDeleteModal({ isOpen: false, service: null })
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex selection:bg-amber-400 selection:text-gray-950">
      <AdminSidebar />

      {/* Main Content dengan padding responsif */}
      <main className="flex-1 md:ml-64 pt-20 md:pt-8 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full pb-20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Senarai Servis & Harga</h1>
            <p className="text-gray-400 text-xs sm:text-sm mt-1">
              Tetapkan pakej potongan rambut, harga, dan anggaran masa servis.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="secondary"
              size="md"
              onClick={fetchServices}
              leftIcon={<RefreshCw className="h-4 w-4 text-amber-400" />}
              className="min-h-[44px]"
            >
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={openCreate}
              leftIcon={<Plus className="h-4 w-4" />}
              className="min-h-[44px]"
            >
              Tambah Servis
            </Button>
          </div>
        </div>

        {/* Senarai Kad Servis */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-44 bg-gray-900 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : services.length === 0 ? (
          <EmptyState
            icon={Scissors}
            title="Tiada servis aktif buat masa ini"
            description="Tambahkan servis pertama kedai anda seperti potongan klasik, fade, atau rawatan rambut."
            action={
              <Button variant="primary" size="sm" onClick={openCreate} leftIcon={<Plus className="h-4 w-4" />}>
                Tambah Servis Sekarang
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((service) => (
              <Card
                key={service.id}
                className="hover:border-gray-700 p-5 transition-all shadow-sm flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="font-bold text-base text-white">{service.name}</h3>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(service)}
                        className="h-8 w-8 text-gray-400 hover:text-amber-400"
                        title="Edit Servis"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteModal({ isOpen: true, service })}
                        className="h-8 w-8 text-red-400 hover:bg-red-950/40"
                        title="Padam Servis"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {service.description && (
                    <p className="text-gray-400 text-xs line-clamp-2">
                      {service.description}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-gray-800 flex items-center justify-between">
                  <span className="text-xs text-gray-300 flex items-center gap-1.5 font-medium bg-gray-950 px-2.5 py-1 rounded-lg border border-gray-800">
                    <Clock className="h-3.5 w-3.5 text-amber-400" /> {service.duration} Minit
                  </span>
                  <span className="text-amber-400 font-black text-lg">
                    {formatCurrency(service.price)}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Modal Tambah/Edit Servis (Shared Modal Component) */}
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={editingService ? 'Kemaskini Servis' : 'Tambah Servis Baru'}
          description="Masukkan butiran nama, tempoh anggaran, dan harga jualan servis."
          maxWidth="md"
        >
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">Nama Servis *</label>
              <Input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Contoh: Skin Fade + Beard Trim"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">Penerangan Ringkas</label>
              <Input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Contoh: Termasuk basuh rambut dan pomade styling"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">Tempoh (Minit) *</label>
                <Input
                  type="number"
                  min="10"
                  step="5"
                  required
                  value={form.duration}
                  onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })}
                  placeholder="30"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">Harga (RM) *</label>
                <Input
                  type="number"
                  min="0"
                  step="0.5"
                  required
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                  placeholder="25"
                />
              </div>
            </div>

            <div className="flex gap-2.5 pt-3 border-t border-gray-800">
              <Button type="button" variant="secondary" onClick={() => setShowModal(false)} className="flex-1">
                Batal
              </Button>
              <Button type="submit" variant="primary" isLoading={saving} className="flex-1">
                Simpan Servis
              </Button>
            </div>
          </form>
        </Modal>

        {/* 🛡️ Modal Pengesahan Padam (Shared ConfirmModal Component) */}
        {deleteModal.isOpen && deleteModal.service && (
          <ConfirmModal
            isOpen={deleteModal.isOpen}
            onClose={() => setDeleteModal({ isOpen: false, service: null })}
            onConfirm={handleDelete}
            title="Padam Servis Ini?"
            description={`Adakah anda pasti mahu memadam pakej servis "${deleteModal.service.name}" daripada senarai kedai?`}
            confirmText="Ya, Padamkan"
            cancelText="Batal"
            variant="danger"
          />
        )}
      </main>
    </div>
  )
}
