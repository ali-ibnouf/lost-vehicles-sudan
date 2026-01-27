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
  // السودان: 249 + 9 أرقام (يبدأ بـ 9)
  // أو: 0 + 9 أرقام (محلي)
  return /^(249)?9\d{8}$/.test(cleaned) || /^09\d{8}$/.test(cleaned)
}

// تنسيق رقم الواتساب للعرض
export function formatWhatsApp(phone: string): string {
  const cleaned = normalizeDigits(phone)
  
  if (cleaned.startsWith('249')) {
    return `+${cleaned}`
  }
  
  if (cleaned.startsWith('0')) {
    return `+249${cleaned.slice(1)}`
  }
  
  if (cleaned.startsWith('9') && cleaned.length === 9) {
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
