import { NextRequest, NextResponse } from 'next/server'
import supabase from '@/lib/supabase'

export async function POST() {
  try {
    // First create a test user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        full_name: 'Test Seller',
        email: 'testseller@example.com',
        role: 'seller'
      })
      .select()
      .single()

    if (profileError) {
      throw new Error(`Profile creation failed: ${profileError.message}`)
    }

    // Then create a seller profile
    const { data: seller, error: sellerError } = await supabase
      .from('sellers')
      .insert({
        user_id: profile.id,
        business_name: 'Test Business Solutions',
        description: 'We provide comprehensive business consulting services',
        location: 'New York, NY',
        is_active: true,
        availability_settings: {
          workDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          workHours: { start: '09:00', end: '17:00' }
        }
      })
      .select()
      .single()

    if (sellerError) {
      throw new Error(`Seller creation failed: ${sellerError.message}`)
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Test data created successfully',
      profile,
      seller
    })

  } catch (error: any) {
    console.error('Error creating test data:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error.message 
      }, 
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    // Test database connectivity and return current data
    const { data: sellers, error: sellersError } = await supabase
      .from('sellers')
      .select(`
        *,
        user_profiles (
          full_name,
          email
        )
      `)

    if (sellersError) {
      throw new Error(`Sellers query failed: ${sellersError.message}`)
    }

    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('*')

    if (profilesError) {
      throw new Error(`Profiles query failed: ${profilesError.message}`)
    }

    return NextResponse.json({
      success: true,
      sellers: sellers || [],
      profiles: profiles || [],
      counts: {
        sellers: sellers?.length || 0,
        profiles: profiles?.length || 0
      }
    })

  } catch (error: any) {
    console.error('Error fetching data:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error.message 
      }, 
      { status: 500 }
    )
  }
}