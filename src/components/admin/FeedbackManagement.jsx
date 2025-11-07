import { useState, useEffect } from 'react'
import { adminAPI } from '../../lib/api'
import { Star, Trash2, MessageSquare, CheckCircle2, Clock } from 'lucide-react'

function FeedbackManagement() {
  const [feedback, setFeedback] = useState([])
  const [stats, setStats] = useState({
    total_feedback: 0,
    pending_feedback: 0,
    reviewed_feedback: 0,
    resolved_feedback: 0,
    average_rating: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState({ status: '', type: '' })
  const [expandedId, setExpandedId] = useState(null)
  const [updatingId, setUpdatingId] = useState(null)

  useEffect(() => {
    fetchFeedback()
  }, [filter])

  const fetchFeedback = async () => {
    try {
      setLoading(true)
      const response = await adminAPI.getAllFeedback(filter)
      setFeedback(response.feedback || [])
      setStats(response.stats || stats)
      setError('')
    } catch (err) {
      setError('Failed to load feedback: ' + (err.response?.data?.error || err.message))
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (feedbackId, status, adminNotes = null) => {
    try {
      setUpdatingId(feedbackId)
      const updates = { status }
      if (adminNotes !== null) {
        updates.admin_notes = adminNotes
      }
      await adminAPI.updateFeedback(feedbackId, updates)
      await fetchFeedback()
      setError('')
    } catch (err) {
      setError('Failed to update feedback: ' + (err.response?.data?.error || err.message))
    } finally {
      setUpdatingId(null)
    }
  }

  const deleteFeedback = async (feedbackId) => {
    if (!confirm('Are you sure you want to delete this feedback?')) {
      return
    }

    try {
      await adminAPI.deleteFeedback(feedbackId)
      await fetchFeedback()
      setError('')
    } catch (err) {
      setError('Failed to delete feedback: ' + (err.response?.data?.error || err.message))
    }
  }

  const getStatusBadge = (status) => {
    const badges = {
      pending: { bg: 'bg-yellow-100 dark:bg-yellow-900/50', text: 'text-yellow-900 dark:text-yellow-100', icon: Clock },
      reviewed: { bg: 'bg-blue-100 dark:bg-blue-900/50', text: 'text-blue-900 dark:text-blue-100', icon: CheckCircle2 },
      resolved: { bg: 'bg-green-100 dark:bg-green-900/50', text: 'text-green-900 dark:text-green-100', icon: CheckCircle2 }
    }
    const badge = badges[status] || badges.pending
    const Icon = badge.icon
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${badge.bg} ${badge.text}`}>
        <Icon className="w-3 h-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  const getTypeBadge = (type) => {
    const colors = {
      general: 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100',
      bug: 'bg-red-100 dark:bg-red-900/50 text-red-900 dark:text-red-100',
      feature: 'bg-purple-100 dark:bg-purple-900/50 text-purple-900 dark:text-purple-100',
      appreciation: 'bg-pink-100 dark:bg-pink-900/50 text-pink-900 dark:text-pink-100'
    }
    return (
      <span className={`px-2 py-1 rounded text-xs font-bold ${colors[type] || colors.general}`}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </span>
    )
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="spiritual-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-bold text-saffron-600">{stats.total_feedback}</p>
            </div>
            <MessageSquare className="w-8 h-8 text-saffron-500" />
          </div>
        </div>
        <div className="spiritual-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending_feedback}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
        <div className="spiritual-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Reviewed</p>
              <p className="text-2xl font-bold text-blue-600">{stats.reviewed_feedback}</p>
            </div>
            <CheckCircle2 className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="spiritual-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Resolved</p>
              <p className="text-2xl font-bold text-green-600">{stats.resolved_feedback}</p>
            </div>
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div className="spiritual-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Avg Rating</p>
              <p className="text-2xl font-bold text-saffron-600">{stats.average_rating.toFixed(1)}</p>
            </div>
            <Star className="w-8 h-8 text-saffron-500 fill-saffron-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="spiritual-card p-4">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Status</label>
            <select
              value={filter.status}
              onChange={(e) => setFilter({ ...filter, status: e.target.value })}
              className="px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-saffron-500"
            >
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="reviewed">Reviewed</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Type</label>
            <select
              value={filter.type}
              onChange={(e) => setFilter({ ...filter, type: e.target.value })}
              className="px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-saffron-500"
            >
              <option value="">All</option>
              <option value="general">General</option>
              <option value="bug">Bug</option>
              <option value="feature">Feature</option>
              <option value="appreciation">Appreciation</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg">
          <p className="text-red-900 dark:text-red-100 font-medium">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-saffron-500 border-t-transparent rounded-full animate-spin mb-2"></div>
          <p className="text-muted-foreground">Loading feedback...</p>
        </div>
      )}

      {/* Feedback List */}
      {!loading && (
        <div className="space-y-4">
          {feedback.length === 0 ? (
            <div className="spiritual-card p-12 text-center">
              <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No feedback found</p>
            </div>
          ) : (
            feedback.map((fb) => (
              <div key={fb.id} className="spiritual-card overflow-hidden">
                {/* Header */}
                <button
                  onClick={() => setExpandedId(expandedId === fb.id ? null : fb.id)}
                  className="w-full p-4 text-left hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusBadge(fb.status)}
                        {getTypeBadge(fb.feedback_type)}
                      </div>
                      <h3 className="font-semibold text-foreground mb-1">{fb.subject}</h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{fb.user_name}</span>
                        <span>•</span>
                        <span>{fb.user_email}</span>
                        <span>•</span>
                        <span>{formatDate(fb.created_at)}</span>
                      </div>
                    </div>
                    {fb.rating && (
                      <div className="flex items-center gap-1">
                        {[...Array(fb.rating)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-saffron-500 text-saffron-500" />
                        ))}
                      </div>
                    )}
                  </div>
                </button>

                {/* Expanded Content */}
                {expandedId === fb.id && (
                  <div className="border-t border-border p-4 bg-muted/20">
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-foreground mb-2">Message</h4>
                      <p className="text-sm text-foreground whitespace-pre-wrap">{fb.message}</p>
                    </div>

                    {fb.admin_notes && (
                      <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <h4 className="text-sm font-medium text-foreground mb-2">Admin Notes</h4>
                        <p className="text-sm text-foreground whitespace-pre-wrap">{fb.admin_notes}</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2">
                      {fb.status === 'pending' && (
                        <>
                          <button
                            onClick={() => updateStatus(fb.id, 'reviewed')}
                            disabled={updatingId === fb.id}
                            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50"
                          >
                            Mark as Reviewed
                          </button>
                          <button
                            onClick={() => {
                              const notes = prompt('Add admin notes (optional):')
                              if (notes !== null) {
                                updateStatus(fb.id, 'resolved', notes || undefined)
                              }
                            }}
                            disabled={updatingId === fb.id}
                            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors disabled:opacity-50"
                          >
                            Mark as Resolved
                          </button>
                        </>
                      )}
                      {fb.status === 'reviewed' && (
                        <button
                          onClick={() => {
                            const notes = prompt('Add admin notes (optional):', fb.admin_notes || '')
                            if (notes !== null) {
                              updateStatus(fb.id, 'resolved', notes || undefined)
                            }
                          }}
                          disabled={updatingId === fb.id}
                          className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors disabled:opacity-50"
                        >
                          Mark as Resolved
                        </button>
                      )}
                      {fb.status === 'resolved' && (
                        <button
                          onClick={() => updateStatus(fb.id, 'pending')}
                          disabled={updatingId === fb.id}
                          className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors disabled:opacity-50"
                        >
                          Reopen
                        </button>
                      )}
                      
                      {/* Add Admin Notes button for all statuses */}
                      <button
                        onClick={() => {
                          const notes = prompt('Add/Edit admin notes:', fb.admin_notes || '')
                          if (notes !== null) {
                            updateStatus(fb.id, fb.status, notes || undefined)
                          }
                        }}
                        disabled={updatingId === fb.id}
                        className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50"
                      >
                        {fb.admin_notes ? 'Edit Notes' : 'Add Notes'}
                      </button>
                      
                      {/* Delete button */}
                      <button
                        onClick={() => deleteFeedback(fb.id)}
                        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors flex items-center gap-2 ml-auto"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default FeedbackManagement
