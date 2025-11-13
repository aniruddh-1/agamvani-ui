import { useState, useEffect, useRef } from 'react'
import { Copy, Check } from 'lucide-react'
import { useRadioCache } from '../contexts/RadioCacheContext'
import LazyImage from './LazyImage'

function DailySchedule({ isActive = false }) {
  const { schedule: contextSchedule, nowPlaying, fetchSchedule: contextFetchSchedule } = useRadioCache()
  const [schedule, setSchedule] = useState(contextSchedule)
  const [loading, setLoading] = useState(!contextSchedule)
  const [error, setError] = useState(null)
  const [expandedSlots, setExpandedSlots] = useState(new Set())
  const [copiedId, setCopiedId] = useState(null)
  const currentTrackRef = useRef(null)
  const hasScrolledRef = useRef(false)

  // Update local schedule when context schedule changes
  useEffect(() => {
    if (contextSchedule) {
      setSchedule(contextSchedule)
      setLoading(false)
      setError(null)
    }
  }, [contextSchedule])

  // Update schedule with current track info from nowPlaying
  useEffect(() => {
    if (nowPlaying && schedule) {
      const needsUpdate = 
        schedule.current_track_code !== nowPlaying.code ||
        schedule.current_sequence_number !== nowPlaying.sequence_number ||
        schedule.current_slot !== nowPlaying.current_slot
      
      if (needsUpdate) {
        setSchedule(prevSchedule => {
          if (!prevSchedule) return prevSchedule
          return {
            ...prevSchedule,
            current_track_code: nowPlaying.code,
            current_track_id: nowPlaying.id,
            current_sequence_number: nowPlaying.sequence_number,
            current_slot: nowPlaying.current_slot
          }
        })
      }
    }
  }, [nowPlaying, schedule])

  const fetchSchedule = async () => {
    try {
      setLoading(true)
      setError(null)
      await contextFetchSchedule(true) // Force refresh
    } catch (err) {
      console.error('Failed to fetch schedule:', err)
      setError('Failed to load schedule')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Fetch schedule on mount if not already cached
    if (!contextSchedule) {
      contextFetchSchedule().catch(err => {
        console.error('Failed to fetch schedule:', err)
        setError('Failed to load schedule')
        setLoading(false)
      })
    }
  }, []) // Only run on mount

  // Auto-scroll to current track when schedule tab becomes active
  useEffect(() => {
    if (isActive && schedule && nowPlaying) {
      // Reset scroll flag when tab becomes active so it can scroll again
      hasScrolledRef.current = false
      
      // Skip auto-scroll if current track is supplemental (hidden from display)
      if (nowPlaying.category !== 'original') {
        return
      }
      
      // Find the CURRENT slot containing the current track and ensure it's expanded
      const currentSlot = schedule.slots?.find(slot => 
        slot.slot_name === schedule.current_slot && 
        slot.tracks?.some(track => 
          track.code === nowPlaying.code && 
          track.sequence_number === nowPlaying.sequence_number
        )
      )
      
      if (currentSlot) {
        // Ensure the slot is expanded
        setExpandedSlots(prev => new Set([...prev, currentSlot.slot_name]))
        
        // Wait a bit for the slot to expand and DOM to update, then scroll
        const scrollTimeout = setTimeout(() => {
          if (currentTrackRef.current && !hasScrolledRef.current) {
            currentTrackRef.current.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'center',
              inline: 'nearest'
            })
            hasScrolledRef.current = true
          }
        }, 400)
        
        return () => clearTimeout(scrollTimeout)
      }
    }
  }, [isActive, schedule, nowPlaying])

  // Also scroll when schedule first loads (initial load)
  useEffect(() => {
    if (schedule && nowPlaying && currentTrackRef.current && !hasScrolledRef.current) {
      // Skip auto-scroll if current track is supplemental (hidden from display)
      if (nowPlaying.category !== 'original') {
        return
      }
      
      // Find the CURRENT slot containing the current track
      const currentSlot = schedule.slots?.find(slot => 
        slot.slot_name === schedule.current_slot && 
        slot.tracks?.some(track => 
          track.code === nowPlaying.code && 
          track.sequence_number === nowPlaying.sequence_number
        )
      )
      
      if (currentSlot) {
        // Ensure the slot is expanded
        setExpandedSlots(prev => new Set([...prev, currentSlot.slot_name]))
        
        // Wait for DOM to update, then scroll
        const scrollTimeout = setTimeout(() => {
          if (currentTrackRef.current) {
            currentTrackRef.current.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'center',
              inline: 'nearest'
            })
            hasScrolledRef.current = true
          }
        }, 600)
        
        return () => clearTimeout(scrollTimeout)
      }
    }
  }, [schedule, nowPlaying])

  const toggleSlot = (slotName) => {
    const newExpanded = new Set(expandedSlots)
    if (newExpanded.has(slotName)) {
      newExpanded.delete(slotName)
    } else {
      newExpanded.add(slotName)
    }
    setExpandedSlots(newExpanded)
  }

  // Helper function to determine if a track should be displayed in the UI
  // Only show 'original' tracks, hide supplemental audio (vandana, dhanya, rag, pad-rag, satsang)
  const shouldShowTrack = (track) => {
    return track.category === 'original'
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

  const copyToClipboard = async (text, id) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
      alert('Failed to copy to clipboard')
    }
  }

  const formatSlotForCopy = (slot) => {
    let text = `🎵 ${slot.slot_label}\n`
    const visibleTracks = slot.tracks.filter(shouldShowTrack)
    text += `   कुल: ${visibleTracks.length} ट्रैक, ${formatDuration(slot.total_duration)}\n\n`
    
    visibleTracks.forEach((track, index) => {
      text += `   ${index + 1}. ${track.title} - ${formatTime(track.duration)}\n`
    })
    
    return text
  }

  const formatFullScheduleForCopy = () => {
    if (!schedule) return ''
    
    let text = `📅 आज का कार्यक्रम - ${formatDate(schedule.date)}\n\n`
    
    schedule.slots.forEach((slot) => {
      text += formatSlotForCopy(slot)
      text += '\n'
    })
    
    text += `\nGenerated by अगम वाणी\nhttps://vani.ramsabha.in`
    
    return text
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
          <div className="flex items-center gap-2">
            <button
              onClick={() => copyToClipboard(formatFullScheduleForCopy(), 'full')}
              className="p-2 hover:bg-muted rounded-lg transition-colors flex items-center gap-1"
              title="Copy full schedule"
            >
              {copiedId === 'full' ? (
                <Check className="w-5 h-5 text-green-500" />
              ) : (
                <Copy className="w-5 h-5" />
              )}
              <span className="text-sm">Copy All</span>
            </button>
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
      </div>

      {/* Time Slots */}
      <div className="space-y-3 pb-6">
        {schedule.slots.map((slot) => {
          const isExpanded = expandedSlots.has(slot.slot_name)
          // Dynamically compute is_current based on current_slot from schedule (updated via nowPlaying)
          const isCurrent = schedule.current_slot === slot.slot_name

          return (
            <div
              key={slot.slot_name}
              className={`rounded-lg border shadow-sm overflow-hidden transition-all ${
                isCurrent ? 'border-saffron-500 bg-saffron-50/50 dark:bg-saffron-950/20' : 'border-border bg-card'
              }`}
            >
              {/* Slot Header */}
              <div className="flex items-center">
                <button
                  onClick={() => toggleSlot(slot.slot_name)}
                  className="flex-1 p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors"
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
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
                      <span>{slot.tracks.filter(shouldShowTrack).length} tracks</span>
                      <span>•</span>
                      <span>{formatDuration(slot.total_duration)}</span>
                    </div>
                  </div>
                  <svg
                    className={`w-5 h-5 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    copyToClipboard(formatSlotForCopy(slot), slot.slot_name)
                  }}
                  className="p-4 hover:bg-muted/50 transition-colors"
                  title="Copy slot"
                >
                  {copiedId === slot.slot_name ? (
                    <Check className="w-5 h-5 text-green-500" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                </button>
              </div>

              {/* Track List */}
              {isExpanded && (
                <div className="border-t border-border">
                  {slot.tracks
                    .filter(shouldShowTrack)
                    .map((track, displayIndex) => {
                    // Match by code, sequence_number, AND ensure it's in the current slot to avoid highlighting duplicates
                    const isCurrentTrack = 
                      track.code === schedule.current_track_code && 
                      track.sequence_number === schedule.current_sequence_number &&
                      isCurrent
                    
                    // Find actual index in full track array for unique key
                    const actualIndex = slot.tracks.indexOf(track)

                    return (
                      <div
                        key={`${slot.slot_name}-${track.id}-${actualIndex}`}
                        ref={isCurrentTrack ? currentTrackRef : null}
                        className={`flex items-start gap-3 p-3 border-b border-border last:border-b-0 transition-colors ${
                          isCurrentTrack ? 'bg-saffron-100 dark:bg-saffron-900/30' : 'hover:bg-muted/30'
                        }`}
                      >
                        {/* Track Number */}
                        <div className="flex-shrink-0 w-8 text-center">
                          <span className="text-sm font-medium text-muted-foreground">
                            {displayIndex + 1}
                          </span>
                        </div>

                        {/* Thumbnail */}
                        <div className="flex-shrink-0">
                          <LazyImage
                            src={track.thumbnail}
                            trackCode={track.code}
                            alt={track.title}
                            className="w-12 h-12 rounded object-cover bg-muted"
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
