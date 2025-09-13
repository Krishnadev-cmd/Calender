// Server-side only Google Calendar utilities
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

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

export class GoogleCalendarServerService {
  private oauth2Client: OAuth2Client;
  
  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI
    );
  }

  // Get authorization URL for Google Calendar access
  getAuthUrl(userType: 'buyer' | 'seller'): string {
    const scopes = [
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email'
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state: userType,
    });
  }

  // Exchange authorization code for tokens
  async getAccessToken(code: string): Promise<any> {
    const { tokens } = await this.oauth2Client.getToken(code);
    return tokens;
  }

  // Set credentials for authenticated requests
  setCredentials(tokens: any) {
    this.oauth2Client.setCredentials(tokens);
  }

  // Get user's calendar events
  async getCalendarEvents(timeMin: string, timeMax: string): Promise<CalendarEvent[]> {
    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
    
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: timeMin,
      timeMax: timeMax,
      singleEvents: true,
      orderBy: 'startTime',
    });

    return response.data.items?.map(event => ({
      id: event.id!,
      summary: event.summary || 'No title',
      start: {
        dateTime: event.start?.dateTime!,
        timeZone: event.start?.timeZone || undefined
      },
      end: {
        dateTime: event.end?.dateTime!,
        timeZone: event.end?.timeZone || undefined
      },
      attendees: event.attendees?.map(attendee => ({
        email: attendee.email!,
        displayName: attendee.displayName || undefined,
        responseStatus: attendee.responseStatus || undefined
      })),
      meetLink: event.hangoutLink || undefined
    })) || [];
  }

  // Get free/busy information for a user
  async getFreeBusy(timeMin: string, timeMax: string, calendarId: string = 'primary'): Promise<TimeSlot[]> {
    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
    
    const response = await calendar.freebusy.query({
      requestBody: {
        timeMin: timeMin,
        timeMax: timeMax,
        items: [{ id: calendarId }]
      }
    });

    const busyTimes = response.data.calendars?.[calendarId]?.busy || [];
    
    // Generate available slots (simplified - every 30 min slot)
    const slots: TimeSlot[] = [];
    const start = new Date(timeMin);
    const end = new Date(timeMax);
    
    for (let time = start; time < end; time.setMinutes(time.getMinutes() + 30)) {
      const slotStart = new Date(time);
      const slotEnd = new Date(time.getTime() + 30 * 60 * 1000);
      
      const isBusy = busyTimes.some(busy => {
        const busyStart = new Date(busy.start!);
        const busyEnd = new Date(busy.end!);
        return slotStart < busyEnd && slotEnd > busyStart;
      });

      slots.push({
        start: slotStart.toISOString(),
        end: slotEnd.toISOString(),
        available: !isBusy
      });
    }

    return slots;
  }

  // Create a new calendar event
  async createEvent(eventData: {
    summary: string;
    start: string;
    end: string;
    attendees: string[];
    description?: string;
  }): Promise<CalendarEvent> {
    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
    
    const event = {
      summary: eventData.summary,
      start: {
        dateTime: eventData.start,
        timeZone: 'UTC',
      },
      end: {
        dateTime: eventData.end,
        timeZone: 'UTC',
      },
      attendees: eventData.attendees.map(email => ({ email })),
      description: eventData.description,
      conferenceData: {
        createRequest: {
          requestId: `meet-${Date.now()}`,
          conferenceSolutionKey: {
            type: 'hangoutsMeet'
          }
        }
      }
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
      conferenceDataVersion: 1
    });

    return {
      id: response.data.id!,
      summary: response.data.summary!,
      start: {
        dateTime: response.data.start?.dateTime!,
        timeZone: response.data.start?.timeZone || undefined
      },
      end: {
        dateTime: response.data.end?.dateTime!,
        timeZone: response.data.end?.timeZone || undefined
      },
      attendees: response.data.attendees?.map(attendee => ({
        email: attendee.email!,
        displayName: attendee.displayName || undefined,
        responseStatus: attendee.responseStatus || undefined
      })),
      meetLink: response.data.hangoutLink || undefined
    };
  }

  // Get user profile information
  async getUserInfo(): Promise<any> {
    const oauth2 = google.oauth2({ version: 'v2', auth: this.oauth2Client });
    const response = await oauth2.userinfo.get();
    return response.data;
  }
}

export const googleCalendarServerService = new GoogleCalendarServerService();