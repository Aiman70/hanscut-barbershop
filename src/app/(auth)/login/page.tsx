// src/app/(auth)/login/page.tsx - Hanscut Online Login
'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Scissors, Eye, EyeOff, ArrowLeft, Mail, Lock } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

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
            description: 'Terlalu banyak percubaan kata laluan gagal. Akaun ini disekat selama 5 minit demi keselamatan.',
            variant: 'destructive',
          })
        } else {
          toast({
            title: 'Log masuk gagal',
            description: 'Email atau kata laluan tidak tepat.',
            variant: 'destructive',
          })
        }
      } else {
        toast({ title: 'Berjaya log masuk! 🎉' })

        // Semak peranan pengguna
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
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-4 selection:bg-amber-400 selection:text-gray-950">
      <div className="w-full max-w-md space-y-6">
        {/* Butang Kembali */}
        <div>
          <Link href="/">
            <Button variant="secondary" size="sm" leftIcon={<ArrowLeft className="h-3.5 w-3.5" />}>
              Kembali ke Laman Utama
            </Button>
          </Link>
        </div>

        {/* Logo & Tajuk */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <div className="p-2.5 bg-amber-400/10 border border-amber-400/20 rounded-2xl group-hover:bg-amber-400/20 transition-all">
              <Scissors className="h-6 w-6 text-amber-400" />
            </div>
            <span className="text-2xl font-black tracking-tight text-white">
              Hanscut <span className="text-amber-400">Barbershop</span>
            </span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-white pt-2">Log Masuk Akaun</h1>
          <p className="text-xs sm:text-sm text-gray-400">Masuk untuk urus temujanji dan semak status kad VIP anda</p>
        </div>

        {/* Form Card (Shared Card Component) */}
        <Card className="p-6 sm:p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Alamat Email *
              </label>
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
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-gray-300">
                  Kata Laluan *
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-semibold text-amber-400 hover:underline"
                >
                  Lupa kata laluan?
                </Link>
              </div>

              <Input
                type={showPassword ? 'text' : 'password'}
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                leftIcon={<Lock className="h-4 w-4" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1 text-gray-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
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
                Log Masuk
              </Button>
            </div>
          </form>

          <p className="mt-6 text-center text-xs text-gray-400">
            Belum ada akaun?{' '}
            <Link href="/register" className="text-amber-400 hover:underline font-bold">
              Daftar sekarang
            </Link>
          </p>
        </Card>
      </div>
    </div>
  )
}
