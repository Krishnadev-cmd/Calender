import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { googleCalendarService, CalendarEvent } from '@/lib/googleCalendar'

interface AppointmentDetails extends CalendarEvent {
  type: 'upcoming' | 'past'
  otherParticipant: string
  userRole: 'buyer' | 'seller'
}

const Appointments = () => {
  const [appointments, setAppointments] = useState<AppointmentDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all')

  const loadAppointments = async () => {
    setLoading(true)
    try {
      const timeMin = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() // Past 30 days
      const timeMax = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // Next 30 days
      
      const events = await googleCalendarService.getCalendarEvents(timeMin, timeMax)
      const now = new Date()
      
      const appointmentDetails: AppointmentDetails[] = events.map(event => ({
        ...event,
        type: new Date(event.start.dateTime) > now ? 'upcoming' : 'past',
        otherParticipant: event.attendees?.[0]?.displayName || event.attendees?.[0]?.email || 'Unknown',
        userRole: 'buyer' // You'd determine this based on your app logic
      }))
      
      setAppointments(appointmentDetails)
    } catch (error) {
      console.error('Failed to load appointments:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredAppointments = appointments.filter(appointment => {
    if (filter === 'all') return true
    return appointment.type === filter
  })

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime)
    return {
      date: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    }
  }

  const getStatusColor = (appointment: AppointmentDetails) => {
    if (appointment.type === 'past') return 'bg-gray-100 text-gray-700'
    return 'bg-green-100 text-green-700'
  }

  const joinMeeting = (meetLink?: string) => {
    if (meetLink) {
      window.open(meetLink, '_blank')
    }
  }

  useEffect(() => {
    loadAppointments()
  }, [])

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-100 rounded-xl">
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-800">My Appointments</h2>
            <p className="text-sm text-gray-500">View and manage your scheduled appointments</p>
          </div>
        </div>
        <Button onClick={loadAppointments} disabled={loading} variant="outline">
          {loading ? 'Loading...' : 'Refresh'}
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-purple-500 to-indigo-500 px-6 py-4">
          <div className="flex gap-2">
            {[
              { key: 'all', label: 'All Appointments' },
              { key: 'upcoming', label: 'Upcoming' },
              { key: 'past', label: 'Past' }
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key as typeof filter)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                  filter === key
                    ? 'bg-white text-purple-600 shadow-sm'
                    : 'text-purple-100 hover:text-white hover:bg-white/10'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your appointments...</p>
            </div>
          ) : filteredAppointments.length > 0 ? (
            <div className="space-y-4">
              {filteredAppointments.map(appointment => {
                const { date, time } = formatDateTime(appointment.start.dateTime)
                const endTime = formatDateTime(appointment.end.dateTime).time
                
                return (
                  <div key={appointment.id} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-gray-800">{appointment.summary}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment)}`}>
                            {appointment.type === 'upcoming' ? 'Upcoming' : 'Completed'}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>{date}</span>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{time} - {endTime}</span>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span>with {appointment.otherParticipant}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 ml-4">
                        {appointment.meetLink && appointment.type === 'upcoming' && (
                          <Button
                            onClick={() => joinMeeting(appointment.meetLink)}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            Join
                          </Button>
                        )}
                        
                        <Button size="sm" variant="outline">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Details
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">No appointments found</h3>
              <p className="text-gray-600">
                {filter === 'all' 
                  ? "You don't have any appointments yet. Book your first appointment!"
                  : `No ${filter} appointments to show.`
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Appointments</p>
              <p className="text-2xl font-bold text-gray-900">{appointments.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Upcoming</p>
              <p className="text-2xl font-bold text-gray-900">
                {appointments.filter(apt => apt.type === 'upcoming').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">
                {appointments.filter(apt => apt.type === 'past').length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Appointments