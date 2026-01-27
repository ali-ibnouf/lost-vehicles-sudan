'use client'

import { useState } from 'react'
import { Search, Phone, Car, FileText, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { Vehicle } from '@/lib/supabase'

export default function SearchPage() {
  const [whatsapp, setWhatsapp] = useState('')
  const [chassis, setChassis] = useState('')
  const [plate, setPlate] = useState('')
  const [carName, setCarName] = useState('')
  const [results, setResults] = useState<Vehicle[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info')

  const handleSearch = async () => {
    // Reset
    setMessage('')
    setResults([])

    // Validation
    if (!whatsapp.trim()) {
      setMessage('الرجاء إدخال رقم الواتساب')
      setMessageType('error')
      return
    }

    if (!chassis.trim() && !plate.trim()) {
      setMessage('الرجاء إدخال رقم الشاسي أو رقم اللوحة')
      setMessageType('error')
      return
    }

    setIsSearching(true)

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          whatsapp: whatsapp.trim(),
          chassis: chassis.trim(),
          plate: plate.trim(),
          carName: carName.trim()
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setMessage(data.error || 'حدث خطأ في البحث')
        setMessageType('error')
        return
      }

      setMessage(data.message)
      setMessageType(data.found ? 'success' : 'info')
      
      if (data.results && data.results.length > 0) {
        setResults(data.results)
      }

    } catch (error) {
      console.error('Search error:', error)
      setMessage('حدث خطأ في الاتصال، الرجاء المحاولة مرة أخرى')
      setMessageType('error')
    } finally {
      setIsSearching(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isSearching) {
      handleSearch()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-blue-50" dir="rtl">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="flex justify-center mb-4">
            <div className="bg-primary/10 p-4 rounded-full">
              <Car className="w-12 h-12 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">
            ابحث عن عربيتك
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            نظام البحث عن العربات المفقودة في السودان
            <br />
            أدخل بياناتك وسنساعدك في العثور على عربيتك
          </p>
        </div>

        {/* Search Form */}
        <Card className="shadow-lg mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              نموذج البحث
            </CardTitle>
            <CardDescription>
              أدخل بياناتك للبحث في قاعدة البيانات
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* WhatsApp */}
              <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  رقم الواتساب <span className="text-red-500">*</span>
                </label>
                <Input
                  type="tel"
                  placeholder="0912345678 أو +249912345678"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  onKeyPress={handleKeyPress}
                  dir="ltr"
                  className="text-right"
                />
                <p className="text-xs text-gray-500 mt-1">
                  سنتواصل معك على هذا الرقم إذا وجدنا عربيتك
                </p>
              </div>

              {/* Chassis */}
              <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  رقم الشاسي (آخر 6 أرقام أو أكثر)
                </label>
                <Input
                  type="text"
                  placeholder="123456 أو 123456789"
                  value={chassis}
                  onChange={(e) => setChassis(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
                <p className="text-xs text-gray-500 mt-1">
                  يمكنك إدخال جزء من رقم الشاسي (6 أرقام على الأقل)
                </p>
              </div>

              {/* Plate */}
              <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                  <Car className="w-4 h-4" />
                  رقم اللوحة
                </label>
                <Input
                  type="text"
                  placeholder="خ 12345 أو 12345"
                  value={plate}
                  onChange={(e) => setPlate(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
              </div>

              {/* Car Name */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  اسم العربية (اختياري)
                </label>
                <Input
                  type="text"
                  placeholder="دبدوب، امجاد، الخ..."
                  value={carName}
                  onChange={(e) => setCarName(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
              </div>

              {/* Search Button */}
              <Button
                onClick={handleSearch}
                disabled={isSearching}
                className="w-full"
                size="lg"
              >
                {isSearching ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                    جاري البحث...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 ml-2" />
                    ابحث الآن
                  </>
                )}
              </Button>
            </div>

            {/* Message */}
            {message && (
              <div
                className={`mt-6 p-4 rounded-lg flex items-start gap-3 ${
                  messageType === 'success'
                    ? 'bg-green-50 text-green-800 border border-green-200'
                    : messageType === 'error'
                    ? 'bg-red-50 text-red-800 border border-red-200'
                    : 'bg-blue-50 text-blue-800 border border-blue-200'
                }`}
              >
                {messageType === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                )}
                <p className="flex-1">{message}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-4 animate-fade-in">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
              النتائج ({results.length})
            </h2>
            
            {results.map((result) => (
              <Card key={result.id} className="shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-primary mb-2">
                    {result.car_name}
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm mb-3">
                    {result.chassis_full && (
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-600">رقم الشاسي:</span>
                        <span className="font-mono font-semibold">{result.chassis_full}</span>
                      </div>
                    )}
                    
                    {result.plate_full && (
                      <div className="flex items-center gap-2">
                        <Car className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-600">رقم اللوحة:</span>
                        <span className="font-semibold">{result.plate_full}</span>
                      </div>
                    )}
                  </div>

                  {result.extra_details && (
                    <p className="text-gray-700 bg-gray-50 p-3 rounded-md text-sm">
                      {result.extra_details}
                    </p>
                  )}

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500">
                      تم الإضافة: {new Date(result.created_at).toLocaleDateString('ar-SD')}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Footer Info */}
        <div className="mt-12 text-center text-sm text-gray-600">
          <p className="mb-2">
            هذا النظام مجاني تماماً ويهدف لمساعدة المواطنين في السودان
          </p>
          <p>
            إذا لم تجد عربيتك، سيتم حفظ طلبك وسنتواصل معك عند توفر معلومات
          </p>
        </div>
      </div>
    </div>
  )
}
