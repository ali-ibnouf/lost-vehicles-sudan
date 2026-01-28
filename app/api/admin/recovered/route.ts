// ===================================
// الملف: app/api/admin/recovered/route.ts
// ===================================

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { normalizeDigits, validateWhatsApp } from '@/lib/utils'

// GET - الحصول على العربات المسترجعة
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const expectedToken = `Bearer ${process.env.ADMIN_SECRET}`
    
    if (!authHeader || authHeader !== expectedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = searchParams.get('limit') || '50'

    let query = supabase
      .from('recovered_vehicles')
      .select('*')
      .order('contact_date', { ascending: false })
      .limit(parseInt(limit))

    if (status && status !== 'all') {
      query = query.eq('recovery_status', status)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({ vehicles: data })
  } catch (error) {
    console.error('Get recovered vehicles error:', error)
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }
}

// POST - إضافة عربية مسترجعة
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const expectedToken = `Bearer ${process.env.ADMIN_SECRET}`
    
    if (!authHeader || authHeader !== expectedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      owner_whatsapp,
      owner_phone_secondary,
      owner_name,
      car_name,
      chassis_digits,
      plate_digits,
      contact_method = 'whatsapp',
      contact_notes,
      reward_amount,
      priority = 'normal'
    } = body

    // Validation
    if (!owner_whatsapp || !owner_whatsapp.trim()) {
      return NextResponse.json({ error: 'رقم الواتساب مطلوب' }, { status: 400 })
    }

    if (!validateWhatsApp(owner_whatsapp)) {
      return NextResponse.json({ error: 'رقم الواتساب غير صحيح' }, { status: 400 })
    }

    if (!car_name || !car_name.trim()) {
      return NextResponse.json({ error: 'اسم العربية مطلوب' }, { status: 400 })
    }

    const chassisClean = normalizeDigits(chassis_digits)
    if (!chassisClean || chassisClean.length < 6) {
      return NextResponse.json({ error: 'رقم الشاسي مطلوب (6 أرقام على الأقل)' }, { status: 400 })
    }

    const plateClean = normalizeDigits(plate_digits)

    // إضافة السجل
    const { data: newVehicle, error: insertError } = await supabase
      .from('recovered_vehicles')
      .insert({
        owner_whatsapp: owner_whatsapp.trim(),
        owner_phone_secondary: owner_phone_secondary?.trim() || null,
        owner_name: owner_name?.trim() || null,
        car_name: car_name.trim(),
        chassis_digits: chassisClean,
        plate_digits: plateClean || null,
        contact_method,
        contact_notes: contact_notes?.trim() || null,
        reward_amount: reward_amount || null,
        reward_currency: 'SDG',
        priority,
        recovery_status: 'contacted',
        contacted_by: 'admin',
        created_by: 'admin'
      })
      .select()
      .single()

    if (insertError) throw insertError

    return NextResponse.json({
      success: true,
      vehicle: newVehicle,
      message: 'تم إضافة العربية بنجاح'
    })

  } catch (error) {
    console.error('Add recovered vehicle error:', error)
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 })
  }
}