import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import supabase from '@/lib/supabase'
import { User } from '@supabase/supabase-js'

interface Appointment {
  id: string
  title: string
  description?: string
  start_time: string
  end_time: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  google_calendar_event_id?: string
  meet_link?: string
  created_at: string
  // For buyer appointments
  sellers?: {
    id: string
    business_name: string
    user_profiles: {
      full_name: string
      email: string
    }
  }
  // For seller appointments
  user_profiles?: {
    full_name: string
    email: string
  }
}

interface AppointmentsProps {
  user?: User
  userRole?: 'buyer' | 'seller'
}

const Appointments = ({ user, userRole }: AppointmentsProps) => {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past' | 'pending' | 'confirmed'>('upcoming')

  useEffect(() => {
    if (user && userRole) {
      loadAppointments()
    }
  }, [user, userRole])

  const loadAppointments = async () => {
    if (!user || !userRole) return

    setLoading(true)
    try {
      const response = await fetch(`/api/appointments/list?userId=${user.id}&role=${userRole}`)
      
      if (response.ok) {
        const result = await response.json()
        setAppointments(result.appointments || [])
      } else {
        console.error('Failed to fetch appointments')
        setAppointments([])
      }
    } catch (error) {
      console.error('Error loading appointments:', error)
      setAppointments([])
    } finally {
      setLoading(false)
    }
  }

  const getFilteredAppointments = () => {
    const now = new Date()
    
    return appointments.filter(appointment => {
      const appointmentTime = new Date(appointment.start_time)
      
      switch (filter) {
        case 'upcoming':
          return appointmentTime > now
        case 'past':
          return appointmentTime <= now
        case 'pending':
          return appointment.status === 'pending'
        case 'confirmed':
          return appointment.status === 'confirmed'
        default:
          return true
      }
    })
  }

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime)
    return {
      date: date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      time: date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'confirmed': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getOtherParticipant = (appointment: Appointment) => {
    if (userRole === 'buyer' && appointment.sellers) {
      return {
        name: appointment.sellers.business_name || appointment.sellers.user_profiles?.full_name || 'Unknown',
        email: appointment.sellers.user_profiles?.email || ''
      }
    } else if (userRole === 'seller' && appointment.user_profiles) {
      return {
        name: appointment.user_profiles.full_name || 'Unknown Client',
        email: appointment.user_profiles.email || ''
      }
    }
    return { name: 'Unknown', email: '' }
  }

  const handleStatusUpdate = async (appointmentId: string, newStatus: string) => {
    try {
      const response = await fetch('/api/appointments/update-status', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appointmentId,
          status: newStatus,
          userId: user?.id,
        }),
      });

      if (response.ok) {
        alert(`Appointment ${newStatus} successfully!`);
        await loadAppointments(); // Reload appointments
      } else {
        const error = await response.json();
        alert(`Failed to update appointment: ${error.error}`);
      }
    } catch (error) {
      console.error('Error updating appointment:', error);
      alert('Failed to update appointment');
    }
  }

  const filteredAppointments = getFilteredAppointments()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading appointments...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">My Appointments</h2>
        <Button onClick={loadAppointments} variant="outline">
          Refresh
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-2 border-b">
        {[
          { key: 'upcoming', label: 'Upcoming' },
          { key: 'past', label: 'Past' },
          { key: 'pending', label: 'Pending' },
          { key: 'confirmed', label: 'Confirmed' },
          { key: 'all', label: 'All' }
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key as any)}
            className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors ${
              filter === key
                ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-700'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Appointments List */}
      {filteredAppointments.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No appointments found</h3>
          <p className="text-gray-500">
            {filter === 'upcoming' 
              ? "You don't have any upcoming appointments" 
              : `No ${filter} appointments found`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAppointments.map((appointment) => {
            const participant = getOtherParticipant(appointment)
            const { date, time } = formatDateTime(appointment.start_time)
            const { time: endTime } = formatDateTime(appointment.end_time)
            const isUpcoming = new Date(appointment.start_time) > new Date()

            return (
              <Card key={appointment.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{appointment.title}</CardTitle>
                      <CardDescription className="mt-1">
                        {userRole === 'buyer' ? 'with' : 'with client'} {participant.name}
                      </CardDescription>
                    </div>
                    <Badge className={getStatusColor(appointment.status)}>
                      {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Date and Time */}
                    <div className="flex items-center space-x-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="font-medium">{date}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{time} - {endTime}</span>
                      </div>
                    </div>

                    {/* Description */}
                    {appointment.description && (
                      <div className="text-sm text-gray-600">
                        <p>{appointment.description}</p>
                      </div>
                    )}

                    {/* Participant Info */}
                    <div className="text-sm text-gray-600">
                      <p><strong>Email:</strong> {participant.email}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-between items-center pt-3 border-t">
                      <div className="flex space-x-2">
                        {appointment.meet_link && (
                          <Button 
                            size="sm" 
                            onClick={() => window.open(appointment.meet_link, '_blank')}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            Join Meeting
                          </Button>
                        )}
                        {appointment.google_calendar_event_id && (
                          <Button size="sm" variant="outline">
                            View in Calendar
                          </Button>
                        )}
                      </div>

                      {/* Status Actions */}
                      {isUpcoming && userRole === 'seller' && appointment.status === 'pending' && (
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusUpdate(appointment.id, 'confirmed')}
                            className="text-green-600 border-green-600 hover:bg-green-50"
                          >
                            Confirm
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusUpdate(appointment.id, 'cancelled')}
                            className="text-red-600 border-red-600 hover:bg-red-50"
                          >
                            Cancel
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default Appointments