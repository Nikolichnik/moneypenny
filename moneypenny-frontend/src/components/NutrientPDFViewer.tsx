import { useEffect, useRef, useState } from 'react'
import type NutrientViewerType from '@nutrient-sdk/viewer'

// Extend window interface for TypeScript
declare global {
  interface Window {
    NutrientViewer?: typeof NutrientViewerType
  }
}

interface NutrientPDFViewerProps {
  documentUrl: string
  isDarkMode?: boolean
  onError?: (error: Error) => void
}

export function NutrientPDFViewer({ documentUrl, isDarkMode = false, onError }: NutrientPDFViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const instanceRef = useRef<any>(null)
  const loadingRef = useRef<Promise<void> | null>(null)
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState<string>('')

  useEffect(() => {
    const container = containerRef.current
    let cleanup = () => {}

    const loadNutrientScript = () => {
      return new Promise<void>((resolve, reject) => {
        // Check if already loaded
        if (window.NutrientViewer) {
          resolve()
          return
        }

        // Check if script tag already exists
        const existingScript = document.querySelector('script[src*="nutrient-viewer.js"]')

        if (existingScript) {
          existingScript.addEventListener('load', () => resolve())
          existingScript.addEventListener('error', () => reject(new Error('Failed to load Nutrient SDK script')))

          return
        }

        // Create and inject script tag
        const script = document.createElement('script')
        script.src = 'https://cdn.cloud.pspdfkit.com/pspdfkit-web@1.9.1/nutrient-viewer.js'
        script.async = true
        script.onload = () => resolve()
        script.onerror = () => reject(new Error('Failed to load Nutrient SDK from CDN'))

        document.head.appendChild(script)
      })
    }

    const waitForNonZeroSize = (el: HTMLElement, timeoutMs = 3000) => {
      return new Promise<void>((resolve, reject) => {
        const rect = el.getBoundingClientRect()
        if (rect.width > 0 && rect.height > 0) {
          resolve()
          return
        }

        const timeout = setTimeout(() => {
          observer?.disconnect()
          reject(new Error('Container still has no dimensions after waiting'))
        }, timeoutMs)

        const observer = new ResizeObserver((entries) => {
          for (const entry of entries) {
            const { width, height } = entry.contentRect
            if (width > 0 && height > 0) {
              clearTimeout(timeout)
              observer.disconnect()
              resolve()
              return
            }
          }
        })

        observer.observe(el)
      })
    }

    const logDimensions = (el: HTMLElement | null, label: string) => {
      if (!el) {
        console.log(`${label}: null`)
        return
      }
      const rect = el.getBoundingClientRect()
      console.log(`${label} size`, {
        width: rect.width,
        height: rect.height,
        offsetWidth: el.offsetWidth,
        offsetHeight: el.offsetHeight,
        clientWidth: el.clientWidth,
        clientHeight: el.clientHeight,
      })
    }

    const resetContainer = async (container: HTMLElement) => {
      if (window.NutrientViewer) {
        try {
          await window.NutrientViewer.unload(container)
        } catch (e) {
          console.warn('Unload failed (ignored):', e)
        }
      }
      container.innerHTML = ''
    }

    const initializePDF = async () => {
      try {
        setStatus('loading')

        // Wait for container to be available in the DOM
        let attempts = 0
        while (!containerRef.current && attempts < 20) {
          await new Promise((resolve) => setTimeout(resolve, 50))
          attempts++
        }

        const container = containerRef.current

        if (!container) {
          throw new Error('Container ref is not available after waiting.')
        }

        // Ensure the host container has dimensions before mounting
        container.style.position = 'relative'
        container.style.width = '100%'
        container.style.height = '100%'
        container.style.minWidth = '320px'
        container.style.minHeight = '480px'
        container.style.display = 'block'

        // Ensure container is completely reset before loading
        await resetContainer(container)
        instanceRef.current = null

        // Load the Nutrient SDK script
        await loadNutrientScript()

        // Wait a bit for SDK to fully initialize
        await new Promise((resolve) => setTimeout(resolve, 100))

        if (!window.NutrientViewer) {
          throw new Error('Nutrient Web SDK failed to initialize after loading.')
        }

        // Wait until the container has non-zero dimensions (first load issue)
        await waitForNonZeroSize(container)

        // Log dimensions before loading
        logDimensions(container, 'host container')
        logDimensions(container.parentElement as HTMLElement | null, 'host parent')
        logDimensions(container.parentElement?.parentElement as HTMLElement | null, 'host grandparent')

        const hostRect = container.getBoundingClientRect()
        if (hostRect.width === 0 || hostRect.height === 0) {
          throw new Error(`Host container still zero size before load (w=${hostRect.width}, h=${hostRect.height})`)
        }

        // Load the PDF into the fresh container
        const loadPromise = window.NutrientViewer.load({
          container,
          portalContainer: container,
          document: documentUrl,
          baseUrl: 'https://cdn.cloud.pspdfkit.com/pspdfkit-web@1.9.1/',
          theme: isDarkMode ? window.NutrientViewer.Theme.DARK : window.NutrientViewer.Theme.LIGHT,
        })

        loadingRef.current = loadPromise.then(() => undefined).catch(() => undefined)
        const instance = await loadPromise

        instanceRef.current = instance
        setStatus('loaded')

        cleanup = () => {
          if (instanceRef.current && window.NutrientViewer && containerRef.current) {
            window.NutrientViewer.unload(containerRef.current)
          }
          instanceRef.current = null
        }
      } catch (error) {
        const err = error as Error
        console.error('PDF loading failed:', err)
        setStatus('error')
        setErrorMessage(err.message)

        if (onError) {
          onError(err)
        }

        // Attempt cleanup on error to leave container empty for retry
        if (containerRef.current) {
          resetContainer(containerRef.current)
        }

        // Log debugging info
        console.log('Debug info:', {
          containerRef: !!container,
          sdkAvailable: !!window.NutrientViewer,
          containerDimensions: container ? container.getBoundingClientRect() : null,
          documentUrl,
          userAgent: navigator.userAgent,
        })
      }
    }

    initializePDF()

    return cleanup
  }, [documentUrl, onError])

  if (status === 'error') {
    return (
      <div className="flex flex-col h-full items-center justify-center p-8 text-center">
        <div className="text-destructive mb-2">Failed to load PDF viewer</div>
        <div className="text-sm text-muted-foreground">{errorMessage}</div>
      </div>
    )
  }

  return (
    <div className="absolute inset-0">
      {status === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10 pointer-events-none">
          <div className="text-sm text-muted-foreground">Loading PDF viewer...</div>
        </div>
      )}
      {/* Empty container div required by Nutrient Viewer - must have no child nodes */}
      <div
        ref={containerRef}
        className="w-full h-full min-h-[400px] min-w-[300px]"
        style={{ position: 'relative' }}
      />
    </div>
  )
}
