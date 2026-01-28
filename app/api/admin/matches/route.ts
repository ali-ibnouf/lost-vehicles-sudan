// ===================================
// الملف: app/api/admin/matches/route.ts
// ===================================

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const expectedToken = `Bearer ${process.env.ADMIN_SECRET}`
    
    if (!authHeader || authHeader !== expectedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const notifiedOnly = searchParams.get('notified') === 'false'

    let query = supabase
      .from('vehicle_matches')
      .select(`
        *,
        search_request:search_requests(*),
        found_vehicle:found_vehicles(*)
      `)
      .order('matched_at', { ascending: false })

    if (notifiedOnly) {
      query = query.eq('notified', false)
    }

    const { data, error } = await query

    if (error) throw error

    const matches = data?.map(match => ({
      id: match.id,
      matchType: match.match_type,
      confidence: match.match_confidence,
      matchedAt: match.matched_at,
      notified: match.notified,
      request: {
        id: match.search_request.id,
        whatsapp: match.search_request.whatsapp,
        phoneSecondary: match.search_request.contact_phone_secondary,
        carName: match.search_request.car_name,
        description: match.search_request.vehicle_description,
        reward: match.search_request.reward_amount,
        currency: match.search_request.reward_currency,
        priority: match.search_request.priority
      },
      vehicle: {
        id: match.found_vehicle.id,
        carName: match.found_vehicle.car_name,
        chassisFull: match.found_vehicle.chassis_full,
        plateFull: match.found_vehicle.plate_full,
        details: match.found_vehicle.extra_details
      }
    }))

    return NextResponse.json({ matches })
  } catch (error) {
    console.error('Get matches error:', error)
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const expectedToken = `Bearer ${process.env.ADMIN_SECRET}`
    
    if (!authHeader || authHeader !== expectedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { matchId, notified } = body

    if (!matchId) {
      return NextResponse.json({ error: 'Match ID required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('vehicle_matches')
      .update({
        notified: notified,
        notified_at: notified ? new Date().toISOString() : null
      })
      .eq('id', matchId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update match error:', error)
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}
