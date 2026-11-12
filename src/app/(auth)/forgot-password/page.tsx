'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Scissors, Mail, KeyRound, Lock, Eye, EyeOff,
  ArrowRight, CheckCircle2, MessageCircle, ArrowLeft, Phone
} from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const { toast } = useToast()

  // Step 1: Minta OTP (Emel / No Tel)
  // Step 2: Masukkan OTP & Kata Laluan Baru
  const [step, setStep] = useState<1 | 2>(1)
  const [identifier, setIdentifier] = useState('')
  const [verifiedEmail, setVerifiedEmail] = useState('')
  const [maskedEmail, setMaskedEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const [loading, setLoading] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  // Countdown timer untuk hantar semula OTP
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [cooldown])

  // 1. Hantar Kod OTP ke Emel Berdaftar
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!identifier.trim()) return

    setLoading(true)
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: identifier.trim() }),
      })

      const data = await res.json()
      if (res.ok) {
        toast({
          title: 'Kod OTP Dihantar! 📬',
          description: data.message,
        })
        if (data.email) {
          setVerifiedEmail(data.email)
        } else {
          setVerifiedEmail(identifier.trim())
        }
        if (data.maskedEmail) {
          setMaskedEmail(data.maskedEmail)
        }
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
        title: 'Ralat Sambungan',
        description: 'Sila pastikan sambungan internet anda stabil dan cuba sebentar lagi.',
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
          email: verifiedEmail || identifier.trim(),
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
        setTimeout(() => {
          router.push('/login')
        }, 1500)
      } else {
        toast({
          title: 'Pengesahan Gagal',
          description: data.error || 'Gagal menetapkan kata laluan baru.',
          variant: 'destructive',
        })
      }
    } catch {
      toast({
        title: 'Ralat Pelayan',
        description: 'Ralat sambungan pelayan. Sila cuba lagi.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-zinc-100 flex items-center justify-center px-4 py-12 relative">
      <div className="w-full max-w-md">
        {/* Butang Kembali ke Login */}
        <div className="mb-5">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-xs font-medium text-zinc-400 hover:text-amber-400 transition-colors bg-[#121215] border border-white/5 px-3 py-1.5 rounded-lg"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Kembali ke Log Masuk
          </Link>
        </div>

        {/* Card Form */}
        <Card className="bg-[#121215] border-white/10 shadow-2xl overflow-hidden">
          <CardHeader className="text-center pb-4 pt-6">
            <div className="mx-auto w-12 h-12 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center mb-3">
              <Scissors className="h-6 w-6 text-amber-400" />
            </div>
            <CardTitle className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {step === 1 ? 'Lupa Kata Laluan?' : 'Pengesahan Kod OTP'}
            </CardTitle>
            <CardDescription className="text-zinc-400 text-xs sm:text-sm mt-1">
              {step === 1
                ? 'Masukkan alamat emel atau nombor telefon berdaftar anda untuk menerima kod pengesahan.'
                : `Kod OTP 6-digit telah dihantar ke: ${maskedEmail || verifiedEmail}`}
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 pt-2">
            {/* STEP 1: Masukkan Emel atau No. Telefon */}
            {step === 1 && (
              <form onSubmit={handleRequestOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 uppercase tracking-wider mb-1.5">
                    Emel atau No. Telefon Akaun
                  </label>
                  <Input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="nama@gmail.com atau 0123456789"
                    leftIcon={identifier.match(/^[0-9+]/) ? <Phone className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
                    autoFocus
                  />
                  <p className="text-[11px] text-zinc-500 mt-1.5">
                    💡 Anda boleh guna nombor telefon yang didaftarkan semasa tempahan.
                  </p>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  isLoading={loading}
                  disabled={!identifier.trim()}
                  className="w-full mt-2 font-bold"
                >
                  Dapatkan Kod OTP
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </form>
            )}

            {/* STEP 2: Masukkan OTP & Kata Laluan Baru */}
            {step === 2 && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                {/* Input OTP 6-Digit */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-medium text-zinc-300 uppercase tracking-wider">
                      Kod OTP 6-Digit
                    </label>
                    <span className="text-[11px] text-amber-400/90 font-medium">
                      ⏱️ Sah 10 minit
                    </span>
                  </div>
                  <Input
                    type="text"
                    required
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="Contoh: 849201"
                    leftIcon={<KeyRound className="h-4 w-4 text-amber-400" />}
                    className="text-center font-mono font-bold text-lg tracking-[0.25em] text-amber-400"
                    autoFocus
                  />
                </div>

                {/* Kata Laluan Baru */}
                <div>
                  <label className="block text-xs font-medium text-zinc-300 uppercase tracking-wider mb-1.5">
                    Kata Laluan Baru
                  </label>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 6 aksara"
                      leftIcon={<Lock className="h-4 w-4" />}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 p-1"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Sahkan Kata Laluan Baru */}
                <div>
                  <label className="block text-xs font-medium text-zinc-300 uppercase tracking-wider mb-1.5">
                    Sahkan Kata Laluan Baru
                  </label>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ulang kata laluan baru"
                    leftIcon={<Lock className="h-4 w-4" />}
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  isLoading={loading}
                  disabled={otp.length !== 6 || !newPassword || !confirmPassword}
                  className="w-full mt-2 font-bold"
                >
                  <CheckCircle2 className="h-4 w-4 mr-1.5" />
                  Sahkan & Tukar Kata Laluan
                </Button>

                {/* Hantar Semula Kod OTP */}
                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={handleRequestOtp}
                    disabled={cooldown > 0 || loading}
                    className="text-xs text-zinc-400 hover:text-amber-400 transition-colors disabled:opacity-40"
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

            {/* Bantuan WhatsApp Alternatif */}
            <div className="mt-6 pt-5 border-t border-white/5 text-center">
              <p className="text-xs text-zinc-500 mb-2.5">
                Ada masalah menerima kod OTP atau emel?
              </p>
              <a
                href="https://wa.me/601119854499?text=Salam%20Hanscut%20Barbershop,%20saya%20perlukan%20bantuan%20untuk%20reset%20kata%20laluan%20akaun%20saya."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs font-medium transition-colors"
              >
                <MessageCircle className="h-4 w-4" />
                Bantuan Terus melalui WhatsApp
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
