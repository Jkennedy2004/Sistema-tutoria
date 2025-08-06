'use client'

import { useState } from 'react'
import { Edit3, Trash2, Check, CheckCheck, X } from 'lucide-react'

interface MessageBubbleProps {
  message: {
    id: string
    content: string
    sender_id: string
    receiver_id: string
    created_at: string
    is_read: boolean
    is_edited?: boolean
  }
  currentUserId: string
  onEdit: (messageId: string, newContent: string) => Promise<void>
  onDelete: (messageId: string) => Promise<void>
  formatDate: (dateString: string) => string
  content: {
    actions: {
      save: string
      cancel: string
    }
    messageStatus: {
      edited: string
    }
  }
  theme: 'blue' | 'green'
}

export function MessageBubble({
  message,
  currentUserId,
  onEdit,
  onDelete,
  formatDate,
  content,
  theme
}: MessageBubbleProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(message.content)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isOwnMessage = message.sender_id === currentUserId
  const themeColors = {
    blue: {
      bg: 'bg-blue-500 text-white',
      hover: 'hover:text-blue-600',
      focus: 'focus:ring-blue-500',
      button: 'bg-blue-500 text-white'
    },
    green: {
      bg: 'bg-green-500 text-white',
      hover: 'hover:text-green-600',
      focus: 'focus:ring-green-500',
      button: 'bg-green-500 text-white'
    }
  }

  const colors = themeColors[theme]

  const handleEdit = async () => {
    if (!editContent.trim() || editContent === message.content) {
      setIsEditing(false)
      return
    }

    setIsSubmitting(true)
    try {
      await onEdit(message.id, editContent)
      setIsEditing(false)
    } catch (error) {
      console.error('Error editing message:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    setEditContent(message.content)
    setIsEditing(false)
  }

  const handleDelete = async () => {
    if (confirm('¿Estás seguro de que quieres eliminar este mensaje?')) {
      try {
        await onDelete(message.id)
      } catch (error) {
        console.error('Error deleting message:', error)
      }
    }
  }

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-xs lg:max-w-md ${isOwnMessage ? 'order-2' : 'order-1'}`}>
        <div className={`rounded-lg px-4 py-2 ${
          isOwnMessage ? colors.bg : 'bg-gray-100 text-gray-900'
        }`}>
          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className={`w-full p-2 text-sm border rounded resize-none focus:ring-2 ${colors.focus}`}
                rows={2}
                autoFocus
              />
              <div className="flex space-x-2">
                <button
                  onClick={handleEdit}
                  disabled={isSubmitting}
                  className={`text-xs ${colors.button} px-2 py-1 rounded disabled:opacity-50`}
                >
                  {isSubmitting ? '...' : content.actions.save}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={isSubmitting}
                  className="text-xs bg-gray-500 text-white px-2 py-1 rounded disabled:opacity-50"
                >
                  {content.actions.cancel}
                </button>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-sm">{message.content}</p>
              {message.is_edited && (
                <p className="text-xs opacity-70 mt-1">
                  {content.messageStatus.edited}
                </p>
              )}
            </div>
          )}
        </div>
        <div className={`flex items-center justify-between mt-1 text-xs text-gray-500 ${
          isOwnMessage ? 'justify-end' : 'justify-start'
        }`}>
          <span>{formatDate(message.created_at)}</span>
          {isOwnMessage && (
            <div className="flex items-center space-x-1">
              {message.is_read ? (
                <CheckCheck className="w-3 h-3 text-blue-500" />
              ) : (
                <Check className="w-3 h-3" />
              )}
              <div className="flex space-x-1">
                <button
                  onClick={() => {
                    setEditContent(message.content)
                    setIsEditing(true)
                  }}
                  className={colors.hover}
                  title="Editar mensaje"
                >
                  <Edit3 className="w-3 h-3" />
                </button>
                <button
                  onClick={handleDelete}
                  className="hover:text-red-600"
                  title="Eliminar mensaje"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 