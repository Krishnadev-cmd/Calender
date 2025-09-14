import { NextRequest, NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabaseAdmin'
import { googleCalendarService } from '@/lib/googleCalendar'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Creating appointment with data:', body)
    
    const { 
      buyer_id, 
      seller_id, 
      title, 
      description, 
      start_time, 
      end_time,
      buyer_email,
      seller_email 
    } = body

    if (!buyer_id || !seller_id || !title || !start_time || !end_time) {
      return NextResponse.json(
        { error: 'Missing required fields: buyer_id, seller_id, title, start_time, end_time' },
        { status: 400 }
      )
    }

    // Get buyer and seller information for calendar events
    const [buyerResult, sellerResult] = await Promise.all([
      supabaseAdmin
        .from('user_profiles')
        .select('email, full_name')
        .eq('id', buyer_id)
        .single(),
      supabaseAdmin
        .from('sellers')
        .select(`
          id,
          user_id,
          business_name,
          user_profiles!inner (
            email,
            full_name
          )
        `)
        .eq('id', seller_id)
        .single()
    ]);

    console.log('User lookup results:', { buyerResult, sellerResult });

    const buyer = buyerResult.data;
    const seller = sellerResult.data;
    const sellerProfile = seller ? (Array.isArray(seller.user_profiles) 
      ? seller.user_profiles[0] 
      : seller.user_profiles) : null;

    // Create appointment in database
    const { data: appointment, error } = await supabaseAdmin
      .from('appointments')
      .insert({
        buyer_id,
        seller_id,
        title,
        description,
        start_time,
        end_time,
        status: 'pending',
        buyer_email: buyer_email || buyer?.email,
        seller_email: seller_email || sellerProfile?.email
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to create appointment' },
        { status: 500 }
      )
    }

    console.log('Appointment created successfully:', appointment);

    // Create Google Calendar events for both buyer and seller
    let googleCalendarResults = {
      buyerEventCreated: false,
      sellerEventCreated: false,
      buyerEventId: null as string | null,
      sellerEventId: null as string | null,
      errors: [] as string[]
    };

    // Get the base URL for API calls
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `http://localhost:3000`;

    if (buyerResult.data && sellerResult.data) {
      const buyer = buyerResult.data;
      const seller = sellerResult.data;
      const sellerProfile = Array.isArray(seller.user_profiles) 
        ? seller.user_profiles[0] 
        : seller.user_profiles;

      try {
        // Create calendar event for buyer
        const buyerCalendarResponse = await fetch(`${baseUrl}/api/calendar/create-event`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: buyer_id,
            userType: 'buyer',
            eventData: {
              summary: `${title} - Meeting with ${sellerProfile?.full_name || seller.business_name}`,
              start: start_time,
              end: end_time,
              attendees: [buyer.email, sellerProfile?.email],
              description: `${description || ''}\n\nAppointment with: ${sellerProfile?.full_name || seller.business_name}\nEmail: ${sellerProfile?.email}`
            }
          })
        });

        if (buyerCalendarResponse.ok) {
          const buyerEvent = await buyerCalendarResponse.json();
          googleCalendarResults.buyerEventCreated = true;
          googleCalendarResults.buyerEventId = buyerEvent.id;
          console.log('Buyer calendar event created:', buyerEvent.id);
        } else {
          const error = await buyerCalendarResponse.text();
          console.error('Buyer calendar error:', error);
          googleCalendarResults.errors.push(`Buyer calendar: ${error}`);
        }
      } catch (error) {
        console.error('Buyer calendar error:', error);
        googleCalendarResults.errors.push(`Buyer calendar error: ${error}`);
      }

      try {
        // Create calendar event for seller
        const sellerCalendarResponse = await fetch(`${baseUrl}/api/calendar/create-event`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: seller.user_id,
            userType: 'seller',
            eventData: {
              summary: `${title} - Meeting with ${buyer.full_name || 'Client'}`,
              start: start_time,
              end: end_time,
              attendees: [buyer.email, sellerProfile?.email],
              description: `${description || ''}\n\nAppointment with: ${buyer.full_name || 'Client'}\nEmail: ${buyer.email}`
            }
          })
        });

        if (sellerCalendarResponse.ok) {
          const sellerEvent = await sellerCalendarResponse.json();
          googleCalendarResults.sellerEventCreated = true;
          googleCalendarResults.sellerEventId = sellerEvent.id;
          console.log('Seller calendar event created:', sellerEvent.id);
        } else {
          const error = await sellerCalendarResponse.text();
          console.error('Seller calendar error:', error);
          googleCalendarResults.errors.push(`Seller calendar: ${error}`);
        }
      } catch (error) {
        console.error('Seller calendar error:', error);
        googleCalendarResults.errors.push(`Seller calendar error: ${error}`);
      }
    }

    return NextResponse.json({ 
      success: true, 
      appointment,
      googleCalendar: googleCalendarResults
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const user_id = searchParams.get('user_id')
    const role = searchParams.get('role')

    if (!user_id || !role) {
      return NextResponse.json(
        { error: 'Missing user_id or role parameter' },
        { status: 400 }
      )
    }

    let appointments;

    if (role === 'buyer') {
      const { data, error } = await supabaseAdmin
        .from('appointments')
        .select(`
          id,
          title,
          description,
          start_time,
          end_time,
          status,
          sellers!inner (
            business_name,
            location,
            user_profiles (
              full_name,
              email
            )
          )
        `)
        .eq('buyer_id', user_id)
        .order('start_time', { ascending: true })

      if (error) {
        console.error('Database error:', error)
        return NextResponse.json(
          { error: 'Failed to fetch appointments' },
          { status: 500 }
        )
      }

      appointments = data
    } else if (role === 'seller') {
      // First get seller ID from user_id
      const { data: seller } = await supabaseAdmin
        .from('sellers')
        .select('id')
        .eq('user_id', user_id)
        .single()

      if (!seller) {
        return NextResponse.json(
          { error: 'Seller not found' },
          { status: 404 }
        )
      }

      const { data, error } = await supabaseAdmin
        .from('appointments')
        .select(`
          id,
          title,
          description,
          start_time,
          end_time,
          status,
          buyer_email,
          user_profiles!buyer_id (
            full_name,
            email
          )
        `)
        .eq('seller_id', seller.id)
        .order('start_time', { ascending: true })

      if (error) {
        console.error('Database error:', error)
        return NextResponse.json(
          { error: 'Failed to fetch appointments' },
          { status: 500 }
        )
      }

      appointments = data
    }

    return NextResponse.json({ 
      success: true, 
      appointments: appointments || []
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}