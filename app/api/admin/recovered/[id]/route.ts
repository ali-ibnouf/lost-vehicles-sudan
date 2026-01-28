// ===================================
// الملف: app/api/admin/recovered/[id]/route.ts
// ===================================

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// PATCH - تحديث عربية مسترجعة
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization')
    const expectedToken = `Bearer ${process.env.ADMIN_SECRET}`
    
    if (!authHeader || authHeader !== expectedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      recovery_status,
      recovery_location,
      recovery_notes,
      ownership_verified,
      documents_checked,
      reward_paid,
      reward_recipient
    } = body

    const updateData: any = {
      updated_by: 'admin',
      updated_at: new Date().toISOString()
    }

    if (recovery_status) {
      updateData.recovery_status = recovery_status
      
      // إذا تم الاسترجاع، سجل التاريخ
      if (recovery_status === 'recovered' && !updateData.recovery_date) {
        updateData.recovery_date = new Date().toISOString()
      }
    }

    if (recovery_location !== undefined) {
      updateData.recovery_location = recovery_location
    }

    if (recovery_notes !== undefined) {
      updateData.recovery_notes = recovery_notes
    }

    if (ownership_verified !== undefined) {
      updateData.ownership_verified = ownership_verified
    }

    if (documents_checked !== undefined) {
      updateData.documents_checked = documents_checked
    }

    if (reward_paid !== undefined) {
      updateData.reward_paid = reward_paid
      
      // إذا تم الدفع، سجل التاريخ
      if (reward_paid) {
        updateData.reward_paid_date = new Date().toISOString()
      }
    }

    if (reward_recipient !== undefined) {
      updateData.reward_recipient = reward_recipient
    }

    const { data, error } = await supabase
      .from('recovered_vehicles')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      vehicle: data,
      message: 'تم التحديث بنجاح'
    })

  } catch (error) {
    console.error('Update recovered vehicle error:', error)
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 })
  }
}

// GET - الحصول على عربية واحدة
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization')
    const expectedToken = `Bearer ${process.env.ADMIN_SECRET}`
    
    if (!authHeader || authHeader !== expectedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('recovered_vehicles')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error) throw error

    return NextResponse.json({ vehicle: data })
  } catch (error) {
    console.error('Get vehicle error:', error)
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }
}