import { NextRequest, NextResponse } from 'next/server'
import supabase from '@/lib/supabase'
import { googleCalendarService } from '@/lib/googleCalendar'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      buyer_id, 
      seller_id, 
      title, 
      description, 
      start_time, 
      end_time,
      buyer_email,
      seller_email 
    } = body

    // Create appointment in database
    const { data: appointment, error } = await supabase
      .from('appointments')
      .insert({
        buyer_id,
        seller_id,
        title,
        description,
        start_time,
        end_time,
        status: 'pending',
        buyer_email,
        seller_email
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to create appointment' },
        { status: 500 }
      )
    }

    // TODO: Create Google Calendar events for both buyer and seller
    // This will be implemented when Google Calendar OAuth is fully set up
    
    return NextResponse.json({ 
      success: true, 
      appointment 
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const user_id = searchParams.get('user_id')
    const role = searchParams.get('role')

    if (!user_id || !role) {
      return NextResponse.json(
        { error: 'Missing user_id or role parameter' },
        { status: 400 }
      )
    }

    let appointments;

    if (role === 'buyer') {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          title,
          description,
          start_time,
          end_time,
          status,
          sellers!inner (
            business_name,
            location,
            user_profiles (
              full_name,
              email
            )
          )
        `)
        .eq('buyer_id', user_id)
        .order('start_time', { ascending: true })

      if (error) {
        console.error('Database error:', error)
        return NextResponse.json(
          { error: 'Failed to fetch appointments' },
          { status: 500 }
        )
      }

      appointments = data
    } else if (role === 'seller') {
      // First get seller ID from user_id
      const { data: seller } = await supabase
        .from('sellers')
        .select('id')
        .eq('user_id', user_id)
        .single()

      if (!seller) {
        return NextResponse.json(
          { error: 'Seller not found' },
          { status: 404 }
        )
      }

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
        console.error('Database error:', error)
        return NextResponse.json(
          { error: 'Failed to fetch appointments' },
          { status: 500 }
        )
      }

      appointments = data
    }

    return NextResponse.json({ 
      success: true, 
      appointments: appointments || []
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}