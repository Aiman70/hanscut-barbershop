// src/components/ui/toaster.tsx
"use client"
import { useToast } from "@/components/ui/use-toast"
import { X } from "lucide-react"

export function Toaster() {
  const { toasts, dismiss } = useToast()
  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-full max-w-sm">
      {toasts.map(({ id, title, description, variant }) => (
        <div key={id}
          className={`flex items-start gap-3 rounded-xl border p-4 shadow-lg backdrop-blur-sm transition-all ${
            variant === 'destructive'
              ? 'bg-red-950/90 border-red-800 text-red-100'
              : 'bg-gray-900/90 border-gray-800 text-white'
          }`}
        >
          <div className="flex-1 min-w-0">
            {title && <p className="font-semibold text-sm">{title}</p>}
            {description && <p className="text-xs opacity-80 mt-0.5">{description}</p>}
          </div>
          <button onClick={() => dismiss(id)} className="opacity-70 hover:opacity-100 shrink-0">
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
