import { useState, useRef, useEffect } from 'react'
import { Send, Paperclip, X, Copy, Check, Loader2, Trash2, Plus } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { useChatStore } from '../stores/chatStore'
import { cn, formatDate, validateFile, formatFileSize } from '../lib/utils'
import { Message, FileAttachment, Conversation } from '../types'

function MessageBubble({ message, isStreaming }: { message: Message; isStreaming?: boolean }) {
  const [copied, setCopied] = useState(false)
  
  return (
    <div className={cn('flex gap-3', message.role === 'user' ? 'flex-row-reverse' : '')}>
      <div
        className={cn(
          'max-w-[70%] rounded-2xl px-4 py-2.5',
          message.role === 'user'
            ? 'bg-nvidia-green text-white rounded-tr-md'
            : 'bg-white text-gray-900 border border-gray-200 rounded-tl-md'
        )}
      >
        {message.files && message.files.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {message.files.map((file) => (
              <div key={file.id} className="flex items-center gap-2 px-3 py-1.5 bg-black/10 rounded-lg text-sm">
                <Paperclip className="w-4 h-4" />
                <span className="truncate max-w-[150px]">{file.name}</span>
                <span className="text-xs opacity-60">{formatFileSize(file.size)}</span>
              </div>
            ))}
          </div>
        )}
        <div className={cn('prose prose-sm max-w-none', message.role === 'user' ? 'text-white' : '')}>
          <ReactMarkdown>{message.content || (isStreaming ? '▌' : '')}</ReactMarkdown>
        </div>
        <div className="mt-2 flex items-center justify-end gap-2">
          <span className="text-xs opacity-60">{formatDate(message.timestamp)}</span>
          {message.role === 'assistant' && message.content && (
            <button
              onClick={() => {
                navigator.clipboard.writeText(message.content)
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
              }}
              className="p-1.5 rounded hover:bg-black/10 transition-colors"
              title="Copy"
            >
              {copied ? <Check className="w-4 h-4 text-nvidia-green" /> : <Copy className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function ConversationSidebar() {
  const { conversations, currentConversationId, setCurrentConversation, createConversation } = useChatStore()

  return (
    <aside className="hidden lg:block w-80 bg-white border-r border-gray-200 flex flex-col h-full">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">Chats</h2>
        <button
          onClick={() => setCurrentConversation(createConversation().id)}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
          title="New chat"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-thin p-2 space-y-1">
        {conversations.length === 0 ? (
          <p className="text-center text-gray-500 py-8 text-sm">No conversations yet</p>
        ) : (
          conversations.map((conv) => (
            <ConversationItem key={conv.id} conversation={conv} isActive={conv.id === currentConversationId} />
          ))
        )}
      </div>
    </aside>
  )
}

function ConversationItem({ conversation, isActive }: { conversation: Conversation; isActive: boolean }) {
  const { setCurrentConversation, deleteConversation } = useChatStore()

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm('Delete this conversation?')) deleteConversation(conversation.id)
  }

  return (
    <div className="relative group">
      <button
        onClick={() => setCurrentConversation(conversation.id)}
        className={cn(
          'w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors flex items-center gap-2',
          isActive
            ? 'bg-nvidia-green/10 text-nvidia-green'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        )}
      >
        <div className="flex-1 min-w-0 truncate">{conversation.title || 'Untitled'}</div>
        <span className="text-xs text-gray-400 whitespace-nowrap">{formatDate(conversation.updatedAt)}</span>
      </button>
      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={handleDelete}
          className="p-1.5 rounded hover:bg-red-100 text-red-500"
          title="Delete"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

function ChatHeader({ conversation }: { conversation: Conversation | null }) {
  return (
    <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-200 px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-nvidia-green/10 flex items-center justify-center">
          <svg className="w-6 h-6 text-nvidia-green" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
        </div>
        <div>
          <h1 className="font-semibold text-gray-900">{conversation?.title || 'Select a chat'}</h1>
          <p className="text-sm text-gray-500">
            {conversation ? `${conversation.messages.length} messages` : 'Start a new conversation'}
          </p>
        </div>
      </div>
    </header>
  )
}

function MessageList({ conversation }: { conversation: Conversation | null }) {
  const { isLoading } = useChatStore()
  const endRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversation?.messages, isLoading])

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Start a conversation</h2>
          <p className="text-gray-500">Select a chat from the sidebar or create a new one</p>
        </div>
      </div>
    )
  }

  return (
    <div ref={messagesContainerRef} className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-4">
      {conversation.messages.map((msg, idx) => (
        <MessageBubble
          key={msg.id}
          message={msg}
          isStreaming={idx === conversation.messages.length - 1 && msg.role === 'assistant' && isLoading}
        />
      ))}
      {isLoading && <MessageBubble message={{ id: 'loading', role: 'assistant', content: '', timestamp: new Date().toISOString() }} isStreaming />}
      <div ref={endRef} />
    </div>
  )
}

