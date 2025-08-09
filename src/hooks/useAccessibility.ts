'use client'

import { useState, useEffect } from 'react'
import { useAccessibilityContext } from '../lib/accessibilityContext'

export interface AccessibilityState {
  // Visual Disabilities
  highContrast: boolean
  monochrome: boolean
  fontSize: number
  lineSpacing: number
  wordSpacing: number
  letterSpacing: number
  dyslexicFont: boolean
  colorblindTypography: boolean
  pageZoom: number
  focusHighlight: boolean
  skipLinks: boolean
  pauseAnimations: boolean
  screenReader: boolean
  audioDescription: boolean
  
  // Auditory Disabilities
  closedCaptions: boolean
  liveCaptions: boolean
  transcription: boolean
  audioControls: boolean
  visualAlerts: boolean
  
  // Language
  language: 'es' | 'en'
}

export function useAccessibility() {
  const { language, screenReader, setLanguage, toggleScreenReader } = useAccessibilityContext()
  
  const [state, setState] = useState<Omit<AccessibilityState, 'language' | 'screenReader'>>({
    // Visual Disabilities
    highContrast: false,
    monochrome: false,
    fontSize: 100,
    lineSpacing: 1.5,
    wordSpacing: 0,
    letterSpacing: 0,
    dyslexicFont: false,
    colorblindTypography: false,
    pageZoom: 100,
    focusHighlight: false,
    skipLinks: false,
    pauseAnimations: false,
    audioDescription: false,
    
    // Auditory Disabilities
    closedCaptions: false,
    liveCaptions: false,
    transcription: false,
    audioControls: false,
    visualAlerts: false,
  })

  // Apply accessibility settings to document
  useEffect(() => {
    const root = document.documentElement
    
    // Visual settings
    root.style.setProperty('--high-contrast', state.highContrast ? '1' : '0')
    root.style.setProperty('--monochrome', state.monochrome ? '1' : '0')
    root.style.setProperty('--font-size', `${state.fontSize}%`)
    root.style.setProperty('--line-spacing', state.lineSpacing.toString())
    root.style.setProperty('--word-spacing', `${state.wordSpacing}px`)
    root.style.setProperty('--letter-spacing', `${state.letterSpacing}px`)
    root.style.setProperty('--dyslexic-font', state.dyslexicFont ? '1' : '0')
    root.style.setProperty('--colorblind-typography', state.colorblindTypography ? '1' : '0')
    root.style.setProperty('--page-zoom', `${state.pageZoom}%`)
    root.style.setProperty('--focus-highlight', state.focusHighlight ? '1' : '0')
    root.style.setProperty('--skip-links', state.skipLinks ? '1' : '0')
    root.style.setProperty('--pause-animations', state.pauseAnimations ? '1' : '0')
    
    // Apply zoom
    document.body.style.zoom = `${state.pageZoom}%`
    
  }, [state])

  const toggleHighContrast = () => setState(prev => ({ ...prev, highContrast: !prev.highContrast }))
  const toggleMonochrome = () => setState(prev => ({ ...prev, monochrome: !prev.monochrome }))
  const increaseFontSize = () => setState(prev => ({ ...prev, fontSize: Math.min(prev.fontSize + 10, 200) }))
  const decreaseFontSize = () => setState(prev => ({ ...prev, fontSize: Math.max(prev.fontSize - 10, 50) }))
  const increaseLineSpacing = () => setState(prev => ({ ...prev, lineSpacing: Math.min(prev.lineSpacing + 0.1, 3) }))
  const decreaseLineSpacing = () => setState(prev => ({ ...prev, lineSpacing: Math.max(prev.lineSpacing - 0.1, 1) }))
  const increaseWordSpacing = () => setState(prev => ({ ...prev, wordSpacing: Math.min(prev.wordSpacing + 1, 10) }))
  const decreaseWordSpacing = () => setState(prev => ({ ...prev, wordSpacing: Math.max(prev.wordSpacing - 1, 0) }))
  const increaseLetterSpacing = () => setState(prev => ({ ...prev, letterSpacing: Math.min(prev.letterSpacing + 0.5, 5) }))
  const decreaseLetterSpacing = () => setState(prev => ({ ...prev, letterSpacing: Math.max(prev.letterSpacing - 0.5, 0) }))
  const toggleDyslexicFont = () => setState(prev => ({ ...prev, dyslexicFont: !prev.dyslexicFont }))
  const toggleColorblindTypography = () => setState(prev => ({ ...prev, colorblindTypography: !prev.colorblindTypography }))
  const increaseZoom = () => setState(prev => ({ ...prev, pageZoom: Math.min(prev.pageZoom + 10, 200) }))
  const decreaseZoom = () => setState(prev => ({ ...prev, pageZoom: Math.max(prev.pageZoom - 10, 50) }))
  const toggleFocusHighlight = () => setState(prev => ({ ...prev, focusHighlight: !prev.focusHighlight }))
  const toggleSkipLinks = () => setState(prev => ({ ...prev, skipLinks: !prev.skipLinks }))
  const togglePauseAnimations = () => setState(prev => ({ ...prev, pauseAnimations: !prev.pauseAnimations }))
  const toggleAudioDescription = () => setState(prev => ({ ...prev, audioDescription: !prev.audioDescription }))
  
  // Auditory settings
  const toggleClosedCaptions = () => setState(prev => ({ ...prev, closedCaptions: !prev.closedCaptions }))
  const toggleLiveCaptions = () => setState(prev => ({ ...prev, liveCaptions: !prev.liveCaptions }))
  const toggleTranscription = () => setState(prev => ({ ...prev, transcription: !prev.transcription }))
  const toggleAudioControls = () => setState(prev => ({ ...prev, audioControls: !prev.audioControls }))
  const toggleVisualAlerts = () => setState(prev => ({ ...prev, visualAlerts: !prev.visualAlerts }))
  
  // Reset all settings
  const resetAll = () => setState({
    highContrast: false,
    monochrome: false,
    fontSize: 100,
    lineSpacing: 1.5,
    wordSpacing: 0,
    letterSpacing: 0,
    dyslexicFont: false,
    colorblindTypography: false,
    pageZoom: 100,
    focusHighlight: false,
    skipLinks: false,
    pauseAnimations: false,
    audioDescription: false,
    closedCaptions: false,
    liveCaptions: false,
    transcription: false,
    audioControls: false,
    visualAlerts: false,
  })

  return {
    ...state,
    language,
    screenReader,
    toggleHighContrast,
    toggleMonochrome,
    increaseFontSize,
    decreaseFontSize,
    increaseLineSpacing,
    decreaseLineSpacing,
    increaseWordSpacing,
    decreaseWordSpacing,
    increaseLetterSpacing,
    decreaseLetterSpacing,
    toggleDyslexicFont,
    toggleColorblindTypography,
    increaseZoom,
    decreaseZoom,
    toggleFocusHighlight,
    toggleSkipLinks,
    togglePauseAnimations,
    toggleScreenReader,
    toggleAudioDescription,
    toggleClosedCaptions,
    toggleLiveCaptions,
    toggleTranscription,
    toggleAudioControls,
    toggleVisualAlerts,
    setLanguage,
    resetAll
  }
} 