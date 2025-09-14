import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('Authorization');
    if (authHeader) {
      // Set the session for this request
      const token = authHeader.replace('Bearer ', '');
      await supabase.auth.setSession({
        access_token: token,
        refresh_token: '', // We don't need refresh token for this operation
      });
    }

    // First, let's just get sellers without any joins to debug
    console.log('Fetching sellers...');
    const { data: sellersOnly, error: sellersError } = await supabase
      .from('sellers')
      .select('*')
      .eq('is_active', true);

    console.log('Sellers only result:', { sellersOnly, sellersError });

    // Now try with user_profiles join
    const { data: sellers, error } = await supabase
      .from('sellers')
      .select(`
        id,
        business_name,
        description,
        location,
        user_id,
        user_profiles!sellers_user_id_fkey (
          email,
          full_name
        )
      `)
      .eq('is_active', true);

    console.log('Sellers query result:', { sellers, error });

    if (error) {
      console.error('Error fetching sellers:', error);
      return NextResponse.json({ error: 'Failed to fetch sellers' }, { status: 500 });
    }

    // Get Google Calendar tokens for all sellers
    const sellerUserIds = sellers?.map(seller => seller.user_id) || [];
    let tokens: any[] = [];
    
    if (sellerUserIds.length > 0) {
      const { data: tokenData, error: tokenError } = await supabase
        .from('google_calendar_tokens')
        .select('user_id, access_token, expires_at')
        .in('user_id', sellerUserIds);

      if (!tokenError) {
        tokens = tokenData || [];
      }
    }

    // Transform the data to include availability status
    const availableSellers = sellers?.map(seller => {
      const userProfile = Array.isArray(seller.user_profiles) 
        ? seller.user_profiles[0] 
        : seller.user_profiles;
      
      // Find the token for this seller
      const userToken = tokens.find(token => token.user_id === seller.user_id);

      return {
        id: seller.id,
        businessName: seller.business_name || 'Unknown Business',
        description: seller.description || 'No description available',
        location: seller.location || 'Location not specified',
        userProfile: {
          email: userProfile?.email || '',
          fullName: userProfile?.full_name || 'Unknown',
        },
        hasGoogleCalendar: !!userToken,
        isOnline: userToken && new Date(userToken.expires_at) > new Date(),
      };
    }) || [];

    return NextResponse.json({ sellers: availableSellers });
  } catch (error) {
    console.error('Error in sellers API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}