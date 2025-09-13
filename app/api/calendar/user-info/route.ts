import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Mock user info for demo purposes
    const mockUserInfo = {
      id: 'user123',
      email: 'user@example.com',
      name: 'Demo User',
      picture: 'https://via.placeholder.com/150'
    };
    
    return NextResponse.json(mockUserInfo);
  } catch (error) {
    console.error('Error fetching user info:', error);
    return NextResponse.json({ error: 'Failed to fetch user info' }, { status: 500 });
  }
}