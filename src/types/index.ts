export interface User {
  id: string
  email: string
  name: string
  createdAt: string
}

export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  files?: FileAttachment[]
}

export interface FileAttachment {
  id: string
  name: string
  type: string
  size: number
  url?: string
  base64?: string
}

export interface Conversation {
  id: string
  title: string
  messages: Message[]
  createdAt: string
  updatedAt: string
}

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string) => Promise<void>
  logout: () => void
}

export interface ChatState {
  conversations: Conversation[]
  currentConversationId: string | null
  isLoading: boolean
  createConversation: () => Conversation
  setCurrentConversation: (id: string) => void
  addMessage: (conversationId: string, message: Message) => void
  updateMessage: (conversationId: string, messageId: string, content: string) => void
  deleteConversation: (id: string) => void
  sendMessage: (content: string, files?: FileAttachment[]) => Promise<void>
}

export interface NvidiaApiConfig {
  apiKey: string
  baseUrl: string
  model: string
}