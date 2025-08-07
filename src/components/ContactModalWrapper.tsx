'use client'

import { useState } from 'react'
import { ContactModal } from './ContactModal'

export function ContactModalWrapper({ children }: { children: React.ReactNode }) {
  const [contactOpen, setContactOpen] = useState(false)

  // Interceptar clicks en enlaces a /contact
  const handleContactLink = (e: any) => {
    if (e.target.closest && e.target.closest('[data-contact-modal-trigger]')) {
      e.preventDefault()
      setContactOpen(true)
    }
  }

  return (
    <div onClick={handleContactLink}>
      {children}
      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} />
    </div>
  )
}
