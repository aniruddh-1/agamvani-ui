import { useState, useEffect, useRef } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { App as CapacitorApp } from '@capacitor/app'
import RadioPlayer from './components/RadioPlayer'
import { APP_CONFIG, API_ENDPOINTS } from './config/constants'
import { useAuth } from './contexts/AuthContext'
import { RadioCacheProvider } from './contexts/RadioCacheContext'
import { deepLinkService } from './services/deepLinkService'

// Import auth components
import LoginPage from './components/auth/LoginPage'
import RegisterPage from './components/auth/RegisterPage'
import InviteRegistrationPage from './components/auth/InviteRegistrationPage'
import ForgotPasswordPage from './components/auth/ForgotPasswordPage'
import ResetPasswordPage from './components/auth/ResetPasswordPage'
import ProfileCompletion from './components/auth/ProfileCompletion'
import AuthSuccess from './components/auth/AuthSuccess'
import AuthError from './components/auth/AuthError'
import PendingVerification from './components/auth/PendingVerification'
import DeleteAccount from './components/profile/DeleteAccount'
import AccountSettings from './components/profile/AccountSettings'
import ChangePassword from './components/auth/ChangePassword'
import AdminPanel from './components/admin/AdminPanel'
import InviteButton from './components/admin/InviteButton'
import FeedbackButton from './components/FeedbackButton'
import PrivacyPolicy from './components/legal/PrivacyPage'
import TermsOfService from './components/legal/TermsPage'
import SatsangSchedule from './components/SatsangSchedule'

// Loading component
const LoadingSpinner = ({ message = 'Loading...' }) => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <div className="inline-block w-12 h-12 border-4 border-saffron-200 border-t-saffron-600 rounded-full animate-spin mb-4"></div>
      <p className="text-muted-foreground">{message}</p>
    </div>
  </div>
)

