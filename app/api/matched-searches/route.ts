import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export async function GET() {
  try {
    const supabase = createAdminClient()

    // جلب طلبات البحث التي تم إيجادها (status = 'matched')
    // مع معلومات العربية الموجودة (JOIN)
    const { data: searches, error } = await supabase
      .from('search_requests')
      .select(`
        *,
        found_vehicle:found_vehicles!search_requests_matched_vehicle_id_fkey (
          id,
          car_name,
          chassis_full,
          chassis_digits,
          plate_full,
          plate_digits,
          color,
          source,
          contact_number,
          uploaded_by,
          uploaded_at
        )
      `)
      .eq('status', 'matched')
      .order('matched_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'فشل جلب البيانات', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      searches: searches || [],
      count: searches?.length || 0
    })

  } catch (error: any) {
    console.error('Server error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في الخادم', details: error.message },
      { status: 500 }
    )
  }
}