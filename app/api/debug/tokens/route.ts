import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (userId) {
      // Get tokens for specific user
      const { data, error } = await supabase
        .from('google_calendar_tokens')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        return NextResponse.json({ 
          found: false,
          error: error.message,
          userId: userId
        });
      }

      return NextResponse.json({ 
        found: true,
        userId: userId,
        hasToken: !!data.access_token,
        hasRefresh: !!data.refresh_token,
        expiresAt: data.expires_at,
        createdAt: data.created_at,
        // Don't return actual tokens for security
        tokenPreview: data.access_token ? `${data.access_token.substring(0, 10)}...` : null
      });
    } else {
      // Get all tokens (for debugging)
      const { data, error } = await supabase
        .from('google_calendar_tokens')
        .select('user_id, expires_at, created_at')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        return NextResponse.json({ 
          error: error.message 
        });
      }

      return NextResponse.json({ 
        totalTokens: data?.length || 0,
        tokens: data || []
      });
    }

  } catch (error) {
    console.error('Debug tokens error:', error);
    return NextResponse.json({ 
      error: 'Debug failed',
      details: error 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, testToken } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    // Insert a test token
    const { error } = await supabase
      .from('google_calendar_tokens')
      .upsert({
        user_id: userId,
        access_token: testToken || 'test_access_token_12345',
        refresh_token: 'test_refresh_token_67890',
        expires_at: new Date(Date.now() + 3600000).toISOString()
      });

    if (error) {
      return NextResponse.json({ 
        success: false,
        error: error.message 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Test token stored successfully',
      userId: userId
    });

  } catch (error) {
    console.error('Test token storage error:', error);
    return NextResponse.json({ 
      error: 'Test failed',
      details: error 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('google_calendar_tokens')
      .delete()
      .eq('user_id', userId);

    if (error) {
      return NextResponse.json({ 
        success: false,
        error: error.message 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Tokens deleted successfully',
      userId: userId
    });

  } catch (error) {
    console.error('Delete tokens error:', error);
    return NextResponse.json({ 
      error: 'Delete failed',
      details: error 
    }, { status: 500 });
  }
}