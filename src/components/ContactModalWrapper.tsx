'use client'

import { useState, createContext, useContext } from 'react'
import { ContactModal } from './ContactModal'

interface ContactModalContextType {
  openContactModal: (email?: string) => void
}

const ContactModalContext = createContext<ContactModalContextType | undefined>(undefined)

export function useContactModal() {
  const context = useContext(ContactModalContext)
  if (!context) {
    throw new Error('useContactModal must be used within a ContactModalWrapper')
  }
  return context
}

export function ContactModalWrapper({ children }: { children: React.ReactNode }) {
  const [contactOpen, setContactOpen] = useState(false)
  const [initialEmail, setInitialEmail] = useState("")

  // Interceptar clicks en enlaces a /contact
  const handleContactLink = (e: any) => {
    if (e.target.closest && e.target.closest('[data-contact-modal-trigger]')) {
      e.preventDefault()
      setContactOpen(true)
    }
  }

  // Función para abrir el modal con email
  const openContactModal = (email: string = "") => {
    setInitialEmail(email)
    setContactOpen(true)
  }

  return (
    <ContactModalContext.Provider value={{ openContactModal }}>
      <div onClick={handleContactLink}>
        {children}
        <ContactModal 
          open={contactOpen} 
          onClose={() => setContactOpen(false)} 
          initialEmail={initialEmail}
        />
      </div>
    </ContactModalContext.Provider>
  )
}
