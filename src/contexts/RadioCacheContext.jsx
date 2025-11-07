import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { API_BASE_URL } from '../config/constants'
import { cacheManager } from '../utils/cacheManager'

const RadioCacheContext = createContext()

/**
 * RadioCacheProvider - Centralized radio state management with caching
 * Provides shared now-playing and schedule data with single polling instance
 */
export function RadioCacheProvider({ children }) {
  const [nowPlaying, setNowPlaying] = useState(null)
  const [schedule, setSchedule] = useState(null)
  const [scheduleLoading, setScheduleLoading] = useState(false)
  const lastTrackId = useRef(null)
  const pollingInterval = useRef(null)

  /**
   * Single now-playing polling instance for entire app
   * Automatically invalidates cache when track changes
   */
  useEffect(() => {
    const fetchNowPlaying = async () => {
      // Check cache first (30 second TTL)
      const cached = cacheManager.get('now-playing')
      if (cached) {
        setNowPlaying(cached)
        return
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/radio/now-playing`)
        if (!response.ok) return
        
        const data = await response.json()
        
        if (data.track) {
          // Detect track change for cache invalidation
          if (lastTrackId.current && lastTrackId.current !== data.track.id) {
            console.log('🎵 Track changed:', data.track.title)
            
            // Invalidate old now-playing cache immediately
            cacheManager.invalidate('now-playing')
          }
          
          lastTrackId.current = data.track.id
          
          // Cache for 30 seconds (shorter than poll interval for freshness)
          cacheManager.set('now-playing', data.track, 30000)
          setNowPlaying(data.track)
        }
      } catch (err) {
        console.error('Failed to fetch now-playing:', err)
      }
    }

    // Fetch immediately on mount
    fetchNowPlaying()
    
    // Poll every 5 seconds (SINGLE instance for whole app)
    pollingInterval.current = setInterval(fetchNowPlaying, 5000)
    
    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current)
      }
    }
  }, [])

  /**
   * Fetch daily schedule with caching
   * @param {boolean} force - Force refresh, bypass cache
   * @returns {Promise<Object>} Schedule data
   */
  const fetchSchedule = async (force = false) => {
    const today = new Date().toISOString().split('T')[0]
    const cacheKey = `schedule:${today}`
    
    // Return cached if available and not forced
    if (!force) {
      const cached = cacheManager.get(cacheKey)
      if (cached) {
        setSchedule(cached)
        return cached
      }
    }

    try {
      setScheduleLoading(true)
      const response = await fetch(`${API_BASE_URL}/api/radio/daily-schedule`)
      if (!response.ok) throw new Error('Failed to fetch schedule')
      
      const data = await response.json()
      
      // Cache for 5 minutes
      cacheManager.set(cacheKey, data, 300000)
      setSchedule(data)
      return data
    } catch (err) {
      console.error('Failed to fetch schedule:', err)
      throw err
    } finally {
      setScheduleLoading(false)
    }
  }

  /**
   * Force refresh now-playing data
   */
  const refreshNowPlaying = () => {
    cacheManager.invalidate('now-playing')
    lastTrackId.current = null
  }

  /**
   * Invalidate schedule cache (e.g., at midnight)
   */
  const invalidateSchedule = () => {
    cacheManager.invalidate('schedule:*')
  }

  /**
   * Clear all radio caches
   */
  const clearCache = () => {
    cacheManager.clear()
    lastTrackId.current = null
  }

  const value = {
    // State
    nowPlaying,
    schedule,
    scheduleLoading,
    
    // Actions
    fetchSchedule,
    refreshNowPlaying,
    invalidateSchedule,
    clearCache,
  }

  return (
    <RadioCacheContext.Provider value={value}>
      {children}
    </RadioCacheContext.Provider>
  )
}

/**
 * Hook to access radio cache context
 * @returns {Object} Radio cache context value
 */
export function useRadioCache() {
  const context = useContext(RadioCacheContext)
  if (!context) {
    throw new Error('useRadioCache must be used within RadioCacheProvider')
  }
  return context
}

export default RadioCacheContext
