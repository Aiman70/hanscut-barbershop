'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import {
  Scissors, Clock, Star, Shield, ChevronRight, Calendar,
  LogOut, Sparkles, CheckCircle2, MapPin, Phone
} from 'lucide-react'

export default function HomePage() {
  const { data: session } = useSession()
  const [shopStatus, setShopStatus] = useState<{
    isOpen: boolean
    statusBadge: string
    detail: string
    isEmergency?: boolean
    isHoliday?: boolean
    isWeeklyOff?: boolean
  }>({
    isOpen: false,
    statusBadge: 'Memeriksa Status Kedai...',
    detail: 'Waktu Operasi: 3.00 PM - 11.00 PM',
  })

  useEffect(() => {
    fetch('/api/shop/status')
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data.isOpen === 'boolean') {
          setShopStatus(data)
        }
      })
      .catch(() => {})
  }, [])

  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-hidden relative selection:bg-amber-400 selection:text-gray-950">
      {/* 🌟 1. BACKGROUND GLOWING AMBIENT ORBS (Bergerak & Bernafas) */}
      <div className="absolute top-[-150px] left-1/2 -translate-x-1/2 w-[650px] h-[650px] bg-gradient-to-tr from-amber-500/20 via-yellow-500/10 to-transparent rounded-full blur-[130px] pointer-events-none animate-pulse -z-10" />
      <div className="absolute top-[400px] right-[-100px] w-[450px] h-[450px] bg-amber-600/10 rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* 💈 2. TOP TICKER RUNNING MARQUEE (Teks Bergerak Tanpa Henti) */}
      <div className="bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-gray-950 py-1.5 px-4 text-xs font-black tracking-wider uppercase overflow-hidden shadow-md">
        <div className="flex gap-8 whitespace-nowrap animate-[marquee_25s_linear_infinite]">
          <span>💈 HANSCUT BARBERSHOP</span>
          <span>•</span>
          <span>🕒 SABTU - KHAMIS: 3.00 PM - 11.00 PM</span>
          <span>•</span>
          <span>🌙 JUMAAT: 8.30 PM - 11.00 PM (MALAM SAHAJA)</span>
          <span>•</span>
          <span>✂️ TEMPAH SLOT DALAM 2 MINIT</span>
          <span>•</span>
          <span>#REZEKI DI KONGSI BERSAMA</span>
          <span>•</span>
          <span>💈 HANSCUT BARBERSHOP</span>
        </div>
      </div>

      {/* 🧭 3. NAVBAR */}
      <nav className="border-b border-gray-800/80 bg-gray-950/70 backdrop-blur-md px-6 py-4 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="p-2 bg-amber-400/10 border border-amber-400/20 rounded-xl group-hover:bg-amber-400/20 transition-all group-hover:rotate-12 duration-300">
              <Scissors className="h-6 w-6 text-amber-400 transition-transform group-hover:scale-110" />
            </div>
            <span className="text-xl font-black tracking-tight">Hanscut <span className="text-amber-400">Barbershop</span></span>
          </Link>

          <div className="flex items-center gap-3">
            {session ? (
              <>
                {(session.user as any)?.role === 'ADMIN' && (
                  <Link href="/dashboard" className="text-xs bg-amber-400 text-gray-950 px-3.5 py-2 rounded-xl font-bold hover:bg-amber-300 transition-all shadow-md">
                    Admin Dashboard
                  </Link>
                )}
                {(session.user as any)?.role === 'BARBER' && (
                  <Link href="/barber" className="text-xs bg-amber-400 text-gray-950 px-3.5 py-2 rounded-xl font-bold hover:bg-amber-300 transition-all shadow-md">
                    Portal Barber
                  </Link>
                )}
                <Link href="/my-appointments" className="text-gray-300 hover:text-white text-xs font-semibold px-3 py-2 rounded-lg hover:bg-gray-800/50 transition-colors">
                  Tempahan Saya
                </Link>

                <button
                  onClick={async () => {
                    await signOut({ redirect: false })
                    window.location.href = '/'
                  }}
                  className="flex items-center gap-1.5 text-xs text-red-400 bg-red-950/30 border border-red-900/40 hover:bg-red-900/30 px-3 py-2 rounded-xl transition-all"
                >
                  <LogOut className="h-3.5 w-3.5" /> Keluar
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-gray-300 hover:text-white text-sm font-semibold px-4 py-2 hover:bg-gray-900 rounded-xl transition-colors"
                >
                  Log Masuk
                </Link>
                <Link
                  href="/register"
                  className="bg-amber-400 text-gray-950 px-4 py-2 rounded-xl font-bold text-sm hover:bg-amber-300 transition-all shadow-md active:scale-95"
                >
                  Daftar
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* 🔥 4. HERO SECTION WITH FLOATING BADGES & ANIMATIONS */}
      <section className="px-6 pt-20 pb-28 text-center relative">
        <div className="max-w-4xl mx-auto">
          {/* Live Status Badge berdenyut (Pulse Ring) */}
          <div className={`inline-flex items-center gap-2.5 border rounded-full px-4 py-2 mb-8 shadow-inner backdrop-blur-sm transition-all ${
            shopStatus.isOpen
              ? 'bg-gray-900/90 border-gray-800 text-gray-300'
              : 'bg-red-500/10 border-red-500/30 text-red-300 shadow-red-950/20'
          }`}>
            <span className="relative flex h-2.5 w-2.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                shopStatus.isOpen ? 'bg-emerald-400' : 'bg-red-400'
              }`}></span>
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                shopStatus.isOpen ? 'bg-emerald-500' : 'bg-red-500'
              }`}></span>
            </span>
            <span className="text-xs font-bold tracking-wide">
              {shopStatus.isOpen
                ? 'Kedai Dibuka Sekarang • Slot Hari Ini Tersedia'
                : `${shopStatus.statusBadge.replace(/^(🟢|🔴|🕒|🌙)\s*/, '')} • ${shopStatus.detail}`}
            </span>
          </div>

          {/* Main Title dengan Animasi Gradient Shimmer */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-black mb-6 leading-[1.1] tracking-tight">
            Tampil Bergaya,
            <br />
            <span className="bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 bg-clip-text text-transparent drop-shadow-sm">
              Tanpa Tunggu Lama
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto font-normal leading-relaxed">
            Tempah tukang gunting kegemaran anda dalam masa 2 minit. Pilih servis, masa yang fleksibel, dan terus duduk di kerusi tanpa perlu beratur panjang.
          </p>

          {/* Butang Call To Action (Glow Button) */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/booking"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-gray-950 px-9 py-4 rounded-2xl font-black text-lg transition-all shadow-xl shadow-amber-500/20 hover:shadow-amber-500/30 hover:scale-[1.02] active:scale-95"
            >
              <Calendar className="h-5 w-5" />
              Tempah Slot Sekarang
              <ChevronRight className="h-5 w-5" />
            </Link>

            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gray-900/90 border border-gray-800 hover:border-gray-700 text-gray-300 hover:text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all hover:bg-gray-800/60"
            >
              Log Masuk Akaun
            </Link>
          </div>

          {!shopStatus.isOpen && (
            <div className="mt-6 max-w-lg mx-auto p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-xs text-red-300 flex items-center justify-center gap-2 shadow-lg shadow-red-950/20">
              <span className="font-bold text-red-400">⚠️ Notis Kedai:</span>
              <span>{shopStatus.detail} (Anda masih boleh menempah untuk tarikh lain yang dibuka).</span>
            </div>
          )}

          {/* 3 Trust Signals */}
          <div className="grid grid-cols-3 max-w-lg mx-auto mt-14 pt-8 border-t border-gray-800/80 text-center gap-4">
            <div>
              <p className="text-2xl font-extrabold text-amber-400">100%</p>
              <p className="text-xs text-gray-400 font-medium mt-0.5">Tanpa Beratur</p>
            </div>
            <div className="border-x border-gray-800/80">
              <p className="text-2xl font-extrabold text-white">4.9 ★</p>
              <p className="text-xs text-gray-400 font-medium mt-0.5">Penilaian Pelanggan</p>
            </div>
            <div>
              <p className="text-2xl font-extrabold text-amber-400">2 Minit</p>
              <p className="text-xs text-gray-400 font-medium mt-0.5">Tempahan Pantas</p>
            </div>
          </div>
        </div>
      </section>

      {/* ✂️ 5. POPULAR SERVICES WITH HOVER ZOOM CARDS */}
      <section className="px-6 py-20 bg-gray-900/40 border-t border-gray-800/80">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-amber-400 text-xs font-bold uppercase tracking-widest bg-amber-400/10 px-3.5 py-1.5 rounded-full border border-amber-400/20">
              Pilihan Servis Kami
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold mt-3">Gaya Rambut & Rawatan Terbaik</h2>
            <p className="text-gray-400 text-sm mt-2">Dapatkan layanan kemas dan profesional daripada tukang gunting pakar</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: 'Gunting Dewasa', price: 'RM 13 - RM 15', duration: '30 min', emoji: '✂️', desc: 'Gaya potongan klasik atau moden kemas untuk dewasa mengikut bentuk muka.' },
              { name: 'Gunting Remaja', price: 'RM 10 - RM 15', duration: '30 min', emoji: '💈', desc: 'Potongan kemas & bergaya untuk golongan remaja dan pelajar.' },
              { name: 'Gunting Kanak-Kanak', price: 'RM 8 - RM 10', duration: '25 min', emoji: '👦', desc: 'Potongan santai dan mesra kanak-kanak bawah 12 tahun.' },
              { name: 'Gunting + Cuci (Kombo)', price: 'RM 18', duration: '45 min', emoji: '💆', desc: 'Pakej lengkap potongan rambut bersama basuhan syampu segar & urutan.' },
              { name: 'Cukur Rambut (Botak/Shave)', price: 'RM 15', duration: '30 min', emoji: '🪒', desc: 'Cukuran rambut licin dan bersih dengan pisau cukur profesional.' },
              { name: 'Cukur Jebeng / Jambang', price: 'RM 5', duration: '15 min', emoji: '🧔', desc: 'Kemas dan bentuk garis tepi jambang, janggut dan misai.' },
              { name: 'Rebonding Rambut', price: 'RM 60+', duration: '90 min', emoji: '✨', desc: 'Rawatan meluruskan rambut agar lebih licin, rapi dan mudah diurus.' },
              { name: 'Keratin Treatment', price: 'RM 90', duration: '90 min', emoji: '🌟', desc: 'Rawatan memulihkan rambut rosak, mengembalikan kilauan semula jadi.' },
              { name: 'Colour / Highlight', price: 'RM 50+', duration: '60 min', emoji: '🎨', desc: 'Pewarnaan satu kepala atau highlight stail premium pilihan anda.' },
            ].map((s, i) => (
              <div
                key={i}
                className="bg-gray-900 border border-gray-800 hover:border-amber-400/50 p-6 rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-amber-500/5 group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-3xl p-3 bg-gray-800/60 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                      {s.emoji}
                    </span>
                    <span className="text-xl font-black text-amber-400">{s.price}</span>
                  </div>
                  <h3 className="text-lg font-bold text-white group-hover:text-amber-300 transition-colors">{s.name}</h3>
                  <p className="text-gray-400 text-xs mt-1.5 leading-relaxed">{s.desc}</p>
                </div>

                <div className="mt-6 pt-3 border-t border-gray-800/80 flex items-center justify-between text-xs text-gray-500">
                  <span className="flex items-center gap-1 font-medium">
                    <Clock className="h-3.5 w-3.5 text-amber-400" /> {s.duration}
                  </span>
                  <Link
                    href="/booking"
                    className="text-amber-400 group-hover:underline font-bold flex items-center gap-0.5"
                  >
                    Pilih Slot →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 🛡️ 6. 3 KELEBIHAN SISTEM KAMI */}
      <section className="px-6 py-20 border-t border-gray-800/80">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Clock className="h-7 w-7 text-amber-400" />,
                title: 'Datang Tepat Waktu',
                desc: 'Pilih masa sendiri dari telefon. Bila sampai kedai, kerusi dah sedia menunggu anda.',
              },
              {
                icon: <Scissors className="h-7 w-7 text-amber-400" />,
                title: 'Tukang Gunting Pakar',
                desc: 'Boleh pilih barber kegemaran anda sendiri mengikut kepakaran gaya potongan.',
              },
              {
                icon: <Shield className="h-7 w-7 text-amber-400" />,
                title: 'Pengesahan Automatik',
                desc: 'Semua rekod temujanji disimpan rapi. Boleh semak atau batalkan bila-bila masa.',
              },
            ].map((f, i) => (
              <div key={i} className="bg-gray-900/80 border border-gray-800 p-7 rounded-2xl hover:border-gray-700 transition-all">
                <div className="mb-4 inline-block p-3 bg-amber-400/10 border border-amber-400/20 rounded-2xl">{f.icon}</div>
                <h3 className="text-lg font-bold text-white mb-2">{f.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 🦶 7. FOOTER */}
      <footer className="border-t border-gray-800/80 bg-gray-950 px-6 py-12 text-center text-gray-500 text-xs">
        <div className="max-w-6xl mx-auto flex flex-col items-center gap-4">
          <div className="flex items-center gap-2">
            <Scissors className="h-5 w-5 text-amber-400" />
            <span className="font-extrabold text-base text-white">Hanscut Barbershop</span>
          </div>
          <p className="max-w-md text-gray-400 leading-relaxed">
            #REZEKI DI KONGSI BERSAMA
          </p>
          <div className="flex items-center gap-4 text-gray-400 mt-2">
            <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-amber-400" /> No. 1, Jalan Utama, Kuala Lumpur</span>
            <span>•</span>
            <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5 text-amber-400" /> 03-1234 5678</span>
          </div>
          <p className="text-gray-600 mt-4">© 2026 Hanscut Barbershop. #REZEKI DI KONGSI BERSAMA. Hak Cipta Terpelihara.</p>
        </div>
      </footer>
    </div>
  )
}
