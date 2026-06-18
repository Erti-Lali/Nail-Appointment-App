# NailStudio 101 — CLAUDE.md

## Proje Özeti
Nail stüdyoları için SaaS randevu yönetim sistemi.

## Stack
- **Monorepo**: Turborepo
- **Web**: Next.js 14 (App Router) — `apps/web`
- **Mobile**: Expo React Native — `apps/mobile`
- **Backend**: Supabase (`ukkjamcqwcfxdhqpkcvx`)
- **Shared**: `packages/shared` (utils, types, formatters)

## Tenant
- ID: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`
- Test kullanıcı: `lalierti0@gmail.com`

## Auth Mimarisi
- `@supabase/supabase-js` (singleton, localStorage) — server-side auth yok
- `AuthGuard` component → client-side session kontrolü → `/auth/login` redirect
- `UserProvider` → user/profile/tenantId context sağlar
- `DashboardShell` → UserProvider + Sidebar + Header

## Tailwind Tema (Beyaz/Pembe)
`white` override = `#1A0A14` (koyu text), `black.*` = açık pembe palette
- `bg-[#FFFFFF]` kullan, `bg-white` DEĞİL (override yüzünden karanlık render eder)
- Modal backdrop: `bg-[#00000066]` kullan, `bg-black/70` DEĞİL
- `btn-gold`: pembe buton, beyaz text
- `btn-ghost`: beyaz bg `bg-[#FFFFFF]`, koyu text

### Renk Değerleri
- Birincil: `#E91E8C` (gold-500)
- Sayfa arka planı: `#FFF5F9` (black.DEFAULT)
- Input arka planı: `#FEF0F5` (black-soft)
- Kart: `#FFFFFF` (black-card)
- Border: `#F3E0EB` (black-border)
- Text: `#1A0A14` (white override)

## Supabase Tabloları
`tenants`, `profiles`, `staff`, `service_categories`, `services`,
`customers`, `appointments`, `appointment_services`

### Önemli
- `staff.profile_id` → nullable (demo staff için)
- RLS: `is_staff_member()` — role in ('super_admin','tenant_admin','staff')
- Demo staff: Ayşe Kaya, Fatma Demir, Zeynep Yıldız

## Dev Sunucusu
```bash
cd "apps/web" && npm run dev   # http://localhost:3000
```
ya da root'tan:
```bash
npm run dev
```

## Durum (Web — `apps/web`)

### ✅ Tamamlanan Sayfalar
- `/dashboard` — stats + today appointments + recent customers
- `/appointments` — week calendar + list + new appointment modal
- `/customers` (+ `/[id]`) — list + detail + new customer modal
- `/services` — kategori CRUD + hizmet CRUD
- `/staff` — personel listesi + detay panel + yeni personel modal
- Auth — `/auth/login`, `/auth/register`, `/api/auth`
- `/book/[studioSlug]` — **public booking** (4 adım: hizmet/personel/tarih-saat/bilgiler)
  → `POST /api/book` (service role ile customer+appointment), `GET /api/book` (müsait saatler)
- `/settings` — gerçek formlar: Stüdyo bilgileri + Randevu ayarları (`tenants`'a yazar) + Şifre + Abonelik (read-only)
- `/analytics` — gerçek KPI + recharts (ciro trendi, top hizmetler, durum dağılımı, personel performansı)
- `/content` — `tenant_content` galeri CRUD (ekle/yayınla/sil, tür filtresi)
- `/notifications` — gerçek geçmiş + kanal durumu + manuel gönderim
  → `lib/notifications.ts` (Netgsm SMS + Resend email), `/api/notifications/send` + `/status`

## Durum (Mobile — `apps/mobile`, Expo)
- ✅ `(tabs)/index`, `book`, `appointments`, `profile` (profil gerçek auth + çıkış)
- ✅ `booking/[studioSlug]` — public booking
- ✅ **Auth** — `lib/supabase.ts` (chunk'lı SecureStore), `lib/auth.tsx` (AuthProvider),
  `(auth)/login` + `(auth)/register`, `app/index.tsx` session gate
- `.env` → `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`

## ⚠️ Manuel adımlar (kod hazır, dağıtım bekliyor)
- **RLS migration `003_tenant_admin_update_and_content.sql`** uygulanmalı →
  tenant admin'in kendi `tenants` satırını UPDATE etmesine izin verir. Bu olmadan
  Settings'teki Stüdyo/Randevu formları kaydedemez (şifre formu çalışır).
  Oto-mod prod migration'ı blokladı; `mcp Supabase apply_migration` ile onaylanınca uygulanır.
- **Web `.env.local`** → public booking için `SUPABASE_SERVICE_ROLE_KEY` gerekli.
- **SMS/E-posta** → `NETGSM_*` / `RESEND_API_KEY` set edilince otomatik aktifleşir (yoksa "Yapılandırılmadı").
- **Mobile** → `cd apps/mobile && npm install` (yeni dosyalar mevcut bağımlılıkları kullanır).

## Sonraki adımlar (opsiyonel)
- Görsel yükleme için Supabase Storage bucket (şu an content URL ile)
- Expo push notification token kaydı + gönderimi
- Randevu oluşturulunca otomatik SMS/email hatırlatma (cron + reminder_hours)
- Stripe ile abonelik yükseltme akışı
