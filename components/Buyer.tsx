import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import supabase from '@/lib/supabase'

// Simple Input component
const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={`flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 ${className || ''}`}
        ref={ref}
        {...props}
      />
    )
  }
)

interface BuyerProps {
  isGoogleConnected?: boolean
}

interface Seller {
  id: string
  user_id: string
  business_name: string
  description: string
  location: string
  availability_settings: any
  user_profiles: {
    full_name: string
    email: string
  }
}

interface Appointment {
  id: string
  title: string
  description: string
  start_time: string
  end_time: string
  status: string
  sellers: {
    business_name: string
    location: string
  }
}

const Buyer = ({ isGoogleConnected = false }: BuyerProps) => {
  const [sellers, setSellers] = useState<Seller[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [availableSlots, setAvailableSlots] = useState<Array<{start: string, end: string, available: boolean}>>([])
  const [loadingAvailability, setLoadingAvailability] = useState(false)
  const [bookingForm, setBookingForm] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    duration: 60
  })

  useEffect(() => {
    console.log('Buyer component mounted, loading data...')
    loadSellers()
    loadAppointments()
  }, [])

  const loadSellers = async () => {
    setLoading(true)
    try {
      // First, let's try a simple query without joins
      const { data: sellersData, error: sellersError } = await supabase
        .from('sellers')
        .select('*')

      if (sellersError) {
        console.error('Error loading sellers:', sellersError)
        setSellers([])
      } else {
        console.log('Sellers data:', sellersData)
        
        if (sellersData && sellersData.length > 0) {
          // For each seller, fetch the user profile separately
          const sellersWithProfiles = await Promise.all(
            sellersData.map(async (seller) => {
              const { data: profileData } = await supabase
                .from('user_profiles')
                .select('full_name, email')
                .eq('id', seller.user_id)
                .single()

              return {
                ...seller,
                user_profiles: profileData || { full_name: 'Unknown', email: '' }
              }
            })
          )
          
          setSellers(sellersWithProfiles)
        } else {
          setSellers([])
        }
      }
    } catch (error) {
      console.error('Error loading sellers:', error)
      setSellers([])
    } finally {
      setLoading(false)
    }
  }

  const loadAppointments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          title,
          description,
          start_time,
          end_time,
          status,
          seller_id,
          sellers (
            business_name,
            location
          )
        `)
        .eq('buyer_id', user.id)
        .order('start_time', { ascending: true })

      if (error) {
        console.error('Error loading appointments:', error)
        setAppointments([])
      } else {
        console.log('Raw appointments data:', data)
        // Transform the data to handle the sellers relationship properly
        const transformedAppointments = (data || []).map((appointment: any) => ({
          ...appointment,
          sellers: appointment.sellers || { business_name: 'Unknown', location: 'Unknown' }
        }))
        console.log('Transformed appointments:', transformedAppointments)
        setAppointments(transformedAppointments)
      }
    } catch (error) {
      console.error('Error loading appointments:', error)
      setAppointments([])
    }
  }

  const loadAvailability = async (sellerId: string, selectedDate: string) => {
    if (!selectedDate) return

    setLoadingAvailability(true)
    try {
      const timeMin = new Date(selectedDate)
      timeMin.setHours(0, 0, 0, 0)
      const timeMax = new Date(selectedDate)
      timeMax.setHours(23, 59, 59, 999)

      const response = await fetch('/api/calendar/freebusy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          timeMin: timeMin.toISOString(),
          timeMax: timeMax.toISOString(),
          calendarId: 'primary'
        })
      })

      if (response.ok) {
        const slots = await response.json()
        setAvailableSlots(slots.filter((slot: any) => slot.available))
      } else {
        console.error('Failed to load availability')
        setAvailableSlots([])
      }
    } catch (error) {
      console.error('Error loading availability:', error)
      setAvailableSlots([])
    } finally {
      setLoadingAvailability(false)
    }
  }

  const filteredSellers = sellers.filter(seller =>
    seller.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    seller.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    seller.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    seller.user_profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleBookAppointment = async () => {
    if (!selectedSeller || !bookingForm.title || !bookingForm.date || !bookingForm.time) {
      alert('Please fill in all required fields')
      return
    }

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const startDateTime = new Date(`${bookingForm.date}T${bookingForm.time}`)
      const endDateTime = new Date(startDateTime.getTime() + bookingForm.duration * 60000)

      // Create appointment in database
      const { data: appointment, error } = await supabase
        .from('appointments')
        .insert({
          buyer_id: user.id,
          seller_id: selectedSeller.id,
          title: bookingForm.title,
          description: bookingForm.description,
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString(),
          status: 'pending',
          buyer_email: user.email,
          seller_email: selectedSeller.user_profiles?.email
        })
        .select()
        .single()

      if (error) {
        console.error('Error booking appointment:', error)
        alert('Failed to book appointment. Please try again.')
        return
      }

      // Try to create Google Calendar events (this will use mock data for now)
      try {
        const eventResponse = await fetch('/api/calendar/create-event', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            summary: `${bookingForm.title} - ${selectedSeller.business_name}`,
            description: bookingForm.description || `Appointment with ${selectedSeller.business_name}`,
            start: startDateTime.toISOString(),
            end: endDateTime.toISOString(),
            attendees: [user.email, selectedSeller.user_profiles?.email].filter(Boolean)
          })
        })

        if (eventResponse.ok) {
          const eventData = await eventResponse.json()
          console.log('Calendar event created:', eventData)
          
          // Update appointment with calendar event data
          await supabase
            .from('appointments')
            .update({ 
              google_event_id: eventData.id,
              google_meet_link: eventData.meetLink 
            })
            .eq('id', appointment.id)
        }
      } catch (calendarError) {
        console.error('Calendar event creation failed:', calendarError)
        // Don't fail the entire booking if calendar fails
      }

      alert('Appointment booked successfully! The service provider will confirm your request.')
      setShowBookingModal(false)
      setSelectedSeller(null)
      setBookingForm({
        title: '',
        description: '',
        date: '',
        time: '',
        duration: 60
      })
      setAvailableSlots([])
      loadAppointments() // Refresh appointments list

    } catch (error) {
      console.error('Error booking appointment:', error)
      alert('Failed to book appointment. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 rounded-xl">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Find & Book Appointments</h2>
            <p className="text-sm text-gray-500">Browse service providers and book appointments</p>
          </div>
        </div>
        <Button onClick={loadSellers} disabled={loading} variant="outline">
          {loading ? 'Loading...' : 'Refresh'}
        </Button>
      </div>

      {/* Search and Sellers List */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Available Service Providers</h3>
        <div className="mb-4">
          <Input
            type="text"
            placeholder="Search by business name, location, or description..."
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-500">Loading service providers...</p>
          </div>
        ) : filteredSellers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSellers.map((seller) => (
              <div key={seller.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                <h4 className="font-semibold text-gray-800">{seller.business_name}</h4>
                <p className="text-sm text-gray-600 mb-2">{seller.user_profiles?.full_name}</p>
                <p className="text-xs text-gray-500 mb-2">📍 {seller.location}</p>
                <p className="text-sm text-gray-600 mb-3">{seller.description}</p>
                <Button
                  onClick={() => {
                    setSelectedSeller(seller)
                    setShowBookingModal(true)
                    setAvailableSlots([]) // Clear previous availability
                    setBookingForm({
                      title: '',
                      description: '',
                      date: '',
                      time: '',
                      duration: 60
                    })
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  size="sm"
                >
                  Book Appointment
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No service providers found</p>
        )}
      </div>

      {/* My Appointments */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">My Appointments</h3>
        {appointments.length > 0 ? (
          <div className="space-y-3">
            {appointments.map((appointment) => (
              <div key={appointment.id} className="p-4 bg-gray-50 rounded-lg border-l-4 border-blue-500">
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="font-medium text-sm">{appointment.title}</h5>
                    <p className="text-xs text-gray-600 mt-1">
                      with {appointment.sellers?.business_name || 'Unknown Provider'} at {appointment.sellers?.location || 'Unknown Location'}
                    </p>
                    <p className="text-xs text-gray-600">
                      {new Date(appointment.start_time).toLocaleDateString()} at{' '}
                      {new Date(appointment.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    {appointment.description && (
                      <p className="text-xs text-gray-500 mt-1">{appointment.description}</p>
                    )}
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    appointment.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                    appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {appointment.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No appointments scheduled</p>
        )}
      </div>

      {/* Booking Modal */}
      {showBookingModal && selectedSeller && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Book with {selectedSeller.business_name}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Appointment Title *</label>
                <Input
                  type="text"
                  value={bookingForm.title}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBookingForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Consultation, Meeting"
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={bookingForm.description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setBookingForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of what you need..."
                  className="w-full p-2 border border-gray-300 rounded-lg h-20 resize-none"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                  <Input
                    type="date"
                    value={bookingForm.date}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const newDate = e.target.value
                      setBookingForm(prev => ({ ...prev, date: newDate, time: '' }))
                      if (newDate && selectedSeller) {
                        loadAvailability(selectedSeller.id, newDate)
                      }
                    }}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time *</label>
                  <Input
                    type="time"
                    value={bookingForm.time}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBookingForm(prev => ({ ...prev, time: e.target.value }))}
                    className="w-full"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                <select
                  value={bookingForm.duration}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setBookingForm(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                >
                  <option value={30}>30 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={90}>1.5 hours</option>
                  <option value={120}>2 hours</option>
                </select>
              </div>

              {/* Available Time Slots */}
              {bookingForm.date && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Available Time Slots
                    {loadingAvailability && <span className="text-blue-500 ml-2">Loading...</span>}
                  </label>
                  {loadingAvailability ? (
                    <div className="text-center py-4 text-gray-500">Loading available times...</div>
                  ) : availableSlots.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                      {availableSlots.map((slot, index) => {
                        const slotTime = new Date(slot.start).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit',
                          hour12: true 
                        })
                        const slotTimeValue = new Date(slot.start).toTimeString().slice(0, 5)
                        
                        return (
                          <button
                            key={index}
                            onClick={() => setBookingForm(prev => ({ ...prev, time: slotTimeValue }))}
                            className={`p-2 text-xs rounded border-2 transition-colors ${
                              bookingForm.time === slotTimeValue
                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50'
                            }`}
                          >
                            {slotTime}
                          </button>
                        )
                      })}
                    </div>
                  ) : bookingForm.date ? (
                    <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-lg">
                      No available slots for this date. Please choose another date.
                    </div>
                  ) : null}
                </div>
              )}
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button
                onClick={() => {
                  setShowBookingModal(false)
                  setSelectedSeller(null)
                }}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleBookAppointment}
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {loading ? 'Booking...' : 'Book Appointment'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Buyer
