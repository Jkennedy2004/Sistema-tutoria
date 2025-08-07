'use client'

import { useState } from 'react'
import { RegisterForm } from '../components/RegisterForm'
import { AccessibilityPanel } from '../../../components/accessibility/AccessibilityPanel'
import { Accessibility } from 'lucide-react'
import { useAccessibilityContext } from '../../../lib/accessibilityContext'

export default function RegisterPage() {
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

      <RegisterForm />
    </div>
  )
} 