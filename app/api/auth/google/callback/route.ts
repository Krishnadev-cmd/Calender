import { NextRequest, NextResponse } from 'next/server';
import { googleCalendarServerService } from '@/lib/googleCalendarServer';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // 'buyer' or 'seller'
    const error = searchParams.get('error');

    console.log('OAuth callback received:', { code: !!code, state, error });

    if (error) {
      console.error('OAuth error:', error);
      return NextResponse.redirect(new URL('/dashboard?error=oauth_failed', request.url));
    }

    if (!code) {
      console.error('No authorization code received');
      return NextResponse.redirect(new URL('/dashboard?error=no_code', request.url));
    }

    try {
      // Exchange code for tokens
      console.log('Exchanging code for tokens...');
      const tokens = await googleCalendarServerService.getAccessToken(code);
      console.log('Received tokens:', { 
        hasAccessToken: !!tokens.access_token, 
        hasRefreshToken: !!tokens.refresh_token,
        expiresIn: tokens.expires_in 
      });

      // Instead of trying to get session from cookies, redirect to client-side handler
      // with the tokens as URL parameters (securely)
      const redirectUrl = new URL('/auth/callback', request.url);
      
      // Add tokens as URL fragment (more secure than query params)
      const tokenFragment = new URLSearchParams({
        'provider_token': tokens.access_token,
        'refresh_token': tokens.refresh_token || '',
        'expires_in': (tokens.expires_in || 3600).toString(),
        'user_type': state || 'buyer'
      });
      
      redirectUrl.hash = tokenFragment.toString();
      
      console.log('Redirecting to client-side handler with tokens');
      return NextResponse.redirect(redirectUrl);

    } catch (tokenError) {
      console.error('Error exchanging code for tokens:', tokenError);
      return NextResponse.redirect(new URL('/dashboard?error=token_exchange_failed', request.url));
    }

  } catch (error) {
    console.error('Error in Google OAuth callback:', error);
    return NextResponse.redirect(new URL('/dashboard?error=callback_failed', request.url));
  }
}