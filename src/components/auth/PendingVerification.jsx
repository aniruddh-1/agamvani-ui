import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'

const PendingVerification = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  // Auto-redirect if user is approved
  useEffect(() => {
    if (user) {
      // Check if user should be allowed access
      // is_verified is set to true for invited users and Google OAuth users
      if (user.is_admin || user.is_verified) {
        navigate('/', { replace: true })
      }
    }
  }, [user, navigate])

  const handleLogout = async () => {
    await logout()
  }

  const handleEditProfile = () => {
    navigate('/complete-profile')
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
        </div>

        <div className="spiritual-card p-8 text-center">
          <div className="text-6xl mb-6">⏳</div>
          <h2 className="text-2xl font-bold text-foreground mb-4">Pending Approval</h2>
          <p className="text-muted-foreground mb-6">
            Your account is currently being reviewed by our administrators. You'll receive access once approved.
          </p>
          
          <div className="bg-accent/50 p-4 rounded-lg mb-6">
            <p className="text-sm text-muted-foreground">
              <strong>Email:</strong> {user?.email}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              <strong>Status:</strong> {user?.verification_status || 'pending'}
            </p>
          </div>

          <div className="space-y-4">
            <button
              onClick={handleEditProfile}
              style={{
                width: '100%',
                padding: '12px 24px',
                backgroundColor: '#dc2626',
                color: 'white',
                borderRadius: '8px',
                border: 'none',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 4px rgba(220, 38, 38, 0.2)'
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = '#b91c1c'
                e.target.style.transform = 'translateY(-1px)'
                e.target.style.boxShadow = '0 4px 8px rgba(220, 38, 38, 0.3)'
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = '#dc2626'
                e.target.style.transform = 'translateY(0px)'
                e.target.style.boxShadow = '0 2px 4px rgba(220, 38, 38, 0.2)'
              }}
            >
              <svg style={{ width: '18px', height: '18px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Profile
            </button>
            
            <button
              onClick={handleLogout}
              style={{
                width: '100%',
                padding: '12px 24px',
                backgroundColor: 'transparent',
                color: '#6b7280',
                borderRadius: '8px',
                border: '2px solid #e5e7eb',
                fontSize: '16px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = '#f9fafb'
                e.target.style.borderColor = '#d1d5db'
                e.target.style.color = '#374151'
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = 'transparent'
                e.target.style.borderColor = '#e5e7eb'
                e.target.style.color = '#6b7280'
              }}
            >
              <svg style={{ width: '18px', height: '18px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PendingVerification
