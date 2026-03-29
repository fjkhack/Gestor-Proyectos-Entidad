import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Sidebar } from '@/components/Sidebar'
import { ToastProvider } from '@/components/ui/Toast'
import { ModalProvider } from '@/components/ui/ModalProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Portal AEMA III',
  description: 'Gestión integral de proyectos y merchandising',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={`${inter.className} bg-slate-50 text-slate-900 antialiased`}>
        <ToastProvider>
          <ModalProvider>
            <div className="flex min-h-screen">
              <Sidebar />
              <main className="flex-1 lg:ml-64 p-4 sm:p-6 lg:p-8 print:ml-0 print:p-4">
                {children}
              </main>
            </div>
          </ModalProvider>
        </ToastProvider>
      </body>
    </html>
  )
}
