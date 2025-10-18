import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

const AuthSuccess = () => {
  const navigate = useNavigate()
  const { fetchUser } = useAuth()

  useEffect(() => {
    const handleAuthSuccess = async () => {
      try {
        await fetchUser()
        navigate('/')
      } catch (err) {
        console.error('Error fetching user after OAuth:', err)
        navigate('/login')
      }
    }

    handleAuthSuccess()
  }, [fetchUser, navigate])

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background/90 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block w-12 h-12 border-4 border-saffron-200 border-t-saffron-600 rounded-full animate-spin mb-4"></div>
        <p className="text-muted-foreground">Completing authentication...</p>
      </div>
    </div>
  )
}

export default AuthSuccess
