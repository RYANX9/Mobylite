'use client'

import { createContext, useContext, useState, useCallback, useRef } from 'react'
import { Check, X, AlertCircle } from 'lucide-react'
import { c } from '@/lib/tokens'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: number
  message: string
  type: ToastType
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} })

export function useToast() {
  return useContext(ToastContext)
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const counter = useRef(0)

  const toast = useCallback((message: string, type: ToastType = 'success') => {
    const id = ++counter.current
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3200)
  }, [])

  const dismiss = (id: number) => setToasts(prev => prev.filter(t => t.id !== id))

  const bgMap: Record<ToastType, string> = {
    success: c.primary,
    error: c.accent,
    info: '#2D6A4F',
  }

  const IconMap: Record<ToastType, React.ReactNode> = {
    success: <Check size={14} strokeWidth={2.5} />,
    error: <AlertCircle size={14} strokeWidth={2} />,
    info: <Check size={14} strokeWidth={2.5} />,
  }

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        style={{
          position: 'fixed',
          top: 'calc(var(--nav-h) + 12px)',
          right: 20,
          zIndex: 999,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          pointerEvents: 'none',
        }}
      >
        {toasts.map(t => (
          <div
            key={t.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '11px 16px',
              background: bgMap[t.type],
              color: '#fff',
              borderRadius: 'var(--r-md)',
              fontSize: 13,
              fontWeight: 500,
              boxShadow: 'var(--shadow-lg)',
              animation: 'toastIn 0.22s ease',
              pointerEvents: 'auto',
              maxWidth: 320,
            }}
          >
            {IconMap[t.type]}
            <span style={{ flex: 1 }}>{t.message}</span>
            <button
              onClick={() => dismiss(t.id)}
              style={{ color: 'rgba(255,255,255,0.6)', display: 'flex', marginLeft: 4, transition: 'color 0.15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#fff' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.6)' }}
            >
              <X size={13} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
