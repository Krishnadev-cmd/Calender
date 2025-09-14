import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import supabase from '@/lib/supabase'
import { User } from '@supabase/supabase-js'

interface Seller {
  id: string
  business_name: string
  description: string
  location: string
  user_id: string
  user_profiles?: {
    email: string
    full_name: string
  }
  hasGoogleCalendar: boolean
  isOnline: boolean
}

interface TimeSlot {
  start: string
  end: string
  available: boolean
}

interface BuyerProps {
  user?: User
  isGoogleConnected?: boolean
}

const Buyer = ({ user, isGoogleConnected = false }: BuyerProps) => {
  const [sellers, setSellers] = useState<Seller[]>([])
  const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null)
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([])
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [appointmentDetails, setAppointmentDetails] = useState({
    title: '',
    description: ''
  })
  const [loading, setLoading] = useState(false)

  // Fetch available sellers on component mount
  useEffect(() => {
    fetchSellers()
  }, [])

  // Fetch availability when seller or date changes
  useEffect(() => {
    if (selectedSeller && selectedDate) {
      fetchAvailability(selectedSeller.id, selectedDate)
    }
  }, [selectedSeller, selectedDate])

  const fetchSellers = async () => {
    try {
      setLoading(true)

      const response = await fetch('/api/sellers/available')

      if (response.ok) {
        const result = await response.json()
        console.log('Sellers API result:', result)
        
        // Transform the sellers data to match our interface
        const transformedSellers = result.sellers?.map((seller: any) => ({
          id: seller.id,
          business_name: seller.business_name || seller.user_profiles?.full_name || 'Unknown Business',
          description: seller.description || 'No description available',
          location: seller.location || 'Location not specified',
          user_id: seller.user_id,
          user_profiles: seller.user_profiles,
          hasGoogleCalendar: seller.hasGoogleCalendar || false,
          isOnline: true // Assume online if they're in the available list
        })) || []
        
        setSellers(transformedSellers)
      } else {
        console.error('Failed to fetch sellers:', response.statusText)
        setSellers([])
      }
    } catch (error) {
      console.error('Error fetching sellers:', error)
      setSellers([])
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailability = async (sellerId: string, date: string) => {
    try {
      // For now, generate some mock time slots since the availability API might not be fully implemented
      // In a real implementation, this would call the availability API
      const generateTimeSlots = (date: string) => {
        const slots = []
        const selectedDate = new Date(date)
        
        // Generate slots from 9 AM to 5 PM
        for (let hour = 9; hour < 17; hour++) {
          const startTime = new Date(selectedDate)
          startTime.setHours(hour, 0, 0, 0)
          
          const endTime = new Date(selectedDate)
          endTime.setHours(hour + 1, 0, 0, 0)
          
          slots.push({
            start: startTime.toISOString(),
            end: endTime.toISOString(),
            available: Math.random() > 0.3 // Randomly make some slots unavailable
          })
        }
        
        return slots
      }

      const slots = generateTimeSlots(date)
      setAvailableSlots(slots)

      // TODO: Replace with actual API call when availability endpoint is ready
      // const response = await fetch('/api/sellers/availability', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({ sellerId, date }),
      // })

      // if (response.ok) {
      //   const result = await response.json()
      //   setAvailableSlots(result.slots)
      // } else {
      //   setAvailableSlots([])
      // }
    } catch (error) {
      console.error('Error fetching availability:', error)
      setAvailableSlots([])
    }
  }

  const handleBookAppointment = async () => {
    if (!selectedSeller || !selectedSlot || !user || !appointmentDetails.title) {
      alert('Please fill in all required fields')
      return
    }

    try {
      setLoading(true)
      console.log('Booking appointment:', {
        buyer_id: user.id,
        seller_id: selectedSeller.id,
        title: appointmentDetails.title,
        description: appointmentDetails.description,
        start_time: selectedSlot.start,
        end_time: selectedSlot.end,
        buyer_email: user.email,
        seller_email: selectedSeller.user_profiles?.email
      })

      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          buyer_id: user.id,
          seller_id: selectedSeller.id,
          title: appointmentDetails.title,
          description: appointmentDetails.description,
          start_time: selectedSlot.start,
          end_time: selectedSlot.end,
          buyer_email: user.email,
          seller_email: selectedSeller.user_profiles?.email
        }),
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Appointment created successfully:', result)
        
        let successMessage = 'Appointment booked successfully!'
        
        // Add calendar event status to the message
        if (result.googleCalendar) {
          const { buyerEventCreated, sellerEventCreated, errors } = result.googleCalendar
          if (buyerEventCreated && sellerEventCreated) {
            successMessage += ' Calendar events created for both you and the service provider.'
          } else if (buyerEventCreated || sellerEventCreated) {
            successMessage += ' Calendar event created for one party. The other may need to manually add the event.'
          } else if (errors && errors.length > 0) {
            successMessage += ' Note: Calendar events could not be created automatically. Please add manually to your calendar.'
            console.warn('Calendar errors:', errors)
          }
        }
        
        alert(successMessage)
        
        // Reset form
        setSelectedSeller(null)
        setSelectedSlot(null)
        setAppointmentDetails({ title: '', description: '' })
        
        // Refresh sellers list
        await fetchSellers()
      } else {
        const error = await response.json()
        console.error('Booking failed:', error)
        alert(`Failed to book appointment: ${error.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error booking appointment:', error)
      alert('Failed to book appointment due to network error')
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (!isGoogleConnected) {
    return (
      <div className="text-center p-8">
        <h3 className="text-lg font-semibold mb-4">Connect Your Google Calendar</h3>
        <p className="mb-4">To book appointments, please connect your Google Calendar first.</p>
        <Button onClick={() => window.location.href = '/api/auth/google?state=buyer'}>
          Connect Google Calendar
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Book an Appointment</h2>
        {selectedSeller && (
          <Button 
            variant="outline" 
            onClick={() => {
              setSelectedSeller(null)
              setSelectedSlot(null)
            }}
          >
            Back to Sellers
          </Button>
        )}
      </div>

      {!selectedSeller ? (
        // Sellers List View
        <div>
          <h3 className="text-lg font-semibold mb-4">Available Service Providers</h3>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>Loading sellers...</p>
            </div>
          ) : sellers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="mb-4">No sellers available at the moment</p>
              <Button onClick={fetchSellers} variant="outline">
                Refresh
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sellers.map((seller) => (
                <Card key={seller.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{seller.business_name}</CardTitle>
                      <div className="flex items-center gap-2">
                        {seller.hasGoogleCalendar && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                            📅 Calendar
                          </span>
                        )}
                        {seller.isOnline && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            🟢 Online
                          </span>
                        )}
                      </div>
                    </div>
                    <CardDescription>{seller.description}</CardDescription>
                    {seller.location && (
                      <p className="text-sm text-gray-500">📍 {seller.location}</p>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-600">
                        {seller.user_profiles?.email || 'Email not available'}
                      </div>
                      <Button 
                        onClick={() => setSelectedSeller(seller)}
                        disabled={!seller.hasGoogleCalendar}
                      >
                        {seller.hasGoogleCalendar ? 'Book Appointment' : 'Calendar Not Connected'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      ) : (
        // Appointment Booking View
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Book with {selectedSeller.business_name}</CardTitle>
              <CardDescription>{selectedSeller.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Date Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">Select Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 w-full"
                />
              </div>

              {/* Time Slots */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Available Times for {formatDate(selectedDate)}
                </label>
                {availableSlots.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    No available slots for this date
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {availableSlots
                      .filter(slot => slot.available)
                      .map((slot, index) => (
                        <Button
                          key={index}
                          variant={selectedSlot === slot ? "default" : "outline"}
                          onClick={() => setSelectedSlot(slot)}
                          className="text-sm"
                        >
                          {formatTime(slot.start)} - {formatTime(slot.end)}
                        </Button>
                      ))}
                  </div>
                )}
              </div>

              {/* Appointment Details */}
              {selectedSlot && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Appointment Title *</label>
                    <input
                      type="text"
                      value={appointmentDetails.title}
                      onChange={(e) => setAppointmentDetails(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g., Consultation Meeting"
                      className="border border-gray-300 rounded-md px-3 py-2 w-full"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Description (optional)</label>
                    <textarea
                      value={appointmentDetails.description}
                      onChange={(e) => setAppointmentDetails(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Any additional details or requirements..."
                      rows={3}
                      className="border border-gray-300 rounded-md px-3 py-2 w-full"
                    />
                  </div>

                  <div className="bg-blue-50 p-4 rounded-md">
                    <h4 className="font-semibold text-blue-800 mb-2">Booking Summary</h4>
                    <div className="text-sm space-y-1 text-blue-700">
                      <p><strong>Provider:</strong> {selectedSeller.business_name}</p>
                      <p><strong>Date:</strong> {formatDate(selectedSlot.start)}</p>
                      <p><strong>Time:</strong> {formatTime(selectedSlot.start)} - {formatTime(selectedSlot.end)}</p>
                      <p><strong>Duration:</strong> {Math.round((new Date(selectedSlot.end).getTime() - new Date(selectedSlot.start).getTime()) / (1000 * 60))} minutes</p>
                    </div>
                  </div>

                  <Button 
                    onClick={handleBookAppointment} 
                    disabled={loading || !appointmentDetails.title}
                    className="w-full"
                  >
                    {loading ? 'Booking...' : 'Confirm Booking'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

export default Buyer