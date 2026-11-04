'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Scissors, Award, Sparkles, Gift, CheckCircle2,
  Clock, ArrowRight, ShieldCheck, Flame, Zap
} from 'lucide-react'
import { CustomerNav } from '@/components/customer-nav'

interface MembershipData {
  totalCuts: number
  currentCycleStamps: number
  freeCutsEarned: number
  cutsRemaining: number
  tier: string
  discount: string
  favoriteBarber: string
  lastCutDate: string | null
}

export default function MembershipCardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [data, setData] = useState<MembershipData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }
    if (status === 'authenticated') {
      fetch('/api/user/membership')
        .then((r) => r.json())
        .then(setData)
        .finally(() => setLoading(false))
    }
  }, [status])

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-16 selection:bg-amber-400 selection:text-gray-950">
      <CustomerNav />

      <main className="max-w-4xl mx-auto px-5 pt-8">
        {/* Header */}
        <div className="text-center max-w-xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 bg-amber-400/10 border border-amber-400/20 px-3.5 py-1.5 rounded-full text-xs font-bold text-amber-400 mb-3">
            <Sparkles className="h-3.5 w-3.5" /> Program Kesetiaan Hanscut Barbershop VIP
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
            Kad Loyalty & Ganjaran Anda
          </h1>
          <p className="text-gray-400 text-sm mt-2">
            Setiap kali selesai gunting rambut, anda automatik dapat 1 cop. Kumpul 10 cop untuk tebus <span className="text-amber-400 font-bold">Cuci Rambut / Pakej Percuma</span>!
          </p>
        </div>

        {/* 💳 KAD MEMBERSHIP VIP HITAM-EMAS (Digital VIP Card) */}
        <div className="max-w-lg mx-auto mb-12">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-900 via-neutral-900 to-black p-7 sm:p-8 border border-amber-500/30 shadow-2xl shadow-amber-500/10 group">
            {/* Background Glow Effect */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -z-0" />
            <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-yellow-500/10 rounded-full blur-2xl pointer-events-none -z-0" />

            {/* Kad Atas: Logo & Tier */}
            <div className="relative z-10 flex items-start justify-between mb-8">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-400 text-gray-950 rounded-xl shadow-md">
                  <Scissors className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-black text-lg tracking-tight text-white leading-tight">Hanscut Barbershop</h3>
                  <p className="text-[10px] text-amber-400 font-extrabold tracking-widest uppercase">VIP Club Card • #REZEKI DI KONGSI BERSAMA</p>
                </div>
              </div>

              <span className="bg-gradient-to-r from-amber-400 to-yellow-300 text-gray-950 text-xs font-black px-3.5 py-1 rounded-full shadow-md uppercase tracking-wider">
                {data?.tier || 'MEMBER'}
              </span>
            </div>

            {/* Kad Tengah: Nama Pemegang & Nombor Ahli */}
            <div className="relative z-10 my-6">
              <span className="text-[10px] uppercase tracking-widest text-gray-400 block font-semibold mb-1">
                Nama Ahli (Cardholder)
              </span>
              <p className="text-2xl font-black text-white tracking-wide truncate">
                {session?.user?.name || 'Pelanggan Setia'}
              </p>
              <p className="text-xs font-mono text-gray-400 tracking-widest mt-1">
                MEMBER ID: •••• {session?.user?.id ? session.user.id.slice(-6).toUpperCase() : '8899'}
              </p>
            </div>

            {/* Kad Bawah: Diskaun & Jumlah Guntingan */}
            <div className="relative z-10 pt-4 border-t border-gray-800/80 flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] text-gray-400 block">Diskaun Ahli</span>
                <span className="font-extrabold text-amber-400 text-base">{data?.discount || '5%'} OFF</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-gray-400 block">Jumlah Kunjungan</span>
                <span className="font-extrabold text-white text-base">{data?.totalCuts || 0} Kali</span>
              </div>
            </div>
          </div>
        </div>

        {/* 🎟️ 10 BULATAN COP KESETIAAN (STAMP CARD) */}
        <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 sm:p-8 mb-10 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-gray-800">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Flame className="h-5 w-5 text-amber-400" /> Kad Cop Gunting Rambut
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                Lagi <span className="text-amber-400 font-bold">{data?.cutsRemaining ?? 10} kali</span> kunjungan untuk dapat pakej percuma!
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs bg-gray-800 text-gray-300 px-3 py-1.5 rounded-xl font-bold border border-gray-700">
                Pusingan Semasa: {data?.currentCycleStamps || 0}/10 Cop
              </span>
            </div>
          </div>

          {/* Grid 10 Bulatan Cop */}
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-3 mb-6">
            {[...Array(10)].map((_, i) => {
              const stampNumber = i + 1
              const isStamped = (data?.currentCycleStamps || 0) >= stampNumber
              const isRewardSlot = stampNumber === 10

              return (
                <div
                  key={i}
                  className={`aspect-square rounded-2xl flex flex-col items-center justify-center p-2 text-center transition-all duration-300 relative ${
                    isRewardSlot
                      ? isStamped
                        ? 'bg-amber-400 text-gray-950 font-black shadow-lg shadow-amber-400/30 scale-105 border-2 border-yellow-300'
                        : 'bg-gradient-to-b from-amber-500/20 to-yellow-500/10 border-2 border-dashed border-amber-400/40 text-amber-400'
                      : isStamped
                      ? 'bg-amber-400 text-gray-950 font-black shadow-md shadow-amber-500/20'
                      : 'bg-gray-800/60 border border-gray-700/60 text-gray-600'
                  }`}
                >
                  {isStamped ? (
                    isRewardSlot ? (
                      <Gift className="h-6 w-6 animate-bounce" />
                    ) : (
                      <CheckCircle2 className="h-6 w-6" />
                    )
                  ) : isRewardSlot ? (
                    <Gift className="h-5 w-5 text-amber-400" />
                  ) : (
                    <span className="text-sm font-bold font-mono">{stampNumber}</span>
                  )}
                  <span className="text-[9px] font-bold mt-1 uppercase">
                    {isRewardSlot ? 'FREE' : `#${stampNumber}`}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Bar Kemajuan (Progress Bar) */}
          <div className="space-y-1.5">
            <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden p-0.5 border border-gray-700">
              <div
                className="bg-gradient-to-r from-amber-500 to-yellow-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${((data?.currentCycleStamps || 0) / 10) * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-gray-400 font-semibold px-1">
              <span>0 Cop</span>
              <span>5 Cop</span>
              <span className="text-amber-400 font-bold">10 Cop (Tebus Percuma)</span>
            </div>
          </div>
        </div>

        {/* 🎁 GAJARAN & KEISTIMEWAAN AHLI (PERKS) */}
        <div className="grid md:grid-cols-3 gap-5 mb-12">
          <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl">
            <div className="p-3 bg-amber-400/10 border border-amber-400/20 rounded-xl w-fit mb-3 text-amber-400">
              <Gift className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-white text-base">Gunting Ke-10 Percuma</h3>
            <p className="text-gray-400 text-xs mt-1.5 leading-relaxed">
              Dapat pakej cuci rambut atau gunting rambut percuma setiap kali cukup 10 kunjungan berturut-turut.
            </p>
          </div>

          <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl">
            <div className="p-3 bg-amber-400/10 border border-amber-400/20 rounded-xl w-fit mb-3 text-amber-400">
              <Zap className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-white text-base">Keutamaan Tempahan (Priority)</h3>
            <p className="text-gray-400 text-xs mt-1.5 leading-relaxed">
              Ahli berdaftar boleh membuat tempahan sehingga 30 hari lebih awal berbanding pelanggan walk-in.
            </p>
          </div>

          <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl">
            <div className="p-3 bg-amber-400/10 border border-amber-400/20 rounded-xl w-fit mb-3 text-amber-400">
              <Award className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-white text-base">Barber Kegemaran</h3>
            <p className="text-gray-400 text-xs mt-1.5 leading-relaxed">
              Barber pilihan anda: <span className="text-amber-400 font-bold">{data?.favoriteBarber || 'Pilih semasa booking'}</span>. Sentiasa ingat gaya kegemaran anda!
            </p>
          </div>
        </div>

        {/* Butang CTA Tempah Sekarang */}
        <div className="text-center bg-gradient-to-r from-gray-900 via-gray-900/90 to-gray-900 border border-gray-800 p-8 rounded-3xl">
          <h3 className="text-xl font-bold mb-2">Dah Masa Untuk Kemaskan Rambut Anda?</h3>
          <p className="text-gray-400 text-xs max-w-md mx-auto mb-6">
            Tempah temujanji seterusnya sekarang dan kumpulkan cop loyalty anda hari ini!
          </p>
          <Link
            href="/booking"
            className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-gray-950 font-black px-8 py-3.5 rounded-2xl text-sm transition-all shadow-lg shadow-amber-500/20 active:scale-95"
          >
            Tempah Temujanji Sekarang <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </main>
    </div>
  )
}
