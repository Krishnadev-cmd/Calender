import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { buyerId, sellerId, startTime, endTime, title, description } = await request.json();

    if (!buyerId || !sellerId || !startTime || !endTime || !title) {
      return NextResponse.json({ 
        error: 'Buyer ID, Seller ID, start time, end time, and title are required' 
      }, { status: 400 });
    }

    // Get buyer and seller information
    const [buyerResult, sellerResult] = await Promise.all([
      supabase
        .from('user_profiles')
        .select('email, full_name')
        .eq('id', buyerId)
        .single(),
      supabase
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
        .eq('id', sellerId)
        .single()
    ]);

    if (buyerResult.error || !buyerResult.data) {
      return NextResponse.json({ error: 'Buyer not found' }, { status: 404 });
    }

    if (sellerResult.error || !sellerResult.data) {
      return NextResponse.json({ error: 'Seller not found' }, { status: 404 });
    }

    const buyer = buyerResult.data;
    const seller = sellerResult.data;
    const sellerProfile = Array.isArray(seller.user_profiles) 
      ? seller.user_profiles[0] 
      : seller.user_profiles;

    // Check if the time slot is still available
    const { data: conflictingAppointments } = await supabase
      .from('appointments')
      .select('id')
      .eq('seller_id', sellerId)
      .gte('start_time', startTime)
      .lte('start_time', endTime)
      .in('status', ['pending', 'confirmed']);

    if (conflictingAppointments && conflictingAppointments.length > 0) {
      return NextResponse.json({ error: 'Time slot is no longer available' }, { status: 409 });
    }

    // Create the appointment in database
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .insert({
        buyer_id: buyerId,
        seller_id: sellerId,
        title,
        description,
        start_time: startTime,
        end_time: endTime,
        status: 'pending',
        buyer_email: buyer.email,
        seller_email: sellerProfile.email
      })
      .select()
      .single();

    if (appointmentError) {
      console.error('Error creating appointment:', appointmentError);
      return NextResponse.json({ error: 'Failed to create appointment' }, { status: 500 });
    }

    // Try to create Google Calendar events for both buyer and seller
    let googleCalendarResults = {
      buyerEventCreated: false,
      sellerEventCreated: false,
      buyerEventId: null as string | null,
      sellerEventId: null as string | null,
      errors: [] as string[]
    };

    // Get the base URL for API calls
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `http://localhost:3000`;

    try {
      // Create calendar event for buyer
      const buyerCalendarResponse = await fetch(`${baseUrl}/api/calendar/create-event`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: buyerId,
          userType: 'buyer',
          eventData: {
            summary: `${title} - Meeting with ${sellerProfile.full_name || 'Seller'}`,
            start: startTime,
            end: endTime,
            attendees: [buyer.email, sellerProfile.email],
            description: `${description}\n\nAppointment with: ${sellerProfile.full_name}\nEmail: ${sellerProfile.email}`
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
            start: startTime,
            end: endTime,
            attendees: [buyer.email, sellerProfile.email],
            description: `${description}\n\nAppointment with: ${buyer.full_name}\nEmail: ${buyer.email}`
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

    // Update appointment with Google Calendar event ID if at least one was created
    if (googleCalendarResults.buyerEventId || googleCalendarResults.sellerEventId) {
      const updateData: any = {};
      if (googleCalendarResults.buyerEventId) {
        updateData.google_calendar_event_id = googleCalendarResults.buyerEventId;
      }
      
      await supabase
        .from('appointments')
        .update(updateData)
        .eq('id', appointment.id);
    }

    return NextResponse.json({
      appointment,
      googleCalendar: googleCalendarResults
    });

  } catch (error) {
    console.error('Error creating appointment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}