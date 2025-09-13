import { NextRequest, NextResponse } from 'next/server';
import { googleCalendarServerService } from '@/lib/googleCalendarServer';

export async function POST(request: NextRequest) {
  try {
    const eventData = await request.json();
    
    // Mock event creation for demo purposes
    const mockEvent = {
      id: `event_${Date.now()}`,
      summary: eventData.summary,
      start: {
        dateTime: eventData.start,
        timeZone: 'UTC'
      },
      end: {
        dateTime: eventData.end,
        timeZone: 'UTC'
      },
      attendees: eventData.attendees.map((email: string) => ({
        email,
        displayName: email.split('@')[0],
        responseStatus: 'needsAction'
      })),
      meetLink: `https://meet.google.com/mock-${Date.now().toString().slice(-6)}`
    };
    
    return NextResponse.json(mockEvent);
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
  }
}