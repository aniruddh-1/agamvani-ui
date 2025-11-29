import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Capacitor } from '@capacitor/core'
import { useAuth } from '../../contexts/AuthContext'
import { nativeGoogleAuth } from '../../services/nativeGoogleAuth'
import { API_BASE_URL, API_ENDPOINTS } from '../../config/constants'
import axios from 'axios'
import VerifyOTP from './VerifyOTP'

const RegisterPage = () => {
  const { requestOTP } = useAuth()
  const navigate = useNavigate()
  
  // Form data
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  
  // OTP flow states
  const [currentStep, setCurrentStep] = useState('registration') // 'registration' or 'otp'
  const [otpEmail, setOtpEmail] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setError('') // Clear error when user types
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Validate terms acceptance
    if (!acceptedTerms) {
      setError('Please accept the Privacy Policy and Terms of Service')
      return
    }

    // Validate full name
    if (formData.fullName.trim().length < 2) {
      setError('Full name must be at least 2 characters')
      return
    }

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    // Validate password length
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)

    try {
      // Request OTP instead of direct registration
      await requestOTP(formData.email, formData.password, formData.fullName.trim())
      
      // Store email for OTP verification
      setOtpEmail(formData.email)
      setCurrentStep('otp')
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.detail || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleBackToRegistration = () => {
    setCurrentStep('registration')
    setOtpEmail('')
    setError('')
  }

  // Show OTP verification if we've moved to that step
  if (currentStep === 'otp') {
    return (
      <VerifyOTP
        email={otpEmail}
        onBack={handleBackToRegistration}
      />
    )
  }

  const handleGoogleSignup = async () => {
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
        window.location.href = `${API_BASE_URL}/auth/google`
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
          <h1 className="text-3xl font-bold text-foreground mb-2">Create Account</h1>
          <p className="text-muted-foreground">Join us to start listening</p>
        </div>

        <div className="spiritual-card p-8">
          {error && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Full Name</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-saffron-500"
                placeholder="Enter your full name"
                required
                minLength={2}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-saffron-500"
                placeholder="Enter your email"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-saffron-500"
                placeholder="Create a password (min 8 characters)"
                required
                minLength={8}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-saffron-500"
                placeholder="Re-enter your password"
                required
                minLength={8}
              />
            </div>

            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="acceptTerms"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-1 w-4 h-4 text-saffron-600 border-gray-300 rounded focus:ring-saffron-500"
                required
              />
              <label htmlFor="acceptTerms" className="text-xs text-muted-foreground">
                I agree to the{' '}
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
              </label>
            </div>

            <button
              type="submit"
              disabled={loading || !acceptedTerms}
              className="w-full py-3 rounded-lg transition-colors font-medium disabled:opacity-50"
              style={{
                backgroundColor: (loading || !acceptedTerms) ? '#9CA3AF' : '#EA580C',
                color: '#FFFFFF',
              }}
              onMouseEnter={(e) => !(loading || !acceptedTerms) && (e.target.style.backgroundColor = '#C2410C')}
              onMouseLeave={(e) => !(loading || !acceptedTerms) && (e.target.style.backgroundColor = '#EA580C')}
            >
              {loading ? 'Creating account...' : 'Sign Up'}
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
              onClick={handleGoogleSignup}
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
            <span className="text-muted-foreground">Already have an account? </span>
            <Link to="/login" className="text-saffron-600 hover:text-saffron-700 font-medium">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage
