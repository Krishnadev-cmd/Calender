import { NextRequest, NextResponse } from 'next/server';
import { googleCalendarServerService } from '@/lib/googleCalendarServer';

export async function POST(request: NextRequest) {
  try {
    const { timeMin, timeMax, calendarId } = await request.json();
    
    // Generate mock available time slots for demo purposes
    const slots = [];
    const start = new Date(timeMin);
    const end = new Date(timeMax);
    
    // Generate slots for the next 7 days, 9 AM - 5 PM
    for (let day = 0; day < 7; day++) {
      const currentDate = new Date(start);
      currentDate.setDate(start.getDate() + day);
      
      for (let hour = 9; hour < 17; hour++) {
        const slotStart = new Date(currentDate);
        slotStart.setHours(hour, 0, 0, 0);
        
        const slotEnd = new Date(slotStart);
        slotEnd.setMinutes(30);
        
        // Randomly make some slots unavailable for demo
        const available = Math.random() > 0.3;
        
        if (slotStart < end) {
          slots.push({
            start: slotStart.toISOString(),
            end: slotEnd.toISOString(),
            available
          });
        }
      }
    }
    
    return NextResponse.json(slots);
  } catch (error) {
    console.error('Error fetching availability:', error);
    return NextResponse.json({ error: 'Failed to fetch availability' }, { status: 500 });
  }
}