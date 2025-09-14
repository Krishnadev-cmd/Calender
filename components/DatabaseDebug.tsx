'use client'

import { useState, useEffect } from 'react'
import supabase from '@/lib/supabase'

export default function DatabaseDebug() {
  const [sellersData, setSellersData] = useState<any[]>([])
  const [profilesData, setProfilesData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    testDatabase()
  }, [])

  const testDatabase = async () => {
    setLoading(true)
    setError(null)

    try {
      console.log('Testing Supabase connection...')
      
      // Test basic connection
      const { data: testData, error: testError } = await supabase
        .from('user_profiles')
        .select('count')
        .single()
      
      if (testError) {
        console.error('Connection test failed:', testError)
        setError(`Connection failed: ${testError.message}`)
        return
      }

      // Test sellers table
      console.log('Fetching sellers...')
      const { data: sellers, error: sellersError } = await supabase
        .from('sellers')
        .select('*')

      if (sellersError) {
        console.error('Sellers query failed:', sellersError)
        setError(`Sellers query failed: ${sellersError.message}`)
      } else {
        console.log('Sellers found:', sellers)
        setSellersData(sellers || [])
      }

      // Test user_profiles table
      console.log('Fetching profiles...')
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('*')

      if (profilesError) {
        console.error('Profiles query failed:', profilesError)
        setError(`Profiles query failed: ${profilesError.message}`)
      } else {
        console.log('Profiles found:', profiles)
        setProfilesData(profiles || [])
      }

    } catch (err) {
      console.error('Unexpected error:', err)
      setError(`Unexpected error: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  const createTestData = async () => {
    try {
      // First create a user profile
      const { data: newProfile, error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          full_name: 'Test Seller',
          email: 'testseller@example.com',
          role: 'seller'
        })
        .select()
        .single()

      if (profileError) {
        console.error('Failed to create profile:', profileError)
        setError(`Failed to create profile: ${profileError.message}`)
        return
      }

      // Then create a seller profile
      const { data: newSeller, error: sellerError } = await supabase
        .from('sellers')
        .insert({
          user_id: newProfile.id,
          business_name: 'Test Business',
          description: 'A test business for debugging',
          location: 'Test Location',
          is_active: true
        })
        .select()
        .single()

      if (sellerError) {
        console.error('Failed to create seller:', sellerError)
        setError(`Failed to create seller: ${sellerError.message}`)
        return
      }

      console.log('Test data created successfully!')
      testDatabase() // Refresh data
    } catch (err) {
      console.error('Error creating test data:', err)
      setError(`Error creating test data: ${err}`)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Database Debug Panel</h1>
      
      {loading && <p>Loading...</p>}
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-xl font-semibold mb-3">Sellers Data ({sellersData.length})</h2>
          <div className="bg-gray-100 p-4 rounded-lg">
            <pre className="text-sm overflow-auto">
              {JSON.stringify(sellersData, null, 2)}
            </pre>
          </div>
        </div>
        
        <div>
          <h2 className="text-xl font-semibold mb-3">User Profiles Data ({profilesData.length})</h2>
          <div className="bg-gray-100 p-4 rounded-lg">
            <pre className="text-sm overflow-auto">
              {JSON.stringify(profilesData, null, 2)}
            </pre>
          </div>
        </div>
      </div>
      
      <div className="mt-6 space-x-4">
        <button 
          onClick={testDatabase}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Refresh Data
        </button>
        <button 
          onClick={createTestData}
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
        >
          Create Test Data
        </button>
      </div>
    </div>
  )
}