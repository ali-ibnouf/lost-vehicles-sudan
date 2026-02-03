// ===================================
// الملف: lib/parsers/vehicle-list-parser.ts
// Parser محسّن - النسخة النهائية
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
  contact_number?: string  // رقم المسؤول
  list_name?: string       // اسم الكشف
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

// استخراج رقم المسؤول
function extractContactNumber(text: string): string | null {
  const patterns = [
    /(?:تواصل|واتساب|اتصال|رقم|للتواصل|موبايل|جوال)[:\s]*([+0-9]{10,14})/i,
    /\b(0[0-9]{9})\b/,
    /\b(249[0-9]{9})\b/,
    /\b(\+249[0-9]{9})\b/
  ]
  
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      const number = match[1].replace(/\s+/g, '')
      const digits = normalizeDigits(number)
      if (digits.length >= 10) {
        return number
      }
    }
  }
  
  return null
}

// استخراج اسم الكشف
function extractListName(text: string): string | null {
  const patterns = [
    /كشف\s*[:\s]*\(?([A-Z0-9]+)\)?/i,
    /قائمة\s*[:\s]*([^\n]+)/i,
    /الكشف\s*رقم\s*([A-Z0-9]+)/i
  ]
  
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      return match[1].trim()
    }
  }
  
  return null
}

// استخراج الألوان
function extractColor(text: string): string | undefined {
  const colors = [
    'ابيض', 'أبيض', 'اسود', 'أسود', 'احمر', 'أحمر',
    'ازرق', 'أزرق', 'اخضر', 'أخضر', 'سلفر', 'بني',
    'رمادي', 'بيج', 'سحلية', 'قبة', 'ذهبي', 'فضي'
  ]
  
  for (const color of colors) {
    if (text.includes(color)) {
      return color
    }
  }
  return undefined
}

// استخراج رقم الشاسي - محسّن
function extractChassis(text: string): { full?: string; digits: string } | null {
  // النمط 1: "شاسي" متبوعة برقم
  const chassisMatch = text.match(/شاسي[:\s]*([0-9A-Za-z]+)/i)
  if (chassisMatch) {
    const full = chassisMatch[1].trim()
    const digits = normalizeDigits(full)
    if (digits.length >= 4) {
      return { full, digits }
    }
  }
  
  // النمط 2: رقم طويل منفرد (6+ أرقام)
  const longNumbers = text.match(/\b\d{6,}\b/g)
  if (longNumbers && longNumbers.length > 0) {
    const longest = longNumbers.sort((a, b) => b.length - a.length)[0]
    const digits = normalizeDigits(longest)
    if (digits.length >= 6) {
      return { full: longest, digits }
    }
  }
  
  // النمط 3: أي رقم 4+ أرقام
  const anyNumber = text.match(/\d{4,}/g)
  if (anyNumber && anyNumber.length > 0) {
    const longest = anyNumber.sort((a, b) => b.length - a.length)[0]
    const digits = normalizeDigits(longest)
    if (digits.length >= 4) {
      return { full: longest, digits }
    }
  }
  
  return null
}

// استخراج رقم اللوحة - محسّن للحروف العربية
function extractPlate(text: string): { full?: string; digits: string } | null {
  // النمط 1: "لوحة" متبوعة برقم وحروف
  const plateMatch1 = text.match(/لوحة[:\s]*([0-9]+)\s*([أ-ي\s]*)/i)
  if (plateMatch1) {
    const number = plateMatch1[1]
    const letters = plateMatch1[2]?.trim() || ''
    const full = letters ? `${number} ${letters}` : number
    const digits = normalizeDigits(number)
    if (digits.length >= 3) {
      return { full, digits }
    }
  }
  
  // النمط 2: رقم ثم حرف عربي (مثل: 12345 خ ع)
  const plateMatch2 = text.match(/(\d{3,})\s*([أ-ي]+)\s*([أ-ي]*)/i)
  if (plateMatch2) {
    const number = plateMatch2[1]
    const letter1 = plateMatch2[2]
    const letter2 = plateMatch2[3] || ''
    const full = letter2 ? `${number} ${letter1} ${letter2}` : `${number} ${letter1}`
    const digits = normalizeDigits(number)
    return { full, digits }
  }
  
  // النمط 3: حرف عربي ثم رقم (مثل: خ 12345)
  const plateMatch3 = text.match(/([أ-ي]+)\s*(\d{3,})/i)
  if (plateMatch3) {
    const letter = plateMatch3[1]
    const number = plateMatch3[2]
    const full = `${letter} ${number}`
    const digits = normalizeDigits(number)
    return { full, digits }
  }
  
  // النمط 4: رقم ب ح رقم
  const plateMatch4 = text.match(/(\d{4,})\s*ب\s*ح\s*(\d)/i)
  if (plateMatch4) {
    const full = `${plateMatch4[1]} ب ح${plateMatch4[2]}`
    const digits = normalizeDigits(plateMatch4[1])
    return { full, digits }
  }
  
  return null
}

