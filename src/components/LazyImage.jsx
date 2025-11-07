import { useState, useEffect, useRef, useCallback } from 'react'
import { imageCache } from '../utils/imageCache'
import { API_BASE_URL } from '../config/constants'

/**
 * LazyImage - Intelligent lazy-loading image component with caching
 * Features:
 * - Instant display for cached images
 * - Lazy loading with IntersectionObserver
 * - Automatic cache management
 * - Fallback placeholder on error
 */
function LazyImage({ 
  src, 
  trackCode, 
  alt = '', 
  className = '', 
  onError,
  eager = false // Skip lazy loading for above-the-fold images
}) {
  const [imageSrc, setImageSrc] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const imgRef = useRef(null)
  const observerRef = useRef(null)

  /**
   * Load image from URL and cache it
   */
  const loadImage = useCallback(async () => {
    if (!src) return
    
    try {
      const fullUrl = src.startsWith('http') ? src : `${API_BASE_URL}${src}`
      const blobUrl = await imageCache.fetchImage(fullUrl, trackCode)
      setImageSrc(blobUrl)
      setLoading(false)
    } catch (err) {
      console.error('Image load failed:', err)
      setError(true)
      setLoading(false)
      onError?.()
    }
  }, [src, trackCode, onError])

  useEffect(() => {
    // Quick return if no src or trackCode
    if (!src || !trackCode) {
      setLoading(false)
      setError(true)
      return
    }

    // Check cache first (instant display)
    const cachedUrl = imageCache.getCachedOrPlaceholder(trackCode)
    if (cachedUrl) {
      setImageSrc(cachedUrl)
      setLoading(false)
      return
    }

    // Eager load (for above-the-fold images like now-playing)
    if (eager) {
      loadImage()
      return
    }

    // Lazy load with IntersectionObserver
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            loadImage()
            observerRef.current?.disconnect()
          }
        })
      },
      { 
        rootMargin: '50px', // Preload 50px before visible
        threshold: 0.01 
      }
    )

    if (imgRef.current) {
      observerRef.current.observe(imgRef.current)
    }

    return () => {
      observerRef.current?.disconnect()
    }
  }, [src, trackCode, eager, loadImage])

  return (
    <div ref={imgRef} className={className}>
      {loading && !imageSrc && (
        <div className="w-full h-full bg-muted animate-pulse rounded" />
      )}
      {imageSrc && !error && (
        <img
          src={imageSrc}
          alt={alt}
          className={className}
          loading="lazy"
          onError={() => {
            setError(true)
            onError?.()
          }}
        />
      )}
      {error && (
        <div className="w-full h-full bg-muted flex items-center justify-center rounded">
          <svg 
            className="w-8 h-8 text-muted-foreground" 
            fill="currentColor" 
            viewBox="0 0 24 24"
            aria-label="Image unavailable"
          >
            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
          </svg>
        </div>
      )}
    </div>
  )
}

export default LazyImage
