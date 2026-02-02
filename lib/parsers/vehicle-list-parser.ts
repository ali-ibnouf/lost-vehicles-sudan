// ===================================
// الملف: lib/parsers/vehicle-list-parser.ts
// Parser لمعالجة كشوفات العربات
// ===================================

export type ParsedVehicle = {
  car_name: string
  chassis_full?: string
  chassis_digits: string
  plate_full?: string
  plate_digits?: string
  color?: string
  extra_details?: string
  line_number: number
  raw_line: string
}

export type ParseResult = {
  success: boolean
  vehicles: ParsedVehicle[]
  errors: string[]
  stats: {
    total_lines: number
    parsed: number
    skipped: number
  }
}

// تنظيف الأرقام
function normalizeDigits(input: string): string {
  return input.replace(/[^0-9]/g, '')
}

// استخراج الألوان
function extractColor(text: string): string | undefined {
  const colors = [
    'ابيض', 'أبيض', 'اسود', 'أسود', 'احمر', 'أحمر',
    'ازرق', 'أزرق', 'اخضر', 'أخضر', 'سلفر', 'بني',
    'رمادي', 'بيج', 'سحلية', 'قبة'
  ]
  
  for (const color of colors) {
    if (text.includes(color)) {
      return color
    }
  }
  return undefined
}

// استخراج رقم الشاسي
function extractChassis(text: string): { full?: string; digits: string } | null {
  // البحث عن "شاسي" متبوعة برقم
  const chassisMatch = text.match(/شاسي[:\s]*([0-9A-Za-z]+)/i)
  if (chassisMatch) {
    const full = chassisMatch[1].trim()
    const digits = normalizeDigits(full)
    if (digits.length >= 4) {
      return { full, digits }
    }
  }
  
  // البحث عن رقم طويل (محتمل شاسي)
  const longNumberMatch = text.match(/\b\d{6,}\b/)
  if (longNumberMatch) {
    const digits = normalizeDigits(longNumberMatch[0])
    if (digits.length >= 6) {
      return { full: longNumberMatch[0], digits }
    }
  }
  
  return null
}

// استخراج رقم اللوحة
function extractPlate(text: string): { full?: string; digits: string } | null {
  // البحث عن "لوحة" متبوعة برقم
  const plateMatch = text.match(/لوحة[:\s]*([0-9]+)\s*([أ-ي]*[0-9]*)/i)
  if (plateMatch) {
    const full = `${plateMatch[1]} ${plateMatch[2]}`.trim()
    const digits = normalizeDigits(plateMatch[1])
    if (digits.length >= 3) {
      return { full, digits }
    }
  }
  
  // البحث عن نمط "رقم خ رقم" (مثل: 52938 خ1)
  const khMatch = text.match(/(\d{4,})\s*خ\s*(\d)/i)
  if (khMatch) {
    const full = `${khMatch[1]} خ${khMatch[2]}`
    const digits = normalizeDigits(khMatch[1])
    return { full, digits }
  }
  
  // البحث عن نمط "رقم ب ح رقم" (مثل: 30310 ب ح8)
  const bhMatch = text.match(/(\d{4,})\s*ب\s*ح\s*(\d)/i)
  if (bhMatch) {
    const full = `${bhMatch[1]} ب ح${bhMatch[2]}`
    const digits = normalizeDigits(bhMatch[1])
    return { full, digits }
  }
  
  return null
}

// استخراج اسم العربية
function extractCarName(text: string): string {
  // إزالة رقم السطر من البداية (1/, 2/, إلخ)
  let cleaned = text.replace(/^\d+[\/\-)]\s*/, '').trim()
  
  // إزالة المعلومات الإضافية (شاسي، لوحة، ألوان)
  cleaned = cleaned
    .replace(/شاسي[:\s]*[0-9A-Za-z]+/gi, '')
    .replace(/لوحة[:\s]*[0-9أ-ي\s]+/gi, '')
    .replace(/\([^)]*\)/g, '') // إزالة الألوان بين الأقواس
    .trim()
  
  // أخذ أول جزء فقط (عادة اسم العربية)
  const parts = cleaned.split(/\s+/)
  const carName = parts.slice(0, 3).join(' ').trim()
  
  return carName || 'غير محدد'
}

/**
 * معالجة كشف كامل من النص
 */
export function parseVehicleList(input: string): ParseResult {
  const result: ParseResult = {
    success: true,
    vehicles: [],
    errors: [],
    stats: {
      total_lines: 0,
      parsed: 0,
      skipped: 0
    }
  }
  
  if (!input || !input.trim()) {
    result.success = false
    result.errors.push('النص فارغ')
    return result
  }
  
  const lines = input.split('\n').filter(line => line.trim())
  result.stats.total_lines = lines.length
  
  lines.forEach((line, index) => {
    const trimmed = line.trim()
    
    // تخطي السطور الفارغة أو العناوين
    if (!trimmed || 
        trimmed.startsWith('كشف') || 
        trimmed.startsWith('تواصل') ||
        trimmed.length < 5) {
      result.stats.skipped++
      return
    }
    
    try {
      // استخراج المعلومات
      const chassis = extractChassis(trimmed)
      const plate = extractPlate(trimmed)
      const color = extractColor(trimmed)
      const carName = extractCarName(trimmed)
      
      // يجب أن يكون هناك شاسي على الأقل
      if (!chassis || chassis.digits.length < 4) {
        result.errors.push(`السطر ${index + 1}: لم يتم العثور على رقم شاسي صحيح`)
        result.stats.skipped++
        return
      }
      
      const vehicle: ParsedVehicle = {
        car_name: carName,
        chassis_full: chassis.full,
        chassis_digits: chassis.digits,
        color,
        line_number: index + 1,
        raw_line: trimmed,
        extra_details: trimmed
      }
      
      if (plate) {
        vehicle.plate_full = plate.full
        vehicle.plate_digits = plate.digits
      }
      
      result.vehicles.push(vehicle)
      result.stats.parsed++
      
    } catch (error) {
      result.errors.push(`السطر ${index + 1}: خطأ في المعالجة - ${error}`)
      result.stats.skipped++
    }
  })
  
  if (result.vehicles.length === 0) {
    result.success = false
    result.errors.push('لم يتم معالجة أي عربية')
  }
  
  return result
}

/**
 * معاينة النتائج قبل الحفظ
 */
export function previewParsedVehicles(vehicles: ParsedVehicle[]): string {
  let preview = `تم معالجة ${vehicles.length} عربية:\n\n`
  
  vehicles.slice(0, 5).forEach((v, i) => {
    preview += `${i + 1}. ${v.car_name}\n`
    preview += `   شاسي: ${v.chassis_digits}\n`
    if (v.plate_digits) {
      preview += `   لوحة: ${v.plate_digits}\n`
    }
    if (v.color) {
      preview += `   اللون: ${v.color}\n`
    }
    preview += '\n'
  })
  
  if (vehicles.length > 5) {
    preview += `... و ${vehicles.length - 5} عربية أخرى`
  }
  
  return preview
}

/**
 * التحقق من وجود تكرار في الكشف
 */
export function checkDuplicates(vehicles: ParsedVehicle[]): string[] {
  const duplicates: string[] = []
  const seen = new Set<string>()
  
  vehicles.forEach((v, index) => {
    const key = v.chassis_digits
    if (seen.has(key)) {
      duplicates.push(`السطر ${v.line_number}: شاسي مكرر ${v.chassis_digits}`)
    } else {
      seen.add(key)
    }
  })
  
  return duplicates
}