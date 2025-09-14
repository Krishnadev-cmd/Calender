import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/supabase';

export async function PATCH(request: NextRequest) {
  try {
    const { appointmentId, status, userId } = await request.json();

    if (!appointmentId || !status || !userId) {
      return NextResponse.json({ 
        error: 'Appointment ID, status, and user ID are required' 
      }, { status: 400 });
    }

    // Validate status
    const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // First, verify that the user has permission to update this appointment
    // Either they're the buyer or they're the seller
    const { data: appointment, error: fetchError } = await supabase
      .from('appointments')
      .select(`
        id,
        buyer_id,
        seller_id,
        status,
        sellers!inner (
          user_id
        )
      `)
      .eq('id', appointmentId)
      .single();

    if (fetchError || !appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    // Check if user has permission (is buyer or is the seller)
    const isBuyer = appointment.buyer_id === userId;
    const sellerData = Array.isArray(appointment.sellers) ? appointment.sellers[0] : appointment.sellers;
    const isSeller = sellerData?.user_id === userId;

    if (!isBuyer && !isSeller) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Update the appointment status
    const { data: updatedAppointment, error: updateError } = await supabase
      .from('appointments')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', appointmentId)
      .select(`
        id,
        title,
        start_time,
        end_time,
        status,
        buyer_id,
        seller_id,
        user_profiles (
          email,
          full_name
        ),
        sellers (
          business_name,
          user_profiles (
            email,
            full_name
          )
        )
      `)
      .single();

    if (updateError) {
      console.error('Error updating appointment:', updateError);
      return NextResponse.json({ error: 'Failed to update appointment' }, { status: 500 });
    }

    // TODO: Send notification emails to both parties about the status change
    // TODO: Update Google Calendar events if needed

    return NextResponse.json({ 
      success: true, 
      appointment: updatedAppointment 
    });

  } catch (error) {
    console.error('Error in appointment update API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}