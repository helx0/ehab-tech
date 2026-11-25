# EHAB TECH

موقع خدمات مطوّر مستقل — React 19 + TypeScript + Vite، جاهز للنشر، مع ثلاثة مشاريع ديمو حقيقية قابلة للتشغيل.

## بيانات التواصل (رسمية)

- البريد: **eng.ayhabtwfyq@gmail.com**
- واتساب / هاتف: **+967 778 172 806** (`https://wa.me/967778172806`)
- نموذج «طلب مشروع» يفتح تطبيق البريد برسالة جاهزة مُعبّأة (لا يحتاج سيرفر).

## التشغيل

```bash
cd /root/projects/my-app/ehab-tech
npm install
npm run dev
```

`http://127.0.0.1:5173`

الإنتاج:

```bash
npm run build
npm run preview   # http://127.0.0.1:4173
```

## النشر (جاهز)

> تنبيه: هذه البيئة لا تحتوي حالياً على أدوات/رموز دخول لأي مزوّد استضافة، لذلك لا يمكن النشر المباشر منها تلقائياً. كل ما يلزم النشر جاهز، واختيارك هو بقاء الاستضافة بخطوة واحدة.

### 1) حدّد نطاقك الحقيقي
```bash
node scripts/set-domain.mjs https://your-real-domain.com
```
يحدّث `index.html`, `robots.txt`, `sitemap.xml`, `.env.local`, `.env.example`.
أو اضبط المتغير `VITE_SITE_URL` في مزوّد الاستضافة / GitHub Actions Variable.

### 2) الخيارات الجاهزة

| المزوّد | الطريقة | الملف الجاهز |
|---|---|---|
| **Vercel** | اسحب `dist/` إلى لوحة Vercel، أو شغّل `npm run deploy:vercel` بعد تسجيل الدخول، أو استخدم Workflow | `vercel.json`, `.github/workflows/deploy-vercel.yml` |
| **Netlify** | اسحب `dist/` إلى Netlify Drop، أو `npm run deploy:netlify`، أو Workflow | `public/_redirects`, `public/_headers`, `.github/workflows/deploy-netlify.yml` |
| **Cloudflare Pages** | اربط المستودع أو `npm run deploy:cloudflare`، أو Workflow | `.github/workflows/deploy-cloudflare.yml` |
| **GitHub Pages** | ادفع إلى `main`، وسيعمل النشر تلقائياً | `.github/workflows/deploy-pages.yml` |
| **Nginx / Apache** | انسخ `dist/` وفعّل rewrite إلى `index.html` + HTTPS + cache immutable لـ `assets/` | — |

### 3) GitHub Actions (اختياري)
أضف من **Settings → Secrets and variables → Actions**:

- متغير (Variables): `VITE_SITE_URL = https://your-real-domain.com`
- Secrets حسب المزوّد:
  - Vercel: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`
  - Netlify: `NETLIFY_AUTH_TOKEN`, `NETLIFY_SITE_ID`
  - Cloudflare: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`

ثم شغّل Workflow يدوياً من تبويب **Actions** (`workflow_dispatch`)، أو ادفع إلى `main` لـ GitHub Pages.

### 4) بعد النشر
تحقق من `/sitemap.xml`, `/robots.txt`, الصفحة `/contact`, وإحدى الديموهات. فعّل DNS وSSL عند المزوّد.

> GitHub Pages مدعوم تلقائياً على مسار فرعي مثل `https://helx0.github.io/ehab-tech/` عبر `VITE_BASE_PATH`، مع ضبط `base` و`basename` ومسارات الأصول. باقي المزوّدات تُنشر على جذر النطاق افتراضياً.

> القيمة `https://ehabtech.example` عنصر نائب فقط؛ استبدلها قبل رفع `dist/`.

## الأداء و System Design

| التحسين | الحالة |
|---|---|
| Code splitting: كل صفحة/Demo في chunk منفصل عبر `React.lazy` | ✅ |
| تحميل أولي: ~99 KB gzip JS + ~5 KB gzip CSS (بدلاً من 130 KB + مع CSS كامل) | ✅ |
| Error Boundary + Suspense fallback + Scroll restoration | ✅ |
| Route-level SEO: title/description/OG/Twitter/canonical لكل صفحة | ✅ |
| Favicon + Web App Manifest + OG image + JSON-LD Organization | ✅ |
| sitemap.xml + robots.txt + SPA rewrites + security headers + immutable asset caching | ✅ |
| واجهات الموقع الرئيسية EN/AR/ZH + RTL + حفظ اللغة + `?lang=` للروابط القابلة للفهرسة (ديموهات: عربي/إنجليزي) | ✅ |
| نماذج محلية `localStorage` في الديمو + تصدير Blob حقيقي (بدون سيرفر) | ✅ |
| Python pipeline بـ stdlib فقط + 8 اختبارات وحدة | ✅ |

### بنية المشروع

```
src/
  components/   Layout, Icon, Ui, ErrorBoundary, RouteMeta, ScrollToTop
  context/      LanguageContext (i18n + RTL + persistence)
  data/         content.ts (services, projects, plans, process, FAQ)
  i18n/         translations.ts (EN/AR/ZH)
  pages/        صفحات الموقع + ثلاثة ديموهات
  App.tsx       routes + lazy loading + providers
  styles.css    التصميم الأساسي
  demo.css / management.css / automation.css  أنماط الديموهات
demos/automation/ pipeline.py, test_pipeline.py, data/input, data/output
public/         favicon, manifest, og-image, robots, sitemap, _redirects, _headers
scripts/        set-domain.mjs
vercel.json     rewrites + headers
```

## المشاريع الحقيقية (ديموهات)

| المشروع | المسار | ما يعمل فعلياً |
|---|---|---|
| SANA COFFEE | `/demos/website` | موقع ثنائي اللغة، قائمة منتجات، طلبات محفوظة في `localStorage` |
| EHAB Management OS | `/demos/system` | KPI، عملاء، طلبات، مخزون، صلاحيات، بحث، رسم SVG، تصدير CSV، استعادة مخزون عند الإلغاء |
| EHAB Data Pipeline | `/demos/automation` | سكربت Python حقيقي + نسخة JS mirror قابلة للتشغيل في المتصفح + تنزيل المخرجات |

نتائج التنفيذ الحقيقية: 15 صف → 8 نظيفة + 7 مستبعدة، إيرادات **$13,751**، اختبارات **8/8**.

## ما يمكن إضافته لاحقاً (خارج نطاق الموقع الثابت)

- Laravel REST API + MySQL لتخزين طلبات المشاريع وربطها بالبريد/WhatsApp تلقائياً.
- لوحة إدارة للطلبات والمحتوى.
- استبدال بيانات الديمو بأعمال حقيقية وصور فعلية.

> استخدمنا CSS variables بدلاً من Tailwind لتقليل زمن التثبيت والبناء على بيئة الهاتف مع الحفاظ على الهوية البصرية.
