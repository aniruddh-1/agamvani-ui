import { useRef, useEffect, useState } from 'react'
import ReactHlsPlayer from 'react-hls-player'
import Hls from 'hls.js'
import { Capacitor } from '@capacitor/core'
import { App as CapApp } from '@capacitor/app'
import BackgroundAudio from '../services/backgroundAudioPlugin'
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
  
  // Use native player on Android, HTML5 on web
  const isNativeAndroid = Capacitor.getPlatform() === 'android' && Capacitor.isNativePlatform()

  // Construct full HLS URL
  const hlsUrl = streamUrl?.startsWith('http') 
    ? streamUrl 
    : `${API_BASE_URL}${streamUrl}`

  // Setup Media Session for background playback
  useEffect(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack?.title || 'Agam Vani Radio',
        artist: currentTrack?.artist || 'Spiritual Radio',
        album: 'Live Stream',
        artwork: [
          { src: '/logo.png', sizes: '96x96', type: 'image/png' },
          { src: '/logo.png', sizes: '128x128', type: 'image/png' },
          { src: '/logo.png', sizes: '192x192', type: 'image/png' },
          { src: '/logo.png', sizes: '256x256', type: 'image/png' },
          { src: '/logo.png', sizes: '384x384', type: 'image/png' },
          { src: '/logo.png', sizes: '512x512', type: 'image/png' },
        ]
      })

      navigator.mediaSession.setActionHandler('play', () => {
        if (playerRef.current) {
          playerRef.current.play()
          setIsPlaying(true)
        }
      })

      navigator.mediaSession.setActionHandler('pause', () => {
        if (playerRef.current) {
          playerRef.current.pause()
          setIsPlaying(false)
        }
      })

      // Update playback state
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused'
    }
  }, [isPlaying, currentTrack])

  // Native player runs continuously on Android - no switching needed

  // Initialize HLS with custom error recovery
  useEffect(() => {
    if (!playerRef.current || !Hls.isSupported()) return

    const video = playerRef.current
    
    // Enable background audio on mobile
    video.setAttribute('playsinline', 'true')
    video.setAttribute('webkit-playsinline', 'true')
    
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
        
        // Always update track info (compare by ID to avoid unnecessary re-renders)
        if (data.track) {
          setCurrentTrack(prevTrack => {
            // Only update if track ID changed or if no previous track
            if (!prevTrack || prevTrack.id !== data.track.id) {
              console.log('Track changed:', data.track.title)
              return data.track
            }
            return prevTrack
          })
        }
      } catch (err) {
        console.error('Failed to fetch now-playing:', err)
      }
    }
    
    // Fetch immediately
    fetchNowPlaying()
    
    // Poll every 5 seconds for more responsive updates
    const intervalId = setInterval(fetchNowPlaying, 5000)
    
    return () => clearInterval(intervalId)
  }, [API_BASE_URL])

  // Update track title on native player when track changes
  useEffect(() => {
    if (isNativeAndroid && currentTrack && isPlaying) {
      BackgroundAudio.updateTrackTitle({ 
        title: currentTrack.title || 'लाइव स्ट्रीमिंग' 
      }).catch(err => 
        console.error('Failed to update track title:', err)
      )
    }
  }, [isNativeAndroid, currentTrack, isPlaying])

  // Cleanup native player on unmount
  useEffect(() => {
    return () => {
      if (isNativeAndroid) {
        BackgroundAudio.stopAudio().catch(err => 
          console.error('Failed to stop native player on unmount:', err)
        )
      }
    }
  }, [isNativeAndroid])

  const togglePlay = async () => {
    // Use native player on Android, HTML5 on web
    if (isNativeAndroid) {
      try {
        if (isPlaying) {
          await BackgroundAudio.pauseAudio()
          setIsPlaying(false)
        } else {
          await BackgroundAudio.startAudio({
            url: hlsUrl,
            title: currentTrack?.title || 'लाइव स्ट्रीमिंग'
          })
          setIsPlaying(true)
        }
      } catch (error) {
        console.error('Native player error:', error)
      }
    } else {
      // HTML5 player for web
      if (!playerRef.current) return
      
      if (isPlaying) {
        playerRef.current.pause()
      } else {
        playerRef.current.play().catch(err => {
          console.error('Play error:', err)
        })
      }
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
        {/* Now Playing Info */}
        {currentTrack && (
          <div className="mb-4 pb-4 border-b border-border">
            <p className="text-xs text-muted-foreground mb-1">Now Playing</p>
            <h3 className="text-sm font-semibold text-foreground line-clamp-2">{currentTrack.title}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              <span className="text-xs font-medium text-red-500">LIVE</span>
            </div>
          </div>
        )}

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

        {/* Hidden HLS Player - Only for web, not used on Android native */}
        {!isNativeAndroid && (
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
        )}

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

      {/* Thumbnail Card */}
      {currentTrack && currentTrack.thumbnail && (
        <div className="rounded-lg border border-border shadow-sm bg-card overflow-hidden">
          {/* Large Thumbnail/Lyrics Image */}
          <img 
            src={`${API_BASE_URL}${currentTrack.thumbnail}`}
            alt={currentTrack.title}
            className="w-full object-cover object-top bg-gradient-to-br from-saffron-50 to-saffron-100 dark:from-saffron-950 dark:to-saffron-900"
            onError={(e) => {
              e.target.parentElement.innerHTML = `
                <div class="w-full h-[400px] flex items-center justify-center" style="background: linear-gradient(135deg, #FF9933 0%, #F59E0B 100%)">
                  <svg class="w-32 h-32 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                  </svg>
                </div>
              `
            }}
          />
        </div>
      )}
    </div>
  )
}

export default RadioPlayer
