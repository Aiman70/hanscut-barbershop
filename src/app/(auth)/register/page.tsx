// src/app/(auth)/register/page.tsx - Hanscut Online Register
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Scissors, ArrowLeft, User, Mail, Phone, Lock } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

export default function RegisterPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (form.password !== form.confirmPassword) {
      toast({
        title: 'Kata laluan tidak sepadan',
        description: 'Sila pastikan kata laluan dan pengesahan kata laluan adalah sama.',
        variant: 'destructive',
      })
      return
    }

    if (form.password.length < 6) {
      toast({
        title: 'Kata laluan terlalu pendek',
        description: 'Kata laluan mestilah sekurang-kurangnya 6 aksara.',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          password: form.password,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast({
          title: 'Pendaftaran gagal',
          description: data.error,
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Akaun berjaya dibuat! 🎉',
          description: 'Sila log masuk untuk meneruskan temujanji anda',
        })
        router.push('/login')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-4 py-8 selection:bg-amber-400 selection:text-gray-950">
      <div className="w-full max-w-md space-y-6">
        <div>
          <Link href="/">
            <Button variant="secondary" size="sm" leftIcon={<ArrowLeft className="h-3.5 w-3.5" />}>
              Kembali ke Laman Utama
            </Button>
          </Link>
        </div>

        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <div className="p-2.5 bg-amber-400/10 border border-amber-400/20 rounded-2xl group-hover:bg-amber-400/20 transition-all">
              <Scissors className="h-6 w-6 text-amber-400" />
            </div>
            <span className="text-2xl font-black tracking-tight text-white">
              Hanscut <span className="text-amber-400">Barbershop</span>
            </span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-white pt-2">Daftar Akaun Ahli</h1>
          <p className="text-xs sm:text-sm text-gray-400">Sertai kami dan nikmati kemudahan tempahan slot online pantas</p>
        </div>

        <Card className="p-6 sm:p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">Nama Penuh *</label>
              <Input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Muhammad Ali"
                leftIcon={<User className="h-4 w-4" />}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">Alamat Email *</label>
              <Input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="nama@email.com"
                leftIcon={<Mail className="h-4 w-4" />}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">No. Telefon</label>
              <Input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="012-3456789"
                leftIcon={<Phone className="h-4 w-4" />}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">Kata Laluan *</label>
              <Input
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Min. 6 aksara"
                leftIcon={<Lock className="h-4 w-4" />}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">Sahkan Kata Laluan *</label>
              <Input
                type="password"
                required
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                placeholder="Ulang kata laluan"
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
                Daftar Akaun
              </Button>
            </div>
          </form>

          <p className="mt-5 text-center text-xs text-gray-400">
            Sudah ada akaun?{' '}
            <Link href="/login" className="text-amber-400 hover:underline font-bold">
              Log masuk
            </Link>
          </p>
        </Card>
      </div>
    </div>
  )
}
