import { useState } from 'react';
import { X, Copy, Check, Send, Calendar } from 'lucide-react';
import { adminAPI } from '../../lib/api';

const InviteUserModal = ({ isOpen, onClose }) => {
  const [step, setStep] = useState('form'); // 'form' or 'success'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    invited_email: '',
    expires_in_days: 7,
    notes: ''
  });
  
  // Generated invite
  const [generatedInvite, setGeneratedInvite] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'expires_in_days' ? parseInt(value, 10) : value
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const payload = {
        expires_in_days: formData.expires_in_days,
        notes: formData.notes || undefined
      };

      // Only include email if it's provided
      if (formData.invited_email?.trim()) {
        payload.invited_email = formData.invited_email.trim();
      }

      const invite = await adminAPI.generateInvitation(payload);
      setGeneratedInvite(invite);
      setStep('success');
      
    } catch (err) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to generate invitation';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyToClipboard = async () => {
    if (!generatedInvite) return;
    
    try {
      await navigator.clipboard.writeText(generatedInvite.invite_url);
      setCopiedToClipboard(true);
      setTimeout(() => setCopiedToClipboard(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const handleClose = () => {
    setStep('form');
    setGeneratedInvite(null);
    setFormData({
      invited_email: '',
      expires_in_days: 7,
      notes: ''
    });
    setError('');
    setCopiedToClipboard(false);
    onClose();
  };

  const formatExpiryDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Send className="w-5 h-5 text-orange-600" />
            <h2 className="text-xl font-semibold">
              {step === 'form' ? 'Invite New User' : 'Invitation Created!'}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {step === 'form' ? (
          /* Invite Form */
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <div>
              <label htmlFor="invited_email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address (Optional)
              </label>
              <input
                type="email"
                id="invited_email"
                name="invited_email"
                value={formData.invited_email}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                placeholder="Leave blank for generic invite"
              />
              <p className="text-xs text-gray-500 mt-1">
                Specific email makes the invite only usable by that person
              </p>
            </div>

            <div>
              <label htmlFor="expires_in_days" className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Expiration
              </label>
              <select
                id="expires_in_days"
                name="expires_in_days"
                value={formData.expires_in_days}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
              >
                <option value={1}>1 day</option>
                <option value={3}>3 days</option>
                <option value={7}>7 days (recommended)</option>
                <option value={14}>14 days</option>
                <option value={30}>30 days</option>
              </select>
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none resize-none"
                placeholder="Add any notes about this invitation..."
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Generate Invite
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* Success View */
          <div className="p-6 space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Invitation Ready!
              </h3>
              <p className="text-sm text-gray-600">
                Share this link with the person you want to invite
              </p>
            </div>

            {generatedInvite && (
              <div className="space-y-4">
                {/* Invite Details */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  {generatedInvite.invited_email && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-600">For:</span>
                      <span className="font-medium">{generatedInvite.invited_email}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600">Expires:</span>
                    <span className="font-medium">{formatExpiryDate(generatedInvite.expires_at)}</span>
                  </div>
                </div>

                {/* Invite URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Invitation Link
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={generatedInvite.invite_url}
                      readOnly
                      className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm font-mono"
                    />
                    <button
                      onClick={handleCopyToClipboard}
                      className="px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-1"
                    >
                      {copiedToClipboard ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span className="text-sm">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span className="text-sm">Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleClose}
                    className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Done
                  </button>
                  <button
                    onClick={() => {
                      setStep('form');
                      setGeneratedInvite(null);
                      setFormData({
                        invited_email: '',
                        expires_in_days: 7,
                        notes: ''
                      });
                    }}
                    className="flex-1 px-4 py-2 border border-orange-600 text-orange-600 rounded-lg hover:bg-orange-50 transition-colors"
                  >
                    Create Another
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default InviteUserModal;
