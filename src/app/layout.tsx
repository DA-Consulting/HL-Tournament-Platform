import type { Metadata } from 'next'
import { Toaster } from 'sonner'
import './globals.css'

export const metadata: Metadata = {
  title: 'Half-Life Tournament Platform | Supabase Services',
  description:
    'Plataforma de torneos Half-Life con integración completa a Supabase para gestión de Clanes y Jugadores.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>
        {children}
        <Toaster theme="dark" position="bottom-right" richColors closeButton />
      </body>
    </html>
  )
}

