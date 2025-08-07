import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AccessibilityProvider } from '../lib/accessibilityContext'
import { AuthProvider } from '../lib/auth/AuthContext'
import { LanguageIndicator } from '../components/accessibility/LanguageIndicator'
import { ContactModalWrapper } from '../components/ContactModalWrapper'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'TutorPro - Gestor de Tutorías',
  description: 'Plataforma moderna para conectar estudiantes con tutores expertos',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <AuthProvider>
          <AccessibilityProvider>
            <ContactModalWrapper>
              {children}
              <LanguageIndicator />
            </ContactModalWrapper>
          </AccessibilityProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
