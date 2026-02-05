'use client'

import { useState, useEffect } from 'react'
import { Search, Phone, Calendar, CheckCircle2, AlertCircle, Car, FileText, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type MatchedSearch = {
  id: string
  whatsapp: string
  chassis_digits?: string
  plate_digits?: string
  car_name?: string
  status: string
  created_at: string
  matched_at?: string
  matched_vehicle_id?: string
  // معلومات العربية الموجودة
  found_vehicle?: {
    id: string
    car_name: string
    chassis_full?: string
    chassis_digits?: string
    plate_full?: string
    plate_digits?: string
    color?: string
    source?: string
    contact_number?: string
    uploaded_by?: string
    uploaded_at?: string
  }
}

type Stats = {
  total_searches: number
  matched: number
  pending: number
  match_rate: number
}

export default function MatchedVehiclesPage() {
  const [searches, setSearches] = useState<MatchedSearch[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchFilter, setSearchFilter] = useState('')
  const [selectedSearch, setSelectedSearch] = useState<MatchedSearch | null>(null)

  useEffect(() => {
    fetchMatchedSearches()
    fetchStats()
  }, [])

  const fetchMatchedSearches = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/matched-searches')
      const data = await response.json()
      if (data.searches) {
        setSearches(data.searches)
      }
    } catch (error) {
      console.error('Error fetching matched searches:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/matched-searches/stats')
      const data = await response.json()
      if (data.stats) {
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const filteredSearches = searches.filter(search => {
    if (!searchFilter) return true
    const filter = searchFilter.toLowerCase()
    return (
      search.whatsapp?.includes(filter) ||
      search.chassis_digits?.includes(filter) ||
      search.plate_digits?.includes(filter) ||
      search.car_name?.toLowerCase().includes(filter) ||
      search.found_vehicle?.car_name?.toLowerCase().includes(filter)
    )
  })

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'غير محدد'
    const date = new Date(dateString)
    return date.toLocaleDateString('ar-SD', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTimeSince = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (days === 0) return 'اليوم'
    if (days === 1) return 'أمس'
    if (days < 7) return `منذ ${days} أيام`
    if (days < 30) return `منذ ${Math.floor(days / 7)} أسابيع`
    return `منذ ${Math.floor(days / 30)} شهر`
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4" dir="rtl">
      <div className="container max-w-7xl mx-auto py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
              العربات التي تم إيجادها (Matched)
            </h1>
            <p className="text-gray-600 mt-1">طلبات البحث الناجحة مع تفاصيل الباحثين والعربات الموجودة</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => window.location.href = '/admin'} variant="outline">
              رجوع
            </Button>
            <Button onClick={fetchMatchedSearches} disabled={loading}>
              تحديث
            </Button>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">إجمالي الطلبات</p>
                    <p className="text-3xl font-bold text-blue-600">{stats.total_searches}</p>
                  </div>
                  <Search className="w-8 h-8 text-blue-600 opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">تم إيجادها</p>
                    <p className="text-3xl font-bold text-green-600">{stats.matched}</p>
                  </div>
                  <CheckCircle2 className="w-8 h-8 text-green-600 opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">قيد البحث</p>
                    <p className="text-3xl font-bold text-amber-600">{stats.pending}</p>
                  </div>
                  <Clock className="w-8 h-8 text-amber-600 opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">نسبة النجاح</p>
                    <p className="text-3xl font-bold text-purple-600">{stats.match_rate}%</p>
                  </div>
                  <Car className="w-8 h-8 text-purple-600 opacity-20" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search Filter */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Search className="w-5 h-5 text-gray-400" />
              <Input
                placeholder="ابحث برقم الواتساب، الشاسي، اللوحة، أو اسم العربية..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="flex-1"
              />
              {searchFilter && (
                <Button variant="ghost" onClick={() => setSearchFilter('')}>
                  مسح
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Searches List */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">جاري التحميل...</p>
          </div>
        ) : filteredSearches.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">لا توجد عربات تم إيجادها</p>
              {searchFilter && (
                <p className="text-sm text-gray-500 mt-2">جرب البحث بكلمات مختلفة</p>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredSearches.map((search) => (
              <Card 
                key={search.id}
                className="hover:shadow-lg transition-shadow cursor-pointer border-r-4 border-green-500"
                onClick={() => setSelectedSearch(search)}
              >
                <CardContent className="p-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* معلومات الباحث */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 pb-3 border-b">
                        <Phone className="w-5 h-5 text-blue-600" />
                        <h3 className="font-bold text-lg">معلومات الباحث</h3>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-start gap-2">
                          <Phone className="w-4 h-4 text-gray-400 mt-1" />
                          <div>
                            <p className="text-sm text-gray-600">رقم الواتساب</p>
                            <p className="font-mono font-bold text-green-700">{search.whatsapp}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <Calendar className="w-4 h-4 text-gray-400 mt-1" />
                          <div>
                            <p className="text-sm text-gray-600">تاريخ الطلب</p>
                            <p className="font-medium">{getTimeSince(search.created_at)}</p>
                            <p className="text-xs text-gray-500">{formatDate(search.created_at)}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-600 mt-1" />
                          <div>
                            <p className="text-sm text-gray-600">تم الإيجاد</p>
                            <p className="font-medium text-green-700">
                              {search.matched_at ? getTimeSince(search.matched_at) : 'غير محدد'}
                            </p>
                            {search.matched_at && (
                              <p className="text-xs text-gray-500">{formatDate(search.matched_at)}</p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 border-t">
                        <p className="text-sm text-gray-600 mb-2">البحث عن:</p>
                        {search.chassis_digits && (
                          <div className="text-sm">
                            <span className="font-medium">شاسي:</span>{' '}
                            <span className="font-mono">{search.chassis_digits}</span>
                          </div>
                        )}
                        {search.plate_digits && (
                          <div className="text-sm">
                            <span className="font-medium">لوحة:</span>{' '}
                            <span className="font-mono">{search.plate_digits}</span>
                          </div>
                        )}
                        {search.car_name && (
                          <div className="text-sm">
                            <span className="font-medium">العربية:</span> {search.car_name}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* معلومات العربية الموجودة */}
                    {search.found_vehicle && (
                      <div className="space-y-4 bg-green-50 p-4 rounded-lg">
                        <div className="flex items-center gap-2 pb-3 border-b border-green-200">
                          <Car className="w-5 h-5 text-green-600" />
                          <h3 className="font-bold text-lg text-green-800">العربية الموجودة</h3>
                        </div>

                        <div className="space-y-2">
                          <div>
                            <p className="text-sm text-gray-600">اسم العربية</p>
                            <p className="font-bold text-lg">{search.found_vehicle.car_name}</p>
                          </div>

                          {search.found_vehicle.chassis_digits && (
                            <div>
                              <p className="text-sm text-gray-600">رقم الشاسي</p>
                              <p className="font-mono font-bold">{search.found_vehicle.chassis_digits}</p>
                            </div>
                          )}

                          {search.found_vehicle.plate_full && (
                            <div>
                              <p className="text-sm text-gray-600">رقم اللوحة</p>
                              <p className="font-mono font-bold">{search.found_vehicle.plate_full}</p>
                            </div>
                          )}

                          {search.found_vehicle.color && (
                            <div>
                              <p className="text-sm text-gray-600">اللون</p>
                              <p className="font-medium">{search.found_vehicle.color}</p>
                            </div>
                          )}
                        </div>

                        {search.found_vehicle.contact_number && (
                          <div className="pt-3 border-t border-green-200">
                            <p className="text-sm text-gray-600">رقم المسؤول</p>
                            <p className="font-mono font-bold text-green-700">
                              {search.found_vehicle.contact_number}
                            </p>
                          </div>
                        )}

                        {search.found_vehicle.source && (
                          <div>
                            <p className="text-sm text-gray-600">المصدر</p>
                            <p className="font-medium">{search.found_vehicle.source}</p>
                          </div>
                        )}

                        {search.found_vehicle.uploaded_at && (
                          <div>
                            <p className="text-sm text-gray-600">تاريخ الرفع</p>
                            <p className="text-sm">{formatDate(search.found_vehicle.uploaded_at)}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mt-4 pt-4 border-t flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        window.open(`https://wa.me/${search.whatsapp.replace(/\D/g, '')}`, '_blank')
                      }}
                    >
                      <Phone className="w-4 h-4 ml-2" />
                      اتصل بالباحث
                    </Button>
                    {search.found_vehicle?.contact_number && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          const number = search.found_vehicle?.contact_number?.replace(/\D/g, '') || ''
                          window.open(`https://wa.me/${number}`, '_blank')
                        }}
                      >
                        <Phone className="w-4 h-4 ml-2" />
                        اتصل بالمسؤول
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Details Modal */}
        {selectedSearch && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedSearch(null)}
          >
            <Card 
              className="max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-6 h-6" />
                  تفاصيل كاملة
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-bold mb-3 pb-2 border-b">معلومات الباحث</h3>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-600">رقم الواتساب:</span>{' '}
                        <span className="font-mono font-bold">{selectedSearch.whatsapp}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">تاريخ الطلب:</span>{' '}
                        <span>{formatDate(selectedSearch.created_at)}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">تم الإيجاد:</span>{' '}
                        <span>{formatDate(selectedSearch.matched_at)}</span>
                      </div>
                    </div>
                  </div>

                  {selectedSearch.found_vehicle && (
                    <div>
                      <h3 className="font-bold mb-3 pb-2 border-b">معلومات العربية</h3>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-gray-600">الاسم:</span>{' '}
                          <span className="font-bold">{selectedSearch.found_vehicle.car_name}</span>
                        </div>
                        {selectedSearch.found_vehicle.chassis_digits && (
                          <div>
                            <span className="text-gray-600">الشاسي:</span>{' '}
                            <span className="font-mono">{selectedSearch.found_vehicle.chassis_digits}</span>
                          </div>
                        )}
                        {selectedSearch.found_vehicle.plate_full && (
                          <div>
                            <span className="text-gray-600">اللوحة:</span>{' '}
                            <span className="font-mono">{selectedSearch.found_vehicle.plate_full}</span>
                          </div>
                        )}
                        {selectedSearch.found_vehicle.contact_number && (
                          <div>
                            <span className="text-gray-600">رقم المسؤول:</span>{' '}
                            <span className="font-mono font-bold">{selectedSearch.found_vehicle.contact_number}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  <Button onClick={() => setSelectedSearch(null)} className="flex-1">
                    إغلاق
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}