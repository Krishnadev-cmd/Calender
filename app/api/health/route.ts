import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const tests = [];
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Test API endpoints
    const endpoints = [
      { name: 'Store Tokens GET', url: `${baseUrl}/api/store-tokens?userId=test` },
      // Add more endpoints to test as needed
    ];

    const results = await Promise.allSettled(
      endpoints.map(async (endpoint) => {
        const response = await fetch(endpoint.url);
        return {
          name: endpoint.name,
          url: endpoint.url,
          status: response.status,
          ok: response.ok,
        };
      })
    );

    return NextResponse.json({
      message: 'API Health Check',
      results: results.map((result, index) => ({
        ...endpoints[index],
        ...(result.status === 'fulfilled' ? result.value : { error: result.reason }),
      })),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        GOOGLE_CLIENT_ID: !!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Health check failed', details: error }, { status: 500 });
  }
}