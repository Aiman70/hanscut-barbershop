'use client'

import { AdminSidebar } from '@/components/admin-sidebar'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Scissors, Settings, ShieldAlert, Calendar, Users, Save,
  Plus, Trash2, AlertTriangle, CheckCircle, RefreshCw, LogOut,
  Info, Sparkles, Database, Download
} from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { signOut } from 'next-auth/react'

interface ShopSettings {
  id: string
  dailyQuota: number
  noticeMessage: string | null
  isEmergencyClose: boolean
}

interface ClosedDate {
  id: string
  date: string
  reason: string
}

export default function AdminSettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  const [settings, setSettings] = useState<ShopSettings>({
    id: 'default',
    dailyQuota: 20,
    noticeMessage: 'Kedai beroperasi seperti biasa.',
    isEmergencyClose: false,
  })
  const [closedDates, setClosedDates] = useState<ClosedDate[]>([])
  const [loading, setLoading] = useState(true)
  const [savingSettings, setSavingSettings] = useState(false)

  // New Closed Date Form State
  const [newDate, setNewDate] = useState('')
  const [newReason, setNewReason] = useState('')
  const [addingDate, setAddingDate] = useState(false)
  const [downloadingBackup, setDownloadingBackup] = useState(false)

  const handleDownloadBackup = async () => {
    setDownloadingBackup(true)
    try {
      const res = await fetch('/api/admin/backup')
      if (!res.ok) throw new Error('Gagal memuat turun')

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `barbershop_backup_${new Date().toISOString().slice(0, 10)}.enc`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)

      toast({
        title: 'Sandaran Berjaya Dimuat Turun! 🔒',
        description: 'Fail disulitkan dengan piawaian tentera AES-256-CBC.',
      })
    } catch {
      toast({
        title: 'Ralat',
        description: 'Gagal memuat turun fail sandaran pangkalan data',
        variant: 'destructive',
      })
    } finally {
      setDownloadingBackup(false)
    }
  }

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }
    if (status === 'authenticated') {
      if ((session?.user as any)?.role !== 'ADMIN') {
        router.push('/booking')
        return
      }
      fetchData()
    }
  }, [status, session])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/settings')
      if (res.ok) {
        const data = await res.json()
        if (data.settings) setSettings(data.settings)
        if (Array.isArray(data.closedDates)) setClosedDates(data.closedDates)
      }
    } catch (e) {
      toast({ title: 'Ralat', description: 'Gagal memuatkan tetapan kedai', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setSavingSettings(true)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dailyQuota: Number(settings.dailyQuota),
          noticeMessage: settings.noticeMessage,
          isEmergencyClose: settings.isEmergencyClose,
        }),
      })

      const data = await res.json()
      if (res.ok) {
        toast({ title: 'Berjaya! ✅', description: data.message })
        if (data.settings) setSettings(data.settings)
      } else {
        toast({ title: 'Ralat', description: data.error || 'Gagal menyimpan tetapan', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Ralat', description: 'Ralat sambungan pelayan', variant: 'destructive' })
    } finally {
      setSavingSettings(false)
    }
  }

  const handleAddClosedDate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newDate) {
      toast({ title: 'Perhatian', description: 'Sila pilih tarikh cuti terlebih dahulu', variant: 'destructive' })
      return
    }

    setAddingDate(true)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: newDate,
          reason: newReason || 'Cuti Khas / Rehat',
        }),
      })

      const data = await res.json()
      if (res.ok) {
        toast({ title: 'Tarikh Tutup Ditambah! 📅', description: `Kedai akan ditutup pada ${newDate}` })
        setNewDate('')
        setNewReason('')
        fetchData()
      } else {
        toast({ title: 'Ralat', description: data.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Ralat', description: 'Gagal menambah tarikh cuti', variant: 'destructive' })
    } finally {
      setAddingDate(false)
    }
  }

  const handleDeleteClosedDate = async (date: string) => {
    if (!confirm(`Buka semula tempahan untuk tarikh ${date}?`)) return

    try {
      const res = await fetch(`/api/admin/settings?date=${date}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (res.ok) {
        toast({ title: 'Dibuka Semula! 🔓', description: data.message })
        setClosedDates(prev => prev.filter(c => c.date !== date))
      } else {
        toast({ title: 'Ralat', description: data.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Ralat', description: 'Gagal memadam tarikh cuti', variant: 'destructive' })
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex">
      {/* Sidebar Admin */}
      <AdminSidebar />

      {/* Main Content Area */}
      <main className="flex-1 ml-64 p-8 max-w-6xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2">
              <Settings className="h-7 w-7 text-amber-400" />
              <h1 className="text-2xl font-black">Tetapan Kedai & Had Kuota</h1>
            </div>
            <p className="text-gray-400 text-sm mt-1">
              Kawal had tempahan harian (elak sistem overbooked ketika Raya) dan urus tarikh cuti khas kedai.
            </p>
          </div>

          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-900 border border-gray-800 hover:border-gray-700 text-gray-300 hover:text-white text-sm font-semibold transition-all self-start sm:self-auto"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="space-y-6">
            <div className="h-40 bg-gray-900 rounded-2xl animate-pulse" />
            <div className="h-64 bg-gray-900 rounded-2xl animate-pulse" />
          </div>
        ) : (
          <div className="space-y-8">
            {/* 1. STATUS OPERASI & KONTROL KUOTA HARIAN */}
            <div className="grid md:grid-cols-3 gap-6">
              {/* Card 1: Kuota Harian */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 relative overflow-hidden shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Had Tempahan Sehari</span>
                  <div className="w-9 h-9 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center">
                    <Users className="h-5 w-5 text-amber-400" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-amber-400">{settings.dailyQuota}</span>
                  <span className="text-sm font-semibold text-gray-400">pelanggan / hari</span>
                </div>
                <p className="text-xs text-gray-500 mt-3 leading-relaxed">
                  Jika tempahan mencapai had ini, sistem secara automatik menutup slot dan menghalang pelanggan baru daripada menempah pada tarikh tersebut.
                </p>
              </div>

              {/* Card 2: Status Buka / Tutup */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 relative overflow-hidden shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Status Kedai</span>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
                    settings.isEmergencyClose
                      ? 'bg-red-500/10 border-red-500/20 text-red-400'
                      : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  }`}>
                    {settings.isEmergencyClose ? <ShieldAlert className="h-5 w-5" /> : <CheckCircle className="h-5 w-5" />}
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className={`text-2xl font-black ${settings.isEmergencyClose ? 'text-red-400' : 'text-emerald-400'}`}>
                    {settings.isEmergencyClose ? '🔴 DITUTUP KECEMASAN' : '🟢 DIBUKA SEPERTI BIASA'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-3 leading-relaxed">
                  {settings.isEmergencyClose
                    ? 'Pelanggan tidak dapat menempah sebarang tarikh sehingga mod kecemasan dimatikan.'
                    : 'Sistem dibuka untuk menerima tempahan mengikut jadual waktu operasi.'}
                </p>
              </div>

              {/* Card 3: Cuti Khas Terjadual */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 relative overflow-hidden shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Cuti Khas Ditetapkan</span>
                  <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-purple-400" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-purple-400">{closedDates.length}</span>
                  <span className="text-sm font-semibold text-gray-400">tarikh cuti</span>
                </div>
                <p className="text-xs text-gray-500 mt-3 leading-relaxed">
                  Pelanggan yang memilih tarikh ini akan dipaparkan Popup Notis Penutupan Kedai (cth: Musim Perayaan).
                </p>
              </div>
            </div>

            {/* 2. FORM KEMASKINI KUOTA & EMERGENCY CLOSE */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center gap-2 mb-6">
                <Sparkles className="h-5 w-5 text-amber-400" />
                <h2 className="text-lg font-bold">Konfigurasi Kuota & Mod Kecemasan</h2>
              </div>

              <form onSubmit={handleSaveSettings} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Kuota Input */}
                  <div>
                    <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
                      Had Maksimum Tempahan Harian (Daily Quota)
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min="1"
                        max="200"
                        value={settings.dailyQuota}
                        onChange={(e) => setSettings({ ...settings, dailyQuota: parseInt(e.target.value) || 1 })}
                        className="w-32 bg-gray-950 border border-gray-800 focus:border-amber-400 rounded-xl px-4 py-3 text-lg font-bold text-white outline-none"
                      />
                      <div className="flex gap-2">
                        {[15, 20, 25, 30].map((preset) => (
                          <button
                            type="button"
                            key={preset}
                            onClick={() => setSettings({ ...settings, dailyQuota: preset })}
                            className={`px-3 py-2 text-xs font-bold rounded-xl border transition-all ${
                              settings.dailyQuota === preset
                                ? 'bg-amber-400 text-gray-950 border-amber-400 shadow-sm'
                                : 'bg-gray-800 text-gray-300 border-gray-700 hover:border-gray-600'
                            }`}
                          >
                            {preset}
                          </button>
                        ))}
                      </div>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-2">
                      💡 Tip: Ketika musim perayaan (Raya), tetapkan sekitar 15-20 orang sehari agar barber tidak penat & sistem kekal lancar tanpa isu kesesakan!
                    </p>
                  </div>

                  {/* Mod Tutup Kecemasan */}
                  <div>
                    <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
                      Tutup Kedai Serta-merta (Emergency Close)
                    </label>
                    <div className="flex items-center gap-4 p-3 bg-gray-950 border border-gray-800 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setSettings({ ...settings, isEmergencyClose: !settings.isEmergencyClose })}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          settings.isEmergencyClose ? 'bg-red-500' : 'bg-gray-800'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            settings.isEmergencyClose ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                      <span className="text-xs font-bold text-gray-300">
                        {settings.isEmergencyClose
                          ? '🚨 Kedai ditutup sekarang (Semua slot disekat)'
                          : '✅ Kedai beroperasi seperti biasa'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Notis Pengumuman / Alasan */}
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
                    Mesej Notis Paparan Pelanggan (Jika Ditutup)
                  </label>
                  <input
                    type="text"
                    value={settings.noticeMessage || ''}
                    onChange={(e) => setSettings({ ...settings, noticeMessage: e.target.value })}
                    placeholder="Contoh: Kedai ditutup sementara waktu atas urusan renovasi."
                    className="w-full bg-gray-950 border border-gray-800 focus:border-amber-400 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 outline-none"
                  />
                  <p className="text-[11px] text-gray-500 mt-1">
                    Mesej ini akan dipaparkan dalam Popup Modal kepada pelanggan jika kedai ditutup secara kecemasan.
                  </p>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={savingSettings}
                    className="flex items-center gap-2 bg-amber-400 hover:bg-amber-500 text-gray-950 font-black px-6 py-3 rounded-xl text-sm transition-all shadow-lg shadow-amber-400/10 active:scale-95 disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                    {savingSettings ? 'Menyimpan...' : 'Simpan Konfigurasi'}
                  </button>
                </div>
              </form>
            </div>

            {/* 3. PENGURUSAN TARIKH CUTI KHAS / MUSIM PERAYAAN (CLOSED DATES) */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
                <div>
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-amber-400" />
                    Jadualkan Cuti Khas & Musim Raya
                  </h2>
                  <p className="text-xs text-gray-400 mt-1">
                    Tetapkan tarikh tertentu di mana kedai tidak beroperasi (contoh: 1 Syawal, Hari Raya Haji, atau cuti peribadi).
                  </p>
                </div>
              </div>

              {/* Form Tambah Tarikh Cuti */}
              <form onSubmit={handleAddClosedDate} className="bg-gray-950 border border-gray-800 rounded-xl p-4 mb-6">
                <div className="grid sm:grid-cols-5 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">
                      Pilih Tarikh Tutup
                    </label>
                    <input
                      type="date"
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      className="w-full bg-gray-900 border border-gray-800 focus:border-amber-400 rounded-xl px-3 py-2 text-sm text-white outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">
                      Sebab Cuti / Notis Pop-up
                    </label>
                    <input
                      type="text"
                      value={newReason}
                      onChange={(e) => setNewReason(e.target.value)}
                      placeholder="cth: Cuti Raya Aidilfitri / Renovasi"
                      className="w-full bg-gray-900 border border-gray-800 focus:border-amber-400 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 outline-none"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      disabled={addingDate}
                      className="w-full flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-500 text-gray-950 font-bold px-4 py-2.5 rounded-xl text-sm transition-all shadow-md active:scale-95 disabled:opacity-50"
                    >
                      <Plus className="h-4 w-4" />
                      {addingDate ? 'Menambah...' : 'Tutup Tarikh Ini'}
                    </button>
                  </div>
                </div>
              </form>

              {/* Senarai Tarikh Cuti Ditetapkan */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Senarai Tarikh Cuti Ditetapkan ({closedDates.length})
                </h3>

                {closedDates.length === 0 ? (
                  <div className="text-center py-8 border border-dashed border-gray-800 rounded-xl text-gray-500 text-xs">
                    Tiada cuti khas dijadualkan. Kedai dibuka mengikut jadual mingguan biasa.
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-3">
                    {closedDates.map((item) => (
                      <div
                        key={item.id || item.date}
                        className="flex items-center justify-between p-3.5 bg-gray-950 border border-gray-800/80 rounded-xl hover:border-gray-700 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/20 flex flex-col items-center justify-center text-red-400">
                            <span className="text-[10px] uppercase font-bold leading-none">
                              {new Date(item.date).toLocaleDateString('ms-MY', { month: 'short' })}
                            </span>
                            <span className="text-base font-black leading-none mt-0.5">
                              {item.date.split('-')[2]}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white">{item.date}</p>
                            <p className="text-xs text-amber-400/90 font-medium">{item.reason}</p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteClosedDate(item.date)}
                          className="px-2.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/40 text-xs font-bold flex items-center gap-1 transition-all"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Buka Semula
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 4. SANDARAN PANGKALAN DATA TERENKRIPSI (AES-256 DATABASE BACKUP) */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <Database className="h-5 w-5 text-amber-400" />
                    Sandaran Pangkalan Data Terenkripsi (AES-256)
                  </h2>
                  <p className="text-xs text-gray-400 mt-1 max-w-2xl leading-relaxed">
                    Muat turun sandaran penuh pangkalan data PostgreSQL (pengguna, tempahan, staf, dan servis). Fail disulitkan menggunakan algoritma piawaian industri <span className="text-amber-400 font-bold">AES-256-CBC</span> demi melindungi privasi maklumat pelanggan daripada kebocoran.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadBackup}
                  disabled={downloadingBackup}
                  className="flex items-center gap-2 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-gray-950 font-black px-6 py-3 rounded-xl text-sm transition-all shadow-lg shadow-amber-400/10 active:scale-95 disabled:opacity-50 shrink-0 self-start sm:self-auto"
                >
                  <Download className={`h-4 w-4 ${downloadingBackup ? 'animate-bounce' : ''}`} />
                  {downloadingBackup ? 'Menjana Sandaran...' : 'Muat Turun Sandaran (.enc)'}
                </button>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-800/80 flex flex-wrap items-center gap-4 text-[11px] text-gray-500">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  Format: Binary Cipher Encrypted (.enc)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-400" />
                  Skrip CLI Tempatan: <code className="text-gray-400 font-mono">node scripts/backup-db.js</code>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-purple-400" />
                  Skrip Nyahsulit: <code className="text-gray-400 font-mono">node scripts/restore-db.js</code>
                </span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
