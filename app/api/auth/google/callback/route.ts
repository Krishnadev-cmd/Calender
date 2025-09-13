import { NextRequest, NextResponse } from 'next/server';
import { googleCalendarServerService } from '@/lib/googleCalendarServer';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // 'buyer' or 'seller'
    const error = searchParams.get('error');

    if (error) {
      console.error('OAuth error:', error);
      return NextResponse.redirect(new URL('/dashboard?error=oauth_failed', request.url));
    }

    if (!code) {
      return NextResponse.redirect(new URL('/dashboard?error=no_code', request.url));
    }

    // Exchange code for tokens
    const tokens = await googleCalendarServerService.getAccessToken(code);
    console.log('Received tokens:', tokens);

    // Store tokens in database
    try {
      const baseUrl = `${request.nextUrl.protocol}//${request.nextUrl.host}`;
      const response = await fetch(`${baseUrl}/api/store-tokens`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_at: new Date(Date.now() + (tokens.expires_in || 3600) * 1000).toISOString()
        })
      });

      if (!response.ok) {
        console.error('Failed to store tokens in database:', await response.text());
        // Fall back to URL parameters method
        const tokenData = {
          access_token: tokens.access_token,
          token_type: tokens.token_type || 'Bearer',
          expires_at: new Date(Date.now() + (tokens.expires_in || 3600) * 1000).toISOString(),
          user_type: state,
        };

        const redirectUrl = new URL('/dashboard', request.url);
        redirectUrl.searchParams.set('google_connected', 'true');
        redirectUrl.searchParams.set('user_type', state || '');
        redirectUrl.searchParams.set('tokens', encodeURIComponent(JSON.stringify(tokenData)));

        return NextResponse.redirect(redirectUrl);
      } else {
        console.log('Tokens stored successfully in database');
      }
    } catch (error) {
      console.error('Error storing tokens:', error);
    }

    // Redirect back to dashboard with success flag
    const redirectUrl = new URL('/dashboard', request.url);
    redirectUrl.searchParams.set('google_connected', 'true');
    redirectUrl.searchParams.set('user_type', state || '');

    return NextResponse.redirect(redirectUrl);

  } catch (error) {
    console.error('Error in Google OAuth callback:', error);
    return NextResponse.redirect(new URL('/dashboard?error=token_exchange_failed', request.url));
  }
}