import { NextRequest, NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabaseAdmin';

export async function GET(request: NextRequest) {
  try {
    // First, let's just get sellers without any joins to debug
    console.log('Fetching sellers...');
    const { data: sellersOnly, error: sellersError } = await supabaseAdmin
      .from('sellers')
      .select('*')
      .eq('is_active', true);

    console.log('Sellers only result:', { sellersOnly, sellersError });

    // Now try with user_profiles join
    const { data: sellers, error } = await supabaseAdmin
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
      const { data: tokenData, error: tokenError } = await supabaseAdmin
        .from('google_calendar_tokens')
        .select('user_id, access_token, expires_at')
        .in('user_id', sellerUserIds)
        .eq('user_type', 'seller');

      console.log('Token check result:', { tokenData, tokenError });

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
        business_name: seller.business_name || 'Unknown Business',
        description: seller.description || 'No description available',
        location: seller.location || 'Location not specified',
        user_id: seller.user_id,
        user_profiles: userProfile ? {
          email: userProfile.email || '',
          full_name: userProfile.full_name || 'Unknown',
        } : null,
        hasGoogleCalendar: !!userToken && new Date(userToken.expires_at) > new Date(),
        isOnline: !!userToken && new Date(userToken.expires_at) > new Date(),
      };
    }) || [];

    return NextResponse.json({ sellers: availableSellers });
  } catch (error) {
    console.error('Error in sellers API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}