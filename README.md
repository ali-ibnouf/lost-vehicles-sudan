# 🚗 Lost Vehicles Sudan - نظام البحث عن العربات المفقودة

نظام مجاني 100% للبحث عن العربات المفقودة في السودان، مبني بتقنيات حديثة وبدون تكاليف تشغيل.

## 🎯 المزايا الرئيسية

- ✅ **مجاني تماماً** - التكلفة: $0/شهر
- ✅ **بحث ذكي** - دعم البحث الجزئي والكامل
- ✅ **محلل متقدم** - يفهم 3 أنماط مختلفة من الكشوفات
- ✅ **PWA** - يعمل offline ويمكن تثبيته على الهاتف
- ✅ **سريع جداً** - Edge Network عالمي
- ✅ **آمن** - Row Level Security في Supabase
- ✅ **عربي 100%** - RTL ودعم كامل للعربية

## 🛠️ التقنيات المستخدمة

### Frontend
- **Next.js 14** - React Framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI Components

### Backend
- **Supabase** - PostgreSQL Database + Auth
- **Edge Functions** - Serverless APIs
- **Row Level Security** - Database security

### Hosting
- **Vercel** - Free hosting + Edge Network
- **Cloudflare** (Optional) - CDN

## 📦 التثبيت والإعداد

### المتطلبات
- Node.js 18+ 
- npm أو yarn
- حساب Supabase (مجاني)
- حساب Vercel (مجاني)

### خطوة 1: Clone المشروع

```bash
git clone <repository-url>
cd lost-vehicles-sudan
```

### خطوة 2: تثبيت المكتبات

```bash
npm install
```

### خطوة 3: إعداد Supabase

