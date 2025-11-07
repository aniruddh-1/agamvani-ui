/**
 * ImageCache - Intelligent image caching with blob URLs and lazy loading
 * Prevents duplicate downloads and provides instant display for cached images
 */

class ImageCache {
  constructor() {
    this.blobCache = new Map() // trackCode → blob URL
    this.loadingPromises = new Map() // trackCode → Promise (deduplication)
    this.observer = null
  }

  /**
   * Fetch and cache image as blob URL
   * @param {string} url - Image URL to fetch
   * @param {string} trackCode - Unique track identifier for caching
   * @returns {Promise<string>} Blob URL for the image
   */
  async fetchImage(url, trackCode) {
    // Return cached blob URL if available (instant display)
    if (this.blobCache.has(trackCode)) {
      return this.blobCache.get(trackCode)
    }

    // Deduplicate concurrent requests for same image
    if (this.loadingPromises.has(trackCode)) {
      return this.loadingPromises.get(trackCode)
    }

    // Fetch image and convert to blob URL
    const promise = fetch(url)
      .then(res => {
        if (!res.ok) {
          throw new Error(`Failed to fetch image: ${res.status}`)
        }
        return res.blob()
      })
      .then(blob => {
        const blobUrl = URL.createObjectURL(blob)
        this.blobCache.set(trackCode, blobUrl)
        this.loadingPromises.delete(trackCode)
        return blobUrl
      })
      .catch(err => {
        this.loadingPromises.delete(trackCode)
        throw err
      })

    this.loadingPromises.set(trackCode, promise)
    return promise
  }

  /**
   * Preload image in background (for next track)
   * @param {string} trackCode - Track identifier
   * @param {string} url - Image URL
   */
  preloadNext(trackCode, url) {
    if (!this.blobCache.has(trackCode) && !this.loadingPromises.has(trackCode)) {
      this.fetchImage(url, trackCode).catch(() => {
        // Silently fail preloads
      })
    }
  }

  /**
   * Get cached image blob URL or null
   * @param {string} trackCode - Track identifier
   * @returns {string|null} Blob URL or null if not cached
   */
  getCachedOrPlaceholder(trackCode) {
    return this.blobCache.get(trackCode) || null
  }

  /**
   * Check if image is cached
   * @param {string} trackCode - Track identifier
   * @returns {boolean}
   */
  has(trackCode) {
    return this.blobCache.has(trackCode)
  }

  /**
   * Check if image is currently loading
   * @param {string} trackCode - Track identifier
   * @returns {boolean}
   */
  isLoading(trackCode) {
    return this.loadingPromises.has(trackCode)
  }

  /**
   * Cleanup old blob URLs (memory management)
   * @param {string[]} keepCodes - Array of track codes to keep in cache
   */
  cleanup(keepCodes = []) {
    const codes = Array.from(this.blobCache.keys())
    codes.forEach(code => {
      if (!keepCodes.includes(code)) {
        const blobUrl = this.blobCache.get(code)
        URL.revokeObjectURL(blobUrl)
        this.blobCache.delete(code)
      }
    })
  }

  /**
   * Clear all cached images
   */
  clear() {
    // Revoke all blob URLs to free memory
    for (const blobUrl of this.blobCache.values()) {
      URL.revokeObjectURL(blobUrl)
    }
    this.blobCache.clear()
    this.loadingPromises.clear()
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache stats
   */
  getStats() {
    return {
      cachedImages: this.blobCache.size,
      loadingImages: this.loadingPromises.size,
      cachedCodes: Array.from(this.blobCache.keys())
    }
  }
}

// Export singleton instance
export const imageCache = new ImageCache()
export default imageCache
