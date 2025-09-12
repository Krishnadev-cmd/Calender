'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import supabase from '@/lib/supabase'
import { User } from '@supabase/supabase-js'

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        setUser(session.user)
      } else {
        router.push('/login')
      }
      setLoading(false)
    }

    getUser()
  }, [router])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <div>Redirecting to login...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Dashboard</h1>
        
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600">Welcome back!</p>
            <p className="font-medium">{user.user_metadata?.full_name || user.email}</p>
          </div>
          
          {user.user_metadata?.avatar_url && (
            <img 
              src={user.user_metadata.avatar_url} 
              alt="Profile" 
              className="w-16 h-16 rounded-full"
            />
          )}
          
          <div className="text-sm text-gray-500">
            <p>Email: {user.email}</p>
            <p>Provider: {user.app_metadata?.provider}</p>
          </div>
          
          <button 
            onClick={handleSignOut}
            className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  )
}