// ===================================
// lib/parsers/vehicle-list-parser.ts
// Parser محدث - يدعم كل أنماط اللوحات السودانية
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
  contact_number?: string
  list_name?: string
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
function extractContactNumber(text: string): string | undefined {
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
  
  return undefined
}

// استخراج اسم الكشف
function extractListName(text: string): string | undefined {
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
  
  return undefined
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

// استخراج رقم الشاسي
function extractChassis(text: string): { full?: string; digits: string } | null {
  const chassisMatch = text.match(/شاسي[:\s]*([0-9A-Za-z]+)/i)
  if (chassisMatch) {
    const full = chassisMatch[1].trim()
    const digits = normalizeDigits(full)
    if (digits.length >= 4) {
      return { full, digits }
    }
  }
  
  const longNumbers = text.match(/\b\d{6,}\b/g)
  if (longNumbers && longNumbers.length > 0) {
    const longest = longNumbers.sort((a, b) => b.length - a.length)[0]
    const digits = normalizeDigits(longest)
    if (digits.length >= 6) {
      return { full: longest, digits }
    }
  }
  
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

// ✅ استخراج رقم اللوحة - محسّن للأنماط السودانية
function extractPlate(text: string): { full?: string; digits: string } | null {
  // نظف النص من "/" و"لوحة"
  let cleaned = text.replace(/لوحة[:\s]*/gi, '').replace(/\s*\/\s*/g, ' ').trim()
  
  // نمط 1: رقم + 3 حروف (مثل: 7072 خ أ ب)
  let match = cleaned.match(/(\d{3,})\s+([أ-ي]+)\s+([أ-ي]+)\s+([أ-ي]+)/i)
  if (match) {
    const number = match[1]
    const l1 = match[2]
    const l2 = match[3]
    const l3 = match[4]
    const full = `${number} ${l1} ${l2} ${l3}`
    const digits = normalizeDigits(number)
    return { full, digits }
  }
  
  // نمط 2: رقم + 2 حرف + رقم (مثل: 11111 ب ح 8)
  match = cleaned.match(/(\d{3,})\s+([أ-ي]+)\s+([أ-ي]+)\s+(\d+)/i)
  if (match) {
    const number = match[1]
    const l1 = match[2]
    const l2 = match[3]
    const extra = match[4]
    const full = `${number} ${l1} ${l2} ${extra}`
    const digits = normalizeDigits(number)
    return { full, digits }
  }
  
  // نمط 3: رقم + 2 حرف (مثل: 12345 خ ع)
  match = cleaned.match(/(\d{3,})\s+([أ-ي]+)\s+([أ-ي]+)(?:\s|$)/i)
  if (match) {
    const number = match[1]
    const l1 = match[2]
    const l2 = match[3]
    const full = `${number} ${l1} ${l2}`
    const digits = normalizeDigits(number)
    return { full, digits }
  }
  
  // نمط 4: رقم + حرف + رقم (مثل: 63566 خ3 أو 55643 خ1)
  match = cleaned.match(/(\d{3,})\s*([أ-ي]+)(\d+)/i)
  if (match) {
    const number = match[1]
    const letter = match[2]
    const extra = match[3]
    const full = `${number} ${letter}${extra}`
    const digits = normalizeDigits(number)
    return { full, digits }
  }
  
  // نمط 5: رقم + حرف (مثل: 69803 خ أو 69803 / خ)
  match = cleaned.match(/(\d{3,})\s+([أ-ي]+)(?:\s|$)/i)
  if (match) {
    const number = match[1]
    const letter = match[2]
    const full = `${number} ${letter}`
    const digits = normalizeDigits(number)
    return { full, digits }
  }
  
  return null
}

// استخراج اسم العربية
function extractCarName(text: string): string {
  let cleaned = text.replace(/^\d+[\/\-)\.]?\s*/, '').trim()
  
  // إزالة معلومات الشاسي واللوحة
  cleaned = cleaned
    .replace(/شاسي[:\s]*[0-9A-Za-z]+/gi, '')
    .replace(/لوحة[:\s]*[0-9أ-ي\s\/]+/gi, '')
    // إزالة أنماط اللوحات المختلفة
    .replace(/\d{3,}\s*\/?\s*[أ-ي]+\s*\d*/g, '')
    .replace(/\d{3,}\s+[أ-ي]+\s+[أ-ي]+\s*\d*/g, '')
    .replace(/[أ-ي]+\s*\d{3,}/g, '')
    .trim()
  
  cleaned = cleaned.replace(/\([^)]*\)/g, '').trim()
  cleaned = cleaned.replace(/\b\d{6,}\b/g, '').trim()
  
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

  result.contact_number = extractContactNumber(input)
  result.list_name = extractListName(input)

  const lines = input.split('\n')
  result.stats.total_lines = lines.length

  lines.forEach((line, index) => {
    const trimmed = line.trim()

    if (
      !trimmed ||
      trimmed.length < 5 ||
      trimmed.startsWith('كشف') ||
      /(?:تواصل|واتساب|اتصال|رقم|للتواصل|موبايل|جوال)/.test(trimmed) ||
      trimmed.startsWith('ملاحظة') ||
      /^[-=_#*]+$/.test(trimmed)
    ) {
      result.stats.skipped++
      return
    }

    try {
      const chassis = extractChassis(trimmed)
      const plate = extractPlate(trimmed)
      const color = extractColor(trimmed)
      const carName = extractCarName(trimmed)

      if (!chassis || !chassis.digits || chassis.digits.length < 4) {
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

    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      result.errors.push(`السطر ${index + 1}: خطأ في المعالجة - ${message}`)
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