import { useState, useEffect, useRef } from 'react'
import { radioAPI } from '../lib/api'
import { API_BASE_URL } from '../config/constants'

function DailySchedule() {
  const [schedule, setSchedule] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [expandedSlots, setExpandedSlots] = useState(new Set())
  const currentTrackRef = useRef(null)

  const fetchSchedule = async () => {
    try {
      setLoading(true)
      const data = await radioAPI.getDailySchedule()
      setSchedule(data)
      
      // Auto-expand current slot
      if (data.current_slot) {
        setExpandedSlots(new Set([data.current_slot]))
      }
      
      setError(null)
    } catch (err) {
      console.error('Failed to fetch schedule:', err)
      setError('Failed to load schedule')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSchedule()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchSchedule, 30000)
    return () => clearInterval(interval)
  }, [])

  // Auto-scroll to current track when schedule loads
  useEffect(() => {
    if (schedule && currentTrackRef.current) {
      setTimeout(() => {
        currentTrackRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 500)
    }
  }, [schedule])

  const toggleSlot = (slotName) => {
    const newExpanded = new Set(expandedSlots)
    if (newExpanded.has(slotName)) {
      newExpanded.delete(slotName)
    } else {
      newExpanded.add(slotName)
    }
    setExpandedSlots(newExpanded)
  }

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const formatDate = (dateString) => {
    // Convert YYYY-MM-DD to DD-MM-YYYY
    const parts = dateString.split('-')
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`
    }
    return dateString
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-saffron-500 border-t-transparent rounded-full animate-spin mb-2"></div>
          <p className="text-muted-foreground">Loading schedule...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={fetchSchedule}
          className="px-4 py-2 bg-saffron-500 text-white rounded-lg hover:bg-saffron-600"
        >
          Retry
        </button>
      </div>
    )
  }

  if (!schedule || !schedule.slots || schedule.slots.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No schedule available
      </div>
    )
  }

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Daily Schedule</h2>
            <p className="text-sm text-muted-foreground">{formatDate(schedule.date)}</p>
          </div>
          <button
            onClick={fetchSchedule}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
            title="Refresh schedule"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Time Slots */}
      <div className="space-y-3 pb-6">
        {schedule.slots.map((slot) => {
          const isExpanded = expandedSlots.has(slot.slot_name)
          const isCurrent = slot.is_current

          return (
            <div
              key={slot.slot_name}
              className={`rounded-lg border shadow-sm overflow-hidden transition-all ${
                isCurrent ? 'border-saffron-500 bg-saffron-50/50 dark:bg-saffron-950/20' : 'border-border bg-card'
              }`}
            >
              {/* Slot Header */}
              <button
                onClick={() => toggleSlot(slot.slot_name)}
                className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isCurrent ? 'bg-saffron-500 text-white' : 'bg-muted'
                  }`}>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
                    </svg>
                  </div>
                  <div className="text-left flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{slot.slot_label}</h3>
                      {isCurrent && (
                        <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse">
                          LIVE
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                      <span>{slot.tracks.length} tracks</span>
                      <span>•</span>
                      <span>{formatDuration(slot.total_duration)}</span>
                    </div>
                  </div>
                </div>
                <svg
                  className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Track List */}
              {isExpanded && (
                <div className="border-t border-border">
                  {slot.tracks.map((track, index) => {
                    // Match by code since schedule tracks use codes, not UUIDs
                    const isCurrentTrack = track.code === schedule.current_track_code

                    return (
                      <div
                        key={`${slot.slot_name}-${track.id}-${index}`}
                        ref={isCurrentTrack ? currentTrackRef : null}
                        className={`flex items-start gap-3 p-3 border-b border-border last:border-b-0 transition-colors ${
                          isCurrentTrack ? 'bg-saffron-100 dark:bg-saffron-900/30' : 'hover:bg-muted/30'
                        }`}
                      >
                        {/* Track Number */}
                        <div className="flex-shrink-0 w-8 text-center">
                          <span className="text-sm font-medium text-muted-foreground">
                            {index + 1}
                          </span>
                        </div>

                        {/* Thumbnail */}
                        <div className="flex-shrink-0">
                          <img
                            src={`${API_BASE_URL}${track.thumbnail}`}
                            alt={track.title}
                            className="w-12 h-12 rounded object-cover bg-muted"
                            onError={(e) => {
                              e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24"%3E%3Cpath fill="%23ccc" d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/%3E%3C/svg%3E'
                            }}
                          />
                        </div>

                        {/* Track Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium line-clamp-2 break-words">
                                {track.title}
                              </h4>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {track.code}
                              </p>
                            </div>
                            <div className="flex-shrink-0 text-right">
                              <span className="text-xs font-medium text-muted-foreground">
                                {formatTime(track.duration)}
                              </span>
                            </div>
                          </div>
                          
                          {/* Now Playing Indicator */}
                          {isCurrentTrack && (
                            <div className="flex items-center gap-2 mt-2">
                              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                              <span className="text-xs font-bold text-red-500">NOW PLAYING</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default DailySchedule
