import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { sellerId, date } = await request.json();

    if (!sellerId || !date) {
      return NextResponse.json({ error: 'Seller ID and date are required' }, { status: 400 });
    }

    // Get seller information
    const { data: seller, error: sellerError } = await supabase
      .from('sellers')
      .select(`
        id,
        availability_settings,
        user_id
      `)
      .eq('id', sellerId)
      .single();

    if (sellerError || !seller) {
      return NextResponse.json({ error: 'Seller not found' }, { status: 404 });
    }

    // Check if seller has Google Calendar connected
    const { data: tokens, error: tokensError } = await supabase
      .from('google_calendar_tokens')
      .select('access_token, refresh_token, expires_at')
      .eq('user_id', seller.user_id)
      .single();

    if (tokensError || !tokens) {
      return NextResponse.json({ error: 'Seller has not connected Google Calendar' }, { status: 400 });
    }

    // Default availability settings if none set
    const availabilitySettings = seller.availability_settings || {
      workingHours: {
        monday: { start: '09:00', end: '17:00', enabled: true },
        tuesday: { start: '09:00', end: '17:00', enabled: true },
        wednesday: { start: '09:00', end: '17:00', enabled: true },
        thursday: { start: '09:00', end: '17:00', enabled: true },
        friday: { start: '09:00', end: '17:00', enabled: true },
        saturday: { start: '10:00', end: '14:00', enabled: false },
        sunday: { start: '10:00', end: '14:00', enabled: false }
      },
      slotDuration: 60, // minutes
      bufferTime: 15 // minutes between appointments
    };

    const selectedDate = new Date(date);
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[selectedDate.getDay()];
    const workingHours = availabilitySettings.workingHours[dayName as keyof typeof availabilitySettings.workingHours];

    if (!workingHours?.enabled) {
      return NextResponse.json({ slots: [] }); // No availability on this day
    }

    // Generate time slots based on working hours
    const slots = [];
    const startTime = new Date(selectedDate);
    const [startHour, startMinute] = workingHours.start.split(':').map(Number);
    startTime.setHours(startHour, startMinute, 0, 0);

    const endTime = new Date(selectedDate);
    const [endHour, endMinute] = workingHours.end.split(':').map(Number);
    endTime.setHours(endHour, endMinute, 0, 0);

    const slotDuration = availabilitySettings.slotDuration || 60;
    const bufferTime = availabilitySettings.bufferTime || 15;

    const currentTime = new Date(startTime);
    while (currentTime < endTime) {
      const slotEnd = new Date(currentTime.getTime() + slotDuration * 60 * 1000);
      
      if (slotEnd <= endTime) {
        slots.push({
          start: currentTime.toISOString(),
          end: slotEnd.toISOString(),
          available: true // Will be checked against existing appointments
        });
      }
      
      currentTime.setTime(currentTime.getTime() + (slotDuration + bufferTime) * 60 * 1000);
    }

    // Get existing appointments for this seller on this date
    const dayStart = new Date(selectedDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(selectedDate);
    dayEnd.setHours(23, 59, 59, 999);

    const { data: existingAppointments } = await supabase
      .from('appointments')
      .select('start_time, end_time')
      .eq('seller_id', sellerId)
      .gte('start_time', dayStart.toISOString())
      .lte('start_time', dayEnd.toISOString())
      .in('status', ['pending', 'confirmed']);

    // Mark slots as unavailable if they conflict with existing appointments
    const availableSlots = slots.map(slot => {
      const slotStart = new Date(slot.start);
      const slotEnd = new Date(slot.end);
      
      const isConflict = existingAppointments?.some(appointment => {
        const appointmentStart = new Date(appointment.start_time);
        const appointmentEnd = new Date(appointment.end_time);
        
        return (
          (slotStart < appointmentEnd && slotEnd > appointmentStart) ||
          (appointmentStart < slotEnd && appointmentEnd > slotStart)
        );
      });
      
      return {
        ...slot,
        available: !isConflict && slotStart > new Date() // Also check if slot is in the future
      };
    });

    return NextResponse.json({ slots: availableSlots });

  } catch (error) {
    console.error('Error getting seller availability:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}