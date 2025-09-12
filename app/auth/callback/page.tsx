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
        
        // Get the current session (this will process the URL fragment automatically)
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Auth callback error:', error)
          router.push('/login?error=auth_failed')
          return
        }

        if (data.session) {
          console.log('User authenticated:', data.session.user.email)
          router.push('/dashboard')
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