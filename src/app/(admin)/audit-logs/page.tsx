'use client'

import { AdminSidebar } from '@/components/admin-sidebar'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Scissors, Shield, RefreshCw, LogOut, Clock,
  Search, Filter, Activity, User, Globe
} from 'lucide-react'
import { format } from 'date-fns'
import { ms } from 'date-fns/locale'
import { signOut } from 'next-auth/react'

interface AuditLog {
  id: string
  action: string
  category: string
  details: string
  userId: string | null
  userEmail: string | null
  userRole: string | null
  ipAddress: string | null
  createdAt: string
}

const CATEGORY_COLORS: Record<string, string> = {
  SETTINGS: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  STAFF: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  SERVICE: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  BOOKING: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  AUTH: 'bg-red-500/10 text-red-400 border-red-500/20',
}

export default function AuditLogsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('ALL')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }
    if (status === 'authenticated') {
      if ((session?.user as any)?.role !== 'ADMIN') {
        router.push('/booking')
        return
      }
      fetchLogs()
    }
  }, [status, session, selectedCategory])

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const url = selectedCategory === 'ALL'
        ? '/api/admin/audit-logs'
        : `/api/admin/audit-logs?category=${selectedCategory}`
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setLogs(Array.isArray(data.logs) ? data.logs : [])
      }
    } finally {
      setLoading(false)
    }
  }

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.userEmail || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.ipAddress || '').includes(searchTerm)
    return matchesSearch
  })

  return (
    <div className="min-h-screen bg-gray-950 text-white flex">
      {/* Sidebar Admin */}
      <AdminSidebar />

      {/* Main Content Area */}
      <main className="flex-1 ml-64 p-8 max-w-6xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2">
              <Shield className="h-7 w-7 text-amber-400" />
              <h1 className="text-2xl font-black">Jejak Log Audit (Audit Trail)</h1>
            </div>
            <p className="text-gray-400 text-sm mt-1">
              Rekod bukti telus bagi setiap perubahan sistem, konfigurasi kedai, dan pengurusan staf.
            </p>
          </div>

          <button
            onClick={fetchLogs}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-900 border border-gray-800 hover:border-gray-700 text-gray-300 hover:text-white text-sm font-semibold transition-all self-start sm:self-auto"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
            Muat Semula Log
          </button>
        </div>

        {/* Filter & Carian */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="flex items-center gap-2 w-full md:w-96 bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2.5">
            <Search className="h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari tindakan, emel, atau IP address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent text-sm text-white placeholder-gray-500 outline-none w-full"
            />
          </div>

          {/* Kategori Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
            {['ALL', 'SETTINGS', 'STAFF', 'SERVICE'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all shrink-0 ${
                  selectedCategory === cat
                    ? 'bg-amber-400 text-gray-950 border-amber-400 shadow-sm'
                    : 'bg-gray-950 border-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                {cat === 'ALL' ? 'Semua Kategori' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Senarai Log */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-900 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center text-gray-500">
            <Activity className="h-10 w-10 mx-auto mb-3 opacity-30 text-amber-400" />
            <p className="font-bold text-sm">Tiada Rekod Audit Dijumpai</p>
            <p className="text-xs text-gray-600 mt-1">
              Sebarang perubahan tetapan atau pengurusan servis akan dipaparkan di sini secara automatik.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredLogs.map((log) => {
              const catColor = CATEGORY_COLORS[log.category] || 'bg-gray-800 text-gray-300 border-gray-700'
              return (
                <div
                  key={log.id}
                  className="bg-gray-900/90 border border-gray-800/80 hover:border-gray-700 rounded-2xl p-4 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${catColor}`}>
                        {log.category}
                      </span>
                      <span className="text-xs font-bold text-white bg-gray-800/80 px-2 py-0.5 rounded-md border border-gray-700/60">
                        {log.action}
                      </span>
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(log.createdAt), 'dd MMM yyyy, hh:mm a', { locale: ms })}
                      </span>
                    </div>

                    <p className="text-sm text-gray-200 font-medium leading-relaxed">
                      {log.details}
                    </p>
                  </div>

                  {/* Metadata Pelaku (User & IP) */}
                  <div className="flex md:flex-col items-center md:items-end justify-between border-t md:border-t-0 border-gray-800/60 pt-2 md:pt-0 gap-1 text-right shrink-0">
                    <div className="flex items-center gap-1.5 text-xs text-amber-400/90 font-semibold">
                      <User className="h-3.5 w-3.5" />
                      <span>{log.userEmail || 'Sistem'}</span>
                      {log.userRole && (
                        <span className="text-[10px] bg-amber-400/10 text-amber-300 px-1.5 py-0.2 rounded border border-amber-400/20 font-bold">
                          {log.userRole}
                        </span>
                      )}
                    </div>

                    {log.ipAddress && (
                      <div className="flex items-center gap-1 text-[11px] text-gray-500 font-mono">
                        <Globe className="h-3 w-3" />
                        <span>IP: {log.ipAddress}</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
