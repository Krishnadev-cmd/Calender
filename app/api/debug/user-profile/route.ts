import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ 
        error: 'Not authenticated',
        authError: authError?.message
      }, { status: 401 });
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        metadata: user.user_metadata
      },
      profile: profile,
      profileError: profileError?.message,
      profileErrorCode: profileError?.code,
      hasProfile: !!profile,
      hasRole: !!profile?.role,
      roleValue: profile?.role
    });

  } catch (error: any) {
    console.error('Debug user profile error:', error);
    return NextResponse.json({ 
      error: 'Debug failed',
      details: error.message 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ 
        error: 'Not authenticated'
      }, { status: 401 });
    }

    // Delete user profile to reset role selection
    const { error: deleteError } = await supabase
      .from('user_profiles')
      .delete()
      .eq('id', user.id);

    if (deleteError) {
      return NextResponse.json({ 
        error: 'Failed to delete profile',
        details: deleteError.message 
      }, { status: 500 });
    }

    // Also delete seller profile if it exists
    await supabase
      .from('sellers')
      .delete()
      .eq('user_id', user.id);

    return NextResponse.json({ 
      success: true,
      message: 'User profile deleted successfully. Role selection will be shown on next login.' 
    });

  } catch (error: any) {
    console.error('Delete profile error:', error);
    return NextResponse.json({ 
      error: 'Delete failed',
      details: error.message 
    }, { status: 500 });
  }
}