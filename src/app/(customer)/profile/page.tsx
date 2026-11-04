'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Scissors, KeyRound, ShieldCheck, User, Mail, Phone,
  Lock, ArrowLeft, CheckCircle2, AlertCircle
} from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

export default function ProfileSettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  if (status === 'unauthenticated') {
    router.push('/login')
    return null
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setSuccessMsg('')

    if (newPassword !== confirmPassword) {
      toast({
        title: 'Kata laluan tidak sepadan',
        description: 'Sila pastikan kata laluan baru dan pengesahan adalah sama.',
        variant: 'destructive',
      })
      return
    }

    if (newPassword.length < 6) {
      toast({
        title: 'Kata laluan terlalu pendek',
        description: 'Kata laluan mestilah sekurang-kurangnya 6 aksara.',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/user/change-password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast({
          title: 'Gagal menukar kata laluan',
          description: data.error || 'Kata laluan semasa tidak tepat.',
          variant: 'destructive',
        })
      } else {
        toast({ title: 'Berjaya! 🔒', description: 'Kata laluan peribadi anda telah dikemaskini.' })
        setSuccessMsg('Kata laluan anda telah berjaya ditukar!')
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      }
    } finally {
      setLoading(false)
    }
  }

  // Tentukan destinasi butang Kembali ikut role
  const userRole = (session?.user as any)?.role
  const backUrl = userRole === 'ADMIN' ? '/dashboard' : userRole === 'BARBER' ? '/barber' : '/booking'

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-12">
      {/* Navbar Ringkas */}
      <nav className="border-b border-gray-800 bg-gray-900/60 backdrop-blur-md px-6 py-4 sticky top-0 z-50">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Scissors className="h-6 w-6 text-amber-400" />
            <span className="font-extrabold text-lg">Hanscut Barbershop</span>
          </Link>

          <Link
            href={backUrl}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white bg-gray-800/80 px-3 py-1.5 rounded-xl border border-gray-700 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Kembali
          </Link>
        </div>
      </nav>

      {/* Main Container */}
      <div className="max-w-2xl mx-auto px-5 mt-10">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold flex items-center gap-2.5">
            <ShieldCheck className="h-8 w-8 text-amber-400" /> Keselamatan & Privasi Akaun
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Urus maklumat profil dan tukar kata laluan peribadi anda di sini
          </p>
        </div>

        {/* Kad Info Pengguna */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-8 shadow-xl">
          <h2 className="text-xs uppercase tracking-wider font-bold text-gray-500 mb-4">Profil Anda</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-3 bg-gray-800/40 p-3.5 rounded-xl border border-gray-800/80">
              <User className="h-5 w-5 text-amber-400 shrink-0" />
              <div className="overflow-hidden">
                <span className="text-[11px] text-gray-400 block">Nama Penuh</span>
                <span className="font-bold text-white truncate block">{session?.user?.name || '-'}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-gray-800/40 p-3.5 rounded-xl border border-gray-800/80">
              <Mail className="h-5 w-5 text-amber-400 shrink-0" />
              <div className="overflow-hidden">
                <span className="text-[11px] text-gray-400 block">Alamat Email</span>
                <span className="font-bold text-white truncate block">{session?.user?.email || '-'}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-800/80 flex items-center justify-between text-xs">
            <span className="text-gray-500">Peranan Akaun</span>
            <span className="bg-amber-400/10 border border-amber-400/30 text-amber-400 px-3 py-1 rounded-full font-bold">
              {userRole || 'CUSTOMER'}
            </span>
          </div>
        </div>

        {/* Kad Borang Tukar Password */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 sm:p-8 shadow-2xl">
          <div className="flex items-center gap-2 mb-6 border-b border-gray-800 pb-4">
            <KeyRound className="h-5 w-5 text-amber-400" />
            <h2 className="text-lg font-bold">Tukar Kata Laluan Peribadi</h2>
          </div>

          {successMsg && (
            <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-sm flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Kata Laluan Semasa *
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Masukkan kata laluan semasa anda"
                  className="w-full bg-gray-800/80 border border-gray-700/80 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Kata Laluan Baru *
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 aksara"
                  className="w-full bg-gray-800/80 border border-gray-700/80 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Sahkan Kata Laluan Baru *
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulang kata laluan baru anda"
                  className="w-full bg-gray-800/80 border border-gray-700/80 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-amber-400 hover:bg-amber-300 text-gray-950 font-black py-3.5 rounded-xl text-sm transition-all shadow-lg shadow-amber-500/10 active:scale-[0.99] disabled:opacity-50"
              >
                {loading ? 'Mengemaskini...' : 'Simpan Kata Laluan Baru'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
