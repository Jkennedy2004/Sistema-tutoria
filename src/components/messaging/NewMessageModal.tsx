'use client'

import { useState } from 'react'
import { X, Send } from 'lucide-react'

interface Contact {
  id: string
  name: string
  email: string
}

interface NewMessageModalProps {
  isOpen: boolean
  onClose: () => void
  onSend: (recipientId: string, content: string) => Promise<void>
  contacts: Contact[]
  content: {
    title: string
    selectRecipient: string
    message: string
    placeholder: string
    actions: {
      cancel: string
      send: string
    }
  }
  theme: 'blue' | 'green'
}

export function NewMessageModal({
  isOpen,
  onClose,
  onSend,
  contacts,
  content,
  theme
}: NewMessageModalProps) {
  const [selectedContact, setSelectedContact] = useState('')
  const [message, setMessage] = useState('')
  const [isSending, setIsSending] = useState(false)

  const themeColors = {
    blue: {
      button: 'bg-blue-600 hover:bg-blue-700',
      focus: 'focus:ring-blue-500'
    },
    green: {
      button: 'bg-green-600 hover:bg-green-700',
      focus: 'focus:ring-green-500'
    }
  }

  const colors = themeColors[theme]

  const handleSend = async () => {
    if (!selectedContact || !message.trim() || isSending) return

    setIsSending(true)
    try {
      await onSend(selectedContact, message.trim())
      setSelectedContact('')
      setMessage('')
      onClose()
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setIsSending(false)
    }
  }

  const handleClose = () => {
    setSelectedContact('')
    setMessage('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            {content.title}
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {content.selectRecipient}
            </label>
            <select
              value={selectedContact}
              onChange={(e) => setSelectedContact(e.target.value)}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 ${colors.focus} focus:border-transparent`}
            >
              <option value="">{content.selectRecipient}</option>
              {contacts.map((contact) => (
                <option key={contact.id} value={contact.id}>
                  {contact.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {content.message}
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={content.placeholder}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 ${colors.focus} focus:border-transparent`}
              rows={3}
            />
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              {content.actions.cancel}
            </button>
            <button
              onClick={handleSend}
              disabled={!selectedContact || !message.trim() || isSending}
              className={`flex-1 px-4 py-2 text-white rounded-md transition-colors disabled:opacity-50 ${colors.button}`}
            >
              {isSending ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <Send className="w-4 h-4" />
                  <span>{content.actions.send}</span>
                </div>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 