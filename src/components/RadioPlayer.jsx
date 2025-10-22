import { useRef, useEffect, useState } from 'react'
import ReactHlsPlayer from 'react-hls-player'
import Hls from 'hls.js'
import { API_BASE_URL } from '../config/constants'

function RadioPlayer({ streamUrl }) {
  const playerRef = useRef(null)
  const hlsRef = useRef(null)
  const retryIntervalRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(1)
  const [currentTrack, setCurrentTrack] = useState(null)
  const [restartCount, setRestartCount] = useState(0)
  const [isConnecting, setIsConnecting] = useState(false)

  // Construct full HLS URL
  const hlsUrl = streamUrl?.startsWith('http') 
    ? streamUrl 
    : `${API_BASE_URL}${streamUrl}`

  // Initialize HLS with custom error recovery
  useEffect(() => {
    if (!playerRef.current || !Hls.isSupported()) return

    const video = playerRef.current
    const hls = new Hls({
      enableWorker: true,
      lowLatencyMode: true,
      backBufferLength: 90,
      manifestLoadingTimeOut: 10000,
      manifestLoadingMaxRetry: Infinity, // Retry forever
      manifestLoadingRetryDelay: 1000,
      levelLoadingTimeOut: 10000,
      levelLoadingMaxRetry: Infinity, // Retry forever
      levelLoadingRetryDelay: 1000,
      fragLoadingTimeOut: 20000,
      fragLoadingMaxRetry: Infinity, // Retry forever
      fragLoadingRetryDelay: 1000,
    })

    hlsRef.current = hls

    // Error recovery handler
    hls.on(Hls.Events.ERROR, (event, data) => {
      if (data.fatal) {
        switch(data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            console.log('Network error, attempting to recover...')
            setIsConnecting(true)
            // Start retry immediately
            hls.startLoad()
            break
          case Hls.ErrorTypes.MEDIA_ERROR:
            console.log('Media error, attempting to recover...')
            hls.recoverMediaError()
            break
          default:
            console.log('Fatal error, destroying and recreating...')
            hls.destroy()
            // Recreate after short delay
            setTimeout(() => {
              if (playerRef.current) {
                const newHls = new Hls(hls.config)
                hlsRef.current = newHls
                newHls.loadSource(hlsUrl)
                newHls.attachMedia(video)
              }
            }, 1000)
            break
        }
      }
    })

    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      setIsConnecting(false)
      console.log('HLS manifest loaded successfully')
      if (isPlaying) {
        video.play().catch(err => console.log('Auto-play prevented:', err))
      }
    })

    hls.loadSource(hlsUrl)
    hls.attachMedia(video)

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy()
      }
    }
  }, [hlsUrl])

  // Additional monitoring - check if playback stalled and resume if needed
  useEffect(() => {
    const monitorPlayback = () => {
      if (hlsRef.current && hlsRef.current.media && isPlaying) {
        const video = hlsRef.current.media
        // If playing flag is set but video is paused, try to resume
        if (video.paused && !video.ended) {
          console.log('Detected paused state during playback, attempting resume')
          video.play().catch(err => console.log('Resume error:', err))
        }
      }
    }

    // Check every 10 seconds (less frequent, less console noise)
    retryIntervalRef.current = setInterval(monitorPlayback, 10000)

    return () => {
      if (retryIntervalRef.current) {
        clearInterval(retryIntervalRef.current)
      }
    }
  }, [isPlaying])

  // Fetch now-playing from server
  useEffect(() => {
    const fetchNowPlaying = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/radio/now-playing`)
        if (!response.ok) {
          console.error('Failed to fetch now-playing')
          return
        }
        const data = await response.json()
        
        // Update thumbnail if track changed
        if (data.track && data.track.id !== currentTrack?.id) {
          // console.log('Now playing:', data.track.title, `(${Math.floor(data.position)}s/${Math.floor(data.track.duration)}s)`)
          setCurrentTrack(data.track)
        }
      } catch (err) {
        console.error('Failed to fetch now-playing:', err)
      }
    }
    
    // Fetch immediately
    fetchNowPlaying()
    
    // Poll every 10 seconds
    const intervalId = setInterval(fetchNowPlaying, 10000)
    
    return () => clearInterval(intervalId)
  }, [currentTrack])

  const togglePlay = () => {
    if (!playerRef.current) return
    
    if (isPlaying) {
      playerRef.current.pause()
    } else {
      playerRef.current.play().catch(err => {
        console.error('Play error:', err)
      })
    }
  }

  // Monitor playback and auto-restart when ended
  useEffect(() => {
    if (!playerRef.current) return

    const handleEnded = () => {
      // console.log('Stream ended, restarting...')
      // Properly restart playback
      if (playerRef.current && isPlaying) {
        // Pause first to clean up
        playerRef.current.pause()
        // Reset to beginning
        playerRef.current.currentTime = 0
        // Reload and play
        setTimeout(() => {
          if (playerRef.current) {
            playerRef.current.load()
            playerRef.current.play().catch(err => {
              console.error('Restart error:', err)
            })
            setRestartCount(prev => prev + 1)
          }
        }, 200)
      }
    }

    const handleWaiting = () => {
      // console.log('Buffering...')
    }

    const handleError = (e) => {
      // console.error('Playback error:', e)
    }

    const player = playerRef.current
    if (player) {
      player.addEventListener('ended', handleEnded)
      player.addEventListener('waiting', handleWaiting)
      player.addEventListener('error', handleError)

      return () => {
        player.removeEventListener('ended', handleEnded)
        player.removeEventListener('waiting', handleWaiting)
        player.removeEventListener('error', handleError)
      }
    }
  }, [isPlaying])

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value)
    setVolume(newVolume)
    if (playerRef.current) {
      playerRef.current.volume = newVolume
    }
  }

  if (!streamUrl) {
    return <div className="text-center text-muted-foreground py-4">No stream available</div>
  }

  if (!streamUrl) {
    return <div className="text-center text-muted-foreground py-4">No stream available</div>
  }

  return (
    <div className="w-full space-y-4">
      {/* Player Controls */}
      <div className="rounded-lg border border-border shadow-sm bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          {/* Play/Pause Button */}
          <button
            onClick={togglePlay}
            className="w-16 h-16 rounded-full text-white flex items-center justify-center transition-all shadow-lg hover:shadow-xl"
            style={{ background: 'linear-gradient(135deg, #FF9933 0%, #F59E0B 100%)' }}
          >
            {isPlaying ? (
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            ) : (
              <svg className="w-8 h-8 ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          {/* Volume Control */}
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-muted-foreground" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
            </svg>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={handleVolumeChange}
              className="w-32 h-2 bg-muted rounded-lg appearance-none cursor-pointer"
              style={{ accentColor: '#FF9933' }}
            />
          </div>
        </div>

        {/* Hidden HLS Player */}
        <div style={{ display: 'none' }}>
          <ReactHlsPlayer
            src={hlsUrl}
            playerRef={playerRef}
            autoPlay={false}
            controls={false}
            loop={true}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => {
              // Auto-restart when stream ends
              if (playerRef.current) {
                playerRef.current.currentTime = 0
                playerRef.current.play()
              }
            }}
          />
        </div>

        {/* Status */}
        <div className="text-center text-sm text-muted-foreground">
          {isConnecting && isPlaying ? (
            <span className="flex items-center justify-center gap-2">
              <span className="inline-block w-4 h-4 border-2 border-saffron-500 border-t-transparent rounded-full animate-spin"></span>
              कनेक्ट हो रहा है...
            </span>
          ) : isPlaying ? (
            'स्ट्रीमिंग चल रही है'
          ) : (
            'सुनने के लिए स्पर्श कीजिए'
          )}
        </div>
      </div>

      {/* Now Playing Card with Large Thumbnail */}
      {currentTrack && (
        <div className="rounded-lg border border-border shadow-sm bg-card overflow-hidden relative">
          {/* Large Thumbnail/Lyrics Image */}
          {currentTrack.thumbnail ? (
            <img 
              src={`${API_BASE_URL}${currentTrack.thumbnail}`}
              alt={currentTrack.title}
              className="w-full h-[1000px] object-contain bg-gradient-to-br from-saffron-50 to-saffron-100 dark:from-saffron-950 dark:to-saffron-900"
              onError={(e) => {
                e.target.parentElement.innerHTML = `
                  <div class="w-full h-[1000px] flex items-center justify-center" style="background: linear-gradient(135deg, #FF9933 0%, #F59E0B 100%)">
                    <svg class="w-32 h-32 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                    </svg>
                  </div>
                `
              }}
            />
          ) : (
            <div className="w-full h-[1000px] flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #FF9933 0%, #F59E0B 100%)' }}>
              <svg className="w-32 h-32 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
              </svg>
            </div>
          )}
          
          {/* Track Info Overlay */}
          <div className="p-4 bg-gradient-to-t from-black/80 to-transparent absolute bottom-0 left-0 right-0 text-white">
            <p className="text-xs opacity-90">Now Playing</p>
            <h3 className="text-xl font-bold">{currentTrack.title}</h3>
            <div className="flex items-center gap-2 mt-2">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              <span className="text-xs font-medium">LIVE</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default RadioPlayer
