
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import supabase from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Buyer from '@/components/Buyer'
import Seller from '@/components/Seller'
import Appointments from '@/components/Appointments'
import RoleSelection from '@/components/RoleSelection'
import { handleSignOut } from '../actions/auth/route'
import { Button } from '@/components/ui/button'

interface UserProfile {
  role: 'buyer' | 'seller' | null;
  full_name: string | null;
  avatar_url: string | null;
}

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [googleTokens, setGoogleTokens] = useState<{
    buyer?: any;
    seller?: any;
  }>({})
  const [isGoogleConnected, setIsGoogleConnected] = useState(false)

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      if (session) {
        setUser(session.user)
        
        // Get user profile and role
        const { data: profile, error } = await supabase
          .from('user_profiles')
          .select('role, full_name, email')
          .eq('id', session.user.id)
          .single()

        if (error) {
          if (error.code === 'PGRST116') {
            // User profile doesn't exist, this is a new user
            console.log('New user detected, profile will be created during role selection');
            setUserProfile(null);
          } else {
            console.error('Error fetching user profile:', error);
          }
        } else {
          setUserProfile({
            ...profile,
            avatar_url: null // Add default avatar_url
          })
        }
        
        // Check for Google Calendar connection status from API
        const checkGoogleConnection = async () => {
          try {
            // Use API endpoint to check tokens (bypasses RLS policies)
            const [buyerResponse, sellerResponse] = await Promise.all([
              fetch(`/api/store-tokens?userId=${session.user.id}&userType=buyer`),
              fetch(`/api/store-tokens?userId=${session.user.id}&userType=seller`)
            ]);

            const buyerResult = await buyerResponse.json();
            const sellerResult = await sellerResponse.json();
            
            console.log('Token check results:', { 
              buyerConnected: buyerResult.connected || false, 
              sellerConnected: sellerResult.connected || false,
              buyerError: !buyerResponse.ok ? 'API_ERROR' : null,
              sellerError: !sellerResponse.ok ? 'API_ERROR' : null
            });

            const hasAnyTokens = buyerResult.connected || sellerResult.connected;
            
            if (hasAnyTokens) {
              setIsGoogleConnected(true);
              
              // Store tokens in localStorage for client-side usage
              if (buyerResult.connected && buyerResult.tokens) {
                localStorage.setItem('google_calendar_tokens_buyer', JSON.stringify(buyerResult.tokens));
              }
              if (sellerResult.connected && sellerResult.tokens) {
                localStorage.setItem('google_calendar_tokens_seller', JSON.stringify(sellerResult.tokens));
              }
              
              // Set tokens for both roles
              setGoogleTokens({
                buyer: buyerResult.connected ? buyerResult.tokens : null,
                seller: sellerResult.connected ? sellerResult.tokens : null
              });
            } else {
              setIsGoogleConnected(false);
              setGoogleTokens({ buyer: null, seller: null });
            }
          } catch (error) {
            console.error('Error checking Google connection:', error);
            setIsGoogleConnected(false);
          }
        };

        // Check URL parameters for immediate feedback from OAuth callback
        const urlParams = new URLSearchParams(window.location.search);
        const googleConnected = urlParams.get('google_connected');
        const userType = urlParams.get('user_type') as 'buyer' | 'seller';
        const tokens = urlParams.get('tokens');
        
        if (googleConnected === 'true') {
          // If tokens are provided in URL (fallback method)
          if (tokens) {
            try {
              const tokenData = JSON.parse(decodeURIComponent(tokens));
              
              setIsGoogleConnected(true);
              
              // Store in state
              setGoogleTokens(prev => ({
                ...prev,
                [userType]: tokenData
              }));
              
              // Store in localStorage for persistence
              localStorage.setItem(`google_tokens_${userType}`, JSON.stringify(tokenData));
            } catch (error) {
              console.error('Error parsing tokens from URL:', error);
              // Fallback to checking database
              await checkGoogleConnection();
            }
          } else {
            // No tokens in URL, check database to verify connection
            await checkGoogleConnection();
          }

          // Clean up URL parameters
          window.history.replaceState({}, '', '/dashboard');
        } else {
          // Normal flow - check database for existing connection
          await checkGoogleConnection();
        }
      } else {
        router.push('/login');
      }
      setLoading(false);
    };

    getUser();
  }, [router]);

  const handleRoleSelected = (role: 'buyer' | 'seller') => {
    setUserProfile(prev => prev ? { ...prev, role } : { role, full_name: null, avatar_url: null });
  };

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

  // Show role selection if user hasn't chosen a role yet
  if (!userProfile?.role) {
    return <RoleSelection userId={user.id} onRoleSelected={handleRoleSelected} />
  }

  const userName = userProfile.full_name || user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User'
  const userAvatar = userProfile.avatar_url || user.user_metadata?.avatar_url || user.user_metadata?.picture
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
            <p className="text-gray-600">
              {userProfile.role === 'buyer' 
                ? 'Find and book appointments with service providers' 
                : 'Manage your calendar and availability for clients'
              }
            </p>
          </div>

          {/* Role-based Content */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            {userProfile.role === 'buyer' ? (
              // Buyer Dashboard
              <Tabs defaultValue="BookAppointments" className="w-full">
                <div className="bg-gradient-to-r from-blue-500 to-cyan-500 px-6 py-4">
                  <TabsList className="bg-white/20 backdrop-blur-sm border-0 rounded-xl p-1">
                    <TabsTrigger 
                      value="BookAppointments" 
                      className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm text-white font-medium px-6 py-2 rounded-lg transition-all duration-200"
                    >
                      🛒 Book Appointments
                    </TabsTrigger>
                    <TabsTrigger 
                      value="MyAppointments" 
                      className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm text-white font-medium px-6 py-2 rounded-lg transition-all duration-200"
                    >
                      � My Appointments
                    </TabsTrigger>
                  </TabsList>
                </div>

                <div className="p-8">
                  <TabsContent value="BookAppointments" className="mt-0">
                    <Buyer user={user} isGoogleConnected={isGoogleConnected || !!googleTokens.buyer} />
                  </TabsContent>

                  <TabsContent value="MyAppointments" className="mt-0">
                    <Appointments user={user} userRole={userProfile?.role} />
                  </TabsContent>
                </div>
              </Tabs>
            ) : (
              // Seller Dashboard
              <Tabs defaultValue="ManageCalendar" className="w-full">
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-6 py-4">
                  <TabsList className="bg-white/20 backdrop-blur-sm border-0 rounded-xl p-1">
                    <TabsTrigger 
                      value="ManageCalendar" 
                      className="data-[state=active]:bg-white data-[state=active]:text-green-600 data-[state=active]:shadow-sm text-white font-medium px-6 py-2 rounded-lg transition-all duration-200"
                    >
                      🏪 Manage Calendar
                    </TabsTrigger>
                    <TabsTrigger 
                      value="Appointments" 
                      className="data-[state=active]:bg-white data-[state=active]:text-green-600 data-[state=active]:shadow-sm text-white font-medium px-6 py-2 rounded-lg transition-all duration-200"
                    >
                      📅 Appointments
                    </TabsTrigger>
                  </TabsList>
                </div>

                <div className="p-8">
                  <TabsContent value="ManageCalendar" className="mt-0">
                    <Seller user={user} isGoogleConnected={isGoogleConnected || !!googleTokens.seller} />
                  </TabsContent>

                  <TabsContent value="Appointments" className="mt-0">
                    <Appointments user={user} userRole={userProfile?.role} />
                  </TabsContent>
                </div>
              </Tabs>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}