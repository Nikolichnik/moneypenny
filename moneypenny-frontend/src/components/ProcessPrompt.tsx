import React, { useState, useRef, useEffect } from 'react'
import { Send, Loader2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { api, ProcessUpdate } from '@/lib/api'

export function ProcessPrompt() {
  const [prompt, setPrompt] = useState('')
  const [processing, setProcessing] = useState(false)
  const [updates, setUpdates] = useState<ProcessUpdate[]>([])
  const [error, setError] = useState<string | null>(null)
  const updatesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    updatesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [updates])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!prompt.trim() || processing) return

    setProcessing(true)
    setError(null)
    setUpdates([])

    api.processDocuments(
      prompt,
      (update) => {
        setUpdates((prev) => [...prev, update])
      },
      (err) => {
        setError(err.message || 'Processing failed')
        setProcessing(false)
      },
      () => {
        setProcessing(false)
      }
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Document Processing</CardTitle>
        <CardDescription>
          Enter natural language instructions to process documents
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="E.g., Add 'CONFIDENTIAL' watermark to all PDFs"
              className="w-full min-h-[100px] p-3 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              disabled={processing}
            />
          </div>
          <Button
            type="submit"
            disabled={!prompt.trim() || processing}
            className="w-full"
          >
            {processing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Process Documents
              </>
            )}
          </Button>
        </form>

        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive rounded-md text-destructive text-sm">
            {error}
          </div>
        )}

        {updates.length > 0 && (
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            <div className="font-medium text-sm text-muted-foreground">
              Processing Updates:
            </div>
            {updates.map((update, index) => (
              <div
                key={index}
                className="p-3 bg-muted/50 rounded-md text-sm space-y-2"
              >
                {update.prompt && (
                  <div>
                    <span className="font-medium">Prompt:</span> {update.prompt}
                  </div>
                )}
                {update.response && (
                  <div>
                    <span className="font-medium">Response:</span> {update.response}
                  </div>
                )}
              </div>
            ))}
            <div ref={updatesEndRef} />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