1. **إنشاء مشروع جديد:**
   - اذهب إلى [https://supabase.com](https://supabase.com)
   - اضغط "New Project"
   - اختر اسم وكلمة مرور قوية
   - اختر Region: `Southeast Asia (Singapore)` - الأقرب للسودان

2. **إنشاء Database Schema:**
   - اذهب إلى SQL Editor في Supabase
   - الصق محتوى ملف `supabase-schema.sql`
   - اضغط "Run"

3. **الحصول على API Keys:**
   - Settings → API
   - احفظ:
     - `Project URL`
     - `anon/public key`

### خطوة 4: إعداد Environment Variables

انسخ `.env.example` إلى `.env.local`:

```bash
cp .env.example .env.local
```

عدّل الملف:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
ADMIN_SECRET=change-to-strong-password
```

⚠️ **مهم جداً:** غيّر `ADMIN_SECRET` إلى كلمة مرور قوية!

### خطوة 5: تشغيل المشروع محلياً

```bash
npm run dev
```

افتح [http://localhost:3000](http://localhost:3000)

## 🚀 النشر على Vercel

### الطريقة الأسهل (Git)

1. ارفع المشروع على GitHub/GitLab
2. اذهب إلى [https://vercel.com](https://vercel.com)
3. اضغط "Import Project"
4. اختر المشروع من Git
5. أضف Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `ADMIN_SECRET`
6. اضغط "Deploy"

### الطريقة اليدوية (CLI)

```bash
# تثبيت Vercel CLI
npm i -g vercel

# تسجيل دخول
vercel login

# النشر
vercel --prod
```

## 📖 دليل الاستخدام

### للمستخدمين (البحث)

1. افتح الموقع
2. أدخل:
   - رقم الواتساب (إجباري)
   - رقم الشاسي أو رقم اللوحة
   - اسم العربية (اختياري)
3. اضغط "ابحث الآن"
4. إذا وجدت نتائج، ستظهر تفاصيل العربات
5. إذا لم توجد، سيتم حفظ طلبك للمتابعة

### للإدارة (رفع الكشوفات)

1. افتح `/admin`
2. أدخل كلمة المرور
3. الصق الكشف الكامل في الحقل
4. اضغط "تحليل ورفع"
5. ستظهر النتائج (نجاح/فشل)

#### صيغ الكشوفات المدعومة:

```
# الصيغة 1: شرطة
دبدوب - 123456789 - خ 12345

# الصيغة 2: عمود رأسي
امجاد | شاسي: 987654321 | لوحة: خ 54321

# الصيغة 3: نص حر
عربية الطيب رقم 555666777
```

## 🏗️ البنية المعمارية

```
lost-vehicles-sudan/
├── app/                      # Next.js App Router
│   ├── page.tsx             # صفحة البحث الرئيسية
│   ├── admin/               # لوحة الإدارة
│   │   └── page.tsx
│   ├── api/                 # API Routes
│   │   ├── search/
│   │   │   └── route.ts    # البحث
│   │   └── upload/
│   │       └── route.ts    # الرفع
│   ├── layout.tsx          # Layout رئيسي
│   └── globals.css         # Styles
├── components/
│   └── ui/                 # UI Components
│       ├── button.tsx
│       ├── input.tsx
│       ├── card.tsx
│       └── textarea.tsx
├── lib/
│   ├── supabase.ts         # Supabase client
│   ├── utils.ts            # Utilities
│   └── parser.ts           # محلل الكشوفات
├── public/
│   └── manifest.json       # PWA manifest
├── supabase-schema.sql     # Database schema
└── package.json
```

## 🔧 API Documentation

### POST /api/search

البحث عن عربة.

**Request:**
```json
{
  "whatsapp": "+249912345678",
  "chassis": "123456",
  "plate": "12345",
  "carName": "دبدوب"
}
```

**Response:**
```json
{
  "found": true,
  "message": "تم العثور على 2 نتيجة",
  "results": [
    {
      "id": "...",
      "car_name": "دبدوب",
      "chassis_full": "123456789",
      "chassis_digits": "123456789",
      "plate_full": "خ 12345",
      "plate_digits": "12345",
      "extra_details": "...",
      "created_at": "2024-01-27T..."
    }
  ]
}
```

### POST /api/upload

رفع كشوفات (Admin فقط).

**Headers:**
```
Authorization: Bearer your-admin-secret
```

**Request:**
```json
{
  "bulkText": "دبدوب - 123456789 - خ 12345\nامجاد - 987654321"
}
```

**Response:**
```json
{
  "success": 2,
  "failed": 0,
  "message": "تم رفع 2 عربية بنجاح",
  "errors": [],
  "stats": {
    "total": 2,
    "parsed": 2,
    "failed": 0
  }
}
```

## 📊 Database Schema

### found_vehicles
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| car_name | TEXT | اسم العربية |
| chassis_full | TEXT | رقم الشاسي الكامل |
| chassis_digits | TEXT | الأرقام فقط |
| plate_full | TEXT | رقم اللوحة الكامل |
| plate_digits | TEXT | الأرقام فقط |
| extra_details | TEXT | تفاصيل إضافية |
| created_at | TIMESTAMPTZ | تاريخ الإضافة |

### search_requests
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| whatsapp | TEXT | رقم الواتساب |
| chassis_digits | TEXT | رقم الشاسي |
| plate_digits | TEXT | رقم اللوحة |
| status | TEXT | حالة الطلب |
| created_at | TIMESTAMPTZ | تاريخ الطلب |

## 🔒 الأمان

- ✅ Row Level Security (RLS) على جميع الجداول
- ✅ Environment variables للمفاتيح الحساسة
- ✅ Admin authentication
- ✅ Input validation
- ✅ HTTPS only (Vercel)
- ✅ CORS protection

## 📈 الأداء والتحسين

### Indexes
- `chassis_digits` - GIN index للبحث الجزئي
- `plate_digits` - B-tree index للبحث الدقيق
- `created_at` - للترتيب

### Caching
- Vercel Edge Caching
- Static assets CDN
- Database connection pooling

### Monitoring
- Vercel Analytics (built-in)
- Supabase Dashboard
- Error tracking في console

## 🐛 Troubleshooting

### المشروع لا يعمل محلياً

```bash
# تأكد من Node.js version
node --version  # يجب أن يكون 18+

# حذف node_modules وإعادة التثبيت
rm -rf node_modules
npm install

# تأكد من .env.local
cat .env.local
```

### خطأ في Supabase

```bash
# تأكد من الـ Keys
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY

# تأكد من RLS
# افتح Supabase → Database → Policies
```

### خطأ في البحث

- تأكد من وجود indexes في Database
- تحقق من Browser console للأخطاء
- راجع Supabase logs

## 📝 Roadmap

### المرحلة 1 (الحالية)
- ✅ البحث الأساسي
- ✅ رفع الكشوفات
- ✅ Admin panel

### المرحلة 2
- [ ] إشعارات WhatsApp تلقائية
- [ ] لوحة تحكم متقدمة
- [ ] إحصائيات وتقارير
- [ ] صور للعربات

### المرحلة 3
- [ ] تطبيق موبايل (React Native)
- [ ] نظام المستخدمين
- [ ] API عامة
- [ ] تكامل مع جهات حكومية

## 🤝 المساهمة

نرحب بالمساهمات! 

1. Fork المشروع
2. أنشئ branch (`git checkout -b feature/amazing`)
3. Commit تغييراتك (`git commit -m 'Add feature'`)
4. Push (`git push origin feature/amazing`)
5. افتح Pull Request

## 📄 الترخيص

هذا المشروع مفتوح المصدر ومجاني للاستخدام.

## 👨‍💻 المطور

Ali Hassan - مهندس كهرباء ومطور Full Stack

## 📞 الدعم

- GitHub Issues: للمشاكل التقنية
- Email: [your-email]
- WhatsApp: [your-number]

---

**صُنع بـ ❤️ في السودان، من أجل السودان**
