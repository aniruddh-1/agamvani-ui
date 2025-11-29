import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authAPI } from '../../lib/api'

const ChangePassword = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const [formData, setFormData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  })

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear errors when user starts typing
    if (error) setError('')
  }

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }))
  }

  const validatePasswords = () => {
    if (!formData.current_password) {
      return 'Current password is required'
    }
    
    if (!formData.new_password) {
      return 'New password is required'
    }
    
    if (formData.new_password.length < 8) {
      return 'New password must be at least 8 characters long'
    }
    
    if (formData.new_password === formData.current_password) {
      return 'New password must be different from current password'
    }
    
    if (formData.new_password !== formData.confirm_password) {
      return 'New passwords do not match'
    }
    
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    
    const validationError = validatePasswords()
    if (validationError) {
      setError(validationError)
      return
    }
    
    setLoading(true)

    try {
      await authAPI.changePassword({
        current_password: formData.current_password,
        new_password: formData.new_password
      })

      setSuccess('Password changed successfully!')
      setFormData({
        current_password: '',
        new_password: '',
        confirm_password: ''
      })
      
      // Auto-redirect after 2 seconds
      setTimeout(() => {
        navigate('/')
      }, 2000)
      
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.details || 'Failed to change password')
    } finally {
      setLoading(false)
    }
  }

  const passwordStrength = (password) => {
    let strength = 0
    if (password.length >= 8) strength++
    if (/[a-z]/.test(password)) strength++
    if (/[A-Z]/.test(password)) strength++
    if (/[0-9]/.test(password)) strength++
    if (/[^A-Za-z0-9]/.test(password)) strength++
    return strength
  }

  const getStrengthColor = (strength) => {
    switch (strength) {
      case 0:
      case 1: return 'bg-red-500'
      case 2: return 'bg-orange-500'
      case 3: return 'bg-yellow-500'
      case 4: return 'bg-blue-500'
      case 5: return 'bg-green-500'
      default: return 'bg-gray-300'
    }
  }

  const getStrengthText = (strength) => {
    switch (strength) {
      case 0:
      case 1: return 'Weak'
      case 2: return 'Fair'
      case 3: return 'Good'
      case 4: return 'Strong'
      case 5: return 'Very Strong'
      default: return ''
    }
  }

  const newPasswordStrength = passwordStrength(formData.new_password)

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background/90 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <header className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <img 
              src="/logo.png" 
              alt="Agamvani Logo" 
              className="w-20 h-20 object-contain filter drop-shadow-lg" 
            />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Change Password</h1>
          <p className="text-muted-foreground">Update your account password</p>
        </header>

        <div className="spiritual-card p-6">
          {error && (
            <div className="mb-6 bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-destructive text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 bg-green-100 border border-green-300 rounded-lg p-3 text-green-700 text-sm">
              {success}
              <p className="text-xs mt-1">Redirecting to home page...</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Current Password */}
            <div>
              <label className="block text-sm font-medium mb-2">Current Password</label>
              <div className="relative">
                <input
                  type={showPasswords.current ? 'text' : 'password'}
                  name="current_password"
                  value={formData.current_password}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 pr-10 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-saffron-500"
                  placeholder="Enter current password"
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('current')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  style={{
                    color: '#6B7280',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    padding: '4px',
                    borderRadius: '4px',
                    backgroundColor: 'transparent',
                    border: 'none'
                  }}
                  disabled={loading}
                  onMouseEnter={(e) => !loading && (e.target.style.color = '#374151')}
                  onMouseLeave={(e) => !loading && (e.target.style.color = '#6B7280')}
                >
                  {showPasswords.current ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-medium mb-2">New Password</label>
              <div className="relative">
                <input
                  type={showPasswords.new ? 'text' : 'password'}
                  name="new_password"
                  value={formData.new_password}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 pr-10 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-saffron-500"
                  placeholder="Enter new password"
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('new')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  style={{
                    color: '#6B7280',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    padding: '4px',
                    borderRadius: '4px',
                    backgroundColor: 'transparent',
                    border: 'none'
                  }}
                  disabled={loading}
                  onMouseEnter={(e) => !loading && (e.target.style.color = '#374151')}
                  onMouseLeave={(e) => !loading && (e.target.style.color = '#6B7280')}
                >
                  {showPasswords.new ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              
              {/* Password Strength Indicator */}
              {formData.new_password && (
                <div className="mt-2">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${getStrengthColor(newPasswordStrength)}`}
                        style={{ width: `${(newPasswordStrength / 5) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">{getStrengthText(newPasswordStrength)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Password must be at least 8 characters long
                  </p>
                </div>
              )}
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="block text-sm font-medium mb-2">Confirm New Password</label>
              <div className="relative">
                <input
                  type={showPasswords.confirm ? 'text' : 'password'}
                  name="confirm_password"
                  value={formData.confirm_password}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 pr-10 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-saffron-500"
                  placeholder="Confirm new password"
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('confirm')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  style={{
                    color: '#6B7280',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    padding: '4px',
                    borderRadius: '4px',
                    backgroundColor: 'transparent',
                    border: 'none'
                  }}
                  disabled={loading}
                  onMouseEnter={(e) => !loading && (e.target.style.color = '#374151')}
                  onMouseLeave={(e) => !loading && (e.target.style.color = '#6B7280')}
                >
                  {showPasswords.confirm ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              
              {/* Password Match Indicator */}
              {formData.confirm_password && (
                <div className="mt-1">
                  {formData.new_password === formData.confirm_password ? (
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Passwords match
                    </p>
                  ) : (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Passwords do not match
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-6 mt-6 border-t border-border" style={{minHeight: '80px', position: 'relative', zIndex: 10}}>
              <button
                type="submit"
                disabled={loading || !formData.current_password || !formData.new_password || !formData.confirm_password}
                className="px-6 py-3 text-white rounded-lg transition-colors font-medium"
                style={{
                  backgroundColor: (loading || !formData.current_password || !formData.new_password || !formData.confirm_password) ? '#9CA3AF' : '#EA580C',
                  cursor: (loading || !formData.current_password || !formData.new_password || !formData.confirm_password) ? 'not-allowed' : 'pointer',
                  opacity: (loading || !formData.current_password || !formData.new_password || !formData.confirm_password) ? 0.7 : 1,
                  minWidth: '160px',
                  minHeight: '44px'
                }}
                onMouseEnter={(e) => {
                  if (!loading && formData.current_password && formData.new_password && formData.confirm_password) {
                    e.target.style.backgroundColor = '#C2410C'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading && formData.current_password && formData.new_password && formData.confirm_password) {
                    e.target.style.backgroundColor = '#EA580C'
                  }
                }}
              >
                {loading ? 'Changing Password...' : 'Change Password'}
              </button>
              
              <button
                type="button"
                onClick={() => navigate('/')}
                disabled={loading}
                className="px-6 py-3 rounded-lg transition-colors font-medium"
                style={{
                  backgroundColor: '#f8f9fa',
                  color: '#495057',
                  border: '1px solid #dee2e6',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1,
                  minWidth: '120px',
                  minHeight: '44px'
                }}
                onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = '#e9ecef')}
                onMouseLeave={(e) => !loading && (e.target.style.backgroundColor = '#f8f9fa')}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ChangePassword