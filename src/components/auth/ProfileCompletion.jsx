import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useDropdownData } from '../../hooks/useDropdownData'
import { authAPI } from '../../lib/api'

const ProfileCompletion = () => {
  const { user, refreshUser } = useAuth()
  const navigate = useNavigate()
  const { 
    countries, 
    states, 
    genders, 
    loading: dropdownLoading, 
    error: dropdownError, 
    fetchStates,
    loadingStates 
  } = useDropdownData()
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedCountry, setSelectedCountry] = useState('IN') // Default to India
  const [processingStep, setProcessingStep] = useState('')
  
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    full_name: '',
    phone_number: '',
    address: '',
    city: '',
    state: '',
    country: 'IN', // Default to India
    postal_code: '',
    date_of_birth: '',
    gender: ''
  })

  useEffect(() => {
    // Pre-populate form with existing user data if available
    if (user && formData.first_name === '' && formData.last_name === '') {
      const selectedCountryCode = user.country || 'IN'
      setSelectedCountry(selectedCountryCode)
      
      const newFormData = {
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        full_name: user.full_name || '',
        phone_number: user.phone_number || '',
        address: user.address || '',
        city: user.city || '',
        state: user.state || '',
        country: selectedCountryCode,
        postal_code: user.postal_code || '',
        date_of_birth: user.date_of_birth || '',
        gender: user.gender || ''
      }
      
      setFormData(newFormData)

      // Load states if country is selected
      if (selectedCountryCode) {
        fetchStates(selectedCountryCode)
      }
    } else if (!user && selectedCountry === 'IN') {
      // Load states for India by default when no user data
      fetchStates('IN')
    }
  }, [user, selectedCountry])
  

  // Age validation helper
  const validateAge = (dateString) => {
    if (!dateString) return { isValid: true, message: '' }
    
    const birthDate = new Date(dateString)
    const today = new Date()
    const age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    
    // Adjust age if birthday hasn't occurred this year
    const actualAge = (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) ? age - 1 : age
    
    if (actualAge < 10) {
      return { isValid: false, message: 'You must be at least 10 years old to register.' }
    }
    if (actualAge > 120) {
      return { isValid: false, message: 'Please enter a valid birth date.' }
    }
    
    return { isValid: true, message: '' }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    
    // Single state update to prevent race conditions
    setFormData(prev => {
      const newFormData = {
        ...prev,
        [name]: value
      }
      
      // Auto-generate full_name from first and last name
      if (name === 'first_name' || name === 'last_name') {
        const firstName = name === 'first_name' ? value : prev.first_name
        const lastName = name === 'last_name' ? value : prev.last_name
        newFormData.full_name = `${firstName} ${lastName}`.trim()
      }
      
      // Handle country change
      if (name === 'country') {
        setSelectedCountry(value)
        newFormData.state = '' // Reset state when country changes
        if (value && value.length === 2) {
          fetchStates(value)
        }
      }
      
      // Clear error when user starts typing
      if (error && name === 'date_of_birth') {
        setError('')
      }
      
      return newFormData
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setProcessingStep('Preparing profile data...')

    try {
      // Validate all required fields
      const requiredFields = {
        first_name: 'First Name',
        last_name: 'Last Name',
        phone_number: 'Phone Number',
        address: 'Address',
        city: 'City',
        state: 'State',
        country: 'Country',
        postal_code: 'Postal Code',
        date_of_birth: 'Date of Birth',
        gender: 'Gender'
      }
      
      const missingFields = []
      for (const [field, label] of Object.entries(requiredFields)) {
        if (!formData[field] || formData[field].trim() === '') {
          missingFields.push(label)
        }
      }
      
      if (missingFields.length > 0) {
        setError(`Please fill in all required fields: ${missingFields.join(', ')}`)
        setLoading(false)
        setProcessingStep('')
        return
      }
      
      // Validate age
      const ageValidation = validateAge(formData.date_of_birth)
      if (!ageValidation.isValid) {
        setError(ageValidation.message)
        setLoading(false)
        setProcessingStep('')
        return
      }
      
      const profileData = {
        ...formData
      }
      
      setProcessingStep('Updating your profile...')
      
      // Use the existing profile completion endpoint
      const response = await authAPI.completeProfile(profileData)
      
      // Always refresh user data immediately after successful update
      setProcessingStep('Refreshing user data...')
      const latestUser = await refreshUser()
      
      // Wait 1 second to ensure database consistency before verification
      setProcessingStep('Verifying profile completion...')
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Profile update was successful - Route based on user status
      setProcessingStep('Profile saved successfully!')
      
      // Route based on user verification status and admin status
      if (latestUser.is_admin || latestUser.is_verified || latestUser.verification_status === 'approved' || latestUser.approval_method === 'invitation') {
        // Admin users, verified users, approved users, or invitation users: Direct access to app
        setProcessingStep('Welcome! Redirecting to your dashboard...')
        
        setTimeout(() => {
          try {
            navigate('/', { replace: true })
          } catch (navError) {
            window.location.href = '/'
          }
        }, 1000)
      } else {
        // Unverified self-registered users: Redirect to verification pending
        setProcessingStep('Profile submitted! Redirecting to verification status...')
        
        setTimeout(() => {
          try {
            navigate('/pending-verification', { replace: true })
          } catch (navError) {
            window.location.href = '/pending-verification'
          }
        }, 1000)
      }
      
    } catch (err) {
      // Enhanced error handling with more specific messages
      let errorMessage = 'Failed to complete profile. Please try again.'
      
      if (err.code === 'NETWORK_ERROR' || !err.response) {
        errorMessage = 'Network connection issue. Please check your internet connection and try again.'
      } else if (err.response?.status === 401) {
        errorMessage = 'Authentication failed. Please try logging out and back in.'
      } else if (err.response?.status === 400) {
        const details = err.response?.data?.detail
        if (typeof details === 'string') {
          errorMessage = details
        } else if (Array.isArray(details)) {
          errorMessage = details.join(', ')
        } else {
          errorMessage = 'Invalid data provided. Please check your inputs and try again.'
        }
      } else if (err.response?.status === 500) {
        errorMessage = 'Server error occurred. Please try again in a few moments.'
      } else if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail
      } else if (err.message) {
        errorMessage = err.message
      }
      
      setError(errorMessage)
    } finally {
      setLoading(false)
      setProcessingStep('')
    }
  }

  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1)
    }
  }

  const previousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const isStepValid = () => {
    if (currentStep === 1) {
      return (
        formData.first_name.trim() !== '' && 
        formData.last_name.trim() !== '' &&
        formData.phone_number.trim() !== '' &&
        formData.date_of_birth.trim() !== '' &&
        formData.gender.trim() !== ''
      )
    }
    if (currentStep === 2) {
      return (
        formData.city.trim() !== '' && 
        formData.state.trim() !== '' && 
        formData.country.trim() !== '' &&
        formData.postal_code.trim() !== '' &&
        formData.address.trim() !== ''
      )
    }
    return true
  }

  if (dropdownLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background/90 flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-8 spiritual-card p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-saffron-600 mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading profile form...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background/90 flex items-center justify-center p-4" style={{paddingBottom: '120px'}}>
      <div className="max-w-md w-full space-y-8 spiritual-card p-8" style={{minHeight: 'auto', marginBottom: '40px'}}>
        <div className="text-center">
          <img 
            src="/logo.png" 
            alt="Agamvani Logo" 
            className="w-20 h-20 mx-auto mb-4" 
          />
          <h2 className="text-3xl font-bold text-foreground mb-2">Complete Your Profile</h2>
          <p className="text-muted-foreground">Let's get to know you better to personalize your experience</p>
          
          {/* Progress indicator */}
          <div className="mt-4 flex justify-center">
            <div className="flex space-x-2">
              {[1, 2, 3].map((step) => (
                <div
                  key={step}
                  className={`w-3 h-3 rounded-full ${
                    step <= currentStep
                      ? 'bg-saffron-600'
                      : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {processingStep && loading && (
            <div className="text-saffron-600 text-sm text-center bg-saffron-50 p-3 rounded-md">
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-saffron-600"></div>
                <span>{processingStep}</span>
              </div>
            </div>
          )}

          {error && (
            <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-md">
              <p>{error}</p>
            </div>
          )}

          {dropdownError && (
            <div className="text-amber-600 text-sm text-center bg-amber-50 p-3 rounded-md">
              {dropdownError} (Using offline data)
            </div>
          )}

          {/* Step 1: Personal Information */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-foreground">Personal Information</h3>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="first_name" className="block text-sm font-medium text-foreground">
                    First Name *
                  </label>
                  <input
                    id="first_name"
                    name="first_name"
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-border shadow-sm focus:border-saffron-500 focus:ring-saffron-500 px-3 py-2"
                  />
                </div>
                
                <div>
                  <label htmlFor="last_name" className="block text-sm font-medium text-foreground">
                    Last Name *
                  </label>
                  <input
                    id="last_name"
                    name="last_name"
                    type="text"
                    required
                    value={formData.last_name}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-border shadow-sm focus:border-saffron-500 focus:ring-saffron-500 px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="phone_number" className="block text-sm font-medium text-foreground">
                  Phone Number *
                </label>
                <input
                  id="phone_number"
                  name="phone_number"
                  type="tel"
                  required
                  value={formData.phone_number}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-border shadow-sm focus:border-saffron-500 focus:ring-saffron-500 px-3 py-2"
                />
              </div>

              <div>
                <label htmlFor="date_of_birth" className="block text-sm font-medium text-foreground">
                  Date of Birth *
                </label>
                <input
                  id="date_of_birth"
                  name="date_of_birth"
                  type="date"
                  required
                  value={formData.date_of_birth}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border shadow-sm focus:border-saffron-500 focus:ring-saffron-500 px-3 py-2 bg-white"
                  style={{
                    border: '1px solid #d1d5db',
                    backgroundColor: '#ffffff',
                    color: '#374151',
                    fontSize: '14px',
                    lineHeight: '1.5',
                    minHeight: '40px',
                    colorScheme: 'light' // Ensure calendar icon is visible
                  }}
                  min={new Date(new Date().setFullYear(new Date().getFullYear() - 120)).toISOString().split('T')[0]} // Max 120 years old
                  max={new Date(new Date().setFullYear(new Date().getFullYear() - 10)).toISOString().split('T')[0]} // Minimum 10 years old
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  You must be at least 10 years old to register
                </p>
              </div>

              <div>
                <label htmlFor="gender" className="block text-sm font-medium text-foreground">
                  Gender *
                </label>
                <select
                  id="gender"
                  name="gender"
                  required
                  value={formData.gender}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-border shadow-sm focus:border-saffron-500 focus:ring-saffron-500 px-3 py-2"
                >
                  <option value="">Select gender</option>
                  {genders.map((gender) => (
                    <option key={gender.code} value={gender.code}>
                      {gender.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Step 2: Location Information */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-foreground">Location Information</h3>
              
              <div>
                <label htmlFor="country" className="block text-sm font-medium text-foreground">
                  Country *
                </label>
                <select
                  id="country"
                  name="country"
                  required
                  value={formData.country}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-border shadow-sm focus:border-saffron-500 focus:ring-saffron-500 px-3 py-2"
                >
                  <option value="">Select country</option>
                  {countries.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="state" className="block text-sm font-medium text-foreground">
                  State/Province *
                  {loadingStates && <span className="ml-2 text-xs text-muted-foreground">(Loading...)</span>}
                </label>
                <select
                  id="state"
                  name="state"
                  required
                  value={formData.state}
                  onChange={handleInputChange}
                  disabled={!selectedCountry || loadingStates}
                  className="mt-1 block w-full rounded-md border-border shadow-sm focus:border-saffron-500 focus:ring-saffron-500 disabled:bg-gray-100 px-3 py-2"
                >
                  <option value="">
                    {!selectedCountry ? 'Select country first' : 'Select state/province'}
                  </option>
                  {states.map((state) => (
                    <option key={state.code} value={state.name}>
                      {state.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="city" className="block text-sm font-medium text-foreground">
                  City *
                </label>
                <input
                  id="city"
                  name="city"
                  type="text"
                  required
                  value={formData.city}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-border shadow-sm focus:border-saffron-500 focus:ring-saffron-500 px-3 py-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="postal_code" className="block text-sm font-medium text-foreground">
                    Postal Code *
                  </label>
                  <input
                    id="postal_code"
                    name="postal_code"
                    type="text"
                    required
                    value={formData.postal_code}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-border shadow-sm focus:border-saffron-500 focus:ring-saffron-500 px-3 py-2"
                  />
                </div>
                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-foreground">
                    Address *
                  </label>
                  <textarea
                    id="address"
                    name="address"
                    rows={1}
                    required
                    value={formData.address}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-border shadow-sm focus:border-saffron-500 focus:ring-saffron-500 px-3 py-2"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Confirmation */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-foreground">Review Your Information</h3>
              
              <div className="bg-accent/30 p-4 rounded-md space-y-2">
                <p><strong>Name:</strong> {formData.full_name}</p>
                <p><strong>Phone:</strong> {formData.phone_number}</p>
                <p><strong>Date of Birth:</strong> {formData.date_of_birth}</p>
                <p><strong>Gender:</strong> {
                  genders.find(g => g.code === formData.gender)?.name || formData.gender
                }</p>
                <p><strong>Address:</strong> {formData.address}</p>
                <p><strong>Location:</strong> {formData.city}, {formData.state}, {
                  countries.find(c => c.code === formData.country)?.name || formData.country
                }</p>
                <p><strong>Postal Code:</strong> {formData.postal_code}</p>
              </div>
              
              <div className="bg-accent/50 p-3 rounded-lg text-sm text-muted-foreground">
                <p className="font-medium mb-1">Email: {user?.email}</p>
                <p className="text-xs">
                  By completing your profile, you'll have access to personalized content and features tailored to your interests.
                </p>
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex justify-between items-center pt-6 mt-6 border-t border-border" style={{minHeight: '60px', position: 'relative', zIndex: 10}}>
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={previousStep}
                disabled={loading}
                className="px-4 py-3 text-sm font-medium rounded-md border transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-saffron-500"
                style={{
                  backgroundColor: '#f8f9fa',
                  borderColor: '#dee2e6',
                  color: '#495057',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1
                }}
                onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = '#e9ecef')}
                onMouseLeave={(e) => !loading && (e.target.style.backgroundColor = '#f8f9fa')}
              >
                Previous
              </button>
            ) : (
              <div></div>
            )}
            
            {currentStep < 3 ? (
              <button
                type="button"
                onClick={nextStep}
                disabled={!isStepValid() || loading}
                className="px-6 py-3 text-sm font-medium text-white rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-saffron-500"
                style={{
                  backgroundColor: (isStepValid() && !loading) ? '#EA580C' : '#9CA3AF',
                  cursor: (isStepValid() && !loading) ? 'pointer' : 'not-allowed',
                  opacity: (isStepValid() && !loading) ? 1 : 0.7
                }}
                onMouseEnter={(e) => (isStepValid() && !loading) && (e.target.style.backgroundColor = '#C2410C')}
                onMouseLeave={(e) => (isStepValid() && !loading) && (e.target.style.backgroundColor = '#EA580C')}
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 text-sm font-medium text-white rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-saffron-500"
                style={{
                  backgroundColor: loading ? '#9CA3AF' : '#EA580C',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                  minWidth: '140px'
                }}
                onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = '#C2410C')}
                onMouseLeave={(e) => !loading && (e.target.style.backgroundColor = '#EA580C')}
              >
                {loading ? 'Saving...' : 'Complete Profile'}
              </button>
            )}
          </div>

        </form>
      </div>
    </div>
  )
}

export default ProfileCompletion
