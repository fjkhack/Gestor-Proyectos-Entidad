'use client'

import { createContext, useContext, useState, ReactNode, useCallback } from 'react'
import { AlertCircle, HelpCircle, X, Info } from 'lucide-react'

interface ModalOptions {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: 'danger' | 'info' | 'warning'
  defaultValue?: string // For prompt
  isPrompt?: boolean
  isAlert?: boolean
}

type ModalResolveValue = boolean | string | null

interface ModalState extends ModalOptions {
  id: string
  resolve: (value: ModalResolveValue) => void
  isOpen: boolean
}

interface ModalContextType {
  confirm: (options: ModalOptions) => Promise<boolean>
  prompt: (options: ModalOptions) => Promise<string | null>
  alert: (options: ModalOptions) => Promise<void>
}

const ModalContext = createContext<ModalContextType | undefined>(undefined)

export function ModalProvider({ children }: { children: ReactNode }) {
  const [modal, setModal] = useState<ModalState | null>(null)
  const [inputValue, setInputValue] = useState('')

  const confirm = useCallback((options: ModalOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setModal({
        ...options,
        id: Math.random().toString(),
        isOpen: true,
        resolve: (value) => resolve(Boolean(value)),
        confirmText: options.confirmText || 'Aceptar',
        cancelText: options.cancelText || 'Cancelar',
        type: options.type || 'info'
      })
    })
  }, [])

  const alert = useCallback((options: ModalOptions): Promise<void> => {
    return new Promise((resolve) => {
      setModal({
        ...options,
        id: Math.random().toString(),
        isOpen: true,
        isAlert: true,
        resolve: () => resolve(),
        confirmText: options.confirmText || 'Entendido',
        type: options.type || 'info'
      })
    })
  }, [])

  const prompt = useCallback((options: ModalOptions): Promise<string | null> => {
    setInputValue(options.defaultValue || '')
    return new Promise((resolve) => {
      setModal({
        ...options,
        id: Math.random().toString(),
        isOpen: true,
        isPrompt: true,
        resolve: (value) => resolve(typeof value === 'string' ? value : null),
        confirmText: options.confirmText || 'Aceptar',
        cancelText: options.cancelText || 'Cancelar',
        type: options.type || 'info'
      })
    })
  }, [])

  const handleConfirm = () => {
    if (modal) {
      modal.resolve(modal.isPrompt ? inputValue : true)
      setModal(null)
    }
  }

  const handleCancel = () => {
    if (modal) {
      modal.resolve(modal.isPrompt ? null : false)
      setModal(null)
    }
  }

  return (
    <ModalContext.Provider value={{ confirm, prompt, alert }}>
      {children}
      
      {modal && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.35)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px',
          animation: 'fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          <div className="modal-card" style={{
            width: '100%',
            maxWidth: '480px',
            background: '#ffffff',
            borderRadius: '24px',
            padding: '32px',
            animation: 'slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
            border: '1px solid rgba(255, 255, 255, 0.5)',
            boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25), 0 0 0 1px rgba(15, 23, 42, 0.05)',
            position: 'relative'
          }}>
            {!modal.isAlert && (
              <button 
                onClick={handleCancel}
                style={{
                  position: 'absolute',
                  top: '20px',
                  right: '20px',
                  padding: '8px',
                  borderRadius: '12px',
                  color: '#94a3b8',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = '#f1f5f9'
                  e.currentTarget.style.color = '#475569'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = '#94a3b8'
                }}
              >
                <X size={20} />
              </button>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center', textAlign: 'center' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                background: modal.type === 'danger' ? 'rgba(239, 68, 68, 0.1)' : 
                           modal.type === 'warning' ? 'rgba(245, 158, 11, 0.1)' : 
                           'rgba(79, 70, 229, 0.1)',
                color: modal.type === 'danger' ? '#ef4444' : 
                       modal.type === 'warning' ? '#f59e0b' : 
                       '#4f46e5'
              }}>
                {modal.type === 'danger' && <AlertCircle size={32} strokeWidth={2.5} />}
                {modal.type === 'warning' && <AlertCircle size={32} strokeWidth={2.5} />}
                {modal.type === 'info' && <Info size={32} strokeWidth={2.5} />}
                {!modal.type && <HelpCircle size={32} strokeWidth={2.5} />}
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '12px', letterSpacing: '-0.025em' }}>{modal.title}</h3>
                <p style={{ color: '#475569', fontSize: '1.05rem', lineHeight: 1.6, whiteSpace: 'pre-wrap', fontWeight: 500 }}>{modal.message}</p>
              </div>
            </div>

            {modal.isPrompt && (
              <div style={{ marginTop: '24px', marginBottom: '8px' }}>
                <input
                  autoFocus
                  type="text"
                  placeholder="Escribe aquí..."
                  style={{ 
                    width: '100%', 
                    padding: '14px 18px',
                    borderRadius: '14px',
                    border: '2px solid #f1f5f9',
                    background: '#f8fafc',
                    fontSize: '1rem',
                    outline: 'none',
                    transition: 'all 0.2s ease',
                    color: '#0f172a',
                    fontWeight: 500
                  }}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleConfirm()
                    if (e.key === 'Escape') handleCancel()
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#4f46e5'}
                  onBlur={(e) => e.target.style.borderColor = '#f1f5f9'}
                />
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '32px' }}>
              {!modal.isAlert && (
                <button 
                  onClick={handleCancel}
                  style={{ 
                    flex: 1,
                    padding: '14px 24px',
                    borderRadius: '16px',
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    background: '#f1f5f9',
                    color: '#475569',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = '#e2e8f0'}
                  onMouseOut={(e) => e.currentTarget.style.background = '#f1f5f9'}
                >
                  {modal.cancelText}
                </button>
              )}
              <button 
                onClick={handleConfirm}
                style={{ 
                  flex: 1,
                  padding: '14px 24px',
                  borderRadius: '16px',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  background: modal.type === 'danger' ? '#ef4444' : '#4f46e5',
                  color: '#ffffff',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: modal.type === 'danger' 
                    ? '0 4px 12px rgba(239, 68, 68, 0.25)' 
                    : '0 4px 12px rgba(79, 70, 229, 0.25)'
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                {modal.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </ModalContext.Provider>
  )
}

export function useModal() {
  const context = useContext(ModalContext)
  if (context === undefined) {
    throw new Error('useModal must be used within a ModalProvider')
  }
  return context
}
