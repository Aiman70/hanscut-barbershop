// src/app/(customer)/profile/page.tsx - Hanscut Online Profile & Security
'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Scissors, KeyRound, ShieldCheck, User, Mail,
  Lock, ArrowLeft, CheckCircle2
} from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

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

  const userRole = (session?.user as any)?.role
  const backUrl = userRole === 'ADMIN' ? '/dashboard' : userRole === 'BARBER' ? '/barber' : '/booking'

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-28 md:pb-16 selection:bg-amber-400 selection:text-gray-950">
      {/* Navbar Header */}
      <nav className="border-b border-gray-800 bg-gray-950/90 backdrop-blur-md px-4 sm:px-6 py-3.5 sticky top-0 z-40 select-none">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Scissors className="h-5 w-5 text-amber-400" />
            <span className="font-extrabold text-base text-white">Hanscut Barbershop</span>
          </Link>

          <Link href={backUrl}>
            <Button variant="secondary" size="sm" leftIcon={<ArrowLeft className="h-3.5 w-3.5" />}>
              Kembali
            </Button>
          </Link>
        </div>
      </nav>

      {/* Main Container */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10 space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="h-6 w-6 text-amber-400" />
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Keselamatan & Privasi Akaun
            </h1>
          </div>
          <p className="text-gray-400 text-xs sm:text-sm">
            Urus maklumat profil dan tukar kata laluan peribadi anda di sini.
          </p>
        </div>

        {/* Kad Info Pengguna */}
        <Card className="p-5 sm:p-6 shadow-md space-y-4">
          <h2 className="text-xs uppercase tracking-wider font-bold text-gray-400">Profil Anda</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
            <div className="flex items-center gap-3 bg-gray-950 p-3 rounded-xl border border-gray-800">
              <User className="h-5 w-5 text-amber-400 shrink-0" />
              <div className="overflow-hidden">
                <span className="text-[11px] text-gray-500 block">Nama Penuh</span>
                <span className="font-bold text-white truncate block">{session?.user?.name || '-'}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-gray-950 p-3 rounded-xl border border-gray-800">
              <Mail className="h-5 w-5 text-amber-400 shrink-0" />
              <div className="overflow-hidden">
                <span className="text-[11px] text-gray-500 block">Alamat Email</span>
                <span className="font-bold text-white truncate block">{session?.user?.email || '-'}</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-gray-800 flex items-center justify-between text-xs">
            <span className="text-gray-400">Peranan Akaun</span>
            <Badge variant="amber" size="sm">
              {userRole || 'CUSTOMER'}
            </Badge>
          </div>
        </Card>

        {/* Kad Borang Tukar Password */}
        <Card className="p-5 sm:p-7 shadow-lg">
          <div className="flex items-center gap-2 mb-5 border-b border-gray-800 pb-3">
            <KeyRound className="h-5 w-5 text-amber-400" />
            <h2 className="text-base sm:text-lg font-bold text-white">Tukar Kata Laluan Peribadi</h2>
          </div>

          {successMsg && (
            <div className="mb-5 p-3.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs sm:text-sm flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Kata Laluan Semasa *
              </label>
              <Input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Masukkan kata laluan semasa anda"
                leftIcon={<Lock className="h-4 w-4" />}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Kata Laluan Baru *
              </label>
              <Input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 6 aksara"
                leftIcon={<Lock className="h-4 w-4" />}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Sahkan Kata Laluan Baru *
              </label>
              <Input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ulang kata laluan baru anda"
                leftIcon={<Lock className="h-4 w-4" />}
              />
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={loading}
                className="w-full min-h-[48px]"
              >
                Simpan Kata Laluan Baru
              </Button>
            </div>
          </form>
        </Card>
      </main>
    </div>
  )
}
