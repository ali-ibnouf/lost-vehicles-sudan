import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

// Database Types
export type Vehicle = {
  id: string
  car_name: string
  chassis_full?: string
  chassis_digits: string
  plate_full?: string
  plate_digits?: string
  extra_details?: string
  created_at: string
  uploaded_by?: string
}

export type SearchRequest = {
  id: string
  whatsapp: string
  chassis_digits?: string
  plate_digits?: string
  car_name?: string
  status: 'pending' | 'matched' | 'expired'
  created_at: string
  matched_vehicle_id?: string
}

export type SearchAnalytics = {
  id: string
  search_type: 'chassis' | 'plate' | 'both'
  results_count: number
  response_time_ms: number
  created_at: string
}
