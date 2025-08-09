'use client'

import { User, GraduationCap } from 'lucide-react'

interface Conversation {
  id: string
  name: string
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
  isStudent?: boolean
}

interface ConversationListProps {
  conversations: Conversation[]
  selectedConversation: string
  onSelectConversation: (conversationId: string) => void
  formatDate: (dateString: string) => string
  emptyMessage: string
  title: string
  theme: 'blue' | 'green'
}

export function ConversationList({
  conversations,
  selectedConversation,
  onSelectConversation,
  formatDate,
  emptyMessage,
  title,
  theme
}: ConversationListProps) {
  const themeColors = {
    blue: {
      selected: 'bg-blue-50 border-blue-500',
      icon: 'text-blue-600'
    },
    green: {
      selected: 'bg-green-50 border-green-500',
      icon: 'text-green-600'
    }
  }

  const colors = themeColors[theme]

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
      </div>
      <div className="max-h-96 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="p-6 text-center">
            <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">{emptyMessage}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => onSelectConversation(conversation.id)}
                className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                  selectedConversation === conversation.id ? `${colors.selected} border-r-2` : ''
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {conversation.isStudent ? (
                      <GraduationCap className={`w-4 h-4 ${colors.icon}`} />
                    ) : (
                      <User className={`w-4 h-4 ${colors.icon}`} />
                    )}
                    <h4 className="font-medium text-gray-900">{conversation.name}</h4>
                  </div>
                  {conversation.unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
                      {conversation.unreadCount}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 truncate mb-1">
                  {conversation.lastMessage}
                </p>
                <p className="text-xs text-gray-400">
                  {formatDate(conversation.lastMessageTime)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 