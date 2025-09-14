import { NextRequest, NextResponse } from 'next/server';
import { googleCalendarServerService } from '@/lib/googleCalendarServer';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const state = searchParams.get('state') || 'buyer'; // Default to buyer if no state provided

    // Generate authorization URL
    const authUrl = googleCalendarServerService.getAuthUrl(state as 'buyer' | 'seller');
    
    console.log('Generated Google OAuth URL with state:', state);
    
    // Redirect user to Google OAuth
    return NextResponse.redirect(authUrl);
    
  } catch (error) {
    console.error('Error generating Google OAuth URL:', error);
    return NextResponse.json({ error: 'Failed to initiate Google OAuth' }, { status: 500 });
  }
}