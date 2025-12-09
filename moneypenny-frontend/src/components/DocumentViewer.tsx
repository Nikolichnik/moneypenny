import { X, FileText, Archive } from 'lucide-react'
import { useState } from 'react'
import { Button } from './ui/button'
import { DocumentMetadata, api } from '@/lib/api'
import { NutrientPDFViewer } from './NutrientPDFViewer'
import { LegacyPDFViewer } from './LegacyPDFViewer'

interface DocumentViewerProps {
  document: DocumentMetadata | null
  onClose: () => void
  isDarkMode: boolean
}

export function DocumentViewer({ document, onClose, isDarkMode }: DocumentViewerProps) {
  const [useLegacyViewer, setUseLegacyViewer] = useState(false)

  if (!document) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-8 text-center">
        <FileText className="h-16 w-16 text-muted-foreground/50 mb-4" />
        <p className="text-sm text-muted-foreground">Select a document to view</p>
      </div>
    )
  }

  const documentUrl = api.getDocumentUrl(document.name)
  const isPdf = document.content_type === 'application/pdf'
  const isImage = document.content_type.startsWith('image/')

  return (
    <div className="flex flex-col h-full bg-card material-texture">
      {/* Header */}
      <div className="border-b px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-sm truncate">{document.name}</h2>
            <p className="text-xs text-muted-foreground">
              {document.content_type}
            </p>
          </div>
            <div className="flex items-center gap-2 mr-2 text-xs text-muted-foreground">
              <span>Legacy viewer</span>
              <Button
                variant={useLegacyViewer ? 'default' : 'secondary'}
                size="icon"
                className="h-8 w-8"
                onClick={() => setUseLegacyViewer((v) => !v)}
                title="Toggle between Nutrient viewer and legacy iframe viewer"
              >
                <Archive className="h-4 w-4" />
              </Button>
            </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Document Content */}
      <div className="flex-1 relative bg-muted/30 min-h-0 min-w-[420px]">
        {isPdf && !useLegacyViewer && (
          <NutrientPDFViewer 
            documentUrl={documentUrl}
            isDarkMode={isDarkMode}
            onError={(error) => console.error('Nutrient PDF Viewer Error:', error)}
          />
        )}
        {isPdf && useLegacyViewer && (
          <LegacyPDFViewer documentUrl={documentUrl} />
        )}
        {isImage && (
          <div className="p-4 flex items-center justify-center h-full">
            <img
              src={documentUrl}
              alt={document.name}
              className="max-w-full max-h-full object-contain"
            />
          </div>
        )}
        {!isPdf && !isImage && (
          <div className="flex items-center justify-center h-full p-8 text-center">
            <div>
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-4">
                Preview not available for this file type
              </p>
              <Button asChild variant="outline">
                <a href={documentUrl} download={document.name}>
                  Download
                </a>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
