'use client'

import { useState, useEffect } from 'react'
import { Plus, Bell, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function AdminRequestsPage() {
  const [adminToken, setAdminToken] = useState('')
  const [requests, setRequests] = useState<any[]>([])
  const [matches, setMatches] = useState<any[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    whatsapp: '', chassis: '', plate: '', carName: '',
    description: '', reward: '', priority: 'normal',
    phoneSecondary: '', notes: ''
  })

  useEffect(() => {
    const token = localStorage.getItem('admin_token') || 'sudan2026admin'
    setAdminToken(token)
    fetchRequests(token)
    fetchMatches(token)
  }, [])

  const fetchRequests = async (token: string) => {
    try {
      const res = await fetch('/api/admin/requests?status=pending', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.requests) setRequests(data.requests)
    } catch (e) { console.error(e) }
  }

  const fetchMatches = async (token: string) => {
    try {
      const res = await fetch('/api/admin/matches?notified=false', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.matches) setMatches(data.matches)
    } catch (e) { console.error(e) }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/admin/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          ...formData,
          reward: formData.reward ? parseFloat(formData.reward) : null
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      alert(data.message)
      setFormData({
        whatsapp: '', chassis: '', plate: '', carName: '',
        description: '', reward: '', priority: 'normal',
        phoneSecondary: '', notes: ''
      })
      setShowAddForm(false)
      fetchRequests(adminToken)
      fetchMatches(adminToken)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  const markAsNotified = async (matchId: string) => {
    try {
      await fetch('/api/admin/matches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({ matchId, notified: true })
      })
      fetchMatches(adminToken)
    } catch (e) { console.error(e) }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4" dir="rtl">
      <div className="container max-w-6xl mx-auto py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">إدارة طلبات البحث</h1>
            <p className="text-gray-600 mt-1">إضافة وإدارة طلبات البحث مع المكافآت</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => window.location.href = '/admin'} variant="outline">
              رفع الكشوفات
            </Button>
            <Button onClick={() => setShowAddForm(!showAddForm)}>
              <Plus className="w-5 h-5 ml-2" />
              طلب جديد
            </Button>
          </div>
        </div>

        {showAddForm && (
          <Card className="mb-8">
            <CardHeader><CardTitle>طلب بحث جديد</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">رقم الواتساب *</label>
                    <Input value={formData.whatsapp} onChange={(e) => setFormData({...formData, whatsapp: e.target.value})} placeholder="0912345678" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">رقم إضافي</label>
                    <Input value={formData.phoneSecondary} onChange={(e) => setFormData({...formData, phoneSecondary: e.target.value})} placeholder="0912345678" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">رقم الشاسي *</label>
                    <Input value={formData.chassis} onChange={(e) => setFormData({...formData, chassis: e.target.value})} placeholder="123456" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">رقم اللوحة</label>
                    <Input value={formData.plate} onChange={(e) => setFormData({...formData, plate: e.target.value})} placeholder="خ 12345" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">اسم العربية</label>
                    <Input value={formData.carName} onChange={(e) => setFormData({...formData, carName: e.target.value})} placeholder="دبدوب، لوري..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">المكافأة (جنيه)</label>
                    <Input type="number" value={formData.reward} onChange={(e) => setFormData({...formData, reward: e.target.value})} placeholder="3000000" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">الأولوية</label>
                    <select value={formData.priority} onChange={(e) => setFormData({...formData, priority: e.target.value})} className="w-full h-10 rounded-md border border-input bg-background px-3">
                      <option value="low">منخفضة</option>
                      <option value="normal">عادية</option>
                      <option value="high">عالية</option>
                      <option value="urgent">عاجلة</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">وصف العربية</label>
                  <Textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="اللون، الموديل..." rows={3} />
                </div>
                <div className="flex gap-3">
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? 'جاري الإضافة...' : 'إضافة الطلب'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>إلغاء</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {matches.length > 0 && (
          <Card className="mb-8 bg-green-50 border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-900">
                <Bell className="w-5 h-5" />
                تطابقات جديدة ({matches.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {matches.map((match) => (
                  <Card key={match.id} className="bg-white">
                    <CardContent className="p-4">
                      <div className="flex justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                            <h4 className="font-bold text-lg">{match.request.carName || 'عربية مفقودة'}</h4>
                            {match.request.reward && (
                              <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-semibold">
                                💰 {match.request.reward.toLocaleString()} {match.request.currency}
                              </span>
                            )}
                          </div>
                          <div className="grid md:grid-cols-2 gap-4 text-sm mb-3">
                            <div>
                              <p className="text-gray-600 font-semibold">الطلب:</p>
                              <p>{match.request.description}</p>
                              <p className="mt-1">📞 {match.request.whatsapp}</p>
                            </div>
                            <div>
                              <p className="text-gray-600 font-semibold">الموجود:</p>
                              <p className="font-semibold text-primary">{match.vehicle.carName}</p>
                              {match.vehicle.chassisFull && <p>شاسي: {match.vehicle.chassisFull}</p>}
                              {match.vehicle.plateFull && <p>لوحة: {match.vehicle.plateFull}</p>}
                            </div>
                          </div>
                        </div>
                        <Button size="sm" onClick={() => markAsNotified(match.id)} variant="outline">
                          تم التواصل
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>الطلبات المعلقة ({requests.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {requests.length === 0 ? (
              <p className="text-center text-gray-500 py-8">لا توجد طلبات معلقة</p>
            ) : (
              <div className="space-y-3">
                {requests.map((req) => (
                  <Card key={req.id} className="bg-gray-50">
                    <CardContent className="p-4">
                      <div className="flex justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-semibold">{req.car_name || 'طلب بحث'}</h4>
                            {req.reward_amount && (
                              <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                                {req.reward_amount.toLocaleString()} {req.reward_currency}
                              </span>
                            )}
                            {req.priority === 'urgent' && (
                              <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">عاجل</span>
                            )}
                          </div>
                          <div className="text-sm text-gray-600">
                            {req.vehicle_description && <p className="mb-1">{req.vehicle_description}</p>}
                            {req.chassis_digits && <p>شاسي: {req.chassis_digits}</p>}
                            {req.plate_digits && <p>لوحة: {req.plate_digits}</p>}
                            <p className="mt-1">📞 {req.whatsapp}</p>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(req.created_at).toLocaleDateString('ar-SD')}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}