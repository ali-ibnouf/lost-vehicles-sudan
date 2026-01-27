# 🚀 دليل البدء السريع - 15 دقيقة

## الخطوة 1: إعداد Supabase (5 دقائق)

### 1.1 إنشاء المشروع
```
1. افتح https://supabase.com
2. Sign Up / Login
3. New Project
   - Name: lost-vehicles-sudan
   - Password: [كلمة مرور قوية - احفظها]
   - Region: Southeast Asia (Singapore)
4. Wait 2-3 minutes
```

### 1.2 إنشاء Database
```
1. SQL Editor (من القائمة الجانبية)
2. New Query
3. الصق محتوى ملف supabase-schema.sql
4. Run (F5)
5. ✅ يجب أن ترى "Success. No rows returned"
```

### 1.3 الحصول على API Keys
```
1. Settings (أيقونة الترس) → API
2. احفظ:
   - Project URL: https://xxxxx.supabase.co
   - anon public: eyJhbGc...
```

---

## الخطوة 2: إعداد المشروع محلياً (5 دقائق)

### 2.1 تحميل وتثبيت
```bash
# Clone (أو حمّل ZIP)
git clone <repo-url>
cd lost-vehicles-sudan

# تثبيت
npm install
```

### 2.2 إعداد Environment Variables
```bash
# انسخ الملف
cp .env.example .env.local

# عدّل .env.local
nano .env.local  # أو أي محرر نصوص
```

**ضع هذه القيم:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
ADMIN_SECRET=sudan_admin_2026_strong_password
NEXT_PUBLIC_ADMIN_PASSWORD=sudan_admin_2026_strong_password
```

⚠️ **غيّر كلمة المرور!**

### 2.3 تشغيل
```bash
npm run dev
```

✅ افتح: http://localhost:3000

---

## الخطوة 3: اختبار (3 دقائق)

### 3.1 اختبر صفحة البحث
```
1. افتح http://localhost:3000
2. أدخل:
   - WhatsApp: 0912345678
   - Chassis: 123456
3. اضغط "ابحث الآن"
4. ستظهر رسالة "لم يتم العثور - تم حفظ طلبك"
   (طبيعي - لا توجد بيانات بعد)
```

### 3.2 اختبر Admin Panel
```
1. افتح http://localhost:3000/admin
2. أدخل كلمة المرور (من .env.local)
3. الصق في الحقل:

دبدوب - 123456789 - خ 12345
امجاد - 987654321 - خ 54321
هايس - 555666777 - خ 99999

4. اضغط "تحليل ورفع"
5. ✅ يجب أن ترى "تم رفع 3 عربية بنجاح"
```

### 3.3 اختبر البحث مرة أخرى
```
1. ارجع لـ http://localhost:3000
2. أدخل:
   - WhatsApp: 0912345678
   - Chassis: 123456
3. اضغط "ابحث"
4. ✅ يجب أن ترى نتيجة "دبدوب"!
```

---

## الخطوة 4: النشر على Vercel (2 دقيقة)

### 4.1 Push إلى Git
```bash
# إذا لم يكن عندك Git repo
git init
git add .
git commit -m "Initial commit"

# ارفع على GitHub (أنشئ repo جديد أولاً)
git remote add origin https://github.com/your-username/lost-vehicles-sudan.git
git push -u origin main
```

### 4.2 Deploy على Vercel
```
1. افتح https://vercel.com
2. Sign Up / Login (استخدم GitHub)
3. Import Git Repository
4. اختر lost-vehicles-sudan
5. أضف Environment Variables:
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - ADMIN_SECRET
   - NEXT_PUBLIC_ADMIN_PASSWORD
6. Deploy
7. ✅ انتظر 2-3 دقائق
```

### 4.3 اختبر الموقع الحي
```
1. افتح الرابط: https://your-project.vercel.app
2. جرب البحث
3. جرب Admin Panel
4. ✅ كل شيء يعمل!
```

---

## الخطوة 5: إضافة بيانات حقيقية (مستمر)

### 5.1 جمع الكشوفات
```
1. احصل على كشوفات العربات المفقودة
2. نظمها في أحد الأنماط:
   - اسم - شاسي - لوحة
   - اسم | شاسي: XXX | لوحة: XXX
3. الصق في Admin Panel
4. ارفع!
```

### 5.2 نشر الرابط
```
1. شارك الرابط على:
   - WhatsApp Groups
   - Facebook
   - Twitter
2. خلي الناس يبحثوا!
```

---

## 🎉 مبروك! المشروع جاهز

### الروابط المهمة:
- 🌐 الموقع: https://your-project.vercel.app
- 🔐 Admin: https://your-project.vercel.app/admin
- 📊 Supabase Dashboard: https://app.supabase.com
- 📈 Vercel Dashboard: https://vercel.com/dashboard

### التكلفة:
- Supabase Free: $0
- Vercel Free: $0
- **إجمالي: $0/شهر** 💰

---

## 🆘 مشاكل شائعة

### "Invalid API key"
```bash
# تأكد من Keys في .env.local
cat .env.local

# أعد التشغيل
npm run dev
```

### "Database connection failed"
```
1. تأكد من إنشاء Tables في Supabase
2. SQL Editor → supabase-schema.sql → Run
3. Database → Tables → يجب أن ترى found_vehicles
```

### "Admin login not working"
```
1. تأكد من ADMIN_SECRET و NEXT_PUBLIC_ADMIN_PASSWORD متطابقين
2. احذف localStorage في Browser
3. أعد المحاولة
```

---

## 📞 محتاج مساعدة؟

1. راجع README.md الكامل
2. افتح Issue على GitHub
3. اسألني مباشرة!

---

**الآن اتفرغ للـ marketing ونشر المشروع! التقنية خلصت 🚀**
