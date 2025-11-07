import { useState } from 'react'
import { feedbackAPI } from '../lib/api'
import { X, Star, Send } from 'lucide-react'

function FeedbackModal({ onClose }) {
  const [formData, setFormData] = useState({
    type: 'general',
    subject: '',
    message: '',
    rating: null
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const feedbackTypes = [
    { value: 'general', label: 'General Feedback' },
    { value: 'bug', label: 'Bug Report' },
    { value: 'feature', label: 'Feature Request' },
    { value: 'appreciation', label: 'Appreciation' }
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.subject.trim() || !formData.message.trim()) {
      setError('Subject and message are required')
      return
    }

    try {
      setLoading(true)
      setError('')
      
      await feedbackAPI.submitFeedback({
        type: formData.type,
        subject: formData.subject.trim(),
        message: formData.message.trim(),
        rating: formData.rating
      })

      setSuccess(true)
      
      // Close modal after 2 seconds
      setTimeout(() => {
        onClose()
      }, 2000)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit feedback')
    } finally {
      setLoading(false)
    }
  }

  const setRating = (rating) => {
    setFormData({ ...formData, rating })
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-peaceful-fade"
      onClick={onClose}
    >
      <div 
        className="bg-card border border-border rounded-xl shadow-divine max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 p-6 rounded-t-xl flex items-center justify-between" style={{ background: 'linear-gradient(135deg, #FF9933 0%, #F59E0B 100%)' }}>
          <div>
            <h2 className="text-xl font-bold text-white drop-shadow-md">Share Your Feedback</h2>
            <p className="text-white text-sm mt-1 drop-shadow">आपकी प्रतिक्रिया हमारे लिए महत्वपूर्ण है</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-white/80 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Success Message */}
        {success && (
          <div className="m-6 p-6 rounded-xl shadow-2xl animate-peaceful-fade" style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)' }}>
            <div className="text-center">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-white font-bold text-xl mb-2 drop-shadow-lg">
                Feedback Submitted Successfully!
              </p>
              <p className="text-white font-semibold text-lg drop-shadow">
                धन्यवाद! आपकी प्रतिक्रिया प्राप्त हो गई है।
              </p>
            </div>
          </div>
        )}

        {/* Form */}
        {!success && (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
              </div>
            )}

            {/* Feedback Type */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Feedback Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-saffron-500"
              >
                {feedbackTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Rating */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Rating (Optional)
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        formData.rating && star <= formData.rating
                          ? 'fill-saffron-500 text-saffron-500'
                          : 'text-muted-foreground'
                      }`}
                    />
                  </button>
                ))}
                {formData.rating && (
                  <button
                    type="button"
                    onClick={() => setRating(null)}
                    className="ml-2 text-sm text-muted-foreground hover:text-foreground"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Subject <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Brief summary of your feedback"
                className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-saffron-500"
                required
              />
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Message <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Share your detailed feedback, suggestions, or report issues..."
                rows={6}
                className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-saffron-500 resize-none"
                required
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 border border-border rounded-lg text-foreground hover:bg-muted transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 rounded-lg text-white font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #FF9933 0%, #F59E0B 100%)' }}
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Submit Feedback
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default FeedbackModal
