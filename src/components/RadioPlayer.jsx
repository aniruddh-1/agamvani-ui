import { useRef, useEffect, useState } from 'react'
import ReactHlsPlayer from 'react-hls-player'
import Hls from 'hls.js'
import { Capacitor } from '@capacitor/core'
import { App as CapApp } from '@capacitor/app'
import { Filesystem, Directory } from '@capacitor/filesystem'
import BackgroundAudio from '../services/backgroundAudioPlugin'
import { API_BASE_URL } from '../config/constants'
import DailySchedule from './DailySchedule'
import { Download, ExternalLink } from 'lucide-react'
import { useRadioCache } from '../contexts/RadioCacheContext'
import LazyImage from './LazyImage'

function RadioPlayer({ streamUrl }) {
  const { nowPlaying } = useRadioCache() // Use shared cached state
  const [activeTab, setActiveTab] = useState('player') // 'player' or 'schedule'
  const playerRef = useRef(null)
  const hlsRef = useRef(null)
  const retryIntervalRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(1)
  const [restartCount, setRestartCount] = useState(0)
  const [isConnecting, setIsConnecting] = useState(false)
  const [downloading, setDownloading] = useState(false)

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
        title: nowPlaying?.title || 'Agam Vani Radio',
        artist: nowPlaying?.artist || 'Spiritual Radio',
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
  }, [isPlaying, nowPlaying])

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
        switch (data.type) {
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

  // Update track title on native player when track changes
  useEffect(() => {
    if (isNativeAndroid && nowPlaying) {
      BackgroundAudio.updateTrackTitle({
        title: nowPlaying.title || 'लाइव स्ट्रीमिंग'
      }).catch(err =>
        console.error('Failed to update track title:', err)
      )
    }
  }, [isNativeAndroid, nowPlaying])

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
            title: nowPlaying?.title || 'लाइव स्ट्रीमिंग'
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

  const handleVolumeChange = async (e) => {
    const newVolume = parseFloat(e.target.value)
    setVolume(newVolume)

    // Update HTML5 player for web
    if (playerRef.current) {
      playerRef.current.volume = newVolume
    }

    // Update native player volume on Android
    if (isNativeAndroid) {
      try {
        await BackgroundAudio.setVolume({ volume: newVolume })
      } catch (error) {
        console.error('Failed to set native player volume:', error)
      }
    }
  }

  const convertBlobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onerror = reject
      reader.onload = () => {
        resolve(reader.result.split(',')[1])
      }
      reader.readAsDataURL(blob)
    })
  }

  const downloadTrackImage = async () => {
    if (!nowPlaying) return

    try {
      setDownloading(true)

      // Use image_path if available (vandana/satsang), otherwise use thumbnail (original tracks)
      const imageUrl = nowPlaying.image_path || nowPlaying.thumbnail
      if (!imageUrl) return

      const thumbnailUrl = `${API_BASE_URL}${imageUrl}`
      const response = await fetch(thumbnailUrl)
      const blob = await response.blob()
      const originalFilename = imageUrl.split('/').pop()

      if (Capacitor.isNativePlatform()) {
        // Android/iOS: Use Filesystem API
        const base64Data = await convertBlobToBase64(blob)

        await Filesystem.writeFile({
          path: originalFilename,
          data: base64Data,
          directory: Directory.Documents,
        })

        alert('Image saved successfully to Documents folder!')
      } else {
        // Web: Use existing method
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = originalFilename

        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }

    } catch (error) {
      console.error('Failed to download image:', error)
      alert('Failed to download image. Please try again.')
    } finally {
      setDownloading(false)
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
      {/* Hidden HLS Player - Always rendered, only hidden visually */}
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

      {/* Platform Link Banner */}
      <a
        href="https://vani.ramsabha.in"
        target="_blank"
        rel="noopener noreferrer"
        className="block rounded-lg p-4 shadow-spiritual animate-peaceful-fade hover:shadow-divine transition-all hover:scale-[1.02] cursor-pointer"
        style={{ background: 'linear-gradient(135deg, #FF9933 0%, #F59E0B 100%)' }}
      >
        <div className="text-center relative">
          <h3 className="text-white font-bold text-lg mb-1 drop-shadow-md flex items-center justify-center gap-2">
            अगम देश की अणभै वाणी (सुखोवाच)
            <ExternalLink className="w-5 h-5" />
          </h3>
          <p className="text-white/95 text-sm leading-relaxed drop-shadow">
            आदि सत्तगुरु सुखरामजी महाराज के कैवल्य-ज्ञान विज्ञान के द्वारा आत्म अनुभूति एवं जीवित अवस्था में परममोक्ष तक की यात्रा सुगम करें।
          </p>
        </div>
      </a>

      {/* Agam Vani Forms Announcement Banner */}
      <div className="rounded-lg overflow-hidden shadow-lg border-2 border-saffron-500 animate-peaceful-fade">
        <div className="bg-gradient-to-r from-saffron-600 via-orange-500 to-red-500 p-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <svg className="w-6 h-6 text-white animate-pulse" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
            </svg>
            <h3 className="text-white font-bold text-lg text-center drop-shadow-md">
              🎤 अगम वाणी गायक नामांकन - फॉर्म फिर से खुले हैं! 🎤
            </h3>
          </div>
          <p className="text-white/95 text-sm text-center mb-3 drop-shadow">
            अगम वाणी के गायक बनने का अवसर - अभी आवेदन करें!
          </p>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-saffron-50 dark:from-orange-950/30 dark:to-saffron-950/30 p-4 space-y-3">
          {/* Singer List Link */}
          <a
            href="https://docs.google.com/spreadsheets/d/1FkGz2cUxN5_sdtCe6dubrgqssJHqQM3_Yj3ep_rVF6A/view?gid=0#gid=0"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow hover:shadow-md transition-all hover:scale-[1.02] border border-blue-300"
          >
            <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-blue-900 text-sm">अगम वाणी गायकों की सूची</p>
              <p className="text-xs text-blue-700">वर्तमान गायकों की पूरी सूची देखें</p>
            </div>
            <ExternalLink className="w-4 h-4 text-saffron-600 flex-shrink-0" />
          </a>

          {/* Nomination Form Link */}
          <a
            href="https://docs.google.com/forms/d/e/1FAIpQLSeiVrus1kqMHbENbyac2ETVeoxwrq_v_UlUc7Dm0cn7arxAaQ/viewform"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow hover:shadow-md transition-all hover:scale-[1.02] border border-green-300"
          >
            <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-green-900 text-sm">गायक नामांकन फॉर्म</p>
              <p className="text-xs text-green-700">नए गायक के रूप में पंजीकरण करें</p>
            </div>
            <ExternalLink className="w-4 h-4 text-green-600 flex-shrink-0" />
          </a>

          {/* Recording Submission Form Link */}
          <a
            href="https://docs.google.com/forms/d/e/1FAIpQLSfgDspS1kyz0zg3sivRAYCrMD49Mg1Km_YRt2VE3jBh0hrpZg/viewform"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg shadow hover:shadow-md transition-all hover:scale-[1.02] border border-purple-300"
          >
            <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-purple-900 text-sm">पद गायन रिकॉर्डिंग फॉर्म</p>
              <p className="text-xs text-purple-700">अपनी रिकॉर्डिंग जमा करें (प्रसार चरण)</p>
            </div>
            <ExternalLink className="w-4 h-4 text-purple-600 flex-shrink-0" />
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab('player')}
          className={`flex-1 py-3 px-4 text-center font-medium transition-colors ${activeTab === 'player'
            ? 'text-saffron-600 border-b-2 border-saffron-600'
            : 'text-muted-foreground hover:text-foreground'
            }`}
        >
          Player
        </button>
        <button
          onClick={() => setActiveTab('schedule')}
          className={`flex-1 py-3 px-4 text-center font-medium transition-colors ${activeTab === 'schedule'
            ? 'text-saffron-600 border-b-2 border-saffron-600'
            : 'text-muted-foreground hover:text-foreground'
            }`}
        >
          Schedule
        </button>
      </div>

      {/* Player Tab Content */}
      {activeTab === 'player' && (
        <>
          {/* Player Controls */}
          <div className="rounded-lg border border-border shadow-sm bg-card p-6">
            {/* Now Playing Info */}
            {nowPlaying && (
              <div className="mb-4 pb-4 border-b border-border">
                <p className="text-xs text-muted-foreground mb-1">Now Playing</p>
                <h3 className="text-sm font-semibold text-foreground line-clamp-2">
                  {nowPlaying.category === 'original' ? nowPlaying.title : 'अगम वाणी'}
                </h3>
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

              {/* Volume Control and Download */}
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

                {/* Download Button */}
                {nowPlaying && (
                  <button
                    onClick={downloadTrackImage}
                    disabled={downloading}
                    className="p-2 hover:bg-muted rounded-lg transition-colors disabled:opacity-50"
                    title="Download track image"
                  >
                    {downloading ? (
                      <div className="w-5 h-5 border-2 border-saffron-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Download className="w-5 h-5 text-saffron-500" />
                    )}
                  </button>
                )}
              </div>
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

          {/* Thumbnail Card */}
          {nowPlaying && (nowPlaying.thumbnail || nowPlaying.image_path) && (
            <div className="rounded-lg border border-border shadow-sm bg-card overflow-hidden">
              {/* Large Thumbnail/Lyrics Image */}
              <LazyImage
                key={nowPlaying.image_path || nowPlaying.thumbnail}
                src={nowPlaying.image_path || nowPlaying.thumbnail}
                trackCode={`${nowPlaying.code}-${nowPlaying.id || nowPlaying.file_path || nowPlaying.title}`}
                alt={nowPlaying.title}
                className="w-full object-cover object-top bg-gradient-to-br from-saffron-50 to-saffron-100 dark:from-saffron-950 dark:to-saffron-900"
                eager={true}
              />
            </div>
          )}
        </>
      )}

      {/* Schedule Tab Content */}
      {activeTab === 'schedule' && (
        <DailySchedule isActive={activeTab === 'schedule'} />
      )}
    </div>
  )
}

export default RadioPlayer
