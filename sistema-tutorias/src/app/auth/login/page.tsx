'use client'

import { useState } from 'react'
import { LoginForm } from '../components/LoginForm'
import { AccessibilityPanel } from '../../../components/accessibility/AccessibilityPanel'
import { Accessibility } from 'lucide-react'
import { useAccessibilityContext } from '../../../lib/accessibilityContext'

export default function LoginPage() {
  const [isAccessibilityOpen, setIsAccessibilityOpen] = useState(false)
  const { language } = useAccessibilityContext()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Accessibility Button */}
      <button
        onClick={() => setIsAccessibilityOpen(true)}
        className="accessibility-btn"
        aria-label="Abrir panel de accesibilidad"
      >
        <Accessibility className="w-6 h-6" />
      </button>



      {/* Accessibility Panel */}
      <AccessibilityPanel 
        isOpen={isAccessibilityOpen}
        onClose={() => setIsAccessibilityOpen(false)}
      />

      <LoginForm />
    </div>
  )
} 