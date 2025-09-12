// import supabase from "@/lib/supabase";
// import { NextResponse ,NextRequest } from "next/server";

// export async function GET(request: NextRequest) {
//     const Requesturl = new URL (request.url);
//     const code = Requesturl.searchParams.get("code");

//     if (!code) {
//         return new Response("Code not found", { status: 400 });
//     }
//     const sessionResponse = await supabase.auth.exchangeCodeForSession(code);
//     if (sessionResponse.error || !sessionResponse.data.session) {
//         return new Response("Failed to exchange code for session", { status: 500 });
//     }

//     return NextResponse.redirect('/');
// }
import supabase from "@/lib/supabase";
import { NextResponse, NextRequest } from "next/server";

export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get("code");
    const error = requestUrl.searchParams.get("error");

    console.log('Callback URL:', request.url);
    console.log('Code parameter:', code);
    console.log('Error parameter:', error);

    if (error) {
        console.error('OAuth Error:', error);
        return NextResponse.redirect(new URL(`/login?error=${error}`, request.url));
    }

    if (!code) {
        // If no code, redirect to client-side handler for implicit flow
        console.log('No code found - redirecting to client-side handler');
        return NextResponse.redirect(new URL('/auth/callback', request.url));
    }

    try {
        const sessionResponse = await supabase.auth.exchangeCodeForSession(code);
        
        if (sessionResponse.error || !sessionResponse.data.session) {
            console.error('Session exchange error:', sessionResponse.error);
            return NextResponse.redirect(new URL('/login?error=session_failed', request.url));
        }

        console.log('Session created successfully');
        return NextResponse.redirect(new URL('/dashboard', request.url));
    } catch (error) {
        console.error('Callback error:', error);
        return NextResponse.redirect(new URL('/login?error=callback_failed', request.url));
    }
}