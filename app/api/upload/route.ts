import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { parseBulkVehicles, validateParsedVehicle } from '@/lib/parser'

export async function POST(request: NextRequest) {
  try {
    // التحقق من Admin token
    const authHeader = request.headers.get('authorization')
    const expectedToken = `Bearer ${process.env.ADMIN_SECRET}`
    
    if (!authHeader || authHeader !== expectedToken) {
      return NextResponse.json(
        { error: 'غير مصرح - Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { bulkText } = body

    if (!bulkText || !bulkText.trim()) {
      return NextResponse.json(
        { error: 'النص مطلوب' },
        { status: 400 }
      )
    }

    // تحليل النص
    const { success, errors, stats } = parseBulkVehicles(bulkText)

    if (success.length === 0) {
      return NextResponse.json({
        success: 0,
        failed: errors.length,
        message: 'لم يتم التعرف على أي سطر بشكل صحيح',
        errors,
        stats
      })
    }

    // التحقق من صحة البيانات
    const validVehicles = []
    const invalidVehicles = []

    for (const vehicle of success) {
      const validation = validateParsedVehicle(vehicle)
      if (validation.isValid) {
        validVehicles.push(vehicle)
      } else {
        invalidVehicles.push({
          data: vehicle,
          errors: validation.errors
        })
      }
    }

    // رفع البيانات الصحيحة إلى Supabase
    if (validVehicles.length > 0) {
      const { error: insertError } = await supabase
        .from('found_vehicles')
        .insert(validVehicles.map(v => ({
          car_name: v.car_name,
          chassis_full: v.chassis_full,
          chassis_digits: v.chassis_digits,
          plate_full: v.plate_full,
          plate_digits: v.plate_digits,
          extra_details: v.extra_details,
          uploaded_by: 'admin'
        })))

      if (insertError) {
        console.error('Insert error:', insertError)
        throw insertError
      }
    }

    return NextResponse.json({
      success: validVehicles.length,
      failed: errors.length + invalidVehicles.length,
      message: `تم رفع ${validVehicles.length} عربية بنجاح`,
      validCount: validVehicles.length,
      invalidCount: invalidVehicles.length,
      unparsedCount: errors.length,
      errors: errors,
      invalidVehicles: invalidVehicles,
      stats
    })

  } catch (error) {
    console.error('Upload API error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في الرفع، الرجاء المحاولة مرة أخرى' },
      { status: 500 }
    )
  }
}
