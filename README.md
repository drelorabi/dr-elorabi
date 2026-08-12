# dr.elorabi

Personal Health, Fitness & Nutrition Web App.

## الملفات

- index.html
- style.css
- app.js
- README.md

## التشغيل

ضع الملفات الأربعة في نفس المجلد:

dr-elorabi/
│
├── index.html
├── style.css
├── app.js
└── README.md

ثم افتح:

index.html

أو ارفع المجلد على:

- CodePen
- Netlify
- Vercel
- GitHub Pages

## Supabase

المشروع يستخدم Supabase Authentication.

يتم استخدام:

- Email
- Password
- Profiles
- Payment Requests
- Storage

## Authentication

المستخدم يستطيع:

1. إنشاء حساب
2. تسجيل الدخول
3. تسجيل الخروج
4. حفظ بيانات الحساب

## Profile

بعد تسجيل الدخول يستطيع المستخدم إدخال:

- الاسم
- تاريخ الميلاد
- النوع
- الطول
- الوزن
- الهدف
- مستوى النشاط
- الأكلات المفضلة
- الأكلات غير المفضلة
- الحساسية
- عدد الوجبات

## Dashboard

يعرض:

- السعرات اليومية
- البروتين
- المياه
- BMI
- استهلاك السعرات
- استهلاك البروتين
- الوجبات
- المياه
- النوم
- التمرين

## PRO

سعر الاشتراك:

50 جنيه / شهر

طريقة الدفع:

InstaPay

رابط الدفع موجود داخل app.js.

بعد الدفع:

1. المستخدم يرفع Screenshot.
2. يضغط تأكيد الدفع.
3. يتم رفع الصورة إلى Supabase Storage.
4. يتم إنشاء Payment Request.
5. الحالة تكون:

pending

ثم تتم مراجعة الطلب من الإدارة.

## Supabase Tables

يحتاج المشروع إلى جدول:

profiles

ويحتاج أيضا:

payment_requests

ويحتاج Storage Bucket باسم:

payment-screenshots

## ملاحظة مهمة

الـ publishable key الموجود في الواجهة ليس Secret Key.

لكن يجب عدم وضع:

service_role key

داخل app.js.

## مشكلة تسجيل الدخول

تم تعديل عملية التحقق من الجلسة بحيث تعتمد على:

getSession()

قبل إرسال طلب الدفع.

إذا لم توجد Session:

سيظهر:

سجل دخولك أولا

وإذا كانت Session موجودة يستطيع المستخدم إرسال طلب الدفع.

## Payment Flow

Login

↓

Dashboard

↓

PRO

↓

طلب تفعيل PRO

↓

الدفع

↓

رفع Screenshot

↓

تأكيد الدفع

↓

Upload Screenshot

↓

Create Payment Request

↓

pending

↓

مراجعة الإدارة

↓

تفعيل PRO
