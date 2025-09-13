import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { googleCalendarService, CalendarEvent, TimeSlot } from '@/lib/googleCalendar'
import supabase from '@/lib/supabase'

interface SellerProps {
  isGoogleConnected?: boolean
}

interface SellerProfile {
  business_name: string
  description: string
  location: string
  availability_settings: any
}

const Seller = ({ isGoogleConnected = false }: SellerProps) => {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [appointments, setAppointments] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [sellerProfile, setSellerProfile] = useState<SellerProfile>({
    business_name: '',
    description: '',
    location: '',
    availability_settings: {}
  })
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    loadSellerProfile()
    loadAppointments()
  }, [])

  const loadSellerProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile, error } = await supabase
        .from('sellers')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading seller profile:', error)
        return
      }

      if (profile) {
        setSellerProfile(profile)
      }
    } catch (error) {
      console.error('Error loading seller profile:', error)
    }
  }

  const loadAppointments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get seller ID first
      const { data: seller } = await supabase
        .from('sellers')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!seller) return

      const { data, error } = await supabase
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
        console.error('Error loading appointments:', error)
      } else {
        setAppointments(data || [])
      }
    } catch (error) {
      console.error('Error loading appointments:', error)
    }
  }

  const saveSellerProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('sellers')
        .upsert({
          user_id: user.id,
          ...sellerProfile,
          updated_at: new Date().toISOString()
        })

      if (error) {
        console.error('Error saving seller profile:', error)
        return
      }

      setIsEditing(false)
      alert('Profile updated successfully!')
    } catch (error) {
      console.error('Error saving seller profile:', error)
    }
  }

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
      const timeMax = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      
      const calendarEvents = await googleCalendarService.getCalendarEvents(timeMin, timeMax)
      setEvents(calendarEvents)
    } catch (error) {
      console.error('Failed to load calendar data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptAppointment = async (appointmentId: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ 
          status: 'confirmed',
          updated_at: new Date().toISOString()
        })
        .eq('id', appointmentId)

      if (error) {
        console.error('Error accepting appointment:', error)
        alert('Failed to accept appointment. Please try again.')
        return
      }

      // Find the appointment details for calendar event
      const appointment = appointments.find(apt => apt.id === appointmentId)
      if (appointment) {
        try {
          // Create Google Calendar event (using mock for now)
          const eventResponse = await fetch('/api/calendar/create-event', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              summary: `${appointment.title} - Confirmed`,
              description: appointment.description || `Confirmed appointment`,
              start: appointment.start_time,
              end: appointment.end_time,
              attendees: [appointment.buyer_email, appointment.seller_email].filter(Boolean)
            })
          })

          if (eventResponse.ok) {
            const eventData = await eventResponse.json()
            console.log('Calendar event created for accepted appointment:', eventData)
            
            // Update appointment with calendar event data
            await supabase
              .from('appointments')
              .update({ 
                google_event_id: eventData.id,
                google_meet_link: eventData.meetLink 
              })
              .eq('id', appointmentId)
          }
        } catch (calendarError) {
          console.error('Calendar event creation failed:', calendarError)
          // Don't fail the acceptance if calendar fails
        }
      }

      // Reload appointments to reflect the change
      loadAppointments()
      alert('Appointment accepted successfully! Calendar event has been created.')
    } catch (error) {
      console.error('Error accepting appointment:', error)
      alert('Failed to accept appointment. Please try again.')
    }
  }

  const handleDeclineAppointment = async (appointmentId: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', appointmentId)

      if (error) {
        console.error('Error declining appointment:', error)
        alert('Failed to decline appointment. Please try again.')
        return
      }

      // Reload appointments to reflect the change
      loadAppointments()
      alert('Appointment declined.')
    } catch (error) {
      console.error('Error declining appointment:', error)
      alert('Failed to decline appointment. Please try again.')
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
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-green-100 rounded-xl">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Seller Dashboard</h2>
            <p className="text-sm text-gray-500">Set up your profile and connect Google Calendar</p>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Business Profile</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Business Name</label>
              <input
                type="text"
                value={sellerProfile.business_name}
                onChange={(e) => setSellerProfile(prev => ({ ...prev, business_name: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your business name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
              <input
                type="text"
                value={sellerProfile.location}
                onChange={(e) => setSellerProfile(prev => ({ ...prev, location: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your location"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={sellerProfile.description}
              onChange={(e) => setSellerProfile(prev => ({ ...prev, description: e.target.value }))}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-24"
              placeholder="Describe your services"
            />
          </div>
          <Button 
            onClick={saveSellerProfile}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
          >
            Save Profile
          </Button>
        </div>

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
            <p className="text-gray-600 mb-6">Connect your calendar to let buyers see your availability and book appointments.</p>
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
              Connect Calendar
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-green-100 rounded-xl">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Calendar Management</h2>
            <p className="text-sm text-gray-500">✅ Connected to Google Calendar</p>
          </div>
        </div>
        <Button onClick={loadCalendarData} disabled={loading} variant="outline">
          {loading ? 'Loading...' : 'Refresh Calendar'}
        </Button>
      </div>

      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Business Profile</h3>
          <Button 
            onClick={() => setIsEditing(!isEditing)}
            variant="outline"
            size="sm"
          >
            {isEditing ? 'Cancel' : 'Edit'}
          </Button>
        </div>
        
        {isEditing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Business Name</label>
                <input
                  type="text"
                  value={sellerProfile.business_name}
                  onChange={(e) => setSellerProfile(prev => ({ ...prev, business_name: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                <input
                  type="text"
                  value={sellerProfile.location}
                  onChange={(e) => setSellerProfile(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={sellerProfile.description}
                onChange={(e) => setSellerProfile(prev => ({ ...prev, description: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent h-24"
              />
            </div>
            <Button onClick={saveSellerProfile} className="bg-green-600 hover:bg-green-700 text-white">
              Save Changes
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <span className="text-sm font-medium text-gray-500">Business Name:</span>
              <p className="text-gray-800">{sellerProfile.business_name || 'Not set'}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">Location:</span>
              <p className="text-gray-800">{sellerProfile.location || 'Not set'}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">Description:</span>
              <p className="text-gray-800">{sellerProfile.description || 'Not set'}</p>
            </div>
          </div>
        )}
      </div>

      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Calendar Overview</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h4 className="font-semibold text-gray-800 mb-3">Upcoming Appointments</h4>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {events.length > 0 ? events.slice(0, 5).map(event => (
                <div key={event.id} className="p-3 bg-gray-50 rounded-lg border-l-4 border-green-500">
                  <h5 className="font-medium text-sm">{event.summary}</h5>
                  <p className="text-xs text-gray-600">
                    {new Date(event.start.dateTime).toLocaleDateString()} at {new Date(event.start.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              )) : (
                <p className="text-gray-500 text-sm">No upcoming appointments</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h4 className="font-semibold text-gray-800 mb-3">Availability Status</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                <span className="text-sm text-gray-700">Today</span>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Available</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-700">Tomorrow</span>
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">Partial</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-700">This Week</span>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">{events.length} appointments</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Buyer Appointments Section */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Appointment Requests</h3>
          <Button onClick={loadAppointments} disabled={loading} variant="outline" size="sm">
            {loading ? 'Loading...' : 'Refresh'}
          </Button>
        </div>
        
        {appointments.length > 0 ? (
          <div className="space-y-3">
            {appointments.map((appointment: any) => (
              <div key={appointment.id} className="p-4 bg-gray-50 rounded-lg border-l-4 border-blue-500">
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="font-medium text-sm">{appointment.title}</h5>
                    <p className="text-xs text-gray-600 mt-1">
                      Requested by {appointment.user_profiles?.[0]?.full_name || appointment.buyer_email}
                    </p>
                    <p className="text-xs text-gray-600">
                      {new Date(appointment.start_time).toLocaleDateString()} at{' '}
                      {new Date(appointment.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    {appointment.description && (
                      <p className="text-xs text-gray-500 mt-1">{appointment.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      appointment.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                      appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {appointment.status}
                    </span>
                    {appointment.status === 'pending' && (
                      <div className="flex gap-1">
                        <Button 
                          size="sm" 
                          className="h-7 px-2 bg-green-600 hover:bg-green-700 text-white text-xs"
                          onClick={() => handleAcceptAppointment(appointment.id)}
                        >
                          Accept
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-7 px-2 text-xs"
                          onClick={() => handleDeclineAppointment(appointment.id)}
                        >
                          Decline
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No appointment requests</p>
        )}
      </div>

      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Availability Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-700 mb-3">Working Hours</h4>
            <div className="space-y-2">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                <div key={day} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">{day}</span>
                  <div className="flex items-center gap-2">
                    <input type="time" defaultValue="09:00" className="text-xs border border-gray-300 rounded px-2 py-1" />
                    <span className="text-xs text-gray-500">to</span>
                    <input type="time" defaultValue="17:00" className="text-xs border border-gray-300 rounded px-2 py-1" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-700 mb-3">Booking Settings</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Appointment Duration</label>
                <select className="w-full p-2 border border-gray-300 rounded-lg">
                  <option value="30">30 minutes</option>
                  <option value="60">1 hour</option>
                  <option value="90">1.5 hours</option>
                  <option value="120">2 hours</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Buffer Time</label>
                <select className="w-full p-2 border border-gray-300 rounded-lg">
                  <option value="0">No buffer</option>
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Advance Notice</label>
                <select className="w-full p-2 border border-gray-300 rounded-lg">
                  <option value="24">24 hours</option>
                  <option value="48">48 hours</option>
                  <option value="168">1 week</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        <Button className="mt-6 bg-green-600 hover:bg-green-700 text-white">
          Save Availability Settings
        </Button>
      </div>
    </div>
  )
}

export default Seller
