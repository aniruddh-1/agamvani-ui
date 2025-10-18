import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const VerifyOTP = ({ email: propEmail, invitationToken: propInvitationToken, onBack }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { verifyOTP, requestOTP } = useAuth();
  
  const email = propEmail || location.state?.email || '';
  const invitationToken = propInvitationToken || location.state?.token || null; // Get invitation token from props or state
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (!email) {
      navigate('/register');
    }
  }, [email, navigate]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!otpCode || otpCode.length !== 6) {
      setError('Please enter the 6-digit verification code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await verifyOTP(email, otpCode, invitationToken);
      
      // User is now logged in, redirect to home
      navigate('/', { replace: true });
    } catch (err) {
      console.error('OTP verification error:', err);
      setError(
        err.response?.data?.error || 
        err.response?.data?.detail ||
        err.message || 
        'Invalid verification code. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendCooldown > 0) return;

    setResending(true);
    setError('');

    try {
      await requestOTP(email, '', ''); // Password not needed for resend
      setResendCooldown(60); // 60 second cooldown
      setError('');
    } catch (err) {
      console.error('Resend OTP error:', err);
      setError('Failed to resend code. Please try again.');
    } finally {
      setResending(false);
    }
  };

  const handleOTPChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Only digits
    if (value.length <= 6) {
      setOtpCode(value);
      setError('');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-50 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Verify your email
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            We've sent a 6-digit code to
          </p>
          <p className="text-center text-sm font-medium text-gray-900">
            {email}
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="otpCode" className="block text-sm font-medium text-gray-700">
              Verification Code
            </label>
            <input
              id="otpCode"
              name="otpCode"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              required
              value={otpCode}
              onChange={handleOTPChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-center text-2xl tracking-widest focus:outline-none focus:ring-orange-500 focus:border-orange-500"
              placeholder="000000"
              maxLength={6}
              autoComplete="one-time-code"
            />
            <p className="mt-2 text-xs text-gray-500 text-center">
              Enter the 6-digit code from your email
            </p>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || otpCode.length !== 6}
              className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                loading || otpCode.length !== 6
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500'
              }`}
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Verifying...
                </span>
              ) : (
                'Verify Email'
              )}
            </button>
          </div>

          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600">
              Didn't receive the code?
            </p>
            <button
              type="button"
              onClick={handleResendOTP}
              disabled={resending || resendCooldown > 0}
              className={`text-sm font-medium ${
                resending || resendCooldown > 0
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-orange-600 hover:text-orange-500'
              }`}
            >
              {resending
                ? 'Sending...'
                : resendCooldown > 0
                ? `Resend code in ${resendCooldown}s`
                : 'Resend verification code'}
            </button>
          </div>

          {onBack ? (
            <div className="text-center text-sm">
              <button 
                onClick={onBack}
                className="font-medium text-orange-600 hover:text-orange-500"
              >
                ← Back to registration
              </button>
            </div>
          ) : (
            <div className="text-center text-sm">
              <Link to="/register" className="font-medium text-orange-600 hover:text-orange-500">
                ← Back to registration
              </Link>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default VerifyOTP;