// استخراج اسم العربية - محسّن
function extractCarName(text: string): string {
  // إزالة رقم السطر من البداية
  let cleaned = text.replace(/^\d+[\/\-)\.]?\s*/, '').trim()
  
  // إزالة معلومات الشاسي واللوحة
  cleaned = cleaned
    .replace(/شاسي[:\s]*[0-9A-Za-z]+/gi, '')
    .replace(/لوحة[:\s]*[0-9أ-ي\s]+/gi, '')
    .replace(/\d{3,}\s*[أ-ي]+(\s*[أ-ي]+)?/g, '') // رقم + حروف
    .replace(/[أ-ي]+\s*\d{3,}/g, '') // حروف + رقم
    .trim()
  
  // إزالة الألوان بين الأقواس
  cleaned = cleaned.replace(/\([^)]*\)/g, '').trim()
  
  // إزالة أرقام منفردة طويلة
  cleaned = cleaned.replace(/\b\d{6,}\b/g, '').trim()
  
  // أخذ أول 3-4 كلمات
  const words = cleaned.split(/\s+/).filter(w => w.length > 0)
  const carName = words.slice(0, 4).join(' ').trim()
  
  if (!carName || carName.length < 2) {
    const beforeNumbers = text.split(/\d{4,}/)[0]
    const cleaned2 = beforeNumbers
      .replace(/^\d+[\/\-)\.]?\s*/, '')
      .replace(/\([^)]*\)/g, '')
      .replace(/شاسي|لوحة/gi, '')
      .trim()
    
    if (cleaned2 && cleaned2.length >= 2) {
      return cleaned2
    }
    
    return 'غير محدد'
  }
  
  return carName
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
  
  // استخراج رقم المسؤول واسم الكشف من النص الكامل
  result.contact_number = extractContactNumber(input)
  result.list_name = extractListName(input)
  
  const lines = input.split('\n').filter(line => line.trim())
  result.stats.total_lines = lines.length
  
  lines.forEach((line, index) => {
    const trimmed = line.trim()
    
    // تخطي السطور الفارغة أو العناوين أو الملاحظات
    if (!trimmed || 
        trimmed.length < 5 ||
        trimmed.startsWith('كشف') || 
        /(?:تواصل|واتساب|اتصال|رقم|للتواصل|موبايل|جوال)/i.test(trimmed) ||
        trimmed.startsWith('ملاحظة') ||
        /^[-=_#*]+$/.test(trimmed)) {
      result.stats.skipped++
      return
    }
    
    try {
      const chassis = extractChassis(trimmed)
      const plate = extractPlate(trimmed)
      const color = extractColor(trimmed)
      const carName = extractCarName(trimmed)
      
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
    if (result.errors.length === 0) {
      result.errors.push('لم يتم معالجة أي عربية')
    }
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
    if (v.plate_full) {
      preview += `   لوحة: ${v.plate_full}\n`
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
  
  vehicles.forEach((v) => {
    const key = v.chassis_digits
    if (seen.has(key)) {
      duplicates.push(`السطر ${v.line_number}: شاسي مكرر ${v.chassis_digits}`)
    } else {
      seen.add(key)
    }
  })
  
  return duplicates
}