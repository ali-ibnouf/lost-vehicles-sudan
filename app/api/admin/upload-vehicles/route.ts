import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import type { ParsedVehicle } from '@/lib/parsers/vehicle-list-parser'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { vehicles, contactNumber, listName } = body as {
      vehicles: ParsedVehicle[]
      contactNumber: string | null
      listName: string
    }

    if (!vehicles || vehicles.length === 0) {
      return NextResponse.json(
        { error: 'لا توجد عربات للحفظ' },
        { status: 400 }
      )
    }

    // ✅ استخدام Admin Client (Service Role Key)
    const supabase = createAdminClient()

    let successCount = 0
    let errorCount = 0
    const errors: string[] = []

    // رفع كل عربية
    for (const vehicle of vehicles) {
      try {
        const { error } = await supabase
          .from('found_vehicles')
          .insert({
            car_name: vehicle.car_name,
            chassis_full: vehicle.chassis_full || null,
            chassis_digits: vehicle.chassis_digits || null,
            plate_full: vehicle.plate_full || null,
            plate_digits: vehicle.plate_digits || null,
            color: vehicle.color || null,
            extra_details: vehicle.extra_details,
            source: listName || 'admin_upload',
            contact_number: contactNumber,
            uploaded_by: contactNumber || 'admin',
            uploaded_at: new Date().toISOString()
          })

        if (error) {
          if (error.code === '23505') {
            const duplicateInfo = vehicle.chassis_digits 
              ? `شاسي ${vehicle.chassis_digits}` 
              : `لوحة ${vehicle.plate_full}`
            errors.push(`السطر ${vehicle.line_number}: ${duplicateInfo} موجود مسبقاً`)
          } else {
            errors.push(`السطر ${vehicle.line_number}: ${error.message}`)
          }
          errorCount++
        } else {
          successCount++
        }
      } catch (err: any) {
        errors.push(`السطر ${vehicle.line_number}: ${err.message}`)
        errorCount++
      }
    }

    return NextResponse.json({
      success: true,
      successCount,
      errorCount,
      errors
    })

  } catch (error: any) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: error.message || 'حدث خطأ في الرفع' },
      { status: 500 }
    )
  }
}