import supabase from "@/lib/supabase";

export const handleSignInWithGoogle = async () => {
    try {   
      await supabase.auth.signOut()
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback`,
          queryParams: {
              access_type: 'offline',
              prompt: 'consent',
            },
        },
        
      })

      console.log('OAuth Response:', data, error);

      if (error) {
        console.error('Error signing in with Google:', error)
      }
    } catch (error) {
      console.error('Login error:', error)
    }
  } 

export const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Error signing out:', error)
      }
    } catch (error) {
      console.error('Logout error:', error)
    }
  }