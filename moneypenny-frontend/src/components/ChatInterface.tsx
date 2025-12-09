import React, { useState, useEffect, useRef } from 'react'
import { Send, Loader2, User, Bot, Trash2 } from 'lucide-react'
import { Button } from './ui/button'
import { api, ProcessUpdate } from '@/lib/api'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

interface ChatInterfaceProps {
  onProcessingComplete: () => void
}

const STORAGE_KEY = 'moneypenny_chat_history'

export function ChatInterface({ onProcessingComplete }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [prompt, setPrompt] = useState('')
  const [processing, setProcessing] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Load chat history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        setMessages(JSON.parse(saved))
      } catch (error) {
        console.error('Failed to load chat history:', error)
      }
    }
  }, [])

  // Save chat history to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
    }
  }, [messages])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!prompt.trim() || processing) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: prompt.trim(),
      timestamp: Date.now()
    }

    setMessages(prev => [...prev, userMessage])
    setPrompt('')
    setProcessing(true)
    setStreamingContent('')

    const assistantMessageId = (Date.now() + 1).toString()
    let fullResponse = ''

    api.processDocuments(
      userMessage.content,
      (update: ProcessUpdate) => {
        if (update.response) {
          fullResponse = update.response
          setStreamingContent(fullResponse)
        }
      },
      (error) => {
        const errorMessage: ChatMessage = {
          id: assistantMessageId,
          role: 'assistant',
          content: `Error: ${error.message}`,
          timestamp: Date.now()
        }
        setMessages(prev => [...prev, errorMessage])
        setStreamingContent('')
        setProcessing(false)
      },
      () => {
        const assistantMessage: ChatMessage = {
          id: assistantMessageId,
          role: 'assistant',
          content: fullResponse || 'Processing complete',
          timestamp: Date.now()
        }
        setMessages(prev => [...prev, assistantMessage])
        setStreamingContent('')
        setProcessing(false)
        onProcessingComplete()
      }
    )
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleClearHistory = () => {
    if (confirm('Are you sure you want to clear all chat history? This cannot be undone.')) {
      setMessages([])
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-border px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-sm">AI Document Processing</h2>
            <p className="text-xs text-muted-foreground">
              Enter instructions to process documents
            </p>
          </div>
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClearHistory}
              className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
              title="Clear chat history"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
        {messages.length === 0 && !processing && (
          <div className="flex items-center justify-center h-full text-center text-muted-foreground text-sm">
            <div>
              <Bot className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">Start a conversation</p>
              <p className="text-xs mt-1.5 max-w-[200px]">
                Ask me to watermark, OCR, sign, or convert documents
              </p>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {message.role === 'assistant' && (
              <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-accent/20 flex items-center justify-center">
                <Bot className="h-4 w-4 text-accent" />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-lg px-3.5 py-2.5 relative z-10 shadow-sm ${
                message.role === 'user'
                  ? 'bg-accent text-accent-foreground'
                  : 'bg-card border border-border'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
              <span className="text-xs opacity-60 mt-1.5 block">
                {new Date(message.timestamp).toLocaleTimeString()}
              </span>
            </div>
            {message.role === 'user' && (
              <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
                <User className="h-4 w-4 text-accent-foreground" />
              </div>
            )}
          </div>
        ))}

        {/* Streaming message */}
        {processing && streamingContent && (
          <div className="flex gap-3 justify-start">
            <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-accent/20 flex items-center justify-center">
              <Bot className="h-4 w-4 text-accent" />
            </div>
            <div className="max-w-[80%] rounded-lg px-3.5 py-2.5 bg-card border border-border relative z-10 shadow-sm">
              <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{streamingContent}</p>
              <Loader2 className="h-3 w-3 animate-spin mt-2" />
            </div>
          </div>
        )}

        {/* Processing indicator */}
        {processing && !streamingContent && (
          <div className="flex gap-3 justify-start">
            <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-accent/20 flex items-center justify-center">
              <Bot className="h-4 w-4 text-accent" />
            </div>
            <div className="rounded-lg px-3.5 py-2.5 bg-card border border-border shadow-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border p-4 flex-shrink-0 bg-card relative z-10">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your instruction here..."
            className="flex-1 resize-none border border-border bg-background rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent min-h-[80px] max-h-[120px]"
            disabled={processing}
            rows={3}
          />
          <Button
            type="submit"
            disabled={!prompt.trim() || processing}
            size="icon"
            className="flex-shrink-0 h-[80px] w-12 bg-accent hover:bg-accent/90 text-accent-foreground"
          >
            {processing ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}
