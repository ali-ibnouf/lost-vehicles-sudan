'use client'

import { useState } from 'react'
import { Upload, CheckCircle2, AlertCircle, Eye, Save, X, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { parseVehicleList, checkDuplicates, type ParseResult } from '@/lib/parsers/vehicle-list-parser'

export default function AdminUploadPage() {
  const [rawText, setRawText] = useState('')
  const [parseResult, setParseResult] = useState<ParseResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 })
  const [showPreview, setShowPreview] = useState(false)
  const [manualContact, setManualContact] = useState('')

  // معالجة النص
  const handleParse = () => {
    if (!rawText.trim()) {
      alert('الرجاء لصق الكشف أولاً')
      return
    }

    const result = parseVehicleList(rawText)
    setParseResult(result)
    setShowPreview(true)

    if (result.contact_number && !manualContact) {
      setManualContact(result.contact_number)
    }

    if (!result.success && result.errors.length > 0) {
      alert('تحذير: بعض السطور لم تُعالج\n' + result.errors.slice(0, 5).join('\n'))
    }
  }

  // ✅ حفظ عبر API Route (يستخدم Service Role Key)
  const handleSave = async () => {
    if (!parseResult || parseResult.vehicles.length === 0) {
      alert('لا توجد عربات للحفظ')
      return
    }

    const contactNumber = manualContact || parseResult.contact_number || null
    
    if (!contactNumber) {
      const proceed = confirm('⚠️ لم يتم العثور على رقم المسؤول\n\nسيتم حفظ العربات بدون رقم مسؤول.\nهل تريد المتابعة؟')
      if (!proceed) return
    }

    const duplicates = checkDuplicates(parseResult.vehicles)
    if (duplicates.length > 0) {
      const proceed = confirm(
        `⚠️ تحذير: يوجد ${duplicates.length} تكرار في الكشف:\n\n` +
        duplicates.slice(0, 5).join('\n') +
        (duplicates.length > 5 ? `\n... و ${duplicates.length - 5} تكرار آخر` : '') +
        '\n\nهل تريد المتابعة؟'
      )
      if (!proceed) return
    }

    setLoading(true)
    setUploadProgress({ current: 0, total: parseResult.vehicles.length })

    try {
      // ✅ استخدام API Route بدلاً من supabase مباشرة
      const response = await fetch('/api/admin/upload-vehicles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vehicles: parseResult.vehicles,
          contactNumber,
          listName: parseResult.list_name || 'admin_upload'
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'حدث خطأ في الرفع')
      }

      // عرض النتيجة
      let message = `✅ تم الرفع بنجاح!\n\n`
      message += `✅ نجح: ${data.successCount} عربية\n`
      if (data.errorCount > 0) {
        message += `❌ فشل: ${data.errorCount}\n\n`
        if (data.errors && data.errors.length > 0) {
          message += 'الأخطاء:\n' + data.errors.slice(0, 10).join('\n')
          if (data.errors.length > 10) {
            message += `\n... و ${data.errors.length - 10} خطأ آخر`
          }
        }
      }
      if (contactNumber) {
        message += `\n\n📞 رقم المسؤول المحفوظ: ${contactNumber}`
      }
      if (parseResult.list_name) {
        message += `\n📋 الكشف: ${parseResult.list_name}`
      }

      alert(message)

      if (data.successCount > 0) {
        setRawText('')
        setParseResult(null)
        setShowPreview(false)
        setManualContact('')
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
2/ دبدوب لوحة 63566 خ3
3/ كلك شاسي 047837 لوحة 55643 / خ1

تواصل واتساب 0999773431`

  return (
    <div className="min-h-screen bg-gray-50 p-4" dir="rtl">
      <div className="container max-w-7xl mx-auto py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">رفع كشوفات العربات الموجودة</h1>
            <p className="text-gray-600 mt-1">قم بلصق كشف العربات مع رقم المسؤول</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => window.location.href = '/admin'} variant="outline">
              رجوع
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
                    الصق الكشف هنا (مع رقم المسؤول)
                  </label>
                  <Textarea
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    placeholder={exampleText}
                    rows={15}
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
                    onClick={() => {
                      setRawText('')
                      setParseResult(null)
                      setShowPreview(false)
                      setManualContact('')
                    }}
                    variant="outline"
                    disabled={loading}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg text-sm">
                  <p className="font-medium mb-2">💡 مهم جداً:</p>
                  <ul className="space-y-1 text-gray-700 text-xs">
                    <li>• ضع رقم المسؤول في الكشف (مثال: تواصل واتساب 0999773431)</li>
                    <li>• سيتم حفظ الرقم مع <strong>كل عربية</strong> في الكشف</li>
                    <li>• يدعم: شاسي فقط، لوحة فقط، أو الاثنين معاً</li>
                    <li>• اللوحات السودانية: "63566 خ3"، "55643 / خ1"، "7072 خ أ ب"</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Preview Section */}
          <div className="space-y-6">
            {showPreview && parseResult && (
              <>
                {(parseResult.contact_number || parseResult.list_name) && (
                  <Card className="border-green-200 bg-green-50">
                    <CardContent className="p-4 space-y-2">
                      {parseResult.list_name && (
                        <div className="text-sm">
                          <span className="font-medium">📋 الكشف:</span> {parseResult.list_name}
                        </div>
                      )}
                      {parseResult.contact_number && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-4 h-4 text-green-600" />
                          <span className="font-medium">رقم المسؤول:</span>
                          <span className="text-green-700 font-mono font-bold">{parseResult.contact_number}</span>
                          <span className="text-xs text-green-600">✓ سيُحفظ مع كل عربية</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                <Card className="border-blue-200">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      رقم المسؤول (تعديل أو إضافة)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Input
                      value={manualContact}
                      onChange={(e) => setManualContact(e.target.value)}
                      placeholder="0999773431 أو +249999773431"
                      className="font-mono"
                    />
                    <p className="text-xs text-gray-600">
                      ⚠️ هذا الرقم سيُحفظ مع <strong>كل عربية</strong> ({parseResult.vehicles.length} عربية)
                    </p>
                  </CardContent>
                </Card>

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

                {parseResult.errors.length > 0 && parseResult.errors.length < 50 && (
                  <Card className="border-amber-200">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-amber-600 text-base">
                        <AlertCircle className="w-5 h-5" />
                        تحذيرات ({parseResult.errors.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-1 max-h-40 overflow-y-auto">
                        {parseResult.errors.slice(0, 10).map((error, i) => (
                          <p key={i} className="text-sm text-amber-700">• {error}</p>
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
                        <div key={i} className="p-3 bg-gray-50 rounded-lg text-sm border-r-4 border-green-500">
                          <p className="font-bold">{vehicle.car_name}</p>
                          {vehicle.chassis_digits && (
                            <p className="text-gray-600">شاسي: {vehicle.chassis_digits}</p>
                          )}
                          {vehicle.plate_full && (
                            <p className="text-gray-600">لوحة: {vehicle.plate_full}</p>
                          )}
                          {vehicle.color && (
                            <p className="text-gray-600">اللون: {vehicle.color}</p>
                          )}
                          <p className="text-xs text-green-600 mt-1">
                            📞 {manualContact || parseResult.contact_number || 'بدون رقم'}
                          </p>
                        </div>
                      ))}
                      {parseResult.vehicles.length > 10 && (
                        <p className="text-center text-sm text-gray-500">
                          ... و {parseResult.vehicles.length - 10} عربية أخرى
                        </p>
                      )}
                    </div>

                    <div className="mt-6">
                      <Button 
                        onClick={handleSave}
                        className="w-full"
                        disabled={loading || parseResult.vehicles.length === 0}
                        size="lg"
                      >
                        {loading ? (
                          <span>جاري الرفع...</span>
                        ) : (
                          <>
                            <Save className="w-5 h-5 ml-2" />
                            حفظ {parseResult.vehicles.length} عربية
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}