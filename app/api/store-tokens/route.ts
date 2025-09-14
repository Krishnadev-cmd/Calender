import { NextRequest, NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabaseAdmin';
import supabase from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { access_token, refresh_token, expires_at, user_id, user_type = 'buyer' } = await request.json();

    if (!access_token || !user_id) {
      return NextResponse.json({ error: 'Access token and user ID are required' }, { status: 400 });
    }

    console.log('Storing tokens for user:', user_id, 'type:', user_type);

    const { data, error } = await supabaseAdmin
      .from('google_calendar_tokens')
      .upsert({
        user_id,
        access_token,
        refresh_token,
        expires_at: new Date(expires_at),
        user_type,
        token_type: 'Bearer',
        scope: 'https://www.googleapis.com/auth/calendar',
        updated_at: new Date()
      }, {
        onConflict: 'user_id,user_type'
      })
      .select();

    if (error) {
      console.error('Error storing tokens:', error);
      return NextResponse.json({ error: 'Failed to store tokens', details: error }, { status: 500 });
    }

    console.log('Tokens stored successfully:', data);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error in store-tokens API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const userType = searchParams.get('userType') || 'buyer';
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    console.log('Checking tokens for user:', userId, 'type:', userType);

    const { data: tokens, error } = await supabaseAdmin
      .from('google_calendar_tokens')
      .select('*')
      .eq('user_id', userId)
      .eq('user_type', userType)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        console.log('No tokens found for user:', userId, 'type:', userType);
        return NextResponse.json({ connected: false });
      }
      console.error('Error fetching tokens:', error);
      return NextResponse.json({ error: 'Failed to fetch tokens' }, { status: 500 });
    }

    const isExpired = new Date(tokens.expires_at) <= new Date();
    console.log('Token check result:', { 
      userId, 
      userType, 
      hasTokens: !!tokens, 
      isExpired, 
      connected: !isExpired,
      expiresAt: tokens.expires_at 
    });
    
    return NextResponse.json({ 
      connected: !isExpired,
      tokens: tokens ? {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: tokens.expires_at
      } : null
    });

  } catch (error) {
    console.error('Error fetching Google Calendar tokens:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
