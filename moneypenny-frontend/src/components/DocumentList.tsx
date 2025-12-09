import React, { useState, useEffect, useRef } from 'react'
import { FileText, Eye, RefreshCw, Download, Trash2 } from 'lucide-react'
import { Button } from './ui/button'
import { api, DocumentMetadata } from '@/lib/api'
import { formatBytes, formatDate } from '@/lib/utils'

interface DocumentListProps {
  onViewDocument: (doc: DocumentMetadata) => void
  refreshTrigger?: number
}

export function DocumentList({ onViewDocument, refreshTrigger }: DocumentListProps) {
  const [documents, setDocuments] = useState<DocumentMetadata[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadDocuments()
  }, [])

  // Refresh when trigger changes (after processing)
  useEffect(() => {
    if (refreshTrigger !== undefined && refreshTrigger > 0) {
      loadDocuments()
    }
  }, [refreshTrigger])

  const loadDocuments = async () => {
    try {
      setError(null)
      const response = await api.getDocuments()
      setDocuments(response.documents)
    } catch (err) {
      setError('Failed to load documents')
      console.error('Error loading documents:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCopyName = (name: string) => {
    navigator.clipboard.writeText(name)
  }

  const handleDownload = async (doc: DocumentMetadata, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/documents/${encodeURIComponent(doc.name)}`)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = doc.name
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      console.error('Error downloading document:', err)
    }
  }

  const handleDelete = async (doc: DocumentMetadata, e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (!confirm(`Are you sure you want to delete "${doc.name}"?`)) {
      return
    }

    try {
      await api.deleteDocument(doc.name)
      // Refresh the document list after deletion
      await loadDocuments()
    } catch (err) {
      console.error('Error deleting document:', err)
      alert('Failed to delete document. Please try again.')
    }
  }

  if (loading && documents.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <div className="border-b px-4 py-3">
          <h2 className="font-semibold text-sm">Document Library</h2>
          <p className="text-xs text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-sm">Document Library</h2>
            <p className="text-xs text-muted-foreground">
              {documents.length} document{documents.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={loadDocuments}
            className="h-6 w-6"
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Document List with Infinite Scroll */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto"
      >
        {error && (
          <div className="p-4 text-center text-sm text-destructive">
            {error}
          </div>
        )}
        
        {documents.length === 0 && !error && (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No documents found
          </div>
        )}

        <div className="p-2 space-y-2">
          {documents.map((doc) => (
            <div
              key={doc.name}
              className="border rounded-lg p-3 hover:bg-accent/10 transition-colors cursor-pointer bg-card relative z-10 flex items-start gap-3 shadow-sm hover:shadow-md"
              onClick={() => handleCopyName(doc.name)}
            >
              {/* Main content area - 93% */}
              <div className="flex items-start gap-2 flex-1 min-w-0">
                <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{doc.name}</p>
                  <div className="flex flex-col gap-0.5 mt-1">
                    <span className="text-xs text-muted-foreground">
                      {formatBytes(doc.size)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(doc.modified_on)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions column - 7% */}
              <div className="flex flex-col gap-1 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 hover:bg-accent/70"
                  onClick={(e) => {
                    e.stopPropagation()
                    onViewDocument(doc)
                  }}
                  title="View document"
                >
                  <Eye className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 hover:bg-accent/70"
                  onClick={(e) => handleDownload(doc, e)}
                  title="Download document"
                >
                  <Download className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 hover:bg-destructive/70 hover:text-destructive-foreground"
                  onClick={(e) => handleDelete(doc, e)}
                  title="Delete document (not yet implemented)"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Document Library</CardTitle>
          <CardDescription>Loading documents...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Document Library</CardTitle>
          <CardDescription className="text-destructive">{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={loadDocuments} variant="outline">
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Document Library</CardTitle>
        <CardDescription>
          {documents.length} document{documents.length !== 1 ? 's' : ''} available
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {documents.map((doc) => (
            <div
              key={doc.name}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
            >
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">{doc.name}</span>
                  <span className="text-xs text-muted-foreground px-2 py-1 bg-muted rounded">
                    {doc.content_type}
                  </span>
                </div>
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <HardDrive className="h-4 w-4" />
                    {formatBytes(doc.size)}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {formatDate(doc.modified_on)}
                  </div>
                </div>
              </div>
              <Button
                onClick={() => onViewDocument(doc)}
                variant="outline"
                size="sm"
                className="ml-4"
              >
                <Eye className="h-4 w-4 mr-2" />
                View
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
