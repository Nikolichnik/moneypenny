interface LegacyPDFViewerProps {
  documentUrl: string
}

// Simple iframe-based PDF viewer as a fallback/legacy option.
export function LegacyPDFViewer({ documentUrl }: LegacyPDFViewerProps) {
  return (
    <div className="absolute inset-0 bg-background">
      <iframe
        src={documentUrl}
        title="PDF preview"
        className="w-full h-full border-0"
      />
      <div className="sr-only">
        <a href={documentUrl} target="_blank" rel="noreferrer">
          Open PDF
        </a>
      </div>
    </div>
  )
}