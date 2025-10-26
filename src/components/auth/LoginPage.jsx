import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Capacitor } from '@capacitor/core'
import { useAuth } from '../../contexts/AuthContext'
import { nativeGoogleAuth } from '../../services/nativeGoogleAuth'
import { API_BASE_URL, API_ENDPOINTS } from '../../config/constants'
import axios from 'axios'

const LoginPage = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setError('')
    setGoogleLoading(true)

    try {
      // Check if running on native platform (Android/iOS)
      if (Capacitor.isNativePlatform()) {
        console.log('🔑 Using native Google Sign-In for mobile APK')
        
        // Use native Google Sign-In SDK
        const googleResult = await nativeGoogleAuth.signIn()
        
        // Send ID token to backend for authentication
        const response = await axios.post(
          `${API_BASE_URL}/auth/google/native`,
          { id_token: googleResult.idToken },
          { headers: { 'Content-Type': 'application/json' } }
        )
        
        // Store tokens
        const { access_token, refresh_token } = response.data
        localStorage.setItem('access_token', access_token)
        if (refresh_token) {
          localStorage.setItem('refresh_token', refresh_token)
        }
        
        console.log('✅ Native Google Sign-In successful')
        
        // Force a page reload to trigger auth context refresh
        window.location.replace('/')
      } else {
        // Use web OAuth flow
        console.log('🌐 Using web Google OAuth flow')
        const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8002'
        window.location.href = `${apiUrl}/auth/google`
      }
    } catch (err) {
      console.error('❌ Google Sign-In failed:', err)
      let errorMessage = 'Google Sign-In failed. Please try again.'
      
      if (err?.message?.includes('network') || err?.message?.includes('fetch')) {
        errorMessage = 'Network error. Please check your internet connection.'
      } else if (err?.message?.includes('timeout')) {
        errorMessage = 'Authentication timed out. Please try again.'
      } else if (err?.response?.status === 400) {
        errorMessage = 'Invalid Google authentication. Please try again.'
      } else if (err?.response?.status >= 500) {
        errorMessage = 'Server error. Please try again later.'
      }
      
      setError(errorMessage)
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background/90 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img 
            src="/logo.png" 
            alt="Agamvani Logo" 
            className="w-20 h-20 mx-auto mb-4" 
          />
          <h1 className="text-3xl font-bold text-foreground mb-2">Welcome Back</h1>
          <p className="text-muted-foreground">Sign in to continue listening</p>
        </div>

        <div className="spiritual-card p-8">
          {error && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-saffron-500"
                required
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium">Password</label>
                <Link to="/forgot-password" className="text-xs text-saffron-600 hover:text-saffron-700">
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-saffron-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg transition-colors font-medium disabled:opacity-50"
              style={{
                backgroundColor: loading ? '#9CA3AF' : '#EA580C',
                color: '#FFFFFF',
              }}
              onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = '#C2410C')}
              onMouseLeave={(e) => !loading && (e.target.style.backgroundColor = '#EA580C')}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-card text-muted-foreground">Or continue with</span>
              </div>
            </div>

            <button
              onClick={handleGoogleLogin}
              disabled={googleLoading}
              className="mt-4 w-full py-3 border border-border rounded-lg hover:bg-accent transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {googleLoading ? (
                <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              {googleLoading ? 'Connecting to Google...' : 'Google'}
            </button>
          </div>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Don't have an account? </span>
            <Link to="/register" className="text-saffron-600 hover:text-saffron-700 font-medium">
              Sign up
            </Link>
          </div>

          <div className="mt-6 pt-6 border-t border-border text-center text-xs text-muted-foreground">
            By continuing, you agree to our{' '}
            <a 
              href={API_ENDPOINTS.PRIVACY_POLICY}
              target="_blank" 
              rel="noopener noreferrer"
              className="text-saffron-600 hover:text-saffron-700 underline"
            >
              Privacy Policy
            </a>
            {' '}and{' '}
            <a 
              href={API_ENDPOINTS.TERMS_OF_SERVICE}
              target="_blank" 
              rel="noopener noreferrer"
              className="text-saffron-600 hover:text-saffron-700 underline"
            >
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
