import { NextRequest, NextResponse } from 'next/server';
import { googleCalendarServerService } from '@/lib/googleCalendarServer';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: NextRequest) {
  try {
    const { userId, eventData } = await request.json();
    
    if (!userId || !eventData) {
      return NextResponse.json({ error: 'User ID and event data are required' }, { status: 400 });
    }

    // Get user's Google Calendar tokens
    const { data: tokens, error: tokenError } = await supabase
      .from('google_calendar_tokens')
      .select('access_token, refresh_token, expires_at')
      .eq('user_id', userId)
      .single();

    if (tokenError || !tokens) {
      return NextResponse.json({ error: 'Google Calendar not connected for this user' }, { status: 400 });
    }

    // Check if tokens are expired and need refresh
    const now = new Date();
    const expiresAt = new Date(tokens.expires_at);
    
    if (expiresAt <= now && tokens.refresh_token) {
      try {
        // Refresh the token
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: tokens.refresh_token,
            client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
            client_secret: process.env.GOOGLE_CLIENT_SECRET!,
          }),
        });

        if (tokenResponse.ok) {
          const newTokens = await tokenResponse.json();
          
          // Update tokens in database
          await supabase
            .from('google_calendar_tokens')
            .update({
              access_token: newTokens.access_token,
              expires_at: new Date(Date.now() + newTokens.expires_in * 1000).toISOString(),
            })
            .eq('user_id', userId);

          tokens.access_token = newTokens.access_token;
        }
      } catch (error) {
        console.error('Error refreshing token:', error);
      }
    }

    // Set credentials and create event
    googleCalendarServerService.setCredentials({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
    });

    const createdEvent = await googleCalendarServerService.createEvent({
      summary: eventData.summary,
      start: eventData.start,
      end: eventData.end,
      attendees: eventData.attendees || [],
      description: eventData.description,
    });

    return NextResponse.json(createdEvent);
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
  }
}