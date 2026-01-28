import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

// Utility for merging Tailwind classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// تنظيف الأرقام من أي أحرف غير رقمية
export function normalizeDigits(input?: string): string {
  if (!input) return ''
  return input.replace(/[^0-9]/g, '')
}

// التحقق من صحة رقم الواتساب السوداني
export function validateWhatsApp(phone: string): boolean {
  const cleaned = normalizeDigits(phone)
  
  // السودان: 10 أرقام تبدأ بـ 0 ثم أي رقم
  // أمثلة: 0912345678 (Zain), 0123456789 (Sudani), 0923456789 (MTN)
  if (/^0\d{9}$/.test(cleaned)) {
    return true
  }
  
  // أو: 249 + 9 أرقام (الصيغة الدولية)
  // أمثلة: 249912345678 (Zain), 249123456789 (Sudani)
  if (/^249\d{9}$/.test(cleaned)) {
    return true
  }
  
  return false
}

// تنسيق رقم الواتساب للعرض
export function formatWhatsApp(phone: string): string {
  const cleaned = normalizeDigits(phone)
  
  // إذا كان بصيغة دولية (249...)
  if (cleaned.startsWith('249')) {
    return `+${cleaned}`
  }
  
  // إذا كان بصيغة محلية (0...)
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    return `+249${cleaned.slice(1)}`
  }
  
  // إذا كان بدون 0 أو 249
  if (cleaned.length === 9) {
    return `+249${cleaned}`
  }
  
  return phone
}

// التحقق من صحة رقم الشاسي
export function validateChassis(chassis: string): boolean {
  const cleaned = normalizeDigits(chassis)
  // على الأقل 6 أرقام
  return cleaned.length >= 6
}

// تنسيق التاريخ بالعربي
export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'الآن'
  if (diffMins < 60) return `منذ ${diffMins} دقيقة`
  if (diffHours < 24) return `منذ ${diffHours} ساعة`
  if (diffDays < 7) return `منذ ${diffDays} يوم`
  
  return date.toLocaleDateString('ar-SD', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// تقصير النص
export function truncate(text: string, length: number = 100): string {
  if (text.length <= length) return text
  return text.substring(0, length) + '...'
}