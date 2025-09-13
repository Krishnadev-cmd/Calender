# Google Calendar Integration Setup Guide

## Step 1: Create a Google Cloud Console Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Calendar API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Calendar API"
   - Click on it and press "Enable"

## Step 2: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Configure the OAuth consent screen first if prompted:
   - Choose "External" user type
   - Fill in the required fields:
     - App name: "Calendar Appointment System"
     - User support email: your email
     - Developer contact information: your email
   - Add scopes:
     - `https://www.googleapis.com/auth/calendar.events`
     - `https://www.googleapis.com/auth/calendar.readonly`
     - `https://www.googleapis.com/auth/userinfo.profile`
     - `https://www.googleapis.com/auth/userinfo.email`
4. Create OAuth 2.0 Client ID:
   - Application type: "Web application"
   - Name: "Calendar Appointment System"
   - Authorized redirect URIs: 
     - `http://localhost:3000/api/auth/google/callback`
     - `http://localhost:3000/auth/google/callback` (if needed)

## Step 3: Update Environment Variables

Add these to your `.env.local` file:

```bash
# Google OAuth Configuration
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
NEXT_PUBLIC_GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
```

## Step 4: Configure OAuth Consent Screen for Testing

Since this is a development app:
1. In Google Cloud Console, go to "APIs & Services" > "OAuth consent screen"
2. Under "Test users", add your email address (kdisop2003@gmail.com)
3. This allows you to test the app even though it's not verified by Google

## Important Notes:

- **For Development**: The app will be in "Testing" mode, so only test users can sign in
- **For Production**: You'll need to submit for Google verification
- **Redirect URI**: Must match exactly what you configure in Google Cloud Console
- **Domain**: For production, you'll need to add your domain to authorized domains

## Troubleshooting:

- **"Access blocked" error**: App not in production mode, add yourself as a test user
- **"redirect_uri_mismatch"**: Check that the redirect URI in code matches Google Cloud Console
- **"invalid_client"**: Check that the client ID and secret are correct