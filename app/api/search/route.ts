import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { normalizeDigits, validateWhatsApp } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { whatsapp, chassis, plate, carName } = body

    // Validation
    if (!whatsapp || !whatsapp.trim()) {
      return NextResponse.json(
        { error: 'رقم الواتساب مطلوب' },
        { status: 400 }
      )
    }

    if (!validateWhatsApp(whatsapp)) {
      return NextResponse.json(
        { error: 'رقم الواتساب غير صحيح' },
        { status: 400 }
      )
    }

    const chassisClean = normalizeDigits(chassis)
    const plateClean = normalizeDigits(plate)

    if (!chassisClean && !plateClean) {
      return NextResponse.json(
        { error: 'رقم الشاسي أو اللوحة مطلوب' },
        { status: 400 }
      )
    }

    const startTime = Date.now()

    // Build the query
    let query = supabase.from('found_vehicles').select('*')

    // البحث بالشاسي (جزئي - suffix match)
    if (chassisClean) {
      // البحث عن أي رقم شاسي يحتوي على الأرقام المدخلة
      query = query.ilike('chassis_digits', `%${chassisClean}%`)
    }

    // البحث باللوحة (دقيق)
    if (plateClean && !chassisClean) {
      query = query.eq('plate_digits', plateClean)
    } else if (plateClean && chassisClean) {
      // إذا كان هناك بحث بالاثنين، نستخدم OR
      query = supabase
        .from('found_vehicles')
        .select('*')
        .or(`chassis_digits.ilike.%${chassisClean}%,plate_digits.eq.${plateClean}`)
    }

    const { data: results, error } = await query

    if (error) {
      console.error('Search error:', error)
      throw error
    }

    const responseTime = Date.now() - startTime

    // إذا لم نجد نتائج، نحفظ الطلب
    if (!results || results.length === 0) {
      // حفظ طلب البحث
      const { error: insertError } = await supabase
        .from('search_requests')
        .insert({
          whatsapp: whatsapp.trim(),
          chassis_digits: chassisClean || null,
          plate_digits: plateClean || null,
          car_name: carName?.trim() || null,
          status: 'pending'
        })

      if (insertError) {
        console.error('Error saving search request:', insertError)
      }

      // تسجيل Analytics
      await supabase.from('search_analytics').insert({
        search_type: chassisClean && plateClean ? 'both' : chassisClean ? 'chassis' : 'plate',
        results_count: 0,
        response_time_ms: responseTime
      })

      return NextResponse.json({
        found: false,
        message: 'لم يتم العثور على نتائج - تم حفظ طلبك وسنتواصل معك عند توفر معلومات',
        results: [],
        responseTime
      })
    }

    // تسجيل Analytics للبحث الناجح
    await supabase.from('search_analytics').insert({
      search_type: chassisClean && plateClean ? 'both' : chassisClean ? 'chassis' : 'plate',
      results_count: results.length,
      response_time_ms: responseTime
    })

    return NextResponse.json({
      found: true,
      message: `تم العثور على ${results.length} نتيجة`,
      results,
      responseTime
    })

  } catch (error) {
    console.error('Search API error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في البحث، الرجاء المحاولة مرة أخرى' },
      { status: 500 }
    )
  }
}

// GET endpoint للإحصائيات (اختياري)
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('search_analytics')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) throw error

    return NextResponse.json({ data })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}