function MessageInput({ conversation }: { conversation: Conversation | null }) {
  const { sendMessage, isLoading } = useChatStore()
  const [text, setText] = useState('')
  const [files, setFiles] = useState<FileAttachment[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if ((!text.trim() && files.length === 0) || isLoading || !conversation) return
    sendMessage(text, files)
    setText('')
    setFiles([])
    textareaRef.current?.focus()
  }

  const handleFileSelect = (selectedFiles: FileList) => {
    const validFiles: FileAttachment[] = []
    for (const file of Array.from(selectedFiles)) {
      const error = validateFile(file)
      if (!error) {
        validFiles.push({
          id: crypto.randomUUID(),
          name: file.name,
          type: file.type,
          size: file.size,
        })
      }
    }
    setFiles((prev) => [...prev, ...validFiles])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removeFile = (id: string) => setFiles((prev) => prev.filter((f) => f.id !== id))

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border-t border-gray-200 p-4 bg-white">
      {files.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2" role="list" aria-label="Attached files">
          {files.map((file) => (
            <div key={file.id} className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg" role="listitem">
              <Paperclip className="w-4 h-4 text-gray-600" />
              <span className="text-sm truncate max-w-[200px]">{file.name}</span>
              <span className="text-xs text-gray-500">{formatFileSize(file.size)}</span>
              <button
                type="button"
                onClick={() => removeFile(file.id)}
                className="p-1 rounded hover:bg-gray-200 text-gray-500"
                aria-label={`Remove ${file.name}`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="relative">
        <div className="flex items-end gap-2">
          <label htmlFor="file-upload" className="p-2.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors cursor-pointer">
            <Paperclip className="w-5 h-5" />
            <input
              id="file-upload"
              ref={fileInputRef}
              type="file"
              multiple
              onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
              className="hidden"
              accept=".txt,.md,.pdf,.json,.js,.ts,.jsx,.tsx,.py,.html,.css,.xml,.csv"
            />
          </label>
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isLoading ? 'Waiting for response...' : 'Message NVIDIA...'}
            disabled={isLoading || !conversation}
            rows={1}
            className="flex-1 min-h-[44px] max-h-48 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-nvidia-green focus:border-transparent resize-none transition-shadow"
            style={{ height: '44px' }}
          />
          <button
            type="submit"
            disabled={isLoading || (!text.trim() && files.length === 0) || !conversation}
            className="p-2.5 rounded-xl bg-nvidia-green text-white hover:bg-nvidia-green/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
            aria-label="Send message"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </form>
  )
}

export function ChatPage() {
  const { currentConversationId, conversations } = useChatStore()
  const conversation = conversations.find((c) => c.id === currentConversationId) || null

  return (
    <div className="flex h-[calc(100vh-4rem)] lg:h-[calc(100vh-3.5rem)]">
      <ConversationSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <ChatHeader conversation={conversation} />
        <MessageList conversation={conversation} />
        <MessageInput conversation={conversation} />
      </div>
    </div>
  )
}