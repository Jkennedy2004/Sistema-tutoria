'use client'

import { useState } from 'react'
import { Send } from 'lucide-react'

interface MessageInputProps {
  onSend: (content: string) => Promise<void>
  placeholder: string
  theme: 'blue' | 'green'
  disabled?: boolean
}

export function MessageInput({
  onSend,
  placeholder,
  theme,
  disabled = false
}: MessageInputProps) {
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
    if (!message.trim() || isSending || disabled) return

    setIsSending(true)
    try {
      await onSend(message.trim())
      setMessage('')
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="border-t border-gray-200 p-4">
      <div className="flex space-x-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          disabled={disabled || isSending}
          className={`flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 ${colors.focus} focus:border-transparent disabled:opacity-50`}
        />
        <button
          onClick={handleSend}
          disabled={!message.trim() || isSending || disabled}
          className={`px-4 py-2 text-white rounded-md transition-colors disabled:opacity-50 ${colors.button}`}
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
} 