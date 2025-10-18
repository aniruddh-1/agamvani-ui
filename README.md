# agamvani-ui

Agamvani Radio Streaming UI - React frontend for spiritual audio content streaming

## Features

- 🎵 Live radio streaming interface
- 🔐 Complete authentication system
  - Email/Password login
  - OTP-based registration with email verification
  - Google OAuth integration
  - Forgot password & reset flow
  - Change password
  - Account deletion
- 📱 Responsive design
- 🎨 Modern UI with Tailwind CSS
- 🔄 Real-time player controls

## Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

**Port:** UI runs on **3001**

## Environment Variables

Create `.env` file:

```env
VITE_API_BASE_URL=http://localhost:8002
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_FRONTEND_URL=http://localhost:3001
```

## Authentication Flows

### 1. Registration with OTP
1. User fills registration form (`/register`)
2. System sends 6-digit OTP to email
3. User verifies OTP (`/verify-otp`)
4. Auto-login after verification

### 2. Login
- Email/password login (`/login`)
- Google OAuth (redirect flow)
- HTTP-only cookies for session

### 3. Password Reset
1. Request reset (`/forgot-password`)
2. Email with reset token sent
3. Reset password (`/reset-password?token=xxx`)

### 4. User Settings
- Change password (requires current password)
- Delete account (with confirmation)

## Project Structure

```
src/
├── components/
│   ├── auth/
│   │   ├── LoginPage.jsx
│   │   ├── RegisterOTP.jsx          # ✅ New: OTP registration
│   │   ├── VerifyOTP.jsx            # ✅ New: OTP verification
│   │   ├── ForgotPasswordPage.jsx
│   │   └── ResetPasswordPage.jsx
│   ├── RadioPlayer.jsx
│   └── PrivateRoute.jsx             # Protected route wrapper
├── contexts/
│   └── AuthContext.jsx              # ✅ Updated with new methods
├── lib/
│   └── api.js                       # ✅ New: Centralized API client
├── config/
│   └── constants.js
└── App.jsx
```

## API Integration

All API calls use the centralized client in `src/lib/api.js`:

```javascript
import { authAPI } from '../lib/api';

// Registration
await authAPI.requestOTP({ email, password, full_name });
await authAPI.verifyOTP({ email, otp_code });

// Login
await authAPI.login({ email, password });

// Password management
await authAPI.forgotPassword(email);
await authAPI.resetPassword({ token, new_password });
await authAPI.changePassword({ current_password, new_password });

// Account
await authAPI.deleteAccount(password);
```

## Remaining Implementation Tasks

### Priority 1 - Required for MVP
- [ ] Update routing in `App.jsx` with new auth routes
- [ ] Update `ForgotPasswordPage.jsx` to use new API
- [ ] Update `ResetPasswordPage.jsx` to use new API
- [ ] Create `UserSettings.jsx` component
- [ ] Update `LoginPage.jsx` with forgot password link

### Priority 2 - Enhanced UX
- [ ] Add loading states and error handling
- [ ] Add toast notifications
- [ ] Add profile completion flow (if needed)
- [ ] Improve mobile responsiveness

## Testing

### Manual Testing Checklist

**Registration Flow:**
1. Visit `/register`
2. Fill form and submit
3. Check email for OTP
4. Enter OTP on `/verify-otp`
5. Should auto-login and redirect to home

**Login Flow:**
1. Visit `/login`
2. Enter credentials
3. Should redirect to home

**Password Reset Flow:**
1. Visit `/forgot-password`
2. Enter email
3. Check email for reset link
4. Click link → `/reset-password?token=xxx`
5. Enter new password
6. Try logging in with new password

**Settings:**
1. Login and visit `/settings`
2. Change password
3. Try delete account (test in dev only)

## Technologies

- **React 18** - UI framework
- **React Router** - Routing
- **Axios** - HTTP client
- **Tailwind CSS** - Styling
- **Vite** - Build tool

## Development Notes

- All authentication uses HTTP-only cookies
- CORS configured for localhost development
- API client automatically includes credentials
- Tokens stored in cookies (secure)

## Related Documentation

- Backend API: `../agamvani-api/README.md`
- Auth Implementation: `../agamvani-api/AUTH_IMPLEMENTATION.md`

See backend README for complete API endpoint documentation.
