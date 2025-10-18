import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import axios from 'axios'

const AccountSettings = () => {
  const { user, fetchUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Form state
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone_number: '',
    address: '',
    city: '',
    state: '',
    country: '',
    postal_code: '',
    date_of_birth: '',
    gender: '',
    preferred_language: 'en'
  })

  // Initialize form with user data
  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone_number: user.phone_number || '',
        address: user.address || '',
        city: user.city || '',
        state: user.state || '',
        country: user.country || '',
        postal_code: user.postal_code || '',
        date_of_birth: user.date_of_birth ? 
          new Date(user.date_of_birth).toISOString().split('T')[0] : '',
        gender: user.gender || '',
        preferred_language: user.preferred_language || 'en'
      })
    }
  }, [user])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8002'
      
      // Filter out empty values
      const updateData = {}
      Object.keys(formData).forEach(key => {
        if (formData[key] && formData[key].trim() !== '') {
          updateData[key] = formData[key]
        }
      })

      await axios.put(
        `${apiUrl}/auth/profile`,
        updateData,
        { withCredentials: true }
      )

      // Refresh user data
      await fetchUser()
      setSuccess('Profile updated successfully!')
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.details || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const genderOptions = [
    { value: '', label: 'Select Gender' },
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'non_binary', label: 'Non-Binary' },
    { value: 'prefer_not_to_say', label: 'Prefer not to say' }
  ]

  const languageOptions = [
    { value: 'en', label: 'English' },
    { value: 'hi', label: 'Hindi' },
    { value: 'sa', label: 'Sanskrit' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background/90 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <header className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <img 
              src="/logo.png" 
              alt="Agamvani Logo" 
              className="w-20 h-20 object-contain filter drop-shadow-lg" 
            />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Account Settings</h1>
          <p className="text-muted-foreground">Update your profile information</p>
        </header>

        <div className="spiritual-card p-8">
          {error && (
            <div className="mb-6 bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-destructive text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 bg-green-100 border border-green-300 rounded-lg p-3 text-green-700 text-sm">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information Section */}
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Personal Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">First Name</label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-saffron-500"
                    placeholder="Enter first name"
                    disabled={loading}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Last Name</label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-saffron-500"
                    placeholder="Enter last name"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Date of Birth</label>
                  <input
                    type="date"
                    name="date_of_birth"
                    value={formData.date_of_birth}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-saffron-500"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Gender</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-saffron-500"
                    disabled={loading}
                  >
                    {genderOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Contact Information Section */}
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                Contact Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Phone Number</label>
                  <input
                    type="tel"
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-saffron-500"
                    placeholder="Enter phone number"
                    disabled={loading}
                  />
                </div>

                <div className="md:col-span-1">
                  <label className="block text-sm font-medium mb-1">Preferred Language</label>
                  <select
                    name="preferred_language"
                    value={formData.preferred_language}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-saffron-500"
                    disabled={loading}
                  >
                    {languageOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Address Information Section */}
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Address Information
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Address</label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-saffron-500"
                    placeholder="Enter your address"
                    disabled={loading}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">City</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-saffron-500"
                      placeholder="Enter city"
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">State</label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-saffron-500"
                      placeholder="Enter state"
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Country</label>
                    <input
                      type="text"
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-saffron-500"
                      placeholder="Enter country"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="md:w-1/3">
                  <label className="block text-sm font-medium mb-1">Postal Code</label>
                  <input
                    type="text"
                    name="postal_code"
                    value={formData.postal_code}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-saffron-500"
                    placeholder="Enter postal code"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            {/* Account Status (Read-only) */}
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Account Status
              </h3>
              
              <div className="bg-accent/30 p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${user?.is_verified ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                    <span className="text-sm">{user?.is_verified ? 'Verified' : 'Pending Verification'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${user?.is_admin ? 'bg-saffron-500' : 'bg-gray-400'}`}></div>
                    <span className="text-sm">{user?.is_admin ? 'Admin User' : 'Regular User'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${user?.profile_completed ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="text-sm">{user?.profile_completed ? 'Complete' : 'Incomplete'}</span>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    <strong>Email:</strong> {user?.email} 
                    <span className="ml-4">
                      <strong>Member since:</strong> {user?.created_at ? 
                        new Date(user.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long'
                        }) : 'Unknown'
                      }
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-border" style={{zIndex: 10, position: 'relative'}}>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 text-white rounded-lg transition-colors font-medium"
                style={{
                  backgroundColor: loading ? '#9CA3AF' : '#EA580C',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1
                }}
                onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = '#C2410C')}
                onMouseLeave={(e) => !loading && (e.target.style.backgroundColor = '#EA580C')}
              >
                {loading ? 'Saving Changes...' : 'Save Changes'}
              </button>
              
              <button
                type="button"
                onClick={() => window.history.back()}
                disabled={loading}
                className="px-6 py-3 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 text-gray-800 rounded-lg transition-colors font-medium"
              >
                Cancel
              </button>
            </div>

            {/* Danger Zone */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-red-600 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.394-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                Danger Zone
              </h3>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-red-800 mb-2">Delete Account</h4>
                    <p className="text-red-700 mb-4">
                      Once you delete your account, there is no going back. Please be certain. This action will:
                    </p>
                    <ul className="text-red-700 text-sm mb-6 list-disc list-inside space-y-1">
                      <li>Permanently delete your profile and account data</li>
                      <li>Remove access to all radio streaming features</li>
                      <li>Cancel any active subscriptions or services</li>
                      <li>This action cannot be undone</li>
                    </ul>
                    
                    <button
                      type="button"
                      onClick={() => {
                        window.location.href = '/profile/delete'
                      }}
                      disabled={loading}
                      className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete My Account
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default AccountSettings