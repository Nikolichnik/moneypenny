import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001'

export interface DocumentMetadata {
  name: string
  size: number
  content_type: string
  created_on: string
  modified_on: string
  path: string
}

export interface DocumentListResponse {
  documents: DocumentMetadata[]
  total: number
}

export interface ProcessRequest {
  prompt: string
}

export interface ProcessUpdate {
  prompt?: string
  response?: string
}

export const api = {
  async getDocuments(): Promise<DocumentListResponse> {
    const response = await axios.get<DocumentListResponse>(`${API_BASE_URL}/documents`)
    return response.data
  },

  getDocumentUrl(filename: string): string {
    return `${API_BASE_URL}/documents/${encodeURIComponent(filename)}`
  },

  async deleteDocument(filename: string): Promise<void> {
    await axios.delete(`${API_BASE_URL}/documents/${encodeURIComponent(filename)}`)
  },

  async processDocuments(
    prompt: string,
    onUpdate: (update: ProcessUpdate) => void,
    onError: (error: Error) => void,
    onComplete: () => void
  ): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('Response body is not readable')
      }

      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          onComplete()
          break
        }

        // Decode the chunk and add to buffer
        buffer += decoder.decode(value, { stream: true })

        // Process complete SSE messages
        const lines = buffer.split('\n')
        buffer = lines.pop() || '' // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6) // Remove 'data: ' prefix
            if (data.trim()) {
              try {
                const update: ProcessUpdate = JSON.parse(data)
                onUpdate(update)
              } catch (error) {
                console.error('Failed to parse SSE data:', error)
              }
            }
          }
        }
      }
    } catch (error) {
      onError(error as Error)
    }
  },
}
