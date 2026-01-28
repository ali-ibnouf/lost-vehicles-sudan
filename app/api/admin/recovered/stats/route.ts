// ===================================
// الملف: app/api/admin/recovered/stats/route.ts
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

    // استدعاء function الإحصائيات من Database
    const { data, error } = await supabase.rpc('get_recovery_stats')

    if (error) {
      // إذا فشل RPC، نحسب يدوياً
      const { data: vehicles, error: fetchError } = await supabase
        .from('recovered_vehicles')
        .select('recovery_status, reward_paid, reward_amount')

      if (fetchError) throw fetchError

      const stats = {
        total_recovered: vehicles?.length || 0,
        contacted: vehicles?.filter(v => v.recovery_status === 'contacted').length || 0,
        verified: vehicles?.filter(v => v.recovery_status === 'verified').length || 0,
        scheduled: vehicles?.filter(v => v.recovery_status === 'scheduled').length || 0,
        recovered: vehicles?.filter(v => v.recovery_status === 'recovered').length || 0,
        rejected: vehicles?.filter(v => v.recovery_status === 'rejected').length || 0,
        rewards_paid: vehicles?.filter(v => v.reward_paid).length || 0,
        total_rewards: vehicles
          ?.filter(v => v.reward_paid && v.reward_amount)
          .reduce((sum, v) => sum + (v.reward_amount || 0), 0) || 0,
        pending_rewards: vehicles
          ?.filter(v => !v.reward_paid && v.reward_amount)
          .reduce((sum, v) => sum + (v.reward_amount || 0), 0) || 0
      }

      return NextResponse.json({ stats })
    }

    return NextResponse.json({ stats: data })

  } catch (error) {
    console.error('Get stats error:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
