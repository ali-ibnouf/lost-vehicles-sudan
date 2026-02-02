'use client'

import { useState } from 'react'
import { Upload, CheckCircle2, AlertCircle, Eye, Save, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { parseVehicleList, previewParsedVehicles, checkDuplicates, type ParseResult, type ParsedVehicle } from '@/lib/parsers/vehicle-list-parser'

export default function AdminUploadPage() {
  const [rawText, setRawText] = useState('')
  const [parseResult, setParseResult] = useState<ParseResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 })
  const [showPreview, setShowPreview] = useState(false)

  // معالجة النص
  const handleParse = () => {
    if (!rawText.trim()) {
      alert('الرجاء لصق الكشف أولاً')
      return
    }

    const result = parseVehicleList(rawText)
    setParseResult(result)
    setShowPreview(true)

    if (!result.success) {
      alert('فشلت المعالجة: ' + result.errors.join('\n'))
    }
  }

  // حفظ في Database
  const handleSave = async () => {
    if (!parseResult || parseResult.vehicles.length === 0) {
      alert('لا توجد عربات للحفظ')
      return
    }

    // التحقق من التكرار داخل الكشف
    const duplicates = checkDuplicates(parseResult.vehicles)
    if (duplicates.length > 0) {
      const proceed = confirm(
        `تحذير: يوجد ${duplicates.length} تكرار في الكشف:\n\n` +
        duplicates.slice(0, 5).join('\n') +
        '\n\nهل تريد المتابعة؟'
      )
      if (!proceed) return
    }

    setLoading(true)
    setUploadProgress({ current: 0, total: parseResult.vehicles.length })

    try {
      let successCount = 0
      let errorCount = 0
      const errors: string[] = []

      // رفع العربات واحدة تلو الأخرى
      for (let i = 0; i < parseResult.vehicles.length; i++) {
        const vehicle = parseResult.vehicles[i]
        
        try {
          const { error } = await supabase
            .from('found_vehicles')
            .insert({
              car_name: vehicle.car_name,
              chassis_full: vehicle.chassis_full,
              chassis_digits: vehicle.chassis_digits,
              plate_full: vehicle.plate_full || null,
              plate_digits: vehicle.plate_digits || null,
              color: vehicle.color || null,
              extra_details: vehicle.extra_details,
              source: 'admin_upload',
              uploaded_by: 'admin',
              uploaded_at: new Date().toISOString()
            })

          if (error) {
            // تحقق من التكرار
            if (error.code === '23505') {
              errors.push(`السطر ${vehicle.line_number}: شاسي ${vehicle.chassis_digits} موجود مسبقاً`)
            } else {
              errors.push(`السطر ${vehicle.line_number}: ${error.message}`)
            }
            errorCount++
          } else {
            successCount++
          }
        } catch (err: any) {
          errors.push(`السطر ${vehicle.line_number}: ${err.message}`)
          errorCount++
        }

        setUploadProgress({ current: i + 1, total: parseResult.vehicles.length })
      }

      // عرض النتيجة
      let message = `تم الرفع بنجاح!\n\n`
      message += `✅ نجح: ${successCount}\n`
      if (errorCount > 0) {
        message += `❌ فشل: ${errorCount}\n\n`
        if (errors.length > 0) {
          message += 'الأخطاء:\n' + errors.slice(0, 10).join('\n')
          if (errors.length > 10) {
            message += `\n... و ${errors.length - 10} خطأ آخر`
          }
        }
      }

      alert(message)

      // إعادة تعيين النموذج
      if (successCount > 0) {
        setRawText('')
        setParseResult(null)
        setShowPreview(false)
      }

    } catch (error: any) {
      alert('حدث خطأ: ' + error.message)
    } finally {
      setLoading(false)
      setUploadProgress({ current: 0, total: 0 })
    }
  }

  const exampleText = `كشف (A6)

1/ هايس تايوتا (ابيض) شاسي 200046160
2/ شاسي 00172844 لوحة 52938 خ1
3/ افانتي سحلية (ابيض) شاسي 285102
4/ مضلع (ابيض) شاسي 694749
5/ شريحة تايوتا قبة (ابيض) شاسي 0067794`

  return (
    <div className="min-h-screen bg-gray-50 p-4" dir="rtl">
      <div className="container max-w-7xl mx-auto py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">رفع كشوفات العربات الموجودة</h1>
            <p className="text-gray-600 mt-1">قم بلصق كشف العربات ليتم معالجته تلقائياً</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => window.location.href = '/admin'} variant="outline">
              رجوع
            </Button>
            <Button onClick={() => window.location.href = '/admin/requests'} variant="outline">
              الطلبات
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  لصق الكشف
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    الصق الكشف هنا (النص الكامل)
                  </label>
                  <Textarea
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    placeholder={exampleText}
                    rows={20}
                    className="font-mono text-sm"
                  />
                </div>

                <div className="flex gap-3">
                  <Button 
                    onClick={handleParse} 
                    className="flex-1"
                    disabled={!rawText.trim() || loading}
                  >
                    <Eye className="w-4 h-4 ml-2" />
                    معالجة ومعاينة
                  </Button>
                  <Button 
                    onClick={() => setRawText('')}
                    variant="outline"
                    disabled={loading}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                {/* Example */}
                <div className="p-4 bg-blue-50 rounded-lg text-sm">
                  <p className="font-medium mb-2">مثال على الصيغة المدعومة:</p>
                  <pre className="text-xs whitespace-pre-wrap text-gray-700">
                    {exampleText}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Preview Section */}
          <div className="space-y-6">
            {showPreview && parseResult && (
              <>
                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold text-green-600">
                        {parseResult.stats.parsed}
                      </p>
                      <p className="text-sm text-gray-600">نجح</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold text-red-600">
                        {parseResult.stats.skipped}
                      </p>
                      <p className="text-sm text-gray-600">تخطي</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold text-blue-600">
                        {parseResult.stats.total_lines}
                      </p>
                      <p className="text-sm text-gray-600">إجمالي</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Errors */}
                {parseResult.errors.length > 0 && (
                  <Card className="border-red-200">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-red-600">
                        <AlertCircle className="w-5 h-5" />
                        تحذيرات ({parseResult.errors.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-1 max-h-40 overflow-y-auto">
                        {parseResult.errors.slice(0, 10).map((error, i) => (
                          <p key={i} className="text-sm text-red-600">• {error}</p>
                        ))}
                        {parseResult.errors.length > 10 && (
                          <p className="text-sm text-gray-500">
                            ... و {parseResult.errors.length - 10} تحذير آخر
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Preview */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      المعاينة ({parseResult.vehicles.length} عربية)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {parseResult.vehicles.slice(0, 10).map((vehicle, i) => (
                        <div key={i} className="p-3 bg-gray-50 rounded-lg text-sm">
                          <p className="font-bold">{vehicle.car_name}</p>
                          <p className="text-gray-600">شاسي: {vehicle.chassis_digits}</p>
                          {vehicle.plate_digits && (
                            <p className="text-gray-600">لوحة: {vehicle.plate_digits}</p>
                          )}
                          {vehicle.color && (
                            <p className="text-gray-600">اللون: {vehicle.color}</p>
                          )}
                        </div>
                      ))}
                      {parseResult.vehicles.length > 10 && (
                        <p className="text-center text-sm text-gray-500">
                          ... و {parseResult.vehicles.length - 10} عربية أخرى
                        </p>
                      )}
                    </div>

                    {/* Save Button */}
                    <div className="mt-6">
                      <Button 
                        onClick={handleSave}
                        className="w-full"
                        disabled={loading || parseResult.vehicles.length === 0}
                        size="lg"
                      >
                        {loading ? (
                          <>
                            <span className="ml-2">
                              جاري الرفع... ({uploadProgress.current}/{uploadProgress.total})
                            </span>
                          </>
                        ) : (
                          <>
                            <Save className="w-5 h-5 ml-2" />
                            حفظ {parseResult.vehicles.length} عربية في قاعدة البيانات
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {/* Instructions */}
            {!showPreview && (
              <Card>
                <CardHeader>
                  <CardTitle>كيفية الاستخدام</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                      1
                    </div>
                    <p>الصق الكشف الكامل في الصندوق على اليسار</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                      2
                    </div>
                    <p>اضغط "معالجة ومعاينة" لتحليل البيانات</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                      3
                    </div>
                    <p>راجع المعاينة وتأكد من صحة البيانات</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                      4
                    </div>
                    <p>اضغط "حفظ" لإضافة العربات إلى قاعدة البيانات</p>
                  </div>

                  <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
                    <p className="font-medium text-yellow-800 mb-2">ملاحظات هامة:</p>
                    <ul className="space-y-1 text-yellow-700 text-xs">
                      <li>• النظام يتعرف تلقائياً على اسم العربية، رقم الشاسي، اللوحة واللون</li>
                      <li>• يمكن لصق أي صيغة من الكشوفات (مع أو بدون ترقيم)</li>
                      <li>• سيتم تخطي السطور الفارغة والعناوين تلقائياً</li>
                      <li>• في حالة التكرار، سيتم تنبيهك قبل الحفظ</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}