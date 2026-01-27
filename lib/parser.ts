import { normalizeDigits } from './utils'

export type ParsedVehicle = {
  car_name: string
  chassis_full?: string
  chassis_digits: string
  plate_full?: string
  plate_digits?: string
  extra_details: string
}

/**
 * تحليل سطر واحد لاستخراج بيانات العربة
 * 
 * الأنماط المدعومة:
 * 1. اسم - شاسي - لوحة
 * 2. اسم | شاسي: XXX | لوحة: XXX
 * 3. نص حر مع رقم طويل
 */
export function parseVehicleLine(line: string): ParsedVehicle | null {
  line = line.trim()
  if (!line) return null

  // نموذج 1: فصل بالشرطة "-"
  // مثال: دبدوب - 123456789 - خ 12345
  if (line.includes('-')) {
    const parts = line.split('-').map(p => p.trim())
    
    if (parts.length >= 2) {
      const carName = parts[0]
      const chassisPart = parts[1]
      const platePart = parts[2] || ''
      
      const chassisDigits = normalizeDigits(chassisPart)
      
      // يجب أن يكون رقم الشاسي 6+ أرقام
      if (chassisDigits.length >= 6) {
        return {
          car_name: carName,
          chassis_full: chassisPart,
          chassis_digits: chassisDigits,
          plate_full: platePart,
          plate_digits: normalizeDigits(platePart),
          extra_details: line
        }
      }
    }
  }

  // نموذج 2: فصل بالعمود الرأسي "|"
  // مثال: امجاد | شاسي: 987654321 | لوحة: خ 54321
  if (line.includes('|')) {
    const parts = line.split('|').map(p => p.trim())
    
    let carName = parts[0]
    let chassisFull = ''
    let plateFull = ''

    for (const part of parts.slice(1)) {
      const lowerPart = part.toLowerCase()
      
      // البحث عن رقم الشاسي
      if (lowerPart.includes('شاسي') || lowerPart.includes('chassis')) {
        // استخراج الأرقام فقط من هذا الجزء
        const digits = normalizeDigits(part)
        if (digits.length >= 6) {
          chassisFull = digits
        }
      }
      
      // البحث عن رقم اللوحة
      if (lowerPart.includes('لوحة') || lowerPart.includes('plate') || lowerPart.includes('رقم')) {
        plateFull = part.replace(/^(لوحة|plate|رقم):?\s*/i, '').trim()
      }
    }

    if (chassisFull) {
      return {
        car_name: carName,
        chassis_full: chassisFull,
        chassis_digits: normalizeDigits(chassisFull),
        plate_full: plateFull,
        plate_digits: normalizeDigits(plateFull),
        extra_details: line
      }
    }
  }

  // نموذج 3: نص حر - استخراج أول رقم طويل (6+ أرقام)
  // مثال: عربية دبدوب رقم 123456789
  const numberMatch = line.match(/\d{6,}/)
  
  if (numberMatch) {
    const number = numberMatch[0]
    const numberIndex = numberMatch.index!
    
    // الاسم هو كل شيء قبل الرقم
    const carName = line.substring(0, numberIndex).trim() || 'غير محدد'
    
    // اللوحة قد تكون بعد الرقم
    const afterNumber = line.substring(numberIndex + number.length).trim()
    
    return {
      car_name: carName,
      chassis_full: number,
      chassis_digits: normalizeDigits(number),
      plate_full: afterNumber,
      plate_digits: normalizeDigits(afterNumber),
      extra_details: line
    }
  }

  // لم نتمكن من تحليل السطر
  return null
}

/**
 * تحليل نص كامل يحتوي على عدة أسطر
 */
export function parseBulkVehicles(bulkText: string): {
  success: ParsedVehicle[]
  errors: string[]
  stats: {
    total: number
    parsed: number
    failed: number
  }
} {
  const lines = bulkText.split('\n')
  const success: ParsedVehicle[] = []
  const errors: string[] = []

  for (const line of lines) {
    const trimmedLine = line.trim()
    
    // تجاهل الأسطر الفارغة
    if (!trimmedLine) continue
    
    // تجاهل الأسطر التي تبدو كعناوين
    if (trimmedLine.length < 5 || /^(#|اسم|رقم|شاسي|لوحة)/i.test(trimmedLine)) {
      continue
    }

    const parsed = parseVehicleLine(trimmedLine)
    
    if (parsed) {
      success.push(parsed)
    } else {
      errors.push(trimmedLine)
    }
  }

  return {
    success,
    errors,
    stats: {
      total: lines.filter(l => l.trim()).length,
      parsed: success.length,
      failed: errors.length
    }
  }
}

/**
 * التحقق من صحة البيانات المستخرجة
 */
export function validateParsedVehicle(vehicle: ParsedVehicle): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (!vehicle.car_name || vehicle.car_name.length < 2) {
    errors.push('اسم العربية قصير جداً')
  }

  if (!vehicle.chassis_digits || vehicle.chassis_digits.length < 6) {
    errors.push('رقم الشاسي يجب أن يكون 6 أرقام على الأقل')
  }

  if (vehicle.chassis_digits && !/^\d+$/.test(vehicle.chassis_digits)) {
    errors.push('رقم الشاسي يجب أن يحتوي على أرقام فقط')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}
