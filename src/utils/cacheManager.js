/**
 * CacheManager - General-purpose in-memory cache with TTL and LRU eviction
 * Handles API response caching with automatic expiration and pattern-based invalidation
 */

class CacheManager {
  constructor() {
    this.cache = new Map()
    this.maxSize = 50 // LRU limit to prevent memory bloat
  }

  /**
   * Store value in cache with TTL
   * @param {string} key - Cache key (e.g., 'now-playing', 'schedule:2025-11-08')
   * @param {any} value - Value to cache
   * @param {number} ttl - Time to live in milliseconds (default: 5 minutes)
   */
  set(key, value, ttl = 300000) {
    const entry = {
      value,
      expiry: Date.now() + ttl,
      accessTime: Date.now()
    }
    
    // LRU eviction if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldest = this.findOldestEntry()
      if (oldest) {
        this.cache.delete(oldest)
      }
    }
    
    this.cache.set(key, entry)
  }

  /**
   * Retrieve value from cache
   * @param {string} key - Cache key
   * @returns {any|null} Cached value or null if expired/not found
   */
  get(key) {
    const entry = this.cache.get(key)
    if (!entry) return null
    
    // Check if expired
    if (Date.now() > entry.expiry) {
      this.cache.delete(key)
      return null
    }
    
    // Update access time for LRU
    entry.accessTime = Date.now()
    return entry.value
  }

  /**
   * Check if key exists and is not expired
   * @param {string} key - Cache key
   * @returns {boolean}
   */
  has(key) {
    return this.get(key) !== null
  }

  /**
   * Delete specific cache entry
   * @param {string} key - Cache key
   */
  delete(key) {
    this.cache.delete(key)
  }

  /**
   * Invalidate cache entries matching pattern
   * @param {string} pattern - Pattern to match (supports wildcards: 'schedule:*')
   */
  invalidate(pattern) {
    const keys = Array.from(this.cache.keys())
    keys.forEach(key => {
      if (this.matchPattern(key, pattern)) {
        this.cache.delete(key)
      }
    })
  }

  /**
   * Clear all cache entries
   */
  clear() {
    this.cache.clear()
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache stats
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      keys: Array.from(this.cache.keys())
    }
  }

  /**
   * Find oldest entry for LRU eviction
   * @private
   * @returns {string|null} Key of oldest entry
   */
  findOldestEntry() {
    let oldestKey = null
    let oldestTime = Infinity
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.accessTime < oldestTime) {
        oldestTime = entry.accessTime
        oldestKey = key
      }
    }
    
    return oldestKey
  }

  /**
   * Match key against pattern (supports * wildcard)
   * @private
   * @param {string} key - Key to test
   * @param {string} pattern - Pattern with optional * wildcard
   * @returns {boolean}
   */
  matchPattern(key, pattern) {
    if (pattern === key) return true
    if (!pattern.includes('*')) return false
    
    // Convert pattern to regex
    const regexPattern = pattern
      .replace(/[.+?^${}()|[\]\\]/g, '\\$&') // Escape special chars
      .replace(/\*/g, '.*') // Replace * with .*
    
    const regex = new RegExp(`^${regexPattern}$`)
    return regex.test(key)
  }
}

// Export singleton instance
export const cacheManager = new CacheManager()
export default cacheManager
