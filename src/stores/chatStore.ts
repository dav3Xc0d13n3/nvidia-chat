import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'
import { ChatState, Conversation, Message, FileAttachment } from '../types'
import { useAuthStore } from './authStore'

const DEFAULT_BASE_URL = 'https://integrate.api.nvidia.com/v1'
const DEFAULT_MODEL = 'nvidia/nemotron-3-ultra'
const DEFAULT_API_KEY = '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'

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      conversations: [],
      currentConversationId: null,
      isLoading: false,
      userApiKey: DEFAULT_API_KEY,
      availableModels: [],
      selectedModel: DEFAULT_MODEL,
      baseUrl: DEFAULT_BASE_URL,

      createConversation: () => {
        const conversation: Conversation = {
          id: uuidv4(),
          title: 'New Chat',
          messages: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        set((state) => ({
          conversations: [conversation, ...state.conversations],
          currentConversationId: conversation.id,
        }))
        return conversation
      },

      setCurrentConversation: (id: string) => set({ currentConversationId: id }),

      addMessage: (conversationId: string, message: Message) =>
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === conversationId
              ? { ...c, messages: [...c.messages, message], updatedAt: new Date().toISOString() }
              : c
          ),
        })),

      updateMessage: (conversationId: string, messageId: string, content: string) =>
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === conversationId
              ? {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === messageId ? { ...m, content } : m
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : c
          ),
        })),

      deleteConversation: (id: string) =>
        set((state) => ({
          conversations: state.conversations.filter((c) => c.id !== id),
          currentConversationId: state.currentConversationId === id ? null : state.currentConversationId,
        })),

      setUserApiKey: (key: string) => set({ userApiKey: key }),

      setSelectedModel: (model: string) => set({ selectedModel: model }),

      setBaseUrl: (url: string) => set({ baseUrl: url }),

      fetchModels: async () => {
        const { userApiKey } = get()
        const apiKey = userApiKey || import.meta.env.VITE_NVIDIA_API_KEY
        if (!apiKey) return

        try {
          const res = await fetch('/api/models', {
            headers: { 
              'Authorization': `Bearer ${apiKey}`,
              'x-api-key': apiKey,
            },
          })
          if (res.ok) {
            const data = await res.json()
            const models = data.data?.map((m: any) => m.id).filter(Boolean) || []
            set({ availableModels: models })
          } else {
            console.error('Failed to fetch models:', await res.text())
          }
        } catch (error) {
          console.error('Failed to fetch models:', error)
        }
      },

      sendMessage: async (content: string, files?: FileAttachment[]) => {
        let { currentConversationId, conversations } = get()
        
        if (!currentConversationId) {
          const newConv = get().createConversation()
          currentConversationId = newConv.id
          conversations = get().conversations
        }

        const conversation = conversations.find((c) => c.id === currentConversationId)
        if (!conversation) return

        const userMessage: Message = {
          id: uuidv4(),
          role: 'user',
          content,
          timestamp: new Date().toISOString(),
          files,
        }

        get().addMessage(currentConversationId, userMessage)

        const assistantMessage: Message = {
          id: uuidv4(),
          role: 'assistant',
          content: '',
          timestamp: new Date().toISOString(),
        }
        get().addMessage(currentConversationId, assistantMessage)
        set({ isLoading: true })

        try {
          const { userApiKey, selectedModel } = get()
          const apiKey = userApiKey || import.meta.env.VITE_NVIDIA_API_KEY
          const { token } = useAuthStore.getState()
          
          const messages = conversation.messages
            .concat(userMessage)
            .map((m) => ({ role: m.role, content: m.content }))

          const res = await fetch('/api/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
              'x-api-key': apiKey,
            },
            body: JSON.stringify({
              model: selectedModel,
              messages,
              stream: true,
              max_tokens: 4096,
              temperature: 0.7,
            }),
          })

          if (!res.ok) {
            const errText = await res.text()
            let err
            try {
              err = JSON.parse(errText)
            } catch {
              err = { error: errText }
            }
            const msg = err.error?.message || err.error || errText || 'Failed to get response'
            throw new Error(msg)
          }

          const reader = res.body?.getReader()
          const decoder = new TextDecoder()
          let fullContent = ''

          if (reader) {
            while (true) {
              const { done, value } = await reader.read()
              if (done) break
              
              const chunk = decoder.decode(value)
              const lines = chunk.split('\n')
              
              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const data = line.slice(6)
                  if (data === '[DONE]') continue
                  try {
                    const parsed = JSON.parse(data)
                    const delta = parsed.choices[0]?.delta?.content
                    if (delta) {
                      fullContent += delta
                      get().updateMessage(currentConversationId, assistantMessage.id, fullContent)
                    }
                  } catch {}
                }
              }
            }
          }

          if (conversation.title === 'New Chat' && content.length > 0) {
            set((state) => ({
              conversations: state.conversations.map((c) =>
                c.id === currentConversationId
                  ? { ...c, title: content.slice(0, 50) + (content.length > 50 ? '...' : '') }
                  : c
              ),
            }))
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error'
          get().updateMessage(currentConversationId, assistantMessage.id, `Error: ${errorMsg}`)
        } finally {
          set({ isLoading: false })
        }
      },
    }),
    { 
      name: 'chat-storage', 
      partialize: (state) => ({ 
        conversations: state.conversations, 
        currentConversationId: state.currentConversationId,
        userApiKey: state.userApiKey,
        selectedModel: state.selectedModel,
        baseUrl: state.baseUrl,
        availableModels: state.availableModels,
      }) 
    }
  )
)

export function ChatProvider({ children }: { children: React.ReactNode }) {
  return children
}