import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export async function GET() {
  try {
    const supabase = createAdminClient()

    // إحصائيات شاملة
    const { data: allSearches } = await supabase
      .from('search_requests')
      .select('status, created_at, matched_at')

    if (!allSearches) {
      return NextResponse.json({
        success: true,
        stats: {
          total_searches: 0,
          matched: 0,
          pending: 0,
          expired: 0,
          match_rate: 0
        }
      })
    }

    const total = allSearches.length
    const matched = allSearches.filter(s => s.status === 'matched').length
    const pending = allSearches.filter(s => s.status === 'pending').length
    const expired = allSearches.filter(s => s.status === 'expired').length
    const matchRate = total > 0 ? Math.round((matched / total) * 100) : 0

    return NextResponse.json({
      success: true,
      stats: {
        total_searches: total,
        matched,
        pending,
        expired,
        match_rate: matchRate
      }
    })

  } catch (error: any) {
    console.error('Stats error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في جلب الإحصائيات', details: error.message },
      { status: 500 }
    )
  }
}