import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { googleCalendarService, TimeSlot } from '@/lib/googleCalendar'

interface Seller {
  id: string
  name: string
  email: string
  specialties: string[]
  rating: number
  isConnected: boolean
}

interface BookingDetails {
  sellerId: string
  sellerName: string
  timeSlot: TimeSlot
  notes: string
}

interface BuyerProps {
  isGoogleConnected?: boolean
}

const Buyer = ({ isGoogleConnected = false }: BuyerProps) => {
  const [sellers, setSellers] = useState<Seller[]>([])
  const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null)
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([])
  const [booking, setBooking] = useState<BookingDetails | null>(null)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const handleGoogleSignIn = () => {
    const authUrl = googleCalendarService.getAuthUrl('buyer')
    
    if (authUrl === '#google-oauth-not-configured') {
      alert('Google Calendar integration is not configured yet. Please set up Google Cloud Console credentials.')
      return
    }
    
    window.location.href = authUrl
  }

  // Mock sellers data - in real app, this would come from your database
  const mockSellers: Seller[] = [
    {
      id: '1',
      name: 'Dr. Sarah Johnson',
      email: 'sarah.johnson@example.com',
      specialties: ['Medical Consultation', 'Health Advice'],
      rating: 4.9,
      isConnected: true
    },
    {
      id: '2',
      name: 'John Smith',
      email: 'john.smith@example.com',
      specialties: ['Business Consulting', 'Strategy'],
      rating: 4.7,
      isConnected: true
    },
    {
      id: '3',
      name: 'Emma Davis',
      email: 'emma.davis@example.com',
      specialties: ['Fitness Training', 'Nutrition'],
      rating: 4.8,
      isConnected: true
    }
  ]

  const loadAvailability = async (seller: Seller) => {
    setLoading(true)
    try {
      const timeMin = new Date().toISOString()
      const timeMax = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // Next 7 days
      
      // In real app, you'd call the seller's calendar availability
      const slots = await googleCalendarService.getFreeBusy(timeMin, timeMax, seller.email)
      setAvailableSlots(slots.filter(slot => slot.available))
    } catch (error) {
      console.error('Failed to load availability:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBookAppointment = async () => {
    if (!booking) return

    try {
      setLoading(true)
      const eventData = {
        summary: `Appointment with ${booking.sellerName}`,
        start: booking.timeSlot.start,
        end: booking.timeSlot.end,
        attendees: [booking.sellerId], // seller's email
        description: booking.notes
      }

      await googleCalendarService.createEvent(eventData)
      
      // Reset booking state
      setBooking(null)
      setSelectedSeller(null)
      alert('Appointment booked successfully! Both calendars have been updated.')
    } catch (error) {
      console.error('Failed to book appointment:', error)
      alert('Failed to book appointment. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const filteredSellers = sellers.filter(seller =>
    seller.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    seller.specialties.some(specialty => specialty.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  useEffect(() => {
    // Load sellers list
    setSellers(mockSellers)
  }, [])

  if (!isGoogleConnected) {
    return (
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-blue-100 rounded-xl">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Appointment Booking</h2>
            <p className="text-sm text-gray-500">Connect your Google Calendar to book appointments</p>
          </div>
        </div>

        {/* Google Sign-in Section */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-8 border border-blue-100 text-center">
          <div className="max-w-md mx-auto">
            <div className="p-4 bg-white rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <svg className="w-10 h-10 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Connect Google Calendar</h3>
            <p className="text-gray-600 mb-6">Sign in with your Google account to book appointments and manage your schedule.</p>
            <Button 
              onClick={handleGoogleSignIn}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
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
          </div>
        </div>
      </div>
    )
  }

  if (booking) {
    return (
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-blue-100 rounded-xl">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Confirm Booking</h2>
            <p className="text-sm text-gray-500">Review your appointment details</p>
          </div>
        </div>

        {/* Booking Confirmation */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Appointment Details</h3>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600">Provider:</span>
                <span className="font-medium">{booking.sellerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date:</span>
                <span className="font-medium">
                  {new Date(booking.timeSlot.start).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Time:</span>
                <span className="font-medium">
                  {new Date(booking.timeSlot.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                  {new Date(booking.timeSlot.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (optional)
              </label>
              <textarea
                value={booking.notes}
                onChange={(e) => setBooking({...booking, notes: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="Add any notes or details about the appointment..."
              />
            </div>

            <div className="flex gap-3">
              <Button 
                onClick={handleBookAppointment}
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {loading ? 'Booking...' : 'Confirm Booking'}
              </Button>
              <Button 
                onClick={() => setBooking(null)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (selectedSeller) {
    return (
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-xl">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Available Times</h2>
              <p className="text-sm text-gray-500">Select a time slot with {selectedSeller.name}</p>
            </div>
          </div>
          <Button onClick={() => setSelectedSeller(null)} variant="outline">
            ← Back to Sellers
          </Button>
        </div>

        {/* Available Slots */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
          <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
            <h3 className="font-semibold text-gray-800 mb-2">{selectedSeller.name}</h3>
            <p className="text-sm text-gray-600 mb-2">
              Specialties: {selectedSeller.specialties.join(', ')}
            </p>
            <div className="flex items-center gap-1">
              <span className="text-sm text-gray-600">Rating:</span>
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className={`w-4 h-4 ${i < Math.floor(selectedSeller.rating) ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
                <span className="ml-1 text-sm text-gray-600">({selectedSeller.rating})</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {loading ? (
              <div className="col-span-full text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-gray-600">Loading available times...</p>
              </div>
            ) : availableSlots.length > 0 ? availableSlots.slice(0, 16).map((slot, index) => (
              <Button
                key={index}
                onClick={() => setBooking({
                  sellerId: selectedSeller.email,
                  sellerName: selectedSeller.name,
                  timeSlot: slot,
                  notes: ''
                })}
                variant="outline"
                className="p-3 text-sm hover:bg-blue-50 hover:border-blue-300"
              >
                <div>
                  <div className="font-medium">
                    {new Date(slot.start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                  <div className="text-xs text-gray-600">
                    {new Date(slot.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </Button>
            )) : (
              <div className="col-span-full text-center py-8">
                <p className="text-gray-600">No available time slots found for the next 7 days.</p>
                <Button onClick={() => loadAvailability(selectedSeller)} className="mt-2" variant="outline">
                  Refresh Availability
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-blue-100 rounded-xl">
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Find Service Providers</h2>
          <p className="text-sm text-gray-500">Browse and book appointments with available providers</p>
        </div>
      </div>

      {/* Search Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
        <div className="mb-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name or specialty..."
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Sellers List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSellers.length > 0 ? filteredSellers.map(seller => (
            <div key={seller.id} className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-gray-800">{seller.name}</h3>
                  <p className="text-sm text-gray-600">{seller.specialties.join(', ')}</p>
                </div>
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="text-sm text-gray-600">{seller.rating}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-2 h-2 rounded-full ${seller.isConnected ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                <span className={`text-xs ${seller.isConnected ? 'text-green-600' : 'text-gray-500'}`}>
                  {seller.isConnected ? 'Available' : 'Not Available'}
                </span>
              </div>

              <Button 
                onClick={() => {
                  setSelectedSeller(seller)
                  loadAvailability(seller)
                }}
                disabled={!seller.isConnected}
                className="w-full bg-blue-600 hover:bg-blue-700"
                size="sm"
              >
                View Availability
              </Button>
            </div>
          )) : (
            <div className="col-span-full text-center py-8">
              <p className="text-gray-600">No providers found matching your search.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Buyer