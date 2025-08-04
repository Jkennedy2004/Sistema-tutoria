'use client'

import { useState } from 'react'
import { RegisterForm } from '../components/RegisterForm'
import { AccessibilityPanel } from '../../../components/accessibility/AccessibilityPanel'
import { Accessibility, Globe } from 'lucide-react'
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

      {/* Language Indicator */}
      <div className="fixed top-4 left-4 z-40 flex items-center space-x-2 px-3 py-2 bg-white rounded-lg shadow-lg">
        <Globe className="w-4 h-4 text-blue-600" />
        <span className="text-sm font-medium text-gray-700">
          {language === 'es' ? 'Español' : 'English'}
        </span>
      </div>

      {/* Accessibility Panel */}
      <AccessibilityPanel 
        isOpen={isAccessibilityOpen}
        onClose={() => setIsAccessibilityOpen(false)}
      />

      <RegisterForm />
    </div>
  )
} 