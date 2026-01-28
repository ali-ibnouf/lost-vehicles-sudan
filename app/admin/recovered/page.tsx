'use client'

import { useState, useEffect } from 'react'
import { CheckCircle2, Phone, Calendar, DollarSign, FileText, AlertCircle, Clock, User, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type RecoveredVehicle = {
  id: string
  owner_name?: string
  owner_whatsapp: string
  owner_phone_secondary?: string
  car_name: string
  chassis_digits: string
  plate_digits?: string
  contact_date: string
  contact_method?: string
  contact_notes?: string
  recovery_status: string
  recovery_date?: string
  recovery_location?: string
  recovery_notes?: string
  reward_paid: boolean
  reward_amount?: number
  reward_currency?: string
  reward_paid_date?: string
  reward_recipient?: string
  ownership_verified: boolean
  documents_checked: boolean
  priority: string
  created_at: string
}

type Stats = {
  total_recovered: number
  contacted: number
  verified: number
  scheduled: number
  recovered: number
  rejected: number
  rewards_paid: number
  total_rewards: number
  pending_rewards: number
}

export default function RecoveredVehiclesPage() {
  const [adminToken, setAdminToken] = useState('')
  const [vehicles, setVehicles] = useState<RecoveredVehicle[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedVehicle, setSelectedVehicle] = useState<RecoveredVehicle | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [filter, setFilter] = useState<string>('all')

  const [formData, setFormData] = useState({
    owner_whatsapp: '',
    owner_phone_secondary: '',
    owner_name: '',
    car_name: '',
    chassis_digits: '',
    plate_digits: '',
    contact_method: 'whatsapp',
    contact_notes: '',
    reward_amount: '',
    priority: 'normal'
  })

  const [updateForm, setUpdateForm] = useState({
    recovery_status: '',
    recovery_location: '',
    recovery_notes: '',
    ownership_verified: false,
    documents_checked: false,
    reward_paid: false,
    reward_recipient: ''
  })

  useEffect(() => {
    const token = localStorage.getItem('admin_token') || 'sudan2026admin'
    setAdminToken(token)
    fetchVehicles(token)
    fetchStats(token)
  }, [])

  const fetchVehicles = async (token: string) => {
    try {
      const response = await fetch('/api/admin/recovered', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (data.vehicles) setVehicles(data.vehicles)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const fetchStats = async (token: string) => {
    try {
      const response = await fetch('/api/admin/recovered/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (data.stats) setStats(data.stats)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/admin/recovered', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          ...formData,
          reward_amount: formData.reward_amount ? parseFloat(formData.reward_amount) : null
        })
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error)

      alert('تم إضافة العربية بنجاح!')
      setFormData({
        owner_whatsapp: '', owner_phone_secondary: '', owner_name: '',
        car_name: '', chassis_digits: '', plate_digits: '',
        contact_method: 'whatsapp', contact_notes: '',
        reward_amount: '', priority: 'normal'
      })
      setShowAddForm(false)
      fetchVehicles(adminToken)
      fetchStats(adminToken)
    } catch (error: any) {
      alert(error.message || 'حدث خطأ')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (vehicleId: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/recovered/${vehicleId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify(updateForm)
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error)

      alert('تم التحديث بنجاح!')
      setSelectedVehicle(null)
      fetchVehicles(adminToken)
      fetchStats(adminToken)
    } catch (error: any) {
      alert(error.message || 'حدث خطأ')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    const colors = {
      contacted: 'bg-blue-100 text-blue-800',
      verified: 'bg-purple-100 text-purple-800',
      scheduled: 'bg-yellow-100 text-yellow-800',
      recovered: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getStatusText = (status: string) => {
    const texts = {
      contacted: 'تم الاتصال',
      verified: 'تم التحقق',
      scheduled: 'موعد محدد',
      recovered: 'تم الاسترجاع',
      rejected: 'مرفوض',
      cancelled: 'ملغي'
    }
    return texts[status as keyof typeof texts] || status
  }

  const filteredVehicles = vehicles.filter(v => 
    filter === 'all' || v.recovery_status === filter
  )

  return (
    <div className="min-h-screen bg-gray-50 p-4" dir="rtl">
      <div className="container max-w-7xl mx-auto py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">العربات المسترجعة</h1>
            <p className="text-gray-600 mt-1">إدارة ومتابعة العربات المسترجعة</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => window.location.href = '/admin'} variant="outline">
              لوحة التحكم
            </Button>
            <Button onClick={() => setShowAddForm(!showAddForm)}>
              + إضافة عربية مسترجعة
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">إجمالي</p>
                    <p className="text-2xl font-bold">{stats.total_recovered}</p>
                  </div>
                  <FileText className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">تم الاسترجاع</p>
                    <p className="text-2xl font-bold text-green-600">{stats.recovered}</p>
                  </div>
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">مكافآت مدفوعة</p>
                    <p className="text-2xl font-bold text-yellow-600">{stats.rewards_paid}</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">إجمالي المكافآت</p>
                    <p className="text-xl font-bold">{(stats.total_rewards || 0).toLocaleString()}</p>
                    <p className="text-xs text-gray-500">جنيه</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Add Form */}
        {showAddForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>إضافة عربية مسترجعة</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddVehicle} className="space-y-4">
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">رقم الواتساب *</label>
                    <Input
                      value={formData.owner_whatsapp}
                      onChange={(e) => setFormData({...formData, owner_whatsapp: e.target.value})}
                      placeholder="0912345678"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">رقم إضافي</label>
                    <Input
                      value={formData.owner_phone_secondary}
                      onChange={(e) => setFormData({...formData, owner_phone_secondary: e.target.value})}
                      placeholder="0923456789"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">اسم المالك</label>
                    <Input
                      value={formData.owner_name}
                      onChange={(e) => setFormData({...formData, owner_name: e.target.value})}
                      placeholder="أحمد محمد"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">اسم العربية *</label>
                    <Input
                      value={formData.car_name}
                      onChange={(e) => setFormData({...formData, car_name: e.target.value})}
                      placeholder="دبدوب، كلك..."
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">رقم الشاسي *</label>
                    <Input
                      value={formData.chassis_digits}
                      onChange={(e) => setFormData({...formData, chassis_digits: e.target.value})}
                      placeholder="123456"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">رقم اللوحة</label>
                    <Input
                      value={formData.plate_digits}
                      onChange={(e) => setFormData({...formData, plate_digits: e.target.value})}
                      placeholder="خ 12345"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">طريقة الاتصال</label>
                    <select
                      value={formData.contact_method}
                      onChange={(e) => setFormData({...formData, contact_method: e.target.value})}
                      className="w-full h-10 rounded-md border border-input bg-background px-3"
                    >
                      <option value="whatsapp">واتساب</option>
                      <option value="phone">هاتف</option>
                      <option value="visit">زيارة</option>
                      <option value="other">أخرى</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">المكافأة (جنيه)</label>
                    <Input
                      type="number"
                      value={formData.reward_amount}
                      onChange={(e) => setFormData({...formData, reward_amount: e.target.value})}
                      placeholder="500000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">الأولوية</label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({...formData, priority: e.target.value})}
                      className="w-full h-10 rounded-md border border-input bg-background px-3"
                    >
                      <option value="low">منخفضة</option>
                      <option value="normal">عادية</option>
                      <option value="high">عالية</option>
                      <option value="urgent">عاجلة</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">ملاحظات الاتصال</label>
                  <Textarea
                    value={formData.contact_notes}
                    onChange={(e) => setFormData({...formData, contact_notes: e.target.value})}
                    placeholder="تم الاتصال عبر واتساب - رد بعد 10 دقائق..."
                    rows={3}
                  />
                </div>

                <div className="flex gap-3">
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? 'جاري الإضافة...' : 'إضافة العربية'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                    إلغاء
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex gap-2 overflow-x-auto">
              {['all', 'contacted', 'verified', 'scheduled', 'recovered', 'rejected'].map(status => (
                <Button
                  key={status}
                  variant={filter === status ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter(status)}
                >
                  {status === 'all' ? 'الكل' : getStatusText(status)}
                  {status !== 'all' && ` (${vehicles.filter(v => v.recovery_status === status).length})`}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Vehicles List */}
        <div className="space-y-4">
          {filteredVehicles.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                لا توجد عربات مسترجعة
              </CardContent>
            </Card>
          ) : (
            filteredVehicles.map((vehicle) => (
              <Card key={vehicle.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold">{vehicle.car_name}</h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(vehicle.recovery_status)}`}>
                          {getStatusText(vehicle.recovery_status)}
                        </span>
                        {vehicle.priority === 'urgent' && (
                          <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">
                            عاجل
                          </span>
                        )}
                      </div>

                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-gray-500" />
                            <span>{vehicle.owner_whatsapp}</span>
                            {vehicle.owner_phone_secondary && (
                              <span className="text-gray-500">/ {vehicle.owner_phone_secondary}</span>
                            )}
                          </div>
                          
                          {vehicle.owner_name && (
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-gray-500" />
                              <span>{vehicle.owner_name}</span>
                            </div>
                          )}

                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-gray-500" />
                            <span>شاسي: {vehicle.chassis_digits}</span>
                            {vehicle.plate_digits && <span>• لوحة: {vehicle.plate_digits}</span>}
                          </div>

                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-500" />
                            <span>تاريخ الاتصال: {new Date(vehicle.contact_date).toLocaleDateString('ar-SD')}</span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          {vehicle.recovery_date && (
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-500" />
                              <span>موعد الاسترجاع: {new Date(vehicle.recovery_date).toLocaleDateString('ar-SD')}</span>
                            </div>
                          )}

                          {vehicle.recovery_location && (
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-gray-500" />
                              <span>{vehicle.recovery_location}</span>
                            </div>
                          )}

                          {vehicle.reward_amount && (
                            <div className="flex items-center gap-2">
                              <DollarSign className="w-4 h-4 text-yellow-600" />
                              <span className="font-semibold text-yellow-600">
                                {vehicle.reward_amount.toLocaleString()} {vehicle.reward_currency}
                              </span>
                              {vehicle.reward_paid && (
                                <span className="text-green-600 text-xs">(✓ مدفوعة)</span>
                              )}
                            </div>
                          )}

                          <div className="flex items-center gap-3 text-xs">
                            {vehicle.ownership_verified && (
                              <span className="text-green-600">✓ تم التحقق</span>
                            )}
                            {vehicle.documents_checked && (
                              <span className="text-green-600">✓ الوثائق</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {vehicle.contact_notes && (
                        <div className="mt-3 p-3 bg-gray-50 rounded text-sm">
                          <p className="text-gray-700">{vehicle.contact_notes}</p>
                        </div>
                      )}
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedVehicle(vehicle)
                        setUpdateForm({
                          recovery_status: vehicle.recovery_status,
                          recovery_location: vehicle.recovery_location || '',
                          recovery_notes: vehicle.recovery_notes || '',
                          ownership_verified: vehicle.ownership_verified,
                          documents_checked: vehicle.documents_checked,
                          reward_paid: vehicle.reward_paid,
                          reward_recipient: vehicle.reward_recipient || ''
                        })
                      }}
                    >
                      تحديث الحالة
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Update Modal */}
        {selectedVehicle && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle>تحديث حالة: {selectedVehicle.car_name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">حالة الاسترجاع</label>
                    <select
                      value={updateForm.recovery_status}
                      onChange={(e) => setUpdateForm({...updateForm, recovery_status: e.target.value})}
                      className="w-full h-10 rounded-md border border-input bg-background px-3"
                    >
                      <option value="contacted">تم الاتصال</option>
                      <option value="verified">تم التحقق</option>
                      <option value="scheduled">موعد محدد</option>
                      <option value="recovered">تم الاسترجاع</option>
                      <option value="rejected">مرفوض</option>
                      <option value="cancelled">ملغي</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">مكان الاسترجاع</label>
                    <Input
                      value={updateForm.recovery_location}
                      onChange={(e) => setUpdateForm({...updateForm, recovery_location: e.target.value})}
                      placeholder="مركز الشرطة - الخرطوم"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">ملاحظات</label>
                    <Textarea
                      value={updateForm.recovery_notes}
                      onChange={(e) => setUpdateForm({...updateForm, recovery_notes: e.target.value})}
                      placeholder="ملاحظات إضافية..."
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={updateForm.ownership_verified}
                        onChange={(e) => setUpdateForm({...updateForm, ownership_verified: e.target.checked})}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">تم التحقق من الملكية</span>
                    </label>

                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={updateForm.documents_checked}
                        onChange={(e) => setUpdateForm({...updateForm, documents_checked: e.target.checked})}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">تم فحص الوثائق</span>
                    </label>
                  </div>

                  {selectedVehicle.reward_amount && (
                    <>
                      <div className="border-t pt-4">
                        <h4 className="font-semibold mb-3">المكافأة</h4>
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-sm">
                            <DollarSign className="w-4 h-4" />
                            <span>المبلغ: {selectedVehicle.reward_amount.toLocaleString()} جنيه</span>
                          </div>

                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={updateForm.reward_paid}
                              onChange={(e) => setUpdateForm({...updateForm, reward_paid: e.target.checked})}
                              className="w-4 h-4"
                            />
                            <span className="text-sm">تم دفع المكافأة</span>
                          </label>

                          {updateForm.reward_paid && (
                            <div>
                              <label className="block text-sm font-medium mb-2">اسم المستلم</label>
                              <Input
                                value={updateForm.reward_recipient}
                                onChange={(e) => setUpdateForm({...updateForm, reward_recipient: e.target.value})}
                                placeholder="أحمد محمد"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  <div className="flex gap-3 pt-4">
                    <Button
                      onClick={() => handleUpdateStatus(selectedVehicle.id)}
                      disabled={loading}
                      className="flex-1"
                    >
                      {loading ? 'جاري التحديث...' : 'حفظ التحديثات'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setSelectedVehicle(null)}
                    >
                      إلغاء
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}