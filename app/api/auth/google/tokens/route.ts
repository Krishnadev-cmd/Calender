import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { user_id, tokens, user_type } = await request.json();
    
    // Store tokens in Supabase
    const { error } = await supabase
      .from('google_calendar_tokens')
      .upsert({
        user_id,
        access_token: tokens.access_token,
        token_type: tokens.token_type,
        expires_at: tokens.expires_at,
        user_type: user_type
      }, {
        onConflict: 'user_id,user_type'
      });

    if (error) {
      console.error('Error storing tokens:', error);
      return NextResponse.json({ error: 'Failed to store tokens' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in store-tokens:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');
    const user_type = searchParams.get('user_type');
    
    if (!user_id || !user_type) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // Get tokens from Supabase
    const { data, error } = await supabase
      .from('google_calendar_tokens')
      .select('*')
      .eq('user_id', user_id)
      .eq('user_type', user_type)
      .single();

    if (error) {
      return NextResponse.json({ error: 'Tokens not found' }, { status: 404 });
    }

    return NextResponse.json({ tokens: data });
  } catch (error) {
    console.error('Error getting tokens:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}