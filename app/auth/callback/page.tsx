'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import supabase from '@/lib/supabase'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('Processing auth callback...')
        console.log('Current URL:', window.location.href)
        
        // Extract provider_token from URL fragment (Google Calendar token)
        const urlParams = new URLSearchParams(window.location.hash.substring(1));
        const providerToken = urlParams.get('provider_token');
        const refreshToken = urlParams.get('refresh_token');
        const expiresIn = urlParams.get('expires_in');
        const userTypeFromGoogle = urlParams.get('user_type'); // From Google OAuth flow
        
        console.log('Provider token found:', !!providerToken);
        console.log('Refresh token found:', !!refreshToken);
        console.log('User type from Google OAuth:', userTypeFromGoogle);
        
        // Get the current session (this will process the URL fragment automatically)
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Auth callback error:', error)
          router.push('/login?error=auth_failed')
          return
        }

        if (data.session) {
          console.log('User authenticated:', data.session.user.email)
          
          // Store Google Calendar tokens if available
          if (providerToken && data.session.user) {
            console.log('Storing Google Calendar tokens...')
            
            // Determine user type priority: Google OAuth > URL params > localStorage > default
            let userType = userTypeFromGoogle; // First priority: from Google OAuth
            
            if (!userType) {
              // Second priority: check URL search params
              const searchParams = new URLSearchParams(window.location.search);
              userType = searchParams.get('user_type');
            }
            
            if (!userType) {
              // Third priority: try to get user type from localStorage
              try {
                const storedProfile = localStorage.getItem('user_profile');
                if (storedProfile) {
                  const profile = JSON.parse(storedProfile);
                  userType = profile.role;
                }
              } catch (e) {
                console.log('Could not get user type from localStorage');
              }
            }
            
            // Default fallback
            userType = userType || 'buyer';
            
            console.log('Determined user type:', userType);
            
            try {
              const response = await fetch('/api/store-tokens', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  user_id: data.session.user.id,
                  access_token: providerToken,
                  refresh_token: refreshToken,
                  expires_at: new Date(Date.now() + (parseInt(expiresIn || '3600') * 1000)).toISOString(),
                  user_type: userType
                })
              });

              if (response.ok) {
                const result = await response.json();
                console.log('Google Calendar tokens stored successfully:', result);
                router.push(`/dashboard?google_connected=true&user_type=${userType}`);
              } else {
                const error = await response.text();
                console.error('Failed to store tokens:', error);
                router.push('/dashboard?google_error=storage_failed');
              }
            } catch (tokenError) {
              console.error('Error storing tokens:', tokenError);
              router.push('/dashboard?google_error=storage_error');
            }
          } else {
            router.push('/dashboard');
          }
        } else {
          console.log('No session found, trying to refresh...')
          // Try to refresh session from URL fragments
          const { error: refreshError } = await supabase.auth.refreshSession()
          if (refreshError) {
            console.error('Session refresh error:', refreshError)
            router.push('/login?error=refresh_failed')
          } else {
            // Check session again after refresh
            const { data: newSession } = await supabase.auth.getSession()
            if (newSession.session) {
              console.log('Session refreshed successfully')
              router.push('/dashboard')
            } else {
              console.log('No session after refresh')
              router.push('/login?error=no_session')
            }
          }
        }
      } catch (error) {
        console.error('Callback processing error:', error)
        router.push('/login?error=callback_error')
      }
    }

    // Small delay to ensure URL fragments are processed
    const timer = setTimeout(() => {
      handleAuthCallback()
    }, 100)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-lg font-semibold text-gray-700 mb-2">Completing sign in...</h2>
        <p className="text-sm text-gray-500">Please wait while we authenticate you</p>
      </div>
    </div>
  )
}