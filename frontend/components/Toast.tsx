'use client'

import { useState, useEffect, createContext, useContext, useCallback, ReactNode } from 'react'
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  type: ToastType
  message: string
  duration?: number
}

interface ToastContextType {
  addToast: (type: ToastType, message: string, duration?: number) => void
  removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used within ToastProvider')
  return context
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const addToast = useCallback((type: ToastType, message: string, duration = 5000) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9)
    setToasts(prev => [...prev, { id, type, message, duration }])
    if (duration > 0) {
      setTimeout(() => removeToast(id), duration)
    }
  }, [removeToast])

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm" role="region" aria-label="Notifications">
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const icons = {
    success: <CheckCircle className="h-5 w-5 text-green-500" />,
    error: <AlertCircle className="h-5 w-5 text-red-500" />,
    warning: <AlertTriangle className="h-5 w-5 text-amber-500" />,
    info: <Info className="h-5 w-5 text-blue-500" />,
  }
  const bgColors = {
    success: 'bg-green-50 border-green-200 dark:bg-green-900/30 dark:border-green-800',
    error: 'bg-red-50 border-red-200 dark:bg-red-900/30 dark:border-red-800',
    warning: 'bg-amber-50 border-amber-200 dark:bg-amber-900/30 dark:border-amber-800',
    info: 'bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800',
  }

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-xl border shadow-lg ${bgColors[toast.type]} animate-in slide-in-from-right`}
      role="alert"
    >
      {icons[toast.type]}
      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 flex-1">{toast.message}</p>
      <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex-shrink-0" aria-label="Dismiss">
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
