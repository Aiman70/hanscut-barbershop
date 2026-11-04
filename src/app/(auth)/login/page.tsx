// src/app/(auth)/login/page.tsx
'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Scissors, Eye, EyeOff } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({ email: '', password: '' })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await signIn('credentials', {
        email: form.email,
        password: form.password,
        redirect: false,
      })

      if (result?.error) {
        if (result.error === 'account_locked' || result.error.includes('account_locked')) {
          toast({
            title: '🚨 Akaun Disekat Sementara!',
            description: 'Terlalu banyak percubaan kata laluan gagal berturut-turut. Akaun ini disekat selama 5 minit demi keselamatan (Anti-Brute Force).',
            variant: 'destructive',
          })
        } else {
          toast({
            title: 'Log masuk gagal',
            description: 'Email atau kata laluan tidak betul. (Maksimum 5 percubaan sebelum akaun disekat)',
            variant: 'destructive',
          })
        }
      } else {
       
  toast({ title: 'Berjaya log masuk! 🎉' })

  // Semak role pengguna yang tengah login
  const sessionRes = await fetch('/api/auth/session')
  const sessionData = await sessionRes.json()
  const role = sessionData?.user?.role

  if (role === 'ADMIN') {
    router.push('/dashboard')
  } else if (role === 'BARBER') {
    router.push('/barber')
  } else {
    router.push('/booking')
  }

  router.refresh()
}
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
                {/* Butang Kembali ke Laman Utama */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors bg-gray-900 border border-gray-800 px-3.5 py-2 rounded-xl"
          >
            ← Kembali ke Laman Utama
          </Link>
        </div>
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-white">
            <Scissors className="h-8 w-8 text-amber-400" />
            <span className="text-2xl font-bold">Hanscut Barbershop</span>
          </Link>
          <h1 className="text-3xl font-bold text-white mt-6 mb-2">Log Masuk</h1>
          <p className="text-gray-400">Masuk untuk urus tempahan anda</p>
        </div>

        {/* Form */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="nama@email.com"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-amber-400 transition-colors"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-300">
                  Kata Laluan
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors"
                >
                  Lupa kata laluan?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-amber-400 transition-colors pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-400 text-gray-950 py-3 rounded-lg font-bold text-lg hover:bg-amber-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sedang log masuk...' : 'Log Masuk'}
            </button>
          </form>

          <p className="mt-6 text-center text-gray-400">
            Belum ada akaun?{' '}
            <Link href="/register" className="text-amber-400 hover:text-amber-300 font-semibold">
              Daftar sekarang
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
