import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    console.log('Testing database connection...');

    // Check user_profiles
    const { data: profiles, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(5);

    console.log('User profiles:', { profiles, profileError });

    // Check sellers
    const { data: sellers, error: sellersError } = await supabase
      .from('sellers')
      .select('*')
      .limit(5);

    console.log('Sellers:', { sellers, sellersError });

    // Check if there are any sellers at all
    const { count: sellerCount } = await supabase
      .from('sellers')
      .select('*', { count: 'exact', head: true });

    console.log('Total sellers count:', sellerCount);

    // Check if there are any user profiles with seller role
    const { count: sellerProfilesCount } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'seller');

    console.log('Total seller profiles count:', sellerProfilesCount);

    return NextResponse.json({
      success: true,
      data: {
        profiles: profiles || [],
        sellers: sellers || [],
        counts: {
          sellers: sellerCount,
          sellerProfiles: sellerProfilesCount
        },
        errors: {
          profileError,
          sellersError
        }
      }
    });
  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json(
      { error: 'Database test failed', details: error },
      { status: 500 }
    );
  }
}