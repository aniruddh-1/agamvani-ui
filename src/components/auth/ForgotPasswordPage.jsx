import { useState } from 'react'
import { Link } from 'react-router-dom'
import { authAPI } from '../../lib/api'

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      const response = await authAPI.forgotPassword(email)
      setMessage(response.message || 'If an account exists with this email, a password reset link has been sent')
      setSubmitted(true)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send password reset email')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background/90 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="spiritual-card p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-2">Forgot Password</h2>
            <p className="text-muted-foreground">
              Enter your email address and we'll send you a link to reset your password
            </p>
          </div>

          {submitted ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Check your email</h3>
              <p className="text-muted-foreground mb-6">
                {message}
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setSubmitted(false)
                    setEmail('')
                    setMessage('')
                  }}
                  className="w-full px-4 py-2 text-sm text-saffron-600 hover:text-saffron-700 transition-colors"
                >
                  Send another email
                </button>
                <Link
                  to="/login"
                  className="block w-full px-6 py-3 bg-saffron-600 text-white text-center rounded-lg hover:bg-saffron-700 transition-colors font-medium"
                >
                  Back to Login
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6" style={{ display: 'block', visibility: 'visible' }}>
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-saffron-500 focus:border-transparent"
                  placeholder="Enter your email address"
                  disabled={loading}
                />
              </div>

              <div className="w-full">
                <button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full px-6 py-3 text-white rounded-lg font-medium transition-colors"
                  style={{
                    backgroundColor: (loading || !email) ? '#9CA3AF' : '#EA580C',
                    color: 'white',
                    border: 'none',
                    cursor: (loading || !email) ? 'not-allowed' : 'pointer',
                    minHeight: '48px'
                  }}
                  onMouseOver={(e) => {
                    if (!loading && email) {
                      e.target.style.backgroundColor = '#DC2626'
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!loading && email) {
                      e.target.style.backgroundColor = '#EA580C'
                    }
                  }}
                >
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </div>

              <div className="text-center">
                <Link
                  to="/login"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Remember your password? Sign in
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default ForgotPasswordPage
