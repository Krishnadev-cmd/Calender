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
      <div className="text-center p-8 bg-white rounded-lg shadow-sm">
        <div className="mb-6">
          <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-2xl">📅</span>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Connect Your Google Calendar</h3>
          <p className="text-gray-600 mb-6">To book appointments, please connect your Google Calendar first.</p>
        </div>
        <Button 
          onClick={() => window.location.href = '/api/auth/google?state=buyer'}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg font-medium"
        >
          Connect Google Calendar
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center border-b border-gray-200 pb-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Book an Appointment</h2>
          <p className="text-gray-600 mt-1">Find and schedule meetings with service providers</p>
        </div>
        {selectedSeller && (
          <Button 
            variant="outline" 
            onClick={() => {
              setSelectedSeller(null)
              setSelectedSlot(null)
            }}
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            ← Back to Sellers
          </Button>
        )}
      </div>

      {!selectedSeller ? (
        // Sellers List View
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-gray-800">Available Service Providers</h3>
            <Button onClick={fetchSellers} variant="outline" size="sm" className="text-gray-600">
              🔄 Refresh
            </Button>
          </div>
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 font-medium">Loading sellers...</p>
            </div>
          ) : sellers.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <span className="text-2xl text-gray-400">👥</span>
              </div>
              <p className="text-gray-600 mb-4 font-medium">No sellers available at the moment</p>
              <Button onClick={fetchSellers} variant="outline" className="text-gray-600">
                Try Again
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sellers.map((seller) => (
                <Card key={seller.id} className="hover:shadow-lg transition-all duration-200 border border-gray-200 hover:border-blue-300">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg font-semibold text-gray-800 leading-tight">
                        {seller.business_name}
                      </CardTitle>
                      <div className="flex flex-col gap-1">
                        {seller.hasGoogleCalendar && (
                          <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full border border-green-200 font-medium">
                            📅 Calendar
                          </span>
                        )}
                        {seller.isOnline && (
                          <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full border border-blue-200 font-medium">
                            🟢 Online
                          </span>
                        )}
                      </div>
                    </div>
                    <CardDescription className="text-gray-600 mt-2 line-clamp-2">
                      {seller.description}
                    </CardDescription>
                    {seller.location && (
                      <p className="text-sm text-gray-500 mt-2 flex items-center">
                        📍 {seller.location}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-600">
                        {seller.user_profiles?.email || 'Email not available'}
                      </div>
                      <Button 
                        onClick={() => setSelectedSeller(seller)}
                        disabled={!seller.hasGoogleCalendar}
                        className={seller.hasGoogleCalendar 
                          ? "bg-blue-600 hover:bg-blue-700 text-white" 
                          : "bg-gray-100 text-gray-400 cursor-not-allowed"
                        }
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
        <div className="max-w-3xl mx-auto">
          <Card className="shadow-lg border border-gray-200">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
              <CardTitle className="text-2xl text-gray-800">Book with {selectedSeller.business_name}</CardTitle>
              <CardDescription className="text-gray-600 mt-1">{selectedSeller.description}</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              {/* Date Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-3">Select Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="border border-gray-300 rounded-lg px-4 py-3 w-full text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium"
                />
              </div>

              {/* Time Slots */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-3">
                  Available Times for {formatDate(selectedDate)}
                </label>
                {availableSlots.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <div className="w-12 h-12 mx-auto mb-3 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-gray-400">📅</span>
                    </div>
                    <p className="text-gray-600 font-medium">No available slots for this date</p>
                    <p className="text-sm text-gray-500 mt-1">Try selecting a different date</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {availableSlots
                      .filter(slot => slot.available)
                      .map((slot, index) => (
                        <Button
                          key={index}
                          variant={selectedSlot === slot ? "default" : "outline"}
                          onClick={() => setSelectedSlot(slot)}
                          className={selectedSlot === slot 
                            ? "bg-blue-600 hover:bg-blue-700 text-white border-blue-600" 
                            : "border-gray-300 text-gray-700 hover:bg-blue-50 hover:border-blue-300"
                          }
                        >
                          {formatTime(slot.start)} - {formatTime(slot.end)}
                        </Button>
                      ))}
                  </div>
                )}
              </div>

              {/* Appointment Details */}
              {selectedSlot && (
                <div className="space-y-6 border-t border-gray-200 pt-8">
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-3">
                      Appointment Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={appointmentDetails.title}
                      onChange={(e) => setAppointmentDetails(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g., Consultation Meeting"
                      className="border border-gray-300 rounded-lg px-4 py-3 w-full text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-3">Description (optional)</label>
                    <textarea
                      value={appointmentDetails.description}
                      onChange={(e) => setAppointmentDetails(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Any additional details or requirements..."
                      rows={4}
                      className="border border-gray-300 rounded-lg px-4 py-3 w-full text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    />
                  </div>

                  <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg">
                    <h4 className="font-semibold text-blue-800 mb-4 flex items-center">
                      📋 Booking Summary
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-blue-700">Provider:</span>
                        <p className="text-blue-800 mt-1">{selectedSeller.business_name}</p>
                      </div>
                      <div>
                        <span className="font-medium text-blue-700">Duration:</span>
                        <p className="text-blue-800 mt-1">
                          {Math.round((new Date(selectedSlot.end).getTime() - new Date(selectedSlot.start).getTime()) / (1000 * 60))} minutes
                        </p>
                      </div>
                      <div>
                        <span className="font-medium text-blue-700">Date:</span>
                        <p className="text-blue-800 mt-1">{formatDate(selectedSlot.start)}</p>
                      </div>
                      <div>
                        <span className="font-medium text-blue-700">Time:</span>
                        <p className="text-blue-800 mt-1">{formatTime(selectedSlot.start)} - {formatTime(selectedSlot.end)}</p>
                      </div>
                    </div>
                  </div>

                  <Button 
                    onClick={handleBookAppointment} 
                    disabled={loading || !appointmentDetails.title}
                    className="w-full py-4 text-lg font-medium bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-300 disabled:text-gray-500"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Booking...
                      </span>
                    ) : (
                      'Confirm Booking'
                    )}
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