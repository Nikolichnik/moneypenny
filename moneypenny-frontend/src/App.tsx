import React, { useState, useEffect } from 'react'
import { FileText, Sun, Moon } from 'lucide-react'
import { Button } from './components/ui/button'
import { DocumentList } from './components/DocumentList'
import { ChatInterface } from './components/ChatInterface'
import { DocumentViewer } from './components/DocumentViewer'
import { DocumentMetadata } from './lib/api'
import './index.css'

function App() {
  const [selectedDocument, setSelectedDocument] = useState<DocumentMetadata | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [isDarkMode, setIsDarkMode] = useState(true)

  // Enable dark mode
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDarkMode])

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode)
  }

  const handleProcessingComplete = () => {
    // Trigger document list refresh after processing
    setRefreshTrigger((prev: number) => prev + 1)
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border flex-shrink-0 bg-card relative z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="grid grid-cols-3 gap-0.5 w-6 h-6">
                  {[...Array(9)].map((_, i) => (
                    <div key={i} className="bg-primary rounded-sm" />
                  ))}
                </div>
                <div>
                  <h1 className="text-xl font-semibold">Moneypenny</h1>
                </div>
              </div>
              <div className="text-xs text-muted-foreground border-l border-border pl-3 ml-1">
                AI-powered document processing with Nutrient DWS
              </div>
            </div>
            
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-9 w-9"
              title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDarkMode ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content - 3 Column Layout */}
      <main className="flex-1 flex overflow-hidden">
        {/* Column 1: Document Library (20%) */}
        <div className="w-[20%] border-r border-border overflow-hidden bg-card material-texture noise-texture relative">
          <DocumentList 
            onViewDocument={setSelectedDocument}
            refreshTrigger={refreshTrigger}
          />
        </div>

        {/* Column 2: Chat Interface (30%) */}
        <div className="w-[30%] border-r border-border overflow-hidden bg-card material-texture noise-texture relative min-w-[320px] min-h-0">
          <ChatInterface onProcessingComplete={handleProcessingComplete} />
        </div>

        {/* Column 3: Document Viewer (50%) */}
        <div className="flex-1 overflow-hidden bg-background relative z-10 min-w-[420px] min-h-0">
          <DocumentViewer
            document={selectedDocument}
            onClose={() => setSelectedDocument(null)}
            isDarkMode={isDarkMode}
          />
        </div>
      </main>
    </div>
  )
}

export default App
