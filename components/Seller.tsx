import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import supabase from '@/lib/supabase'
import { User } from '@supabase/supabase-js'

interface SellerProps {
  user?: User
  isGoogleConnected?: boolean
}

interface SellerProfile {
  id: string
  business_name: string
  description: string
  location: string
  availability_settings: any
  is_active: boolean
}

interface PendingAppointment {
  id: string
  title: string
  description?: string
  start_time: string
  end_time: string
  user_profiles: {
    full_name: string
    email: string
  }
}

const Seller = ({ user, isGoogleConnected = false }: SellerProps) => {
  const [sellerProfile, setSellerProfile] = useState<SellerProfile | null>(null)
  const [pendingAppointments, setPendingAppointments] = useState<PendingAppointment[]>([])
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    business_name: '',
    description: '',
    location: '',
  })

  useEffect(() => {
    if (user) {
      loadSellerData()
    }
  }, [user])

  const loadSellerData = async () => {
    if (!user) return

    setLoading(true)
    try {
      // Load seller profile
      const { data: profile, error: profileError } = await supabase
        .from('sellers')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error loading seller profile:', profileError)
      } else if (profile) {
        setSellerProfile(profile)
        setFormData({
          business_name: profile.business_name || '',
          description: profile.description || '',
          location: profile.location || '',
        })
      }

      // Load pending appointments
      if (profile) {
        const response = await fetch(`/api/appointments/list?userId=${user.id}&role=seller`)
        if (response.ok) {
          const result = await response.json()
          const pending = result.appointments.filter((apt: any) => apt.status === 'pending')
          setPendingAppointments(pending)
        }
      }
    } catch (error) {
      console.error('Error loading seller data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!user) return

    try {
      setLoading(true)
      
      if (sellerProfile) {
        // Update existing profile
        const { error } = await supabase
          .from('sellers')
          .update({
            business_name: formData.business_name,
            description: formData.description,
            location: formData.location,
          })
          .eq('user_id', user.id)

        if (error) {
          console.error('Error updating profile:', error)
          alert('Failed to update profile')
          return
        }
      } else {
        // Create new profile
        const { error } = await supabase
          .from('sellers')
          .insert({
            user_id: user.id,
            business_name: formData.business_name,
            description: formData.description,
            location: formData.location,
            is_active: true,
          })

        if (error) {
          console.error('Error creating profile:', error)
          alert('Failed to create profile')
          return
        }
      }

      await loadSellerData()
      setIsEditing(false)
      alert('Profile updated successfully!')
    } catch (error) {
      console.error('Error saving profile:', error)
      alert('Failed to save profile')
    } finally {
      setLoading(false)
    }
  }

  const handleAppointmentAction = async (appointmentId: string, action: 'confirm' | 'cancel') => {
    try {
      const status = action === 'confirm' ? 'confirmed' : 'cancelled';
      
      const response = await fetch('/api/appointments/update-status', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appointmentId,
          status,
          userId: user?.id,
        }),
      });

      if (response.ok) {
        alert(`Appointment ${action === 'confirm' ? 'confirmed' : 'cancelled'} successfully!`);
        await loadSellerData(); // Reload data
      } else {
        const error = await response.json();
        alert(`Failed to ${action} appointment: ${error.error}`);
      }
    } catch (error) {
      console.error('Error updating appointment:', error);
      alert(`Failed to ${action} appointment`);
    }
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

  if (!isGoogleConnected) {
    return (
      <div className="text-center p-8">
        <h3 className="text-lg font-semibold mb-4">Connect Your Google Calendar</h3>
        <p className="mb-4">To manage appointments and availability, please connect your Google Calendar first.</p>
        <Button onClick={() => window.location.href = '/api/auth/google?state=seller'}>
          Connect Google Calendar
        </Button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading seller dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Seller Dashboard</h2>
        <div className="flex space-x-2">
          <Button onClick={loadSellerData} variant="outline">
            Refresh
          </Button>
        </div>
      </div>

      {/* Business Profile Card */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Business Profile</CardTitle>
              <CardDescription>
                Manage your business information and availability settings
              </CardDescription>
            </div>
            <Button 
              onClick={() => setIsEditing(!isEditing)}
              variant={isEditing ? "outline" : "default"}
            >
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Business Name</label>
                <input
                  type="text"
                  value={formData.business_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, business_name: e.target.value }))}
                  placeholder="Your business or service name"
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your services..."
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="City, State or Region"
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div className="flex space-x-2">
                <Button onClick={handleSaveProfile} disabled={loading}>
                  {loading ? 'Saving...' : 'Save Profile'}
                </Button>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {sellerProfile ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900">Business Name</h4>
                    <p className="text-gray-600">{sellerProfile.business_name || 'Not set'}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Location</h4>
                    <p className="text-gray-600">{sellerProfile.location || 'Not set'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <h4 className="font-medium text-gray-900">Description</h4>
                    <p className="text-gray-600">{sellerProfile.description || 'No description provided'}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Status</h4>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      sellerProfile.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {sellerProfile.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No business profile found</p>
                  <Button onClick={() => setIsEditing(true)}>
                    Create Profile
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Appointments */}
      {pendingAppointments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>Pending Appointments</span>
              <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
                {pendingAppointments.length}
              </span>
            </CardTitle>
            <CardDescription>
              Review and respond to appointment requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingAppointments.map((appointment) => {
                const { date, time } = formatDateTime(appointment.start_time)
                const { time: endTime } = formatDateTime(appointment.end_time)
                
                return (
                  <div key={appointment.id} className="border border-yellow-200 bg-yellow-50 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-medium text-gray-900">{appointment.title}</h4>
                        <p className="text-sm text-gray-600">
                          with {appointment.user_profiles.full_name}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          onClick={() => handleAppointmentAction(appointment.id, 'confirm')}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Confirm
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAppointmentAction(appointment.id, 'cancel')}
                          className="text-red-600 border-red-600 hover:bg-red-50"
                        >
                          Decline
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Date: </span>
                        <span>{date}</span>
                      </div>
                      <div>
                        <span className="font-medium">Time: </span>
                        <span>{time} - {endTime}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="font-medium">Contact: </span>
                        <span>{appointment.user_profiles.email}</span>
                      </div>
                      {appointment.description && (
                        <div className="col-span-2">
                          <span className="font-medium">Notes: </span>
                          <span>{appointment.description}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {pendingAppointments.length}
              </div>
              <p className="text-sm text-gray-600">Pending Requests</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {isGoogleConnected ? '✓' : '✗'}
              </div>
              <p className="text-sm text-gray-600">Google Calendar</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {sellerProfile?.is_active ? 'Active' : 'Inactive'}
              </div>
              <p className="text-sm text-gray-600">Profile Status</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Seller