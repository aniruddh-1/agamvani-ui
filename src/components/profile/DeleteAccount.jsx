import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'

const DeleteAccount = () => {
  const { user, deleteAccount } = useAuth()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleDeleteAccount = async () => {
    setError('')
    setLoading(true)

    try {
      await deleteAccount()
      // The deleteAccount function should handle navigation
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to delete account')
    } finally {
      setLoading(false)
    }
  }

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
          <h1 className="text-3xl font-bold text-destructive mb-2">Delete Account</h1>
          <p className="text-muted-foreground">This action cannot be undone</p>
        </header>

        <div className="spiritual-card p-8">
          {!showConfirm ? (
            /* Warning Stage */
            <div className="text-center">
              <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              
              <h3 className="text-xl font-semibold mb-4">Are you sure?</h3>
              
              <div className="text-left bg-destructive/5 p-4 rounded-lg mb-6">
                <h4 className="font-medium text-destructive mb-2">Deleting your account will:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Permanently delete all your profile information</li>
                  <li>• Remove access to the radio service</li>
                  <li>• Delete your listening history and preferences</li>
                  <li>• This action cannot be reversed</li>
                </ul>
              </div>

              <div className="bg-accent/30 p-3 rounded-lg mb-6">
                <p className="text-sm">
                  <strong>Account:</strong> {user?.email}
                </p>
                <p className="text-sm">
                  <strong>Member since:</strong> {user?.created_at ? 
                    new Date(user.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long'
                    }) : 'Unknown'
                  }
                </p>
              </div>

              <div className="flex flex-col gap-3" style={{minHeight: '120px', position: 'relative', zIndex: 10}}>
                <button
                  onClick={() => setShowConfirm(true)}
                  className="w-full py-3 text-white rounded-lg transition-colors font-medium"
                  style={{
                    backgroundColor: '#DC2626',
                    minHeight: '48px',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => (e.target.style.backgroundColor = '#B91C1C')}
                  onMouseLeave={(e) => (e.target.style.backgroundColor = '#DC2626')}
                >
                  Yes, Delete My Account
                </button>
                <button
                  onClick={() => window.history.back()}
                  className="w-full py-3 rounded-lg transition-colors font-medium"
                  style={{
                    backgroundColor: '#f8f9fa',
                    color: '#495057',
                    border: '1px solid #dee2e6',
                    minHeight: '48px',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => (e.target.style.backgroundColor = '#e9ecef')}
                  onMouseLeave={(e) => (e.target.style.backgroundColor = '#f8f9fa')}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            /* Confirmation Stage */
            <div className="space-y-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-destructive mb-4">Final Confirmation</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Are you absolutely sure you want to permanently delete your account?
                  <br />
                  This action cannot be undone.
                </p>
              </div>

              {error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-destructive text-sm">
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-3" style={{minHeight: '120px', position: 'relative', zIndex: 10}}>
                <button
                  onClick={handleDeleteAccount}
                  disabled={loading}
                  className="w-full py-3 text-white rounded-lg transition-colors font-medium"
                  style={{
                    backgroundColor: loading ? '#9CA3AF' : '#DC2626',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.7 : 1,
                    minHeight: '48px'
                  }}
                  onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = '#B91C1C')}
                  onMouseLeave={(e) => !loading && (e.target.style.backgroundColor = '#DC2626')}
                >
                  {loading ? 'Deleting Account...' : 'Yes, Delete My Account'}
                </button>
                <button
                  onClick={() => setShowConfirm(false)}
                  disabled={loading}
                  className="w-full py-3 rounded-lg transition-colors font-medium"
                  style={{
                    backgroundColor: '#f8f9fa',
                    color: '#495057',
                    border: '1px solid #dee2e6',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.6 : 1,
                    minHeight: '48px'
                  }}
                  onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = '#e9ecef')}
                  onMouseLeave={(e) => !loading && (e.target.style.backgroundColor = '#f8f9fa')}
                >
                  No, Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default DeleteAccount