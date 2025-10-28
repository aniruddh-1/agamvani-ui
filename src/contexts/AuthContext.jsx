import { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../lib/api'

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const fetchUser = async () => {
    try {
      const userData = await authAPI.getCurrentUser()
      setUser(userData)
      setIsAuthenticated(true)
      return userData
    } catch (error) {
      setUser(null)
      setIsAuthenticated(false)
      throw error
    }
  }

  const refreshUser = async () => {
    return await fetchUser()
  }

  const login = async (email, password) => {
    try {
      await authAPI.login({ email, password })
      const userData = await fetchUser()
      return userData
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }

  const register = async (email, password, fullName) => {
    try {
      await authAPI.register({ email, password, full_name: fullName })
      const userData = await fetchUser()
      return userData
    } catch (error) {
      console.error('Registration error:', error)
      throw error
    }
  }

  // OTP-based registration
  const requestOTP = async (email, password, fullName, invitationToken = null) => {
    try {
      const data = { 
        email, 
        password, 
        full_name: fullName 
      }
      if (invitationToken) {
        data.token = invitationToken
      }
      const response = await authAPI.requestOTP(data)
      return response
    } catch (error) {
      console.error('Request OTP error:', error)
      throw error
    }
  }

  const verifyOTP = async (email, otpCode, invitationToken = null) => {
    try {
      const data = { email, otp_code: otpCode }
      if (invitationToken) {
        data.token = invitationToken
      }
      const response = await authAPI.verifyOTP(data)
      // Auto-login after OTP verification
      const userData = await fetchUser()
      return userData
    } catch (error) {
      console.error('Verify OTP error:', error)
      throw error
    }
  }

  // Password management
  const forgotPassword = async (email) => {
    try {
      const response = await authAPI.forgotPassword(email)
      return response
    } catch (error) {
      console.error('Forgot password error:', error)
      throw error
    }
  }

  const resetPassword = async (token, newPassword) => {
    try {
      const response = await authAPI.resetPassword({ 
        token, 
        new_password: newPassword 
      })
      return response
    } catch (error) {
      console.error('Reset password error:', error)
      throw error
    }
  }

  const changePassword = async (currentPassword, newPassword) => {
    try {
      const response = await authAPI.changePassword({ 
        current_password: currentPassword, 
        new_password: newPassword 
      })
      return response
    } catch (error) {
      console.error('Change password error:', error)
      throw error
    }
  }

  // Account management
  const deleteAccount = async () => {
    try {
      await authAPI.deleteAccount()
      setUser(null)
      setIsAuthenticated(false)
      window.location.href = '/'
    } catch (error) {
      console.error('Delete account error:', error)
      throw error
    }
  }

  // Google OAuth
  const loginWithGoogle = (invitationToken = null) => {
    authAPI.googleLogin(invitationToken)
  }

  const logout = async () => {
    // Call logout API FIRST (before clearing cookies/tokens)
    try {
      await authAPI.logout()
    } catch (error) {
      // Ignore logout API errors - continue with frontend logout
      console.log('Logout API call failed (non-critical):', error.message)
    }
    
    // Clear all authentication state
    setUser(null)
    setIsAuthenticated(false)
    
    // Clear specific auth-related items from storage
    const authKeys = ['access_token', 'refresh_token', 'user_id', 'user_email', 'token_expires_at']
    authKeys.forEach(key => {
      localStorage.removeItem(key)
      sessionStorage.removeItem(key)
    })
    sessionStorage.clear()
    
    // Clear all cookies aggressively for both localhost and production
    const domains = ['localhost', '.localhost', '.ramsabha.in', 'ramsabha.in', '.av.ramsabha.in', 'av.ramsabha.in']
    document.cookie.split(";").forEach(function(c) { 
      const eqPos = c.indexOf("=");
      const name = eqPos > -1 ? c.substr(0, eqPos).trim() : c.trim();
      // Clear for all possible domains and paths
      domains.forEach(domain => {
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${domain}`;
      })
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    });
    
    // Force immediate redirect
    window.location.replace('/login')
  }

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      
      try {
        await fetchUser()
      } catch (error) {
        // Not authenticated
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    requestOTP,
    verifyOTP,
    forgotPassword,
    resetPassword,
    changePassword,
    deleteAccount,
    loginWithGoogle,
    logout,
    fetchUser,
    refreshUser
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
