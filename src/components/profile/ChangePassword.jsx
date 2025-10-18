import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'

const ChangePassword = () => {
  const { changePassword } = useAuth()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    // Validation
    if (!currentPassword.trim()) {
      setError('Current password is required')
      return
    }

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match')
      return
    }

    if (currentPassword === newPassword) {
      setError('New password must be different from current password')
      return
    }

    setLoading(true)

    try {
      await changePassword(currentPassword, newPassword)
      setSuccess('Password changed successfully!')
      
      // Clear form
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to change password')
    } finally {
      setLoading(false)
    }
  }

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }))
  }

  const getPasswordStrength = (password) => {
    if (password.length === 0) return { strength: 0, text: '', color: 'bg-gray-200' }
    
    let score = 0
    if (password.length >= 8) score++
    if (/[a-z]/.test(password)) score++
    if (/[A-Z]/.test(password)) score++
    if (/[0-9]/.test(password)) score++
    if (/[^A-Za-z0-9]/.test(password)) score++

    const strengths = [
      { strength: 1, text: 'Very Weak', color: 'bg-red-500' },
      { strength: 2, text: 'Weak', color: 'bg-orange-500' },
      { strength: 3, text: 'Fair', color: 'bg-yellow-500' },
      { strength: 4, text: 'Good', color: 'bg-blue-500' },
      { strength: 5, text: 'Strong', color: 'bg-green-500' }
    ]

    return strengths[score - 1] || strengths[0]
  }

  const passwordStrength = getPasswordStrength(newPassword)

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

        <div className="spiritual-card p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-destructive text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-100 border border-green-300 rounded-lg p-3 text-green-700 text-sm">
                {success}
              </div>
            )}

            {/* Current Password */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Current Password *
              </label>
              <div className="relative">
                <input
                  type={showPasswords.current ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-2 pr-10 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-saffron-500"
                  placeholder="Enter current password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('current')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {showPasswords.current ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L12 12m-3.122-3.122l4.244-4.244" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    )}
                  </svg>
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-medium mb-2">
                New Password *
              </label>
              <div className="relative">
                <input
                  type={showPasswords.new ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2 pr-10 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-saffron-500"
                  placeholder="Enter new password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('new')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {showPasswords.new ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L12 12m-3.122-3.122l4.244-4.244" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    )}
                  </svg>
                </button>
              </div>
              
              {/* Password Strength Indicator */}
              {newPassword && (
                <div className="mt-2">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                        style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">{passwordStrength.text}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Password should be at least 8 characters with uppercase, lowercase, numbers, and symbols
                  </p>
                </div>
              )}
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Confirm New Password *
              </label>
              <div className="relative">
                <input
                  type={showPasswords.confirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 pr-10 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-saffron-500"
                  placeholder="Confirm new password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('confirm')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {showPasswords.confirm ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L12 12m-3.122-3.122l4.244-4.244" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    )}
                  </svg>
                </button>
              </div>
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs text-destructive mt-1">Passwords do not match</p>
              )}
            </div>

            {/* Submit Buttons */}
            <div className="flex flex-col gap-3 pt-4">
              <button
                type="submit"
                disabled={loading || !currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                className="w-full py-3 bg-saffron-600 hover:bg-saffron-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
              >
                {loading ? 'Changing Password...' : 'Change Password'}
              </button>
              
              <button
                type="button"
                onClick={() => window.history.back()}
                disabled={loading}
                className="w-full py-3 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 text-gray-800 rounded-lg transition-colors font-medium"
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