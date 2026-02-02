import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// ✅ Client Supabase - للاستخدام في الصفحات (Client Components)
// يستخدم ANON_KEY - آمن وعام
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

// ✅ Admin Supabase - للاستخدام في API Routes فقط
// يستخدم SERVICE_ROLE_KEY - صلاحيات كاملة
export function createAdminClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!serviceKey) {
    console.warn('SUPABASE_SERVICE_ROLE_KEY not found, using anon key')
    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  }
  
  return createClient(supabaseUrl, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

// Database Types
export type Vehicle = {
  id: string
  car_name: string
  chassis_full?: string
  chassis_digits: string
  plate_full?: string
  plate_digits?: string
  color?: string
  extra_details?: string
  created_at: string
  uploaded_by?: string
  uploaded_at?: string
  source?: string
}

export type FoundVehicle = Vehicle

export type SearchRequest = {
  id: string
  whatsapp: string
  chassis_digits?: string
  plate_digits?: string
  car_name?: string
  status: 'pending' | 'matched' | 'expired'
  created_at: string
  matched_vehicle_id?: string
  contact_phone_secondary?: string
  vehicle_description?: string
  reward_amount?: number
  reward_currency?: string
  priority?: string
  notes?: string
  admin_notes?: string
}

export type RecoveredVehicle = {
  id: string
  found_vehicle_id?: string
  search_request_id?: string
  match_id?: string
  owner_name?: string
  owner_whatsapp: string
  owner_phone_secondary?: string
  car_name: string
  chassis_full?: string
  chassis_digits: string
  plate_full?: string
  plate_digits?: string
  contact_date: string
  contacted_by?: string
  contact_method?: string
  contact_notes?: string
  recovery_status: 'contacted' | 'verified' | 'scheduled' | 'recovered' | 'rejected' | 'cancelled'
  recovery_date?: string
  recovery_location?: string
  recovery_notes?: string
  reward_paid: boolean
  reward_amount?: number
  reward_currency?: string
  reward_paid_date?: string
  reward_recipient?: string
  ownership_verified: boolean
  documents_checked: boolean
  priority: string
  admin_notes?: string
  created_at: string
  updated_at: string
}

export type VehicleMatch = {
  id: string
  search_request_id: string
  found_vehicle_id: string
  match_type: 'exact' | 'partial'
  match_confidence: number
  matched_fields: string[]
  created_at: string
  notified: boolean
}

export type SearchAnalytics = {
  id: string
  search_type: 'chassis' | 'plate' | 'both'
  results_count: number
  response_time_ms: number
  created_at: string
}