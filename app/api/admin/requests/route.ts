// ===================================
// الملف: app/api/admin/requests/route.ts
// ===================================

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { normalizeDigits, validateWhatsApp } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const expectedToken = `Bearer ${process.env.ADMIN_SECRET}`
    
    if (!authHeader || authHeader !== expectedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      whatsapp, 
      chassis, 
      plate, 
      carName, 
      description, 
      reward, 
      priority = 'normal',
      phoneSecondary,
      notes 
    } = body

    if (!whatsapp?.trim()) {
      return NextResponse.json({ error: 'رقم الواتساب مطلوب' }, { status: 400 })
    }

    if (!validateWhatsApp(whatsapp)) {
      return NextResponse.json({ error: 'رقم الواتساب غير صحيح' }, { status: 400 })
    }

    const chassisClean = normalizeDigits(chassis)
    const plateClean = normalizeDigits(plate)

    if (!chassisClean && !plateClean) {
      return NextResponse.json({ error: 'رقم الشاسي أو اللوحة مطلوب' }, { status: 400 })
    }

    const { data: newRequest, error: insertError } = await supabase
      .from('search_requests')
      .insert({
        whatsapp: whatsapp.trim(),
        chassis_digits: chassisClean || null,
        plate_digits: plateClean || null,
        car_name: carName?.trim() || null,
        vehicle_description: description?.trim() || null,
        reward_amount: reward || null,
        reward_currency: 'SDG',
        priority: priority,
        contact_phone_secondary: phoneSecondary?.trim() || null,
        notes: notes?.trim() || null,
        source: 'admin',
        status: 'pending'
      })
      .select()
      .single()

    if (insertError) throw insertError

    // بحث فوري
    let matchQuery = supabase.from('found_vehicles').select('*')

    if (chassisClean) {
      matchQuery = matchQuery.ilike('chassis_digits', `%${chassisClean}%`)
    }

    if (plateClean && !chassisClean) {
      matchQuery = matchQuery.eq('plate_digits', plateClean)
    } else if (plateClean && chassisClean) {
      matchQuery = supabase
        .from('found_vehicles')
        .select('*')
        .or(`chassis_digits.ilike.%${chassisClean}%,plate_digits.eq.${plateClean}`)
    }

    const { data: matches } = await matchQuery

    if (matches && matches.length > 0) {
      const matchRecords = matches.map(match => {
        const matchType = 
          (chassisClean && match.chassis_digits?.includes(chassisClean)) &&
          (plateClean && match.plate_digits === plateClean)
            ? 'both'
            : chassisClean && match.chassis_digits?.includes(chassisClean)
            ? 'chassis'
            : 'plate'

        const confidence = matchType === 'both' ? 1.0 : matchType === 'plate' ? 0.9 : 0.8

        return {
          search_request_id: newRequest.id,
          found_vehicle_id: match.id,
          match_type: matchType,
          match_confidence: confidence,
          notified: false
        }
      })

      await supabase.from('vehicle_matches').insert(matchRecords)

      await supabase
        .from('search_requests')
        .update({ 
          status: 'matched',
          matched_vehicle_id: matches[0].id
        })
        .eq('id', newRequest.id)
    }

    return NextResponse.json({
      success: true,
      request: newRequest,
      matches: matches || [],
      message: matches && matches.length > 0
        ? `✅ تم! وجدنا ${matches.length} تطابق${reward ? ` - المكافأة: ${reward.toLocaleString()} جنيه` : ''}`
        : `تم حفظ الطلب${reward ? ` - المكافأة: ${reward.toLocaleString()} جنيه` : ''}`
    })

  } catch (error) {
    console.error('Add request error:', error)
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const expectedToken = `Bearer ${process.env.ADMIN_SECRET}`
    
    if (!authHeader || authHeader !== expectedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'pending'

    let query = supabase
      .from('search_requests')
      .select('*')
      .order('created_at', { ascending: false })

    if (status !== 'all') {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({ requests: data })
  } catch (error) {
    console.error('Get requests error:', error)
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }
}
