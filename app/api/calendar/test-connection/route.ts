import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Check if tokens exist in database
    const { data: tokens, error } = await supabase
      .from('google_calendar_tokens')
      .select('expires_at')
      .eq('user_id', userId)
      .single();

    if (error || !tokens) {
      return NextResponse.json({ connected: false }, { status: 200 });
    }

    // Check if token is expired
    const isExpired = new Date(tokens.expires_at) <= new Date();
    
    return NextResponse.json({ connected: !isExpired }, { status: 200 });
    
  } catch (error) {
    console.error('Error testing Google Calendar connection:', error);
    return NextResponse.json({ connected: false }, { status: 200 });
  }
}