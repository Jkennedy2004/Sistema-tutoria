'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface AccessibilityContextType {
  language: 'es' | 'en'
  screenReader: boolean
  setLanguage: (language: 'es' | 'en') => void
  toggleScreenReader: () => void
  speakText: (text: string) => void
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined)

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<'es' | 'en'>('es')
  const [screenReader, setScreenReader] = useState(false)

  // Screen reader functionality
  const speakText = (text: string) => {
    if (screenReader && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = language === 'es' ? 'es-ES' : 'en-US'
      speechSynthesis.speak(utterance)
    }
  }

  const toggleScreenReader = () => {
    setScreenReader(!screenReader)
    if (screenReader) {
      speechSynthesis.cancel() // Stop any ongoing speech
    }
  }

  const setLanguage = (newLanguage: 'es' | 'en') => {
    setLanguageState(newLanguage)
  }

  // Helper function to check if element is interactive
  const isInteractiveElement = (element: HTMLElement): boolean => {
    const interactiveTags = ['button', 'a', 'input', 'select', 'textarea', 'label']
    const interactiveRoles = ['button', 'link', 'menuitem', 'tab', 'checkbox', 'radio', 'switch']
    
    // Check if it's an interactive HTML tag
    if (interactiveTags.includes(element.tagName.toLowerCase())) {
      return true
    }
    
    // Check if it has an interactive role
    const role = element.getAttribute('role')
    if (role && interactiveRoles.includes(role)) {
      return true
    }
    
    // Check if it has tabindex (can be focused)
    if (element.hasAttribute('tabindex')) {
      return true
    }
    
    // Check if it has click handlers
    if (element.onclick || element.getAttribute('onclick')) {
      return true
    }
    
    // Check if it's a child of an interactive element
    const parent = element.closest(interactiveTags.join(', '))
    if (parent) {
      return true
    }
    
    return false
  }

  // Helper function to clean text content
  const cleanText = (text: string): string => {
    return text.replace(/\s+/g, ' ').trim()
  }

  // Helper function to get accessible text for an element
  const getAccessibleText = (element: HTMLElement): string => {
    // Priority order for accessible text
    const ariaLabel = element.getAttribute('aria-label')
    if (ariaLabel) return cleanText(ariaLabel)
    
    const title = element.getAttribute('title')
    if (title) return cleanText(title)
    
    const alt = element.getAttribute('alt')
    if (alt) return cleanText(alt)
    
    // For interactive elements, get their text content
    if (isInteractiveElement(element)) {
      const textContent = element.textContent?.trim()
      if (textContent) return cleanText(textContent)
    }
    
    // For form controls, get their label or placeholder
    if (element.tagName.toLowerCase() === 'input') {
      const placeholder = element.getAttribute('placeholder')
      if (placeholder) return cleanText(placeholder)
      
      // Try to find associated label
      const id = element.getAttribute('id')
      if (id) {
        const label = document.querySelector(`label[for="${id}"]`)
        if (label) {
          const labelText = label.textContent?.trim()
          if (labelText) return cleanText(labelText)
        }
      }
    }
    
    // For content elements (headings, paragraphs, etc.), get their text content
    const contentTags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'div']
    if (contentTags.includes(element.tagName.toLowerCase())) {
      const textContent = element.textContent?.trim()
      if (textContent && textContent.length > 0 && textContent.length < 200) {
        // Check if this element is a child of another element with the same text
        const parent = element.parentElement
        if (parent) {
          const parentText = parent.textContent?.trim()
          if (parentText && cleanText(parentText) === cleanText(textContent)) {
            return '' // Don't read if parent has same text
          }
        }
        return cleanText(textContent)
      }
    }
    
    return ''
  }

  // Global screen reader for hover and focus events
  useEffect(() => {
    if (!screenReader) return

    let lastSpokenText = ''
    let lastSpokenTime = 0
    const DEBOUNCE_TIME = 1000 // 1 second debounce

    const handleMouseOver = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      const accessibleText = getAccessibleText(target)
      
      if (accessibleText && accessibleText !== lastSpokenText) {
        const now = Date.now()
        if (now - lastSpokenTime > DEBOUNCE_TIME) {
          speakText(accessibleText)
          lastSpokenText = accessibleText
          lastSpokenTime = now
        }
      }
    }

    const handleFocus = (event: FocusEvent) => {
      const target = event.target as HTMLElement
      const accessibleText = getAccessibleText(target)
      
      if (accessibleText && accessibleText !== lastSpokenText) {
        const now = Date.now()
        if (now - lastSpokenTime > DEBOUNCE_TIME) {
          speakText(accessibleText)
          lastSpokenText = accessibleText
          lastSpokenTime = now
        }
      }
    }

    document.addEventListener('mouseover', handleMouseOver)
    document.addEventListener('focus', handleFocus, true)

    return () => {
      document.removeEventListener('mouseover', handleMouseOver)
      document.removeEventListener('focus', handleFocus, true)
    }
  }, [screenReader, language])

  return (
    <AccessibilityContext.Provider
      value={{
        language,
        screenReader,
        setLanguage,
        toggleScreenReader,
        speakText
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  )
}

export function useAccessibilityContext() {
  const context = useContext(AccessibilityContext)
  if (context === undefined) {
    throw new Error('useAccessibilityContext must be used within an AccessibilityProvider')
  }
  return context
} 