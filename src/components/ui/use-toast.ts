// src/components/ui/use-toast.ts
"use client"
import { useState, useEffect, useCallback } from "react"

type ToastVariant = "default" | "destructive"

interface Toast {
  id: string
  title?: string
  description?: string
  variant?: ToastVariant
}

interface ToastOptions {
  title?: string
  description?: string
  variant?: ToastVariant
  duration?: number
}

let toastCount = 0
const listeners: Array<(toasts: Toast[]) => void> = []
let memToasts: Toast[] = []

const emit = (toasts: Toast[]) => {
  memToasts = toasts
  listeners.forEach(l => l(toasts))
}

export function toast(options: ToastOptions) {
  const id = String(++toastCount)
  const newToast: Toast = { id, ...options }
  emit([...memToasts, newToast])
  
  const duration = options.duration ?? 4000
  setTimeout(() => {
    emit(memToasts.filter(t => t.id !== id))
  }, duration)
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>(memToasts)

  useEffect(() => {
    listeners.push(setToasts)
    return () => {
      const idx = listeners.indexOf(setToasts)
      if (idx > -1) listeners.splice(idx, 1)
    }
  }, [])

  const dismiss = useCallback((id: string) => {
    emit(memToasts.filter(t => t.id !== id))
  }, [])

  return { toasts, toast, dismiss }
}
