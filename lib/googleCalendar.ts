// Client-side Google Calendar API wrapper
export interface CalendarEvent {
  id: string;
  summary: string;
  start: {
    dateTime: string;
    timeZone?: string;
  };
  end: {
    dateTime: string;
    timeZone?: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus?: string;
  }>;
  meetLink?: string;
}

export interface TimeSlot {
  start: string;
  end: string;
  available: boolean;
}

class GoogleCalendarService {
  // Get authorization URL for Google Calendar access
  getAuthUrl(userType: 'buyer' | 'seller'): string {
    // Check if Google OAuth is properly configured
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const redirectUri = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI;
    
    if (!clientId || !redirectUri) {
      console.error('Google OAuth not configured. Please set up Google Cloud Console credentials.');
      // Return a dummy URL for development
      return '#google-oauth-not-configured';
    }

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: [
        'https://www.googleapis.com/auth/calendar.events',
        'https://www.googleapis.com/auth/calendar.readonly',
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email'
      ].join(' '),
      response_type: 'code',
      access_type: 'offline',
      state: userType
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  // Get user's calendar events
  async getCalendarEvents(timeMin: string, timeMax: string): Promise<CalendarEvent[]> {
    const response = await fetch('/api/calendar/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ timeMin, timeMax })
    });

    if (!response.ok) {
      throw new Error('Failed to fetch calendar events');
    }

    return response.json();
  }

  // Get free/busy information for a user
  async getFreeBusy(timeMin: string, timeMax: string, calendarId: string = 'primary'): Promise<TimeSlot[]> {
    const response = await fetch('/api/calendar/freebusy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ timeMin, timeMax, calendarId })
    });

    if (!response.ok) {
      throw new Error('Failed to fetch availability');
    }

    return response.json();
  }

  // Create a new calendar event
  async createEvent(eventData: {
    summary: string;
    start: string;
    end: string;
    attendees: string[];
    description?: string;
  }): Promise<CalendarEvent> {
    const response = await fetch('/api/calendar/create-event', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventData)
    });

    if (!response.ok) {
      throw new Error('Failed to create event');
    }

    return response.json();
  }

  // Get user profile information
  async getUserInfo(): Promise<any> {
    const response = await fetch('/api/calendar/user-info');

    if (!response.ok) {
      throw new Error('Failed to get user info');
    }

    return response.json();
  }
}

export const googleCalendarService = new GoogleCalendarService();