'use client'

import { useState } from 'react'
import { Upload, FileText, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [bulkText, setBulkText] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleLogin = () => {
    // في production، استخدم authentication حقيقي
    const adminSecret = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'sudan2026admin'
    if (password === adminSecret) {
      setIsAuthenticated(true)
      localStorage.setItem('admin_token', password)
    } else {
      alert('كلمة مرور خاطئة')
    }
  }

  const handleUpload = async () => {
    if (!bulkText.trim()) {
      alert('الرجاء لصق الكشف أولاً')
      return
    }

    setIsUploading(true)
    setResult(null)

    try {
      const adminToken = localStorage.getItem('admin_token') || password
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({ bulkText })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'حدث خطأ في الرفع')
      }

      setResult(data)
      
      if (data.success > 0) {
        setBulkText('') // Clear on success
      }

    } catch (error: any) {
      alert(error.message || 'حدث خطأ في الرفع')
    } finally {
      setIsUploading(false)
    }
  }

  // Login screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center p-4" dir="rtl">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl text-center">دخول الإدارة</CardTitle>
            <CardDescription className="text-center">
              أدخل كلمة المرور للوصول إلى لوحة التحكم
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Input
                type="password"
                placeholder="كلمة المرور"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              />
              <Button onClick={handleLogin} className="w-full">
                دخول
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Admin panel
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-4" dir="rtl">
      <div className="container max-w-5xl mx-auto py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">لوحة تحكم الإدارة</h1>
            <p className="text-gray-600 mt-1">رفع كشوفات العربات المفقودة</p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setIsAuthenticated(false)
              setPassword('')
              localStorage.removeItem('admin_token')
            }}
          >
            تسجيل خروج
          </Button>
        </div>

        {/* Upload Form */}
        <Card className="shadow-lg mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              رفع الكشوفات
            </CardTitle>
            <CardDescription>
              الصق الكشف الكامل هنا - يدعم النظام عدة صيغ
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Format Examples */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  الصيغ المدعومة:
                </h4>
                <ul className="space-y-1 text-gray-700">
                  <li>• <code className="bg-white px-2 py-0.5 rounded">اسم العربية - رقم الشاسي - رقم اللوحة</code></li>
                  <li>• <code className="bg-white px-2 py-0.5 rounded">اسم العربية | شاسي: رقم | لوحة: رقم</code></li>
                  <li>• أي نص يحتوي على اسم ورقم طويل (6+ أرقام)</li>
                </ul>
              </div>

              {/* Textarea */}
              <Textarea
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder="الصق هنا...

مثال:
دبدوب - 123456789 - خ 12345
امجاد - 987654321 - خ 54321
عربية الطيب | شاسي: 555666777 | لوحة: خ 99999"
                rows={12}
                className="font-mono text-sm"
              />

              {/* Upload Button */}
              <Button
                onClick={handleUpload}
                disabled={isUploading}
                className="w-full"
                size="lg"
              >
                {isUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                    جاري المعالجة...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 ml-2" />
                    تحليل ورفع إلى قاعدة البيانات
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {result && (
          <div className="space-y-4 animate-fade-in">
            {/* Success Summary */}
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                  <h3 className="text-lg font-bold text-green-900">نتيجة الرفع</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{result.success}</div>
                    <div className="text-sm text-gray-600">تم بنجاح</div>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{result.failed}</div>
                    <div className="text-sm text-gray-600">فشل</div>
                  </div>
                  
                  {result.stats && (
                    <div className="bg-white p-4 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{result.stats.total}</div>
                      <div className="text-sm text-gray-600">إجمالي الأسطر</div>
                    </div>
                  )}
                </div>

                <p className="mt-4 text-green-800">
                  {result.message}
                </p>
              </CardContent>
            </Card>

            {/* Errors */}
            {result.errors && result.errors.length > 0 && (
              <Card className="bg-red-50 border-red-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-900">
                    <XCircle className="w-5 h-5" />
                    أسطر لم يتم التعرف عليها ({result.errors.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-white p-4 rounded-lg max-h-60 overflow-y-auto">
                    <pre className="text-sm text-red-800 whitespace-pre-wrap">
                      {result.errors.join('\n')}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Invalid Vehicles */}
            {result.invalidVehicles && result.invalidVehicles.length > 0 && (
              <Card className="bg-yellow-50 border-yellow-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-yellow-900">
                    <AlertTriangle className="w-5 h-5" />
                    بيانات غير مكتملة ({result.invalidVehicles.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {result.invalidVehicles.map((item: any, idx: number) => (
                      <div key={idx} className="bg-white p-3 rounded-lg text-sm">
                        <div className="font-semibold text-gray-900 mb-1">
                          {item.data.car_name}
                        </div>
                        <div className="text-red-600 text-xs">
                          {item.errors.join(', ')}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Instructions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>تعليمات الاستخدام</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>✓ الصق الكشف كاملاً في الحقل أعلاه</li>
              <li>✓ كل سطر يجب أن يحتوي على اسم العربية ورقم الشاسي على الأقل</li>
              <li>✓ رقم الشاسي يجب أن يكون 6 أرقام أو أكثر</li>
              <li>✓ يمكن استخدام أي من الصيغ الموضحة أعلاه</li>
              <li>✓ الأسطر الفارغة والعناوين يتم تجاهلها تلقائياً</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
