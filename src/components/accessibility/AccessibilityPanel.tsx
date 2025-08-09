'use client'

import { useState } from 'react'
import { useAccessibility } from '../../hooks/useAccessibility'
import { translations } from '../../lib/translations'
import { useAccessibilityContext } from '../../lib/accessibilityContext'
import { 
  Accessibility, 
  X, 
  Eye, 
  Headphones, 
  Contrast, 
  Palette, 
  Type, 
  ZoomIn, 
  ZoomOut, 
  Volume2, 
  VolumeX, 
  Subtitles, 
  FileText, 
  Download, 
  Bell, 
  RotateCcw,
  Globe,
  Plus,
  Minus,
  EyeOff
} from 'lucide-react'

interface AccessibilityPanelProps {
  isOpen: boolean
  onClose: () => void
}

export function AccessibilityPanel({ isOpen, onClose }: AccessibilityPanelProps) {
  const [activeSection, setActiveSection] = useState<'visual' | 'auditory'>('visual')
  const accessibility = useAccessibility()
  const { language, screenReader, setLanguage, speakText } = useAccessibilityContext()
  const t = translations[language].accessibility.panel

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Accessibility className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">
              {t.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-md hover:bg-gray-100 transition-colors"
            aria-label="Cerrar panel"
            onFocus={() => speakText('Botón cerrar panel')}
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Language Selector */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Globe className="w-5 h-5 text-gray-600" />
              <span className="font-medium text-gray-700">{translations[language].accessibility.panel.language.title}</span>
            </div>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as 'es' | 'en')}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              onFocus={() => speakText('Selector de idioma')}
              aria-label="Seleccionar idioma"
            >
              <option value="es">Español</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>

        {/* Section Navigation */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveSection('visual')}
            className={`flex-1 flex items-center justify-center space-x-2 px-6 py-4 font-medium transition-colors ${
              activeSection === 'visual'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            onFocus={() => speakText('Sección discapacidad visual')}
            aria-label={`Cambiar a sección ${t.visual.title}`}
          >
            <Eye className="w-5 h-5" />
            <span>{t.visual.title}</span>
          </button>
          <button
            onClick={() => setActiveSection('auditory')}
            className={`flex-1 flex items-center justify-center space-x-2 px-6 py-4 font-medium transition-colors ${
              activeSection === 'auditory'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            onFocus={() => speakText('Sección discapacidad auditiva')}
            aria-label={`Cambiar a sección ${t.auditory.title}`}
          >
            <Headphones className="w-5 h-5" />
            <span>{t.auditory.title}</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeSection === 'visual' && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* High Contrast */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Contrast className="w-5 h-5 text-gray-600" />
                    <span className="font-medium">{t.visual.highContrast}</span>
                  </div>
                  <button
                    onClick={accessibility.toggleHighContrast}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      accessibility.highContrast ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                    onFocus={() => speakText(`${t.visual.highContrast}. ${accessibility.highContrast ? 'Activado' : 'Desactivado'}`)}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      accessibility.highContrast ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                {/* Monochrome */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Palette className="w-5 h-5 text-gray-600" />
                    <span className="font-medium">{t.visual.monochrome}</span>
                  </div>
                  <button
                    onClick={accessibility.toggleMonochrome}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      accessibility.monochrome ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                    onFocus={() => speakText(`${t.visual.monochrome}. ${accessibility.monochrome ? 'Activado' : 'Desactivado'}`)}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      accessibility.monochrome ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                {/* Font Size */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Type className="w-5 h-5 text-gray-600" />
                    <span className="font-medium">{t.visual.fontSize}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={accessibility.decreaseFontSize}
                      className="p-1 rounded hover:bg-gray-200"
                      onFocus={() => speakText('Disminuir tamaño de fuente')}
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-12 text-center font-medium">{accessibility.fontSize}%</span>
                    <button
                      onClick={accessibility.increaseFontSize}
                      className="p-1 rounded hover:bg-gray-200"
                      onFocus={() => speakText('Aumentar tamaño de fuente')}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Line Spacing */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Type className="w-5 h-5 text-gray-600" />
                    <span className="font-medium">{t.visual.lineSpacing}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={accessibility.decreaseLineSpacing}
                      className="p-1 rounded hover:bg-gray-200"
                      onFocus={() => speakText('Disminuir espaciado de línea')}
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-12 text-center font-medium">{accessibility.lineSpacing.toFixed(1)}</span>
                    <button
                      onClick={accessibility.increaseLineSpacing}
                      className="p-1 rounded hover:bg-gray-200"
                      onFocus={() => speakText('Aumentar espaciado de línea')}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Word Spacing */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Type className="w-5 h-5 text-gray-600" />
                    <span className="font-medium">{t.visual.wordSpacing}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={accessibility.decreaseWordSpacing}
                      className="p-1 rounded hover:bg-gray-200"
                      onFocus={() => speakText('Disminuir espaciado de palabras')}
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-12 text-center font-medium">{accessibility.wordSpacing}px</span>
                    <button
                      onClick={accessibility.increaseWordSpacing}
                      className="p-1 rounded hover:bg-gray-200"
                      onFocus={() => speakText('Aumentar espaciado de palabras')}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Letter Spacing */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Type className="w-5 h-5 text-gray-600" />
                    <span className="font-medium">{t.visual.letterSpacing}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={accessibility.decreaseLetterSpacing}
                      className="p-1 rounded hover:bg-gray-200"
                      onFocus={() => speakText('Disminuir espaciado de caracteres')}
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-12 text-center font-medium">{accessibility.letterSpacing}px</span>
                    <button
                      onClick={accessibility.increaseLetterSpacing}
                      className="p-1 rounded hover:bg-gray-200"
                      onFocus={() => speakText('Aumentar espaciado de caracteres')}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Page Zoom */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <ZoomIn className="w-5 h-5 text-gray-600" />
                    <span className="font-medium">{t.visual.pageZoom}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={accessibility.decreaseZoom}
                      className="p-1 rounded hover:bg-gray-200"
                      onFocus={() => speakText('Disminuir zoom de página')}
                    >
                      <ZoomOut className="w-4 h-4" />
                    </button>
                    <span className="w-12 text-center font-medium">{accessibility.pageZoom}%</span>
                    <button
                      onClick={accessibility.increaseZoom}
                      className="p-1 rounded hover:bg-gray-200"
                      onFocus={() => speakText('Aumentar zoom de página')}
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Dyslexic Font */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Type className="w-5 h-5 text-gray-600" />
                    <span className="font-medium">{t.visual.dyslexicFont}</span>
                  </div>
                  <button
                    onClick={accessibility.toggleDyslexicFont}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      accessibility.dyslexicFont ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                    onFocus={() => speakText(`${t.visual.dyslexicFont}. ${accessibility.dyslexicFont ? 'Activado' : 'Desactivado'}`)}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      accessibility.dyslexicFont ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                {/* Colorblind Typography */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <EyeOff className="w-5 h-5 text-gray-600" />
                    <span className="font-medium">{t.visual.colorblindTypography}</span>
                  </div>
                  <button
                    onClick={accessibility.toggleColorblindTypography}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      accessibility.colorblindTypography ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                    onFocus={() => speakText(`${t.visual.colorblindTypography}. ${accessibility.colorblindTypography ? 'Activado' : 'Desactivado'}`)}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      accessibility.colorblindTypography ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                {/* Focus Highlight */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Eye className="w-5 h-5 text-gray-600" />
                    <span className="font-medium">{t.visual.focusHighlight}</span>
                  </div>
                  <button
                    onClick={accessibility.toggleFocusHighlight}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      accessibility.focusHighlight ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                    onFocus={() => speakText(`${t.visual.focusHighlight}. ${accessibility.focusHighlight ? 'Activado' : 'Desactivado'}`)}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      accessibility.focusHighlight ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                {/* Skip Links */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Accessibility className="w-5 h-5 text-gray-600" />
                    <span className="font-medium">{t.visual.skipLinks}</span>
                  </div>
                  <button
                    onClick={accessibility.toggleSkipLinks}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      accessibility.skipLinks ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                    onFocus={() => speakText(`${t.visual.skipLinks}. ${accessibility.skipLinks ? 'Activado' : 'Desactivado'}`)}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      accessibility.skipLinks ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                {/* Pause Animations */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <VolumeX className="w-5 h-5 text-gray-600" />
                    <span className="font-medium">{t.visual.pauseAnimations}</span>
                  </div>
                  <button
                    onClick={accessibility.togglePauseAnimations}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      accessibility.pauseAnimations ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                    onFocus={() => speakText(`${t.visual.pauseAnimations}. ${accessibility.pauseAnimations ? 'Activado' : 'Desactivado'}`)}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      accessibility.pauseAnimations ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                {/* Screen Reader */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Volume2 className="w-5 h-5 text-gray-600" />
                    <span className="font-medium">{t.visual.screenReader}</span>
                  </div>
                  <button
                    onClick={accessibility.toggleScreenReader}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      screenReader ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                    onFocus={() => speakText(`${t.visual.screenReader}. ${screenReader ? 'Activado' : 'Desactivado'}`)}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      screenReader ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'auditory' && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Closed Captions */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Subtitles className="w-5 h-5 text-gray-600" />
                    <span className="font-medium">{t.auditory.closedCaptions}</span>
                  </div>
                  <button
                    onClick={accessibility.toggleClosedCaptions}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      accessibility.closedCaptions ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                    onFocus={() => speakText(`${t.auditory.closedCaptions}. ${accessibility.closedCaptions ? 'Activado' : 'Desactivado'}`)}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      accessibility.closedCaptions ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                {/* Live Captions */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-5 h-5 text-gray-600" />
                    <span className="font-medium">{t.auditory.liveCaptions}</span>
                  </div>
                  <button
                    onClick={accessibility.toggleLiveCaptions}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      accessibility.liveCaptions ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                    onFocus={() => speakText(`${t.auditory.liveCaptions}. ${accessibility.liveCaptions ? 'Activado' : 'Desactivado'}`)}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      accessibility.liveCaptions ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                {/* Transcription */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Download className="w-5 h-5 text-gray-600" />
                    <span className="font-medium">{t.auditory.transcription}</span>
                  </div>
                  <button
                    onClick={accessibility.toggleTranscription}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      accessibility.transcription ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                    onFocus={() => speakText(`${t.auditory.transcription}. ${accessibility.transcription ? 'Activado' : 'Desactivado'}`)}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      accessibility.transcription ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                {/* Audio Controls */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Volume2 className="w-5 h-5 text-gray-600" />
                    <span className="font-medium">{t.auditory.audioControls}</span>
                  </div>
                  <button
                    onClick={accessibility.toggleAudioControls}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      accessibility.audioControls ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                    onFocus={() => speakText(`${t.auditory.audioControls}. ${accessibility.audioControls ? 'Activado' : 'Desactivado'}`)}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      accessibility.audioControls ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                {/* Visual Alerts */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Bell className="w-5 h-5 text-gray-600" />
                    <span className="font-medium">{t.auditory.visualAlerts}</span>
                  </div>
                  <button
                    onClick={accessibility.toggleVisualAlerts}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      accessibility.visualAlerts ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                    onFocus={() => speakText(`${t.auditory.visualAlerts}. ${accessibility.visualAlerts ? 'Activado' : 'Desactivado'}`)}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      accessibility.visualAlerts ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <button
            onClick={accessibility.resetAll}
            className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            onFocus={() => speakText('Botón restablecer configuración')}
          >
            <RotateCcw className="w-4 h-4" />
            <span>{t.reset}</span>
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            onFocus={() => speakText('Botón cerrar')}
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  )
} 