import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { adminAPI } from '../../lib/api'

const AdminPanel = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [users, setUsers] = useState([])
  const [stats, setStats] = useState({
    total_users: 0,
    pending_verification: 0,
    admins: 0,
    verified_users: 0
  })
  const [selectedTab, setSelectedTab] = useState('overview')
  const [selectedUser, setSelectedUser] = useState(null)

  // Redirect if not admin
  useEffect(() => {
    if (user && !user.is_admin) {
      navigate('/')
    }
  }, [user, navigate])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      
      const response = await adminAPI.getUsers()
      
      setUsers(response.users || [])
      
      // Calculate stats
      const totalUsers = response.users?.length || 0
      const pendingVerification = response.users?.filter(u => u.verification_status === 'pending').length || 0
      const admins = response.users?.filter(u => u.is_admin).length || 0
      const verifiedUsers = response.users?.filter(u => u.is_verified).length || 0
      
      setStats({
        total_users: totalUsers,
        pending_verification: pendingVerification,
        admins: admins,
        verified_users: verifiedUsers
      })
    } catch (err) {
      setError('Failed to load users: ' + (err.response?.data?.error || err.message))
    } finally {
      setLoading(false)
    }
  }

  const updateUserStatus = async (userId, updates) => {
    try {
      await adminAPI.updateUser(userId, updates)
      
      // Refresh users list
      await fetchUsers()
    } catch (err) {
      setError('Failed to update user: ' + (err.response?.data?.error || err.message))
    }
  }

  const approveUser = async (userId) => {
    try {
      await adminAPI.approveUser(userId)
      
      // Refresh users list
      await fetchUsers()
    } catch (err) {
      setError('Failed to approve user: ' + (err.response?.data?.error || err.message))
    }
  }

  const deleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return
    }
    
    try {
      await adminAPI.deleteUser(userId)
      
      // Refresh users list
      await fetchUsers()
    } catch (err) {
      setError('Failed to delete user: ' + (err.response?.data?.error || err.message))
    }
  }

  useEffect(() => {
    if (user?.is_admin) {
      fetchUsers()
    }
  }, [user])

  // Component for displaying user avatar
  const UserAvatar = ({ user, size = 'w-10 h-10' }) => {
    const [imageError, setImageError] = useState(false)
    const [imageLoaded, setImageLoaded] = useState(false)
    
    // Check if user has a valid profile picture URL
    const hasValidUrl = user?.profile_picture_url && user.profile_picture_url.trim() !== ''
    const hasProfilePicture = hasValidUrl && !imageError
    
    // Get user initials for fallback avatar
    const getUserInitials = () => {
      if (user.first_name && user.last_name) {
        return `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase()
      }
      if (user.full_name) {
        const names = user.full_name.trim().split(' ')
        if (names.length >= 2) {
          return `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`.toUpperCase()
        }
        return user.full_name.charAt(0).toUpperCase()
      }
      if (user.email) {
        return user.email.charAt(0).toUpperCase()
      }
      return '?'
    }
    
    const initials = getUserInitials()
    
    return (
      <div className="relative inline-block">
        {hasProfilePicture && (
          <img 
            src={user.profile_picture_url} 
            alt={`${user.first_name || user.full_name || 'User'}'s profile`}
            className={`${size} rounded-full object-cover border-2 border-saffron-200 ${
              imageLoaded ? 'block' : 'hidden'
            }`}
            onLoad={() => {
              setImageLoaded(true)
              setImageError(false)
            }}
            onError={() => {
              setImageError(true)
              setImageLoaded(false)
            }}
          />
        )}
        
        {(!hasProfilePicture || !imageLoaded) && (
          <div 
            className={`${size} rounded-full flex items-center justify-center`}
            style={{
              backgroundColor: '#DC2626',
              color: '#FFFFFF',
              fontWeight: '900',
              fontSize: size === 'w-10 h-10' ? '16px' : 
                       size === 'w-12 h-12' ? '18px' : 
                       size === 'w-14 h-14' ? '22px' : 
                       size === 'w-16 h-16' ? '26px' :
                       size === 'w-20 h-20' ? '32px' : '18px',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              border: '2px solid #B91C1C'
            }}
          >
            {initials}
          </div>
        )}
      </div>
    )
  }

  const getStatusBadge = (user) => {
    if (user.is_admin) {
      return <span className="px-2 py-1 bg-saffron-100 text-saffron-800 text-xs rounded-full">Admin</span>
    }
    
    if (user.verification_status === 'approved') {
      return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Approved</span>
    }
    
    if (user.verification_status === 'pending') {
      return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">Pending</span>
    }
    
    if (user.verification_status === 'rejected') {
      return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">Rejected</span>
    }
    
    return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">Unknown</span>
  }

  if (user && !user.is_admin) {
    return null // Component will redirect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background/90 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Admin Panel</h1>
              <p className="text-muted-foreground">Manage users and system settings</p>
            </div>
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors"
            >
              Back to Radio
            </button>
          </div>
        </header>

        {error && (
          <div className="mb-6 bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-destructive">
            {error}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-border">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setSelectedTab('overview')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  selectedTab === 'overview'
                    ? 'border-saffron-500 text-saffron-600'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setSelectedTab('users')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  selectedTab === 'users'
                    ? 'border-saffron-500 text-saffron-600'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                User Management
              </button>
            </nav>
          </div>
        </div>

        {/* Overview Tab */}
        {selectedTab === 'overview' && (
          <div>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="spiritual-card p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-2xl font-bold text-foreground">{stats.total_users}</p>
                    <p className="text-sm text-muted-foreground">Total Users</p>
                  </div>
                </div>
              </div>

              <div className="spiritual-card p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-2xl font-bold text-foreground">{stats.pending_verification}</p>
                    <p className="text-sm text-muted-foreground">Pending Verification</p>
                  </div>
                </div>
              </div>

              <div className="spiritual-card p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-2xl font-bold text-foreground">{stats.verified_users}</p>
                    <p className="text-sm text-muted-foreground">Verified Users</p>
                  </div>
                </div>
              </div>

              <div className="spiritual-card p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="w-8 h-8 text-saffron-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-2xl font-bold text-foreground">{stats.admins}</p>
                    <p className="text-sm text-muted-foreground">Administrators</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="spiritual-card p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Recent Users</h3>
              {loading ? (
                <div className="text-center py-8">
                  <div className="inline-block w-6 h-6 border-2 border-saffron-200 border-t-saffron-600 rounded-full animate-spin"></div>
                  <p className="text-muted-foreground mt-2">Loading...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {users.slice(0, 5).map(user => (
                    <div key={user.id} className="flex items-center justify-between p-3 bg-accent/20 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <UserAvatar user={user} size="w-12 h-12" />
                        <div className="hidden w-8 h-8 bg-saffron-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                          {user.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unknown User'}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                          {user.google_id && <p className="text-xs text-blue-600">Google OAuth</p>}
                        </div>
                      </div>
                      <div className="text-right">
                        {getStatusBadge(user)}
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(user.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Users Tab */}
        {selectedTab === 'users' && (
          <div className="spiritual-card p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-foreground">User Management</h3>
              <button
                onClick={fetchUsers}
                disabled={loading}
                className="px-4 py-2 bg-saffron-600 hover:bg-saffron-700 disabled:opacity-50 text-white rounded-lg transition-colors"
              >
                {loading ? 'Loading...' : 'Refresh'}
              </button>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block w-8 h-8 border-4 border-saffron-200 border-t-saffron-600 rounded-full animate-spin"></div>
                <p className="text-muted-foreground mt-4">Loading users...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-medium text-foreground">User</th>
                      <th className="text-left py-3 px-4 font-medium text-foreground">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-foreground">Joined</th>
                      <th className="text-left py-3 px-4 font-medium text-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(userItem => (
                      <tr key={userItem.id} className="border-b border-border/50 hover:bg-accent/10">
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-3">
                            <UserAvatar user={userItem} size="w-14 h-14" />
                            <div className="hidden w-10 h-10 bg-saffron-600 rounded-full flex items-center justify-center text-white font-medium">
                              {userItem.email.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-foreground">
                                {userItem.full_name || `${userItem.first_name || ''} ${userItem.last_name || ''}`.trim() || 'Unknown User'}
                              </p>
                              <p className="text-sm text-muted-foreground">{userItem.email}</p>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                {userItem.google_id && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">Google</span>}
                                {userItem.profile_completed && <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">Complete</span>}
                                {userItem.approval_method === 'invitation' && (
                                  <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded" title={`Invited by ${userItem.invitation_created_by_email || 'admin'}`}>
                                    📨 Invited
                                  </span>
                                )}
                                {userItem.approval_method === 'admin_dashboard' && (
                                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded" title={`Approved by ${userItem.approved_by_admin_email || 'admin'}`}>
                                    ✅ Admin Approved
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          {getStatusBadge(userItem)}
                        </td>
                        <td className="py-4 px-4 text-muted-foreground">
                          {new Date(userItem.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2 flex-wrap">
                            <button
                              onClick={() => setSelectedUser(userItem)}
                              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors font-medium"
                              style={{ minHeight: '32px', display: 'inline-block', visibility: 'visible' }}
                            >
                              View Details
                            </button>
                            
                            {!userItem.is_admin && userItem.verification_status === 'pending' && (
                              <>
                                <button
                                  onClick={() => approveUser(userItem.id)}
                                  className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition-colors font-medium"
                                  style={{ minHeight: '32px', display: 'inline-block', visibility: 'visible' }}
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => updateUserStatus(userItem.id, { verification_status: 'rejected' })}
                                  className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors font-medium"
                                  style={{ minHeight: '32px', display: 'inline-block', visibility: 'visible' }}
                                >
                                  Reject
                                </button>
                              </>
                            )}
                            
                            {!userItem.is_admin && (
                              <button
                                onClick={() => updateUserStatus(userItem.id, { is_admin: true })}
                                className="px-3 py-2 bg-saffron-600 hover:bg-saffron-700 text-white text-xs rounded transition-colors font-medium"
                                style={{
                                  minHeight: '32px',
                                  display: 'inline-block',
                                  visibility: 'visible',
                                  backgroundColor: '#EA580C',
                                  border: 'none',
                                  color: 'white'
                                }}
                              >
                                Make Admin
                              </button>
                            )}
                            
                            {userItem.is_admin && userItem.id !== user.id && (
                              <button
                                onClick={() => updateUserStatus(userItem.id, { is_admin: false })}
                                className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white text-xs rounded transition-colors font-medium"
                                style={{ minHeight: '32px', display: 'inline-block', visibility: 'visible' }}
                              >
                                Remove Admin
                              </button>
                            )}
                            
                            {userItem.id !== user.id && (
                              <button
                                onClick={() => deleteUser(userItem.id)}
                                className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors font-medium"
                                style={{ minHeight: '32px', display: 'inline-block', visibility: 'visible' }}
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {users.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No users found
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        
        {/* User Details Modal */}
        {selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <h3 className="text-xl font-semibold text-foreground">User Details</h3>
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                {/* User Header */}
                <div className="flex items-center space-x-4 mb-6 p-4 bg-gray-50 rounded-lg">
                  <UserAvatar user={selectedUser} size="w-20 h-20" />
                  <div className="hidden w-16 h-16 bg-saffron-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                    {selectedUser.email.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-foreground">
                      {selectedUser.full_name || `${selectedUser.first_name || ''} ${selectedUser.last_name || ''}`.trim() || 'Unknown User'}
                    </h4>
                    <p className="text-muted-foreground">{selectedUser.email}</p>
                    <div className="flex items-center gap-2 mt-2">
                      {getStatusBadge(selectedUser)}
                      {selectedUser.google_id && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Google OAuth</span>}
                    </div>
                  </div>
                </div>
                
                {/* Profile Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h5 className="font-semibold text-foreground mb-3">Contact Information</h5>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium">Phone:</span> {selectedUser.phone_number || 'Not provided'}</div>
                      <div><span className="font-medium">Email:</span> {selectedUser.email}</div>
                      {selectedUser.google_id && (
                        <div><span className="font-medium">Google ID:</span> {selectedUser.google_id}</div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h5 className="font-semibold text-foreground mb-3">Address</h5>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium">Street:</span> {selectedUser.address || 'Not provided'}</div>
                      <div><span className="font-medium">City:</span> {selectedUser.city || 'Not provided'}</div>
                      <div><span className="font-medium">State:</span> {selectedUser.state || 'Not provided'}</div>
                      <div><span className="font-medium">Country:</span> {selectedUser.country || 'Not provided'}</div>
                      <div><span className="font-medium">Postal Code:</span> {selectedUser.postal_code || 'Not provided'}</div>
                    </div>
                  </div>
                  
                  <div>
                    <h5 className="font-semibold text-foreground mb-3">Personal Information</h5>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium">Date of Birth:</span> {
                        selectedUser.date_of_birth ? new Date(selectedUser.date_of_birth).toLocaleDateString() : 'Not provided'
                      }</div>
                      <div><span className="font-medium">Gender:</span> {selectedUser.gender || 'Not provided'}</div>
                      <div><span className="font-medium">Language:</span> {selectedUser.preferred_language || 'Not provided'}</div>
                    </div>
                  </div>
                  
                  <div>
                    <h5 className="font-semibold text-foreground mb-3">Account Status</h5>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium">Profile Completed:</span> {selectedUser.profile_completed ? 'Yes' : 'No'}</div>
                      <div><span className="font-medium">Verified:</span> {selectedUser.is_verified ? 'Yes' : 'No'}</div>
                      <div><span className="font-medium">Admin:</span> {selectedUser.is_admin ? 'Yes' : 'No'}</div>
                      <div><span className="font-medium">Joined:</span> {new Date(selectedUser.created_at).toLocaleDateString()}</div>
                      {selectedUser.last_login && (
                        <div><span className="font-medium">Last Login:</span> {new Date(selectedUser.last_login).toLocaleDateString()}</div>
                      )}
                    </div>
                  </div>
                  
                  {(selectedUser.approval_method || selectedUser.invitation_created_by_email || selectedUser.approved_by_admin_email) && (
                    <div className="md:col-span-2">
                      <h5 className="font-semibold text-foreground mb-3">Approval Traceability</h5>
                      <div className="space-y-2 text-sm bg-blue-50 p-4 rounded-lg">
                        {selectedUser.approval_method && (
                          <div>
                            <span className="font-medium">Approval Method:</span>{' '}
                            <span className={`px-2 py-1 rounded ${
                              selectedUser.approval_method === 'invitation'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {selectedUser.approval_method === 'invitation' ? 'Via Invitation' : 'Admin Dashboard'}
                            </span>
                          </div>
                        )}
                        {selectedUser.invitation_created_by_email && (
                          <div>
                            <span className="font-medium">Invited By:</span> {selectedUser.invitation_created_by_email}
                          </div>
                        )}
                        {selectedUser.approved_by_admin_email && (
                          <div>
                            <span className="font-medium">Approved By:</span> {selectedUser.approved_by_admin_email}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 mt-6 pt-6 border-t">
                  {!selectedUser.is_admin && selectedUser.verification_status === 'pending' && (
                    <>
                      <button
                        onClick={() => {
                          approveUser(selectedUser.id)
                          setSelectedUser(null)
                        }}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                      >
                        Approve User
                      </button>
                      <button
                        onClick={() => {
                          updateUserStatus(selectedUser.id, { verification_status: 'rejected' })
                          setSelectedUser(null)
                        }}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                      >
                        Reject User
                      </button>
                    </>
                  )}
                  
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminPanel
