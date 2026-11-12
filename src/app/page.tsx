'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import {
  Scissors, Clock, ChevronRight, Calendar,
  ShieldCheck, MapPin, Phone, Star, Sparkles, UserCheck
} from 'lucide-react'
import { CustomerNav } from '@/components/customer-nav'

export default function HomePage() {
  const { data: session } = useSession()
  const [shopStatus, setShopStatus] = useState<{
    isOpen: boolean
    statusBadge: string
    detail: string
  }>({
    isOpen: false,
    statusBadge: 'Memeriksa Waktu Operasi...',
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
    <div className="min-h-screen bg-gray-950 text-white selection:bg-amber-400 selection:text-gray-950 pb-20 md:pb-0">
      {/* 🧭 Customer Navigation Bar */}
      <CustomerNav />

      {/* 💈 HERO SECTION (Clean, Authentic, No AI Glow Slop) */}
      <section className="px-4 sm:px-6 pt-10 sm:pt-16 pb-16 sm:pb-20 text-center max-w-4xl mx-auto">
        {/* Status Kedai Semasa */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gray-900 border border-gray-800 text-xs font-semibold mb-6 shadow-sm">
          <span className="relative flex h-2.5 w-2.5">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              shopStatus.isOpen ? 'bg-emerald-400' : 'bg-amber-400'
            }`}></span>
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
              shopStatus.isOpen ? 'bg-emerald-500' : 'bg-amber-500'
            }`}></span>
          </span>
          <span className="text-gray-300">
            {shopStatus.isOpen
              ? 'Kedai Dibuka Sekarang • Slot Tersedia'
              : `${shopStatus.statusBadge.replace(/^(🟢|🔴|🕒|🌙)\s*/, '')} (${shopStatus.detail})`}
          </span>
        </div>

        {/* Tajuk Utama Berwibawa */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.15] text-white mb-5">
          Potongan Rambut Kemas,{' '}
          <span className="text-amber-400">Tepat Pada Waktunya.</span>
        </h1>

        <p className="text-sm sm:text-base md:text-lg text-gray-400 max-w-2xl mx-auto mb-8 font-normal leading-relaxed">
          Tempah tukang gunting pilihan anda dalam masa 2 minit. Pilih servis dan slot masa tanpa perlu menunggu atau beratur lama di kedai.
        </p>

        {/* Butang Tindakan Utama (Ergonomik Telefon >= 48px) */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 max-w-md mx-auto">
          <Link
            href="/booking"
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-300 text-gray-950 font-black px-7 py-3.5 rounded-2xl text-base transition-all shadow-lg shadow-amber-400/10 active:scale-95 min-h-[48px]"
          >
            <Calendar className="h-5 w-5" />
            <span>Tempah Slot Sekarang</span>
            <ChevronRight className="h-4 w-4" />
          </Link>

          {!session && (
            <Link
              href="/login"
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-gray-200 border border-gray-800 px-6 py-3.5 rounded-2xl text-sm font-bold transition-all min-h-[48px]"
            >
              Log Masuk Akaun
            </Link>
          )}
        </div>

        {/* 3 Nilai Teras Ringkas */}
        <div className="grid grid-cols-3 max-w-md mx-auto mt-10 pt-6 border-t border-gray-800/80 text-center gap-2">
          <div>
            <p className="text-xl sm:text-2xl font-black text-amber-400">0 Minit</p>
            <p className="text-[11px] text-gray-400 font-medium mt-0.5">Masa Menunggu</p>
          </div>
          <div className="border-x border-gray-800">
            <p className="text-xl sm:text-2xl font-black text-white">4.9 ★</p>
            <p className="text-[11px] text-gray-400 font-medium mt-0.5">Kepuasan Pelanggan</p>
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-black text-amber-400">20 Slot</p>
            <p className="text-[11px] text-gray-400 font-medium mt-0.5">Had Berkualiti Sehari</p>
          </div>
        </div>
      </section>

      {/* ✂️ SENARAI PAKEJ SERVIS */}
      <section className="px-4 sm:px-6 py-12 sm:py-16 bg-gray-900/50 border-t border-gray-800">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <span className="text-amber-400 text-xs font-bold uppercase tracking-wider bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">
              Pilihan Servis Kami
            </span>
            <h2 className="text-2xl sm:text-3xl font-black mt-2 text-white">Pakej & Anggaran Harga</h2>
            <p className="text-gray-400 text-xs sm:text-sm mt-1">Layanan teliti daripada tukang gunting berpengalaman</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { name: 'Gunting Dewasa', price: 'RM 13 - RM 15', duration: '30 min', desc: 'Potongan klasik, modern fade, atau taper mengikut bentuk muka.' },
              { name: 'Gunting Remaja & Pelajar', price: 'RM 10 - RM 15', duration: '30 min', desc: 'Gaya kemas untuk sekolah, kolej, dan universiti.' },
              { name: 'Gunting Kanak-Kanak', price: 'RM 8 - RM 10', duration: '25 min', desc: 'Potongan santai & sabar untuk anak-anak bawah 12 tahun.' },
              { name: 'Gunting + Cuci Rambut', price: 'RM 18', duration: '45 min', desc: 'Pakej lengkap potong rambut dan cuci kepala syampu segar.' },
              { name: 'Cukur Janggut & Misai', price: 'RM 5', duration: '15 min', desc: 'Kemas dan rapikan garis tepi janggut, jambang, dan misai.' },
              { name: 'Keratin & Rawatan Rambut', price: 'RM 90', duration: '90 min', desc: 'Rawatan memulihkan rambut rosak dan melembutkan tekstur rambut.' },
            ].map((s, i) => (
              <div
                key={i}
                className="bg-gray-900 border border-gray-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-between hover:border-gray-700 transition-all shadow-sm space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <h3 className="font-bold text-base text-white">{s.name}</h3>
                    <span className="text-amber-400 font-extrabold text-sm">{s.price}</span>
                  </div>
                  <p className="text-gray-400 text-xs leading-relaxed">{s.desc}</p>
                </div>

                <div className="pt-3 border-t border-gray-800 flex items-center justify-between text-xs">
                  <span className="text-gray-400 flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-amber-400" /> {s.duration}
                  </span>
                  <Link
                    href="/booking"
                    className="text-amber-400 font-bold hover:underline flex items-center gap-0.5"
                  >
                    Pilih Slot →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 🕒 JADUAL WAKTU OPERASI KEDAI */}
      <section className="px-4 sm:px-6 py-12 border-t border-gray-800 max-w-4xl mx-auto">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 sm:p-6 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center justify-center sm:justify-start gap-2">
              <Clock className="h-5 w-5 text-amber-400" /> Waktu Operasi Rasmi
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              • <span className="text-white font-semibold">Sabtu - Khamis:</span> 3.00 PM - 11.00 PM<br className="sm:hidden" />
              <span className="hidden sm:inline"> | </span>
              • <span className="text-white font-semibold">Jumaat:</span> 8.30 PM - 11.00 PM (Malam Sahaja)
            </p>
          </div>

          <Link
            href="/booking"
            className="bg-amber-400 text-gray-950 font-bold px-5 py-2.5 rounded-xl text-xs sm:text-sm hover:bg-amber-300 transition-all shrink-0 min-h-[44px] flex items-center justify-center"
          >
            Semak Tarikh Dibuka
          </Link>
        </div>
      </section>

      {/* 🦶 FOOTER */}
      <footer className="border-t border-gray-800 bg-gray-950 px-4 sm:px-6 py-8 text-center text-xs text-gray-500">
        <div className="max-w-5xl mx-auto flex flex-col items-center gap-3">
          <div className="flex items-center gap-2">
            <Scissors className="h-4 w-4 text-amber-400" />
            <span className="font-extrabold text-sm text-white">Hanscut Barbershop</span>
          </div>
          <p className="text-gray-400 text-xs">#REZEKI DI KONGSI BERSAMA</p>
          <div className="flex flex-wrap items-center justify-center gap-3 text-gray-400 text-[11px]">
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3 text-amber-400" /> Cawangan Rasmi Hanscut
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Phone className="h-3 w-3 text-amber-400" /> Tempahan Online Pantas
            </span>
          </div>
          <p className="text-gray-600 text-[10px] mt-2">© 2026 Hanscut Barbershop. Hak Cipta Terpelihara.</p>
        </div>
      </footer>
    </div>
  )
}
