'use client'

import { Globe } from 'lucide-react'
import { useAccessibilityContext } from '../../lib/accessibilityContext'

export function LanguageIndicator() {
  const { language } = useAccessibilityContext()

  return (
    <div className="fixed bottom-4 right-4 z-40 flex items-center space-x-2 px-3 py-2 bg-white rounded-lg shadow-lg">
      <Globe className="w-4 h-4 text-blue-600" />
      <span className="text-sm font-medium text-gray-700">
        {language === 'es' ? 'Español' : 'English'}
      </span>
    </div>
  )
}


