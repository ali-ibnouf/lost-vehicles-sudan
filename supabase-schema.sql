-- ===================================
-- Lost Vehicles Sudan - Database Schema
-- ===================================

-- تفعيل التوسعة للبحث النصي
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ===================================
-- 1. جدول العربات الموجودة
-- ===================================

CREATE TABLE IF NOT EXISTS found_vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    car_name TEXT NOT NULL,
    chassis_full TEXT,
    chassis_digits TEXT NOT NULL,
    plate_full TEXT,
    plate_digits TEXT,
    extra_details TEXT,
    uploaded_by TEXT DEFAULT 'admin',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT chassis_min_length CHECK (length(chassis_digits) >= 6),
    CONSTRAINT chassis_digits_format CHECK (chassis_digits ~ '^[0-9]+$')
);

-- Indexes للبحث السريع
CREATE INDEX IF NOT EXISTS idx_chassis_digits ON found_vehicles USING gin (chassis_digits gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_chassis_digits_btree ON found_vehicles (chassis_digits);
CREATE INDEX IF NOT EXISTS idx_plate_digits ON found_vehicles (plate_digits);
CREATE INDEX IF NOT EXISTS idx_created_at ON found_vehicles (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_car_name ON found_vehicles USING gin (car_name gin_trgm_ops);

-- Trigger لتحديث updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_found_vehicles_updated_at BEFORE UPDATE ON found_vehicles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===================================
-- 2. جدول طلبات البحث
-- ===================================

CREATE TABLE IF NOT EXISTS search_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    whatsapp TEXT NOT NULL,
    chassis_digits TEXT,
    plate_digits TEXT,
    car_name TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'matched', 'expired')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    matched_vehicle_id UUID REFERENCES found_vehicles(id) ON DELETE SET NULL,
    matched_at TIMESTAMPTZ,
    
    -- Constraints
    CONSTRAINT require_search_criteria CHECK (
        chassis_digits IS NOT NULL OR plate_digits IS NOT NULL
    )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_search_status ON search_requests (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_whatsapp ON search_requests (whatsapp);
CREATE INDEX IF NOT EXISTS idx_search_chassis ON search_requests (chassis_digits);

-- ===================================
-- 3. جدول الإحصائيات
-- ===================================

CREATE TABLE IF NOT EXISTS search_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    search_type TEXT NOT NULL CHECK (search_type IN ('chassis', 'plate', 'both')),
    results_count INTEGER NOT NULL DEFAULT 0,
    response_time_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Additional analytics fields
    user_agent TEXT,
    ip_address TEXT
);

-- Index
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON search_analytics (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_type ON search_analytics (search_type);

-- ===================================
-- 4. Row Level Security (RLS)
-- ===================================

-- تفعيل RLS على جميع الجداول
ALTER TABLE found_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_analytics ENABLE ROW LEVEL SECURITY;

-- Policies للعربات الموجودة
CREATE POLICY "Anyone can read found vehicles"
    ON found_vehicles FOR SELECT
    USING (true);

CREATE POLICY "Only authenticated users can insert vehicles"
    ON found_vehicles FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Only authenticated users can update vehicles"
    ON found_vehicles FOR UPDATE
    USING (auth.role() = 'authenticated');

-- Policies لطلبات البحث
CREATE POLICY "Anyone can create search requests"
    ON search_requests FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Only authenticated users can read search requests"
    ON search_requests FOR SELECT
    USING (auth.role() = 'authenticated');

-- Policies للإحصائيات
CREATE POLICY "Anyone can insert analytics"
    ON search_analytics FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Only authenticated users can read analytics"
    ON search_analytics FOR SELECT
    USING (auth.role() = 'authenticated');

-- ===================================
-- 5. Functions مساعدة
-- ===================================

-- دالة للبحث المتقدم
CREATE OR REPLACE FUNCTION search_vehicles(
    p_chassis TEXT DEFAULT NULL,
    p_plate TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    car_name TEXT,
    chassis_full TEXT,
    chassis_digits TEXT,
    plate_full TEXT,
    plate_digits TEXT,
    extra_details TEXT,
    created_at TIMESTAMPTZ,
    similarity_score REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        fv.id,
        fv.car_name,
        fv.chassis_full,
        fv.chassis_digits,
        fv.plate_full,
        fv.plate_digits,
        fv.extra_details,
        fv.created_at,
        GREATEST(
            COALESCE(similarity(fv.chassis_digits, p_chassis), 0),
            COALESCE(similarity(fv.plate_digits, p_plate), 0)
        ) as similarity_score
    FROM found_vehicles fv
    WHERE 
        (p_chassis IS NOT NULL AND fv.chassis_digits ILIKE '%' || p_chassis || '%')
        OR
        (p_plate IS NOT NULL AND fv.plate_digits = p_plate)
    ORDER BY similarity_score DESC, fv.created_at DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- ===================================
-- 6. Sample Data (للتجربة فقط)
-- ===================================

-- يمكن إزالة هذا القسم بعد الاختبار
-- INSERT INTO found_vehicles (car_name, chassis_full, chassis_digits, plate_full, plate_digits, extra_details)
-- VALUES 
--     ('دبدوب', '123456789', '123456789', 'خ 12345', '12345', 'عربية دبدوب لون أبيض'),
--     ('امجاد', '987654321', '987654321', 'خ 54321', '54321', 'عربية امجاد لون أزرق'),
--     ('هايس', '555666777', '555666777', 'خ 99999', '99999', 'هايس موديل 2020');

-- ===================================
-- 7. Maintenance و Optimization
-- ===================================

-- Vacuum و Analyze بشكل دوري (يتم تلقائياً في Supabase)
-- يمكن تشغيلها يدوياً عند الحاجة:
-- VACUUM ANALYZE found_vehicles;
-- VACUUM ANALYZE search_requests;
-- VACUUM ANALYZE search_analytics;

-- ===================================
-- Notes:
-- ===================================
-- 1. نفذ هذا الملف في Supabase SQL Editor
-- 2. تأكد من تفعيل RLS على جميع الجداول
-- 3. الـ Indexes مهمة جداً للأداء - لا تحذفها
-- 4. pg_trgm ضرورية للبحث الجزئي
