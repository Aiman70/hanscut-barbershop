'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Scissors, Mail, KeyRound, Lock, Eye, EyeOff,
  ArrowRight, CheckCircle2, RefreshCw
} from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const { toast } = useToast()

  // Step 1: Request OTP, Step 2: Enter OTP & New Password
  const [step, setStep] = useState<1 | 2>(1)
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const [loading, setLoading] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  // Countdown timer for resend OTP
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [cooldown])

  // 1. Hantar Kod OTP ke Gmail
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setLoading(true)
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()
      if (res.ok) {
        toast({
          title: 'Kod OTP Dihantar! 📬',
          description: data.message,
        })
        setStep(2)
        setCooldown(60) // 60s cooldown sebelum boleh minta semula
      } else {
        toast({
          title: 'Perhatian',
          description: data.error || 'Gagal menghantar kod OTP.',
          variant: 'destructive',
        })
      }
    } catch {
      toast({
        title: 'Ralat',
        description: 'Ralat sambungan pelayan. Sila cuba sebentar lagi.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  // 2. Sahkan OTP & Kemaskini Kata Laluan
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword.length < 6) {
      toast({
        title: 'Kata laluan terlalu pendek',
        description: 'Kata laluan mestilah sekurang-kurangnya 6 aksara.',
        variant: 'destructive',
      })
      return
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: 'Kata laluan tidak sepadan',
        description: 'Sila pastikan kedua-dua kata laluan adalah sama.',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          otp,
          newPassword,
        }),
      })

      const data = await res.json()
      if (res.ok) {
        toast({
          title: 'Berjaya Tukar Kata Laluan! 🎉',
          description: data.message,
        })
        // Redirect ke laman log masuk
        setTimeout(() => {
          router.push('/login')
        }, 1500)
      } else {
        toast({
          title: 'Gagal',
          description: data.error || 'Gagal menetapkan kata laluan.',
          variant: 'destructive',
        })
      }
    } catch {
      toast({
        title: 'Ralat',
        description: 'Ralat sambungan pelayan.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none -z-10" />

      <div className="w-full max-w-md">
        {/* Butang Kembali ke Login */}
        <div className="mb-6">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-white transition-colors bg-gray-900 border border-gray-800 px-3.5 py-2 rounded-xl"
          >
            ← Kembali ke Log Masuk
          </Link>
        </div>

        {/* Header Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-amber-400/10 border border-amber-400/20 rounded-2xl mb-4">
            <Scissors className="h-8 w-8 text-amber-400" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black">
            {step === 1 ? 'Lupa Kata Laluan?' : 'Pengesahan Kod OTP'}
          </h1>
          <p className="text-gray-400 text-xs sm:text-sm mt-1.5 max-w-xs mx-auto">
            {step === 1
              ? 'Masukkan emel berdaftar anda untuk menerima kod pengesahan 6-digit melalui Gmail.'
              : `Kod pengesahan telah dihantar ke: ${email}`}
          </p>
        </div>

        {/* Card Form */}
        <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative">
          {/* Step 1: Masukkan Emel */}
          {step === 1 && (
            <form onSubmit={handleRequestOtp} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
                  Alamat Emel Akaun
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@gmail.com"
                    className="w-full bg-gray-950 border border-gray-800 focus:border-amber-400 rounded-xl pl-12 pr-4 py-3 text-sm text-white placeholder-gray-600 outline-none transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !email}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-gray-950 font-black py-3.5 rounded-xl text-sm transition-all shadow-lg shadow-amber-400/10 active:scale-95 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Menghantar Kod OTP...
                  </>
                ) : (
                  <>
                    Hantar Kod OTP ke Gmail
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Step 2: Masukkan OTP & Kata Laluan Baru */}
          {step === 2 && (
            <form onSubmit={handleResetPassword} className="space-y-5">
              {/* Input OTP 6-Digit */}
              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
                  Kod OTP 6-Digit (Gmail)
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-amber-400" />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="Contoh: 849201"
                    className="w-full bg-gray-950 border border-amber-400/40 focus:border-amber-400 rounded-xl pl-12 pr-4 py-3.5 text-lg font-black tracking-widest text-amber-400 placeholder-gray-700 outline-none font-mono"
                  />
                </div>
                <p className="text-[11px] text-gray-500 mt-1.5 flex items-center gap-1">
                  ⏱️ Kod OTP sah selama 10 minit sahaja.
                </p>
              </div>

              {/* Kata Laluan Baru */}
              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
                  Kata Laluan Baru
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 6 aksara"
                    className="w-full bg-gray-950 border border-gray-800 focus:border-amber-400 rounded-xl pl-12 pr-12 py-3 text-sm text-white placeholder-gray-600 outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Sahkan Kata Laluan Baru */}
              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
                  Sahkan Kata Laluan Baru
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ulang kata laluan baru"
                    className="w-full bg-gray-950 border border-gray-800 focus:border-amber-400 rounded-xl pl-12 pr-4 py-3 text-sm text-white placeholder-gray-600 outline-none transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || otp.length !== 6 || !newPassword}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-gray-950 font-black py-3.5 rounded-xl text-sm transition-all shadow-lg shadow-amber-400/10 active:scale-95 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Menetapkan Semula Kata Laluan...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Tukar Kata Laluan Sekarang
                  </>
                )}
              </button>

              {/* Hantar Semula Kod OTP */}
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={handleRequestOtp}
                  disabled={cooldown > 0 || loading}
                  className="text-xs font-bold text-gray-400 hover:text-amber-400 transition-colors disabled:opacity-50"
                >
                  {cooldown > 0 ? (
                    `Hantar semula kod OTP dalam masa ${cooldown}s`
                  ) : (
                    'Belum terima kod? Klik untuk hantar semula'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer Info */}
        <div className="text-center mt-6">
          <p className="text-xs text-gray-500">
            Perlukan bantuan lanjut? Sila hubungi pihak kedai kami.
          </p>
        </div>
      </div>
    </div>
  )
}
