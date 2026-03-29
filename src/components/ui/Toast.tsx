'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import { CheckCircle, AlertCircle, X, Bell } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: string
  message: string
  type: ToastType
}

interface ToastContextType {
  showToast: (message: string, type: ToastType) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = (message: string, type: ToastType) => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prev) => [...prev, { id, message, type }])

    // Auto dismiss after 3 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id))
    }, 3000)
  }

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="toast-container" style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        zIndex: 10000,
        pointerEvents: 'none'
      }}>
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast ${toast.type}`} style={{
            pointerEvents: 'auto',
            minWidth: '300px',
            maxWidth: '450px',
            padding: '12px 16px',
            borderRadius: '12px',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            animation: 'toastIn 0.3s ease',
            color: 'var(--text-primary)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: toast.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 
                         toast.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 
                         'rgba(59, 130, 246, 0.1)',
              color: toast.type === 'success' ? '#10b981' : 
                     toast.type === 'error' ? '#ef4444' : 
                     '#3b82f6'
            }}>
              {toast.type === 'success' && <CheckCircle size={18} />}
              {toast.type === 'error' && <AlertCircle size={18} />}
              {toast.type === 'info' && <Bell size={18} />}
            </div>
            
            <div style={{ flex: 1, fontSize: '0.875rem', fontWeight: 500 }}>{toast.message}</div>
            
            <button 
              onClick={() => removeToast(toast.id)}
              style={{ 
                background: 'none', 
                border: 'none', 
                color: 'var(--text-secondary)', 
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '4px',
                display: 'flex'
              }}
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
      <style jsx global>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(50px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
