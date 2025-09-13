import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { access_token, refresh_token, expires_at } = await request.json();

    if (!access_token) {
      return NextResponse.json({ error: 'Access token is required' }, { status: 400 });
    }
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Store or update the tokens
    const { error } = await supabase
      .from('google_calendar_tokens')
      .upsert({
        user_id: user.id,
        access_token,
        refresh_token,
        expires_at: new Date(expires_at),
        updated_at: new Date()
      })
      .select();

    if (error) {
      console.error('Error storing tokens:', error);
      return NextResponse.json({ error: 'Failed to store tokens' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error storing Google Calendar tokens:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Get stored tokens for the current user
export async function GET() {
  try {
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the tokens
    const { data: tokens, error } = await supabase
      .from('google_calendar_tokens')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No tokens found
        return NextResponse.json({ connected: false });
      }
      console.error('Error fetching tokens:', error);
      return NextResponse.json({ error: 'Failed to fetch tokens' }, { status: 500 });
    }

    // Check if token is expired
    const isExpired = new Date(tokens.expires_at) <= new Date();
    
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