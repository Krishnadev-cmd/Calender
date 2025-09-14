import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const role = searchParams.get('role'); // 'buyer' or 'seller'

    if (!userId || !role) {
      return NextResponse.json({ error: 'User ID and role are required' }, { status: 400 });
    }

    let query;

    if (role === 'buyer') {
      // Get appointments where user is the buyer
      query = supabase
        .from('appointments')
        .select(`
          id,
          title,
          description,
          start_time,
          end_time,
          status,
          google_calendar_event_id,
          meet_link,
          created_at,
          sellers (
            id,
            business_name,
            description,
            user_profiles (
              full_name,
              email
            )
          )
        `)
        .eq('buyer_id', userId)
        .order('start_time', { ascending: true });
    } else {
      // Get appointments where user is the seller (via sellers table)
      const { data: sellerData } = await supabase
        .from('sellers')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (!sellerData) {
        return NextResponse.json({ appointments: [] });
      }

      query = supabase
        .from('appointments')
        .select(`
          id,
          title,
          description,
          start_time,
          end_time,
          status,
          google_calendar_event_id,
          meet_link,
          created_at,
          user_profiles (
            full_name,
            email
          )
        `)
        .eq('seller_id', sellerData.id)
        .order('start_time', { ascending: true });
    }

    const { data: appointments, error } = await query;

    if (error) {
      console.error('Error fetching appointments:', error);
      return NextResponse.json({ error: 'Failed to fetch appointments' }, { status: 500 });
    }

    return NextResponse.json({ appointments: appointments || [] });

  } catch (error) {
    console.error('Error in appointments API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}