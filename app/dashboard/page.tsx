
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import supabase from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Buyer from '@/components/Buyer'
import Seller from '@/components/Seller'
import { handleSignOut } from '../actions/auth/route'
import { Button } from '@/components/ui/button'

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

    const userName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User'
    const userAvatar = user.user_metadata?.avatar_url || user.user_metadata?.picture
    const userEmail = user.email

return (
    <div className='flex flex-col flex-1'>
      <div className='flex flex-row justify-between items-center h-20 w-full bg-green-500 px-6'>
        {/* Left side - Dashboard title */}
        <div>        
          <p className="text-white font-semibold text-xl">Dashboard</p>
        </div>

        {/* Right side - Username and Avatar */}
        <div className="flex items-center gap-3 ml-250">
          <p className="text-white">Welcome, {userName}</p>
          <Avatar>
            <AvatarImage src={userAvatar} />
            <AvatarFallback>{userName?.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
        
        </div>
      <div>
        <Button onClick={handleSignOut} className='bg-red-500 hover:bg-red-600 text-white'>Sign Out</Button>
      </div>
      </div>
      
      {/* Main Content Area */}
      <div className="flex-1 bg-gradient-to-br from-slate-50 to-blue-50 p-8">
        <div className="max-w-6xl mx-auto">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome back, {userName}! 👋</h1>
            <p className="text-gray-600">Manage your marketplace activities with ease</p>
          </div>

          {/* Enhanced Tabs Section */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <Tabs defaultValue="Buyer" className="w-full">
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-6 py-4">
                <TabsList className="bg-white/20 backdrop-blur-sm border-0 rounded-xl p-1">
                  <TabsTrigger 
                    value="Buyer" 
                    className="data-[state=active]:bg-white data-[state=active]:text-green-600 data-[state=active]:shadow-sm text-yellow-400 font-medium px-6 py-2 rounded-lg transition-all duration-200"
                  >
                    🛒 Buyer Dashboard
                  </TabsTrigger>
                  <TabsTrigger 
                    value="Seller" 
                    className="data-[state=active]:bg-white data-[state=active]:text-green-600 data-[state=active]:shadow-sm text-yellow-400 font-medium px-6 py-2 rounded-lg transition-all duration-200"
                  >
                    🏪 Seller Dashboard
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="p-8">
                <TabsContent value="Buyer" className="mt-0">
                  <Buyer />
                </TabsContent>

                <TabsContent value="Seller" className="mt-0">
                  <Seller />
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}