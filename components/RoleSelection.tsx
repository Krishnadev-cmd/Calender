import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import supabase from '@/lib/supabase';

interface RoleSelectionProps {
  userId: string;
  onRoleSelected: (role: 'buyer' | 'seller') => void;
}

export default function RoleSelection({ userId, onRoleSelected }: RoleSelectionProps) {
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'buyer' | 'seller' | null>(null);

  const handleRoleSelection = async (role: 'buyer' | 'seller') => {
    setLoading(true);
    try {
      // First, ensure user profile exists
      const { data: existingProfile, error: fetchError } = await supabase
        .from('user_profiles')
        .select('id, role')
        .eq('id', userId)
        .single();

      if (fetchError && fetchError.code === 'PGRST116') {
        // User profile doesn't exist, create it
        const { data: userData } = await supabase.auth.getUser();
        const { error: createError } = await supabase
          .from('user_profiles')
          .insert({
            id: userId,
            email: userData.user?.email,
            full_name: userData.user?.user_metadata?.full_name || userData.user?.user_metadata?.name || '',
            role: role
          });

        if (createError) {
          console.error('Error creating user profile:', createError);
          return;
        }
      } else {
        // Update existing profile with selected role
        const { error: profileError } = await supabase
          .from('user_profiles')
          .update({ role })
          .eq('id', userId);

        if (profileError) {
          console.error('Error updating user profile:', profileError);
          return;
        }
      }

      // If user selected seller, create seller profile
      if (role === 'seller') {
        const { error: sellerError } = await supabase
          .from('sellers')
          .insert({
            user_id: userId,
            business_name: '',
            description: '',
            location: '',
            availability_settings: {}
          });

        if (sellerError) {
          console.error('Error creating seller profile:', sellerError);
          return;
        }
      }

      onRoleSelected(role);
    } catch (error) {
      console.error('Error selecting role:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome! Choose Your Role</h1>
          <p className="text-gray-600">Select how you'd like to use our calendar appointment system</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Buyer Card */}
          <Card 
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
              selectedRole === 'buyer' ? 'ring-2 ring-blue-500 shadow-lg' : ''
            }`}
            onClick={() => setSelectedRole('buyer')}
          >
            <CardHeader className="text-center">
              <div className="text-4xl mb-4">🛒</div>
              <CardTitle className="text-xl text-blue-600">I'm a Buyer</CardTitle>
              <CardDescription>I want to book appointments with service providers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Browse and search for service providers</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>View available time slots</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Book appointments instantly</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Automatic calendar integration</span>
                </div>
              </div>
              {selectedRole === 'buyer' && (
                <Button 
                  onClick={() => handleRoleSelection('buyer')} 
                  disabled={loading}
                  className="w-full mt-4 bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? 'Setting up...' : 'Continue as Buyer'}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Seller Card */}
          <Card 
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
              selectedRole === 'seller' ? 'ring-2 ring-green-500 shadow-lg' : ''
            }`}
            onClick={() => setSelectedRole('seller')}
          >
            <CardHeader className="text-center">
              <div className="text-4xl mb-4">🏪</div>
              <CardTitle className="text-xl text-green-600">I'm a Seller</CardTitle>
              <CardDescription>I provide services and want to manage my calendar</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Manage your availability</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Accept appointment bookings</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Google Calendar integration</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Automated meeting links</span>
                </div>
              </div>
              {selectedRole === 'seller' && (
                <Button 
                  onClick={() => handleRoleSelection('seller')} 
                  disabled={loading}
                  className="w-full mt-4 bg-green-600 hover:bg-green-700"
                >
                  {loading ? 'Setting up...' : 'Continue as Seller'}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}