// Protected Route Component
const ProtectedRoute = ({ children, skipProfileCheck = false, skipVerificationCheck = false }) => {
  const { isAuthenticated, isLoading, user } = useAuth()

  if (isLoading) {
    return <LoadingSpinner message="Authenticating..." />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Check if profile completion is required
  if (!skipProfileCheck && user && !user.profile_completed) {
    return <Navigate to="/complete-profile" replace />
  }

  // Check verification status (only after profile is completed)
  if (!skipVerificationCheck && user && user.profile_completed) {
    // Admins are automatically approved once profile is completed
    if (user.is_admin) {
      return <>{children}</>
    }

    // Users with invitation approval method
    if (user.approval_method === 'invitation') {
      return <>{children}</>
    }

    // Users that are already verified
    if (user.is_verified) {
      return <>{children}</>
    }

    // Regular users need approval
    if (user.verification_status !== 'approved') {
      return <Navigate to="/pending-verification" replace />
    }
  }

  return <>{children}</>
}

// Public Route Component
const PublicRoute = ({ children, allowWhenIncomplete = false }) => {
  const { isAuthenticated, isLoading, user } = useAuth()

  if (isLoading) {
    return <LoadingSpinner />
  }

  // Only redirect if user is actually authenticated
  if (isAuthenticated && user) {
    if (user.profile_completed) {
      if (user.is_admin) {
        return <Navigate to="/" replace />
      }

      if (user.approval_method === 'invitation') {
        return <Navigate to="/" replace />
      }

      if (user.is_verified) {
        return <Navigate to="/" replace />
      }

      if (user.verification_status === 'approved') {
        return <Navigate to="/" replace />
      } else {
        return <Navigate to="/pending-verification" replace />
      }
    }

    if (!user.profile_completed && !allowWhenIncomplete) {
      return <Navigate to="/complete-profile" replace />
    }
  }

  return <>{children}</>
}

// Main Radio Page Component
const RadioPage = () => {
  const [liveStream, setLiveStream] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  // Zoom functionality
  const [pageScale, setPageScale] = useState(1)
  const [pagePosition, setPagePosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const touchStartRef = useState({ distance: 0, x: 0, y: 0, scale: 1 })[0]

  useEffect(() => {
    initializeRadio()
  }, [])

  const initializeRadio = async () => {
    try {
      setLoading(true)

      // Get live radio stream
      const liveResponse = await fetch(API_ENDPOINTS.RADIO_LIVE)
      if (!liveResponse.ok) {
        throw new Error('Failed to initialize radio')
      }
      const liveData = await liveResponse.json()
      setLiveStream(liveData)
    } catch (err) {
      console.error('Error initializing radio:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const [showProfileMenu, setShowProfileMenu] = useState(false)

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showProfileMenu && !event.target.closest('.profile-menu-container')) {
        setShowProfileMenu(false)
      }
    }

    if (showProfileMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showProfileMenu])

  const handleLogout = async () => {
    try {
      await logout()
    } catch (err) {
      console.error('Logout error:', err)
    }
  }

  // Pinch-to-zoom handlers
  const getDistance = (touch1, touch2) => {
    const dx = touch1.clientX - touch2.clientX
    const dy = touch1.clientY - touch2.clientY
    return Math.sqrt(dx * dx + dy * dy)
  }

  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      // Pinch gesture - prevent default to disable scroll
      e.preventDefault()
      const distance = getDistance(e.touches[0], e.touches[1])
      touchStartRef.distance = distance
      touchStartRef.scale = pageScale
      touchStartRef.x = pagePosition.x
      touchStartRef.y = pagePosition.y
    } else if (e.touches.length === 1 && pageScale > 1) {
      // Single touch for dragging when zoomed
      setIsDragging(true)
      touchStartRef.x = e.touches[0].clientX - pagePosition.x
      touchStartRef.y = e.touches[0].clientY - pagePosition.y
      touchStartRef.scale = pageScale
    }
    // Allow normal scrolling for single touch when not zoomed
  }

  const handleTouchMove = (e) => {
    if (e.touches.length === 2) {
      // Pinch zoom - prevent scroll during pinch
      e.preventDefault()
      const distance = getDistance(e.touches[0], e.touches[1])
      const scale = (distance / touchStartRef.distance) * touchStartRef.scale
      const clampedScale = Math.max(1, Math.min(4, scale)) // Limit zoom between 1x and 4x
      setPageScale(clampedScale)

      // Reset position when zooming out to 1x
      if (clampedScale === 1) {
        setPagePosition({ x: 0, y: 0 })
      }
    } else if (e.touches.length === 1 && isDragging && pageScale > 1) {
      // Pan when zoomed - prevent scroll during pan
      e.preventDefault()
      const newX = e.touches[0].clientX - touchStartRef.x
      const newY = e.touches[0].clientY - touchStartRef.y
      setPagePosition({ x: newX, y: newY })
    }
    // Allow normal scrolling for single touch when not zoomed or dragging
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background/90 p-6">
      {/* Admin Invite Button - Fixed, not zoomable */}
      {user?.is_admin && <InviteButton />}

      {/* Feedback Button - Fixed, available to all authenticated users */}
      <FeedbackButton />

      {/* Zoomable content wrapper */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: `scale(${pageScale}) translate(${pagePosition.x / pageScale}px, ${pagePosition.y / pageScale}px)`,
          transformOrigin: 'center top',
          transition: isDragging ? 'none' : 'transform 0.1s ease-out',
        }}
      >
        {/* User Info Header with Profile Menu - Top Right */}
        <div className="absolute top-4 right-4 z-50">
          <div className="spiritual-card p-4 flex items-center gap-4">
            <div className="text-sm">
              <p className="font-medium text-foreground">{user?.full_name || user?.email}</p>
              <p className="text-xs text-muted-foreground">{user?.is_admin ? 'admin' : 'user'}</p>
            </div>
            <div className="relative profile-menu-container">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-saffron-600/10 text-saffron-600 hover:bg-saffron-600/20 rounded-lg transition-colors"
              >
                <div className="w-6 h-6 bg-saffron-600 rounded-full flex items-center justify-center text-white text-xs font-medium">
                  {user?.email?.charAt(0).toUpperCase()}
                </div>
                <span>Profile</span>
                <svg className={`w-4 h-4 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Profile Dropdown Menu */}
              {showProfileMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-[100] overflow-hidden">
                  <div className="py-2">
                    <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                      <p className="text-sm font-medium text-gray-900">{user?.full_name || 'User'}</p>
                      <p className="text-xs text-gray-600">{user?.email}</p>
                    </div>


                    <button
                      onClick={() => {
                        setShowProfileMenu(false)
                        navigate('/settings')
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Account Settings
                    </button>

                    <button
                      onClick={() => {
                        setShowProfileMenu(false)
                        navigate('/change-password')
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m0 0a2 2 0 012 2 2 2 0 00-2-2m-2-4H9a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V9a2 2 0 00-2-2m-2-4V3a2 2 0 00-2-2H9a2 2 0 00-2 2v2m6 0H9" />
                      </svg>
                      Change Password
                    </button>

                    {user?.is_admin && (
                      <button
                        onClick={() => {
                          setShowProfileMenu(false)
                          navigate('/admin')
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition-colors flex items-center gap-2 text-saffron-600 font-medium border-t border-gray-200"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        Admin Panel
                      </button>
                    )}

                    <div className="border-t border-gray-200 mt-2 pt-2">
                      <button
                        onClick={() => {
                          setShowProfileMenu(false)
                          handleLogout()
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Logout
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="max-w-7xl mx-auto pt-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Left Column - Logo and Description */}
            <div className="space-y-6">
              <div className="spiritual-card p-8">
                {/* Centered Logo */}
                <div className="flex flex-col items-center mb-8">
                  <img
                    src="/logo.png"
                    alt="Agamvani Logo"
                    className="w-64 h-64 object-contain filter drop-shadow-lg mb-4"
                  />
                  <h1 className="text-4xl font-bold text-foreground">अगम वाणी</h1>
                </div>

                {/* Description */}
                <div className="space-y-6">
                  <p className="text-base text-foreground leading-relaxed text-center">
                    आदि सत्तगुरु, सर्व आत्माओं के सत्तगुरु, सर्व सृष्टि के सत्तगुरु, सत्तगुरु सुखरामजी महाराज की अणभै वाणी से उनके अनुयायियों द्वारा गायन किए गए पद को श्रवण करने हेतु मंच
                  </p>

                  {/* Google Play Store Badge */}
                  <div className="pt-4 border-t border-border text-center">
                    <p className="text-xs text-muted-foreground mb-3">Download our mobile app</p>
                    <a
                      href="https://play.google.com/store/apps/details?id=in.ramsabha.agamvani"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block transition-transform hover:scale-105"
                    >
                      <img
                        src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png"
                        alt="Get it on Google Play"
                        className="h-14 mx-auto"
                      />
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Radio Player */}
            <div className="spiritual-card p-8">
              {loading && (
                <div className="text-center py-8">
                  <div className="inline-block w-12 h-12 border-4 border-saffron-200 border-t-saffron-600 rounded-full animate-spin mb-4"></div>
                  <p className="text-muted-foreground">Loading radio stream...</p>
                </div>
              )}

              {error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-4">
                  <p className="text-destructive text-sm mb-3">Error: {error}</p>
                  <button
                    onClick={initializeRadio}
                    className="px-4 py-2 bg-saffron-600 text-white rounded-lg hover:bg-saffron-700 transition-colors font-medium"
                  >
                    Retry
                  </button>
                </div>
              )}

              {!loading && !error && !liveStream && (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="mb-2">No live stream available.</p>
                  <p className="text-sm">Upload an audio file to get started.</p>
                </div>
              )}

              {!loading && !error && liveStream && (
                <RadioPlayer streamUrl={liveStream.stream_url} />
              )}
            </div>
          </div>

          {/* Online Programs Schedule */}
          <SatsangSchedule />
        </div>
      </div>
    </div>
  )
}

// Root paths where we should show "press back again to exit"
const ROOT_PATHS = ['/', '/login', '/register'];

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [initialDeepLinkHandled, setInitialDeepLinkHandled] = useState(false);
  const lastBackPressTime = useRef(0);
  const [showExitToast, setShowExitToast] = useState(false);

  // Set up deep link navigation handler - only once
  useEffect(() => {
    // Set navigation handler for deep links
    deepLinkService.setNavigationHandler((path) => {
      console.log('📱 Deep link navigation:', path);
      navigate(path);
    });
  }, []); // No dependencies - run once

  // Handle initial launch deep link - only once
  useEffect(() => {
    if (initialDeepLinkHandled) {
      return;
    }

    const checkInitialDeepLink = async () => {
      try {
        const initialPath = await deepLinkService.handleInitialLaunch();
        if (initialPath) {
          console.log('📱 Initial deep link:', initialPath);
          navigate(initialPath);
        } else {
          // Check for any stored pending path
          const pendingPath = deepLinkService.getPendingPath();
          if (pendingPath) {
            console.log('📱 Pending deep link:', pendingPath);
            navigate(pendingPath);
          }
        }
      } catch (error) {
        console.error('❌ Error handling initial deep link:', error);
      } finally {
        setInitialDeepLinkHandled(true);
      }
    };

    checkInitialDeepLink();
  }, [navigate, initialDeepLinkHandled]);

  // Handle Android back button (mobile only)
  useEffect(() => {
    // Only run on mobile platforms
    if (!window.Capacitor || window.Capacitor.getPlatform() === 'web') {
      return; // No cleanup needed for web
    }

    let handleBackButton;

    const setupBackButtonListener = async () => {
      handleBackButton = await CapacitorApp.addListener('backButton', ({ canGoBack }) => {
        const currentPath = location.pathname;
        const isRootPath = ROOT_PATHS.includes(currentPath);

        // If not on a root path and can go back in history, navigate back
        if (!isRootPath && canGoBack) {
          navigate(-1);
          return;
        }

        // If on root path, implement double-tap to exit
        const currentTime = Date.now();
        const timeSinceLastPress = currentTime - lastBackPressTime.current;

        if (timeSinceLastPress < 2000) {
          // Double tap detected within 2 seconds - exit app
          CapacitorApp.exitApp();
        } else {
          // First tap - show toast message
          lastBackPressTime.current = currentTime;
          setShowExitToast(true);

          // Hide toast after 2 seconds
          setTimeout(() => {
            setShowExitToast(false);
          }, 2000);
        }
      });
    };

    setupBackButtonListener();

    // Cleanup listener on unmount
    return () => {
      if (handleBackButton && typeof handleBackButton.remove === 'function') {
        handleBackButton.remove();
      }
    };
  }, [navigate, location.pathname]);

  return (
    <RadioCacheProvider>
      <Routes>
        {/* Authentication Routes */}
        <Route
          path="/login"
          element={
            <PublicRoute allowWhenIncomplete={true}>
              <LoginPage />
            </PublicRoute>
          }
        />

        <Route
          path="/register"
          element={
            <PublicRoute allowWhenIncomplete={true}>
              <RegisterPage />
            </PublicRoute>
          }
        />

        <Route
          path="/register/invite/:token"
          element={
            <PublicRoute allowWhenIncomplete={true}>
              <InviteRegistrationPage />
            </PublicRoute>
          }
        />

        <Route
          path="/auth/register/invite"
          element={
            <PublicRoute allowWhenIncomplete={true}>
              <InviteRegistrationPage />
            </PublicRoute>
          }
        />

        <Route
          path="/forgot-password"
          element={
            <PublicRoute allowWhenIncomplete={true}>
              <ForgotPasswordPage />
            </PublicRoute>
          }
        />

        <Route
          path="/reset-password"
          element={
            <PublicRoute allowWhenIncomplete={true}>
              <ResetPasswordPage />
            </PublicRoute>
          }
        />

        {/* Profile completion route */}
        <Route
          path="/complete-profile"
          element={
            <ProtectedRoute skipProfileCheck={true} skipVerificationCheck={true}>
              <ProfileCompletion />
            </ProtectedRoute>
          }
        />

        {/* Pending verification route */}
        <Route
          path="/pending-verification"
          element={
            <ProtectedRoute skipVerificationCheck={true}>
              <PendingVerification />
            </ProtectedRoute>
          }
        />

        {/* Profile routes */}

        <Route
          path="/profile/delete"
          element={
            <ProtectedRoute>
              <DeleteAccount />
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedRoute skipVerificationCheck={true}>
              <AccountSettings />
            </ProtectedRoute>
          }
        />

        <Route
          path="/change-password"
          element={
            <ProtectedRoute>
              <ChangePassword />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminPanel />
            </ProtectedRoute>
          }
        />

        {/* OAuth callback routes */}
        <Route path="/auth/success" element={<AuthSuccess />} />
        <Route path="/auth/error" element={<AuthError />} />

        {/* Legal pages - publicly accessible */}
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />

        {/* Main Radio Route (Protected) */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <RadioPage />
            </ProtectedRoute>
          }
        />

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Exit app toast message */}
      {showExitToast && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50 px-4 py-3 bg-gray-800 text-white rounded-lg shadow-lg animate-pulse">
          <p className="text-sm font-medium">Press back again to exit</p>
        </div>
      )}
    </RadioCacheProvider>
  )
}

export default App
