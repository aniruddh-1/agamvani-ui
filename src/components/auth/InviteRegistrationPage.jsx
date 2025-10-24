import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { API_ROOT_URL, API_BASE_URL } from '../../config/constants';
import { useAuth } from '../../contexts/AuthContext';
import { nativeGoogleAuth } from '../../services/nativeGoogleAuth';
import axios from 'axios';
import VerifyOTP from './VerifyOTP';

const InviteRegistrationPage = () => {
  const navigate = useNavigate();
  const { loginWithGoogle } = useAuth();
  const { token: pathToken } = useParams();
  const [searchParams] = useSearchParams();
  // Support both path parameter (/invite/:token) and query parameter (/invite?token=...)
  const token = pathToken || searchParams.get('token');
  
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [inviteValidation, setInviteValidation] = useState(null);
  const [isValidatingInvite, setIsValidatingInvite] = useState(true);
  const [currentStep, setCurrentStep] = useState('registration'); // 'registration' or 'otp'
  const [otpEmail, setOtpEmail] = useState('');

  // Validate invitation on mount
  useEffect(() => {
    const validateInvitation = async () => {
      if (!token) {
        setError('No invitation token provided');
        setIsValidatingInvite(false);
        return;
      }

      try {
        const response = await fetch(`${API_ROOT_URL}/api/invitations/validate/${token}`);
        
        if (!response.ok) {
          throw new Error('Failed to validate invitation');
        }
        
        const validation = await response.json();
        setInviteValidation(validation);
        
        if (!validation.is_valid) {
          setError(validation.error_message || 'Invalid invitation');
        } else if (validation.invited_email) {
          setFormData(prev => ({ ...prev, email: validation.invited_email }));
        }
      } catch (err) {
        setError('Failed to validate invitation');
      } finally {
        setIsValidatingInvite(false);
      }
    };

    validateInvitation();
  }, [token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setIsSubmitting(true);

    try {
      // Request OTP with invitation token
      const otpResponse = await fetch(`${API_ROOT_URL}/auth/request-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          email: formData.email,
          password: formData.password,
          full_name: formData.full_name
        }),
      });

      if (!otpResponse.ok) {
        const errorData = await otpResponse.json();
        throw new Error(errorData.error || 'Failed to send OTP');
      }

      // Move to OTP step
      setOtpEmail(formData.email);
      setCurrentStep('otp');
      
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignup = async () => {
    setError('');
    setGoogleLoading(true);

    try {
      // Check if running on native platform (Android/iOS)
      if (Capacitor.isNativePlatform()) {
        console.log('🔑 Using native Google Sign-In for mobile APK with invitation');
        
        // Store invitation token before auth
        if (token) {
          sessionStorage.setItem('invitation_token', token);
        }
        
        // Use native Google Sign-In SDK
        const googleResult = await nativeGoogleAuth.signIn();
        
        // Send ID token to backend with invitation token
        const payload = { id_token: googleResult.idToken };
        if (token) {
          payload.invitation_token = token;
        }
        
        const response = await axios.post(
          `${API_BASE_URL}/auth/google/native`,
          payload,
          { headers: { 'Content-Type': 'application/json' } }
        );
        
        // Store tokens
        const { access_token, refresh_token } = response.data;
        localStorage.setItem('access_token', access_token);
        if (refresh_token) {
          localStorage.setItem('refresh_token', refresh_token);
        }
        
        console.log('✅ Native Google Sign-In successful with invitation');
        
        // Force a page reload to trigger auth context refresh
        window.location.replace('/');
      } else {
        // Use web OAuth flow
        console.log('🌐 Using web Google OAuth flow with invitation');
        // Store invitation token in sessionStorage before redirecting to Google
        if (token) {
          sessionStorage.setItem('invitation_token', token);
        }
        loginWithGoogle(token);
      }
    } catch (err) {
      console.error('❌ Google Sign-In failed:', err);
      let errorMessage = 'Google Sign-In failed. Please try again.';
      
      if (err?.message?.includes('network') || err?.message?.includes('fetch')) {
        errorMessage = 'Network error. Please check your internet connection.';
      } else if (err?.message?.includes('timeout')) {
        errorMessage = 'Authentication timed out. Please try again.';
      } else if (err?.response?.status === 400) {
        errorMessage = 'Invalid Google authentication. Please try again.';
      } else if (err?.response?.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      }
      
      setError(errorMessage);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleBackToRegistration = () => {
    setCurrentStep('registration');
    setOtpEmail('');
    setError('');
  };

  // Show OTP verification if we've moved to that step
  if (currentStep === 'otp') {
    return (
      <VerifyOTP
        email={otpEmail}
        invitationToken={token}
        onBack={handleBackToRegistration}
      />
    );
  }

  if (isValidatingInvite) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-pulse">📨</div>
          <p>Validating invitation...</p>
        </div>
      </div>
    );
  }

  if (!inviteValidation?.is_valid) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold mb-2">Invalid Invitation</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            to="/register"
            className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            Register Normally
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">You're Invited! 🎉</h1>
          <p className="text-gray-600">
            Create your account to join Agamvani Radio
          </p>
          {inviteValidation.invited_email && (
            <p className="text-sm text-orange-600 mt-2">
              Invitation for: {inviteValidation.invited_email}
            </p>
          )}
        </div>

        {/* Registration Form */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <div>
              <label htmlFor="full_name" className="block text-sm font-medium mb-2">
                Full Name
              </label>
              <input
                type="text"
                id="full_name"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                required
                minLength={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={!!inviteValidation.invited_email}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none ${
                  inviteValidation.invited_email ? 'bg-gray-50 cursor-not-allowed' : ''
                }`}
                placeholder="Enter your email"
              />
              {inviteValidation.invited_email && (
                <p className="text-xs text-gray-500 mt-1">
                  This invitation is for this email address
                </p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                placeholder="Create a password (min 6 characters)"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                placeholder="Confirm your password"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Registering...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignup}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {googleLoading ? (
              <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            )}
            <span className="text-gray-700 font-medium">{googleLoading ? 'Connecting to Google...' : 'Sign up with Google'}</span>
          </button>

          <div className="mt-6 text-center text-sm">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-orange-600 hover:text-orange-700 font-medium">
                Sign in here
              </Link>
            </p>
          </div>
        </div>

        {/* Invitation Info */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            🎫 Registration via invitation • Auto-approved access
          </p>
          {inviteValidation.expires_at && (
            <p className="text-xs text-gray-500 mt-1">
              Invitation expires: {new Date(inviteValidation.expires_at).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default InviteRegistrationPage;
