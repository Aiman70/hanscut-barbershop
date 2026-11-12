'use client'

import { AdminSidebar } from '@/components/admin-sidebar'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  Shield, Clock, User, Globe, Search, RefreshCw, Activity,
  Filter, FileText, CheckCircle2, AlertTriangle, AlertCircle
} from 'lucide-react'
import { format } from 'date-fns'
import { ms } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'

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
  SETTINGS: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  STAFF: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  SERVICE: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  SECURITY: 'bg-red-500/10 text-red-400 border-red-500/20',
}

export default function AuditLogsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('ALL')

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/login'); return }
    if (status === 'authenticated') {
      if ((session?.user as any)?.role !== 'ADMIN') { router.push('/booking'); return }
      fetchLogs()
    }
  }, [status, session])

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/audit-logs')
      const data = await res.json()
      setLogs(Array.isArray(data) ? data : [])
    } finally {
      setLoading(false)
    }
  }

  const filteredLogs = logs.filter((log) => {
    const matchesCategory = selectedCategory === 'ALL' || log.category === selectedCategory
    if (!matchesCategory) return false

    const q = searchTerm.toLowerCase()
    const matchesSearch =
      !searchTerm ||
      log.action.toLowerCase().includes(q) ||
      log.details.toLowerCase().includes(q) ||
      (log.userEmail || '').toLowerCase().includes(q) ||
      (log.ipAddress || '').includes(searchTerm)
    return matchesSearch
  })

  return (
    <div className="min-h-screen bg-gray-950 text-white flex selection:bg-amber-400 selection:text-gray-950">
      <AdminSidebar />

      {/* Main Content Area dengan margin responsif untuk telefon */}
      <main className="flex-1 md:ml-64 pt-20 md:pt-8 p-4 sm:p-6 md:p-8 max-w-6xl mx-auto w-full pb-20">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-amber-400" />
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Jejak Log Audit (Audit Trail)</h1>
            </div>
            <p className="text-gray-400 text-xs sm:text-sm mt-1">
              Rekod telus bagi setiap perubahan sistem, konfigurasi kedai, dan pengurusan staf.
            </p>
          </div>

          <Button
            variant="secondary"
            size="md"
            onClick={fetchLogs}
            isLoading={loading}
            leftIcon={<RefreshCw className="h-4 w-4 text-amber-400" />}
            className="self-start sm:self-auto min-h-[44px]"
          >
            Muat Semula Log
          </Button>
        </div>

        {/* Filter & Carian (Shared Card & Input Primitives) */}
        <Card className="p-3 sm:p-4 mb-6 flex flex-col md:flex-row gap-3 justify-between items-center">
          <div className="w-full md:w-96">
            <Input
              placeholder="Cari tindakan, emel, atau IP address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search className="h-4 w-4" />}
            />
          </div>

          {/* Kategori Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 scrollbar-none">
            {['ALL', 'SETTINGS', 'STAFF', 'SERVICE'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 min-h-[38px] ${
                  selectedCategory === cat
                    ? 'bg-amber-400 text-gray-950 shadow-sm'
                    : 'bg-gray-950 border border-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                {cat === 'ALL' ? 'Semua Kategori' : cat}
              </button>
            ))}
          </div>
        </Card>

        {/* Senarai Log */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-900 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filteredLogs.length === 0 ? (
          <EmptyState
            icon={Activity}
            title="Tiada Rekod Audit Dijumpai"
            description="Sebarang perubahan tetapan atau pengurusan servis akan dipaparkan di sini secara automatik."
          />
        ) : (
          <div className="space-y-3">
            {filteredLogs.map((log) => {
              const catColor = CATEGORY_COLORS[log.category] || 'bg-gray-800 text-gray-300 border-gray-700'
              return (
                <Card
                  key={log.id}
                  className="p-4 hover:border-gray-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${catColor}`}>
                        {log.category}
                      </span>
                      <span className="text-xs font-bold text-white bg-gray-950 px-2 py-0.5 rounded-md border border-gray-800">
                        {log.action}
                      </span>
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(log.createdAt), 'dd MMM yyyy, hh:mm a', { locale: ms })}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-gray-200 font-medium leading-relaxed">
                      {log.details}
                    </p>
                  </div>

                  {/* Metadata Pelaku (User & IP) */}
                  <div className="flex md:flex-col items-center md:items-end justify-between border-t md:border-t-0 border-gray-800 pt-2 md:pt-0 gap-1 text-right shrink-0">
                    <div className="flex items-center gap-1.5 text-xs text-amber-400 font-semibold">
                      <User className="h-3.5 w-3.5" />
                      <span>{log.userEmail || 'Sistem'}</span>
                      {log.userRole && (
                        <Badge variant="amber" size="sm">
                          {log.userRole}
                        </Badge>
                      )}
                    </div>

                    {log.ipAddress && (
                      <div className="flex items-center gap-1 text-[11px] text-gray-500 font-mono">
                        <Globe className="h-3 w-3" />
                        <span>IP: {log.ipAddress}</span>
                      </div>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
