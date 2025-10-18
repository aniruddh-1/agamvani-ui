import { Link } from 'react-router-dom'

const AuthError = () => {
  const urlParams = new URLSearchParams(window.location.search)
  const error = urlParams.get('error') || 'Authentication failed'

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background/90 flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className="spiritual-card p-8">
          <div className="text-6xl mb-6">❌</div>
          <h2 className="text-2xl font-bold text-foreground mb-4">Authentication Error</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          
          <Link 
            to="/login"
            className="inline-block px-6 py-3 bg-saffron-600 text-white rounded-lg hover:bg-saffron-700 transition-colors font-medium"
          >
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  )
}

export default AuthError
