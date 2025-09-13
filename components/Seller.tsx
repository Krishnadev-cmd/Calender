import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { googleCalendarService, CalendarEvent, TimeSlot } from '@/lib/googleCalendar'

interface SellerProps {
  isGoogleConnected?: boolean
}

const Seller = ({ isGoogleConnected = false }: SellerProps) => {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [availabilitySlots, setAvailabilitySlots] = useState<TimeSlot[]>([])
  const [loading, setLoading] = useState(false)

  const handleGoogleSignIn = () => {
    const authUrl = googleCalendarService.getAuthUrl('seller')
    
    if (authUrl === '#google-oauth-not-configured') {
      alert('Google Calendar integration is not configured yet. Please set up Google Cloud Console credentials.')
      return
    }
    
    window.location.href = authUrl
  }

  const loadCalendarData = async () => {
    setLoading(true)
    try {
      const timeMin = new Date().toISOString()
      const timeMax = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // Next 7 days
      
      const [calendarEvents, freeBusySlots] = await Promise.all([
        googleCalendarService.getCalendarEvents(timeMin, timeMax),
        googleCalendarService.getFreeBusy(timeMin, timeMax)
      ])
      
      setEvents(calendarEvents)
      setAvailabilitySlots(freeBusySlots)
    } catch (error) {
      console.error('Failed to load calendar data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isGoogleConnected) {
      loadCalendarData()
    }
  }, [isGoogleConnected])

  if (!isGoogleConnected) {
    return (
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-green-100 rounded-xl">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Seller Calendar Management</h2>
            <p className="text-sm text-gray-500">Connect your Google Calendar to manage appointments</p>
          </div>
        </div>

        {/* Google Sign-in Section */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-8 border border-green-100 text-center">
          <div className="max-w-md mx-auto">
            <div className="p-4 bg-white rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <svg className="w-10 h-10 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Connect Google Calendar</h3>
            <p className="text-gray-600 mb-6">Sign in with your Google account to access calendar features and manage your availability for appointments.</p>
            <Button 
              onClick={handleGoogleSignIn}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium"
              size="lg"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign in with Google Calendar
            </Button>
            <p className="text-xs text-gray-500 mt-3">
              This will request access to your calendar events and availability
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-green-100 rounded-xl">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Calendar Management</h2>
            <p className="text-sm text-gray-500">Manage your availability and upcoming appointments</p>
          </div>
        </div>
        <Button onClick={loadCalendarData} disabled={loading} variant="outline">
          {loading ? 'Loading...' : 'Refresh Calendar'}
        </Button>
      </div>

      {/* Calendar View */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Events */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-3">Upcoming Events</h3>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {events.length > 0 ? events.slice(0, 5).map(event => (
                <div key={event.id} className="p-3 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-sm">{event.summary}</h4>
                  <p className="text-xs text-gray-600">
                    {new Date(event.start.dateTime).toLocaleDateString()} at{' '}
                    {new Date(event.start.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  {event.attendees && (
                    <p className="text-xs text-gray-500 mt-1">
                      {event.attendees.length} attendee{event.attendees.length !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              )) : (
                <div className="text-sm text-gray-500 text-center py-4">
                  No upcoming events
                </div>
              )}
            </div>
          </div>

          {/* Availability Overview */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-3">Today's Availability</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {availabilitySlots.length > 0 ? availabilitySlots.filter(slot => {
                const today = new Date().toDateString()
                return new Date(slot.start).toDateString() === today
              }).slice(0, 8).map((slot, index) => (
                <div key={index} className={`p-2 rounded text-sm ${
                  slot.available ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}>
                  {new Date(slot.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                  {new Date(slot.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  <span className="ml-2 text-xs">
                    {slot.available ? '✅ Available' : '❌ Busy'}
                  </span>
                </div>
              )) : (
                <div className="text-sm text-gray-500 text-center py-4">
                  Loading availability...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 bg-white rounded-lg p-4 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-3">Quick Actions</h3>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" className="bg-green-100 text-green-700 hover:bg-green-200">
              Set Available Hours
            </Button>
            <Button size="sm" variant="outline">
              Block Time Off
            </Button>
            <Button size="sm" variant="outline">
              View Full Calendar
            </Button>
            <Button size="sm" variant="outline">
              Export Schedule
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Seller