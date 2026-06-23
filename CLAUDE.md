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
- ⏸️ `/content` — `tenant_content` galeri CRUD + doğrudan dosya yükleme (storage).
  Kodu HAZIR ama **ilk sürümde sidebar nav'dan gizlendi** (kullanıcı istemiyor);
  doğrudan URL ile açılır. Geri açmak: `sidebar.tsx` NAV_ITEMS'a İçerik öğesini ekle.
- `/notifications` — gerçek geçmiş + kanal durumu + manuel gönderim
  → `lib/notifications.ts` (Netgsm SMS + Resend email), `/api/notifications/send` + `/status`
  → Kanal durumu **env var**'lardan okunur (`NETGSM_*` / `RESEND_API_KEY`), `tenants`'tan DEĞİL.
    ⚠️ Sağlayıcı secret'larını (resend_api_key, netgsm password) `tenants` tablosuna KOYMA:
    tenants public-read RLS'li (`public_read_active_tenants`), anon key ile herkese sızar.
  → Manuel gönderim sonucu (sent/failed) mevcut `notifications` tablosuna loglanır
    (service role; recipient_id=gönderen admin, gerçek alıcı `data.to`'da). Ayrı
    `notification_logs` tablosu yok — `notifications` kullanılır. İki kanal da yoksa send 503 döner.

### ✅ Müşteri Paneli (`/hesabim/*`) — müşteri auth, admin'den ayrı
- `CustomerShell` (`components/customer/`) → header (avatar + bildirim ikonu) +
  desktop sol sidebar / mobil alt tab bar; auth guard → `/hesabim/giris` redirect.
- `/hesabim` — Randevularım: zengin kartlar (tarih bloğu + hizmet/personel/stüdyo +
  durum/fiyat), **iptal** + **tarih-saat değiştir** + tekrar al + stüdyo favori kalbi.
  framer-motion fade-in. İllüstratif boş durum.
- `/hesabim/profil` — profil düzenle (`profiles` + `customers` telefon senkron),
  e-posta + şifre değişimi auth SDK ile (şifre için reauth).
- `/hesabim/favoriler` — Stüdyolar / Hizmetler sekmeleri, "Randevu Al" CTA.
- API'ler `api/customer/*`: `appointments` (GET), `appointments/cancel`,
  `appointments/reschedule`, `profile` (GET/PUT), `favorites` (GET/POST/DELETE).
  Hepsi token doğrular sonra **service role** kullanır (`lib/customer-auth.ts`).
  İptal/değiştir `tenants.cancellation_hours` (default 24) penceresine uyar;
  değiştir yeni saat müsaitliğini `/api/book` busy mantığıyla kontrol eder.
- Booking başarı ekranında giriş yapmış müşteriye "Favorilere ekle" sunulur.

### ✅ Genel/müşteri arayüzü
- `/` — B2B landing (stüdyo sahibi için).
- ⏸️ `/kesfet` — **public stüdyo dizini** (müşteri için): kodu HAZIR ve çalışır
  (anon client, `public_read_active_tenants` + `public_see_active_services` RLS;
  arama + şehir filtresi, stüdyo kartı, "Randevu Al" → `/book/[slug]`).
  **ŞİMDİLİK UI'dan link verilmiyor (ertelendi):** müşteriler yalnızca stüdyoların
  kendi `/book/[slug]` linklerinden randevu alır. Sonraki aşamada landing
  nav/hero/footer + `/hesabim` boş durumlarına link'ler geri eklenecek.

## Durum (Mobile — `apps/mobile`, Expo)
- ✅ `(tabs)/index`, `book`, `appointments`, `profile` (profil gerçek auth + çıkış)
- ✅ `booking/[studioSlug]` — public booking
- ✅ **Auth** — `lib/supabase.ts` (chunk'lı SecureStore), `lib/auth.tsx` (AuthProvider),
  `(auth)/login` + `(auth)/register`, `app/index.tsx` session gate
- `.env` → `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`

## ⚠️ Manuel adımlar (kod hazır, dağıtım bekliyor)
- ✅ **RLS migration `003_tenant_admin_update_and_content.sql`** UYGULANDI (2026-06-20) →
  `tenant_admin_update_own` policy prod'a eklendi, tenant admin artık kendi `tenants`
  satırını UPDATE edebiliyor (Settings formları kaydeder).
  Not: Prod DB, 002'deki `auth.*` helper'lar yerine `public.get_my_tenant_id()` +
  `public.is_tenant_admin()` kullanıyor; policy bunlara göre yazıldı. `tenant_content`
  tablosu ve policy'leri zaten 001/002'den mevcut (yeniden oluşturulmadı).
- ✅ **Migration `004_tenant_settings_fields.sql`** UYGULANDI (2026-06-20) →
  `tenants`'a `description` (text), `slot_duration_minutes` (int, default 30,
  check 15/30/45/60), `auto_confirm` (bool, default false) eklendi. Settings'teki
  Stüdyo açıklaması + Randevu slot süresi/oto-onay formları bunları kaydeder.
  Not: `slot_duration_minutes` ve `auto_confirm` artık **web booking akışına bağlı**
  (2026-06-23): `GET /api/book?tenantId=` → `slotDuration`/`autoConfirm` döner; booking-client
  slot adımını bu değerden üretir; `POST /api/book` `auto_confirm` true ise randevuyu
  `confirmed`, değilse `pending` oluşturur. ⚠️ Mobil (`apps/mobile/app/booking/[studioSlug].tsx`)
  hâlâ **statik mock** (API'ye bağlı değil) — slotDuration bağlanması için önce gerçek
  booking pipeline'ı kurulmalı (TODO).
  `database.types.ts` elle bu 3 kolonla güncellendi (dosya MCP generate'in üretmediği
  custom helper export'ları içerdiği için yeniden generate edilmedi).
- ✅ **Migration `005_customer_favorites.sql`** UYGULANDI (2026-06-22) →
  `customer_favorites` tablosu (profile_id, tenant_id?, service_id?, type studio/service)
  + RLS `users_own_favorites` (profile_id = auth.uid()). `database.types.ts` elle eklendi.
- ✅ **Migration `006_storage_bucket.sql`** UYGULANDI (2026-06-23) →
  public `tenant-content` storage bucket (5MB, image/jpeg·png·webp·gif) + storage.objects
  RLS (read public; insert/update/delete → `public.is_staff_member()` + path'in ilk
  klasörü `public.get_my_tenant_id()`). `/content` artık doğrudan dosya yükler
  (`POST /api/upload`, service role, path `tenant-content/{tenantId}/{uuid}-{name}`);
  URL ile ekleme de çalışır (geriye dönük uyumlu). İçerik silinince bucket'tan da silinir.
  Not: Görevde "005" istendi ama 005 dolu olduğu için 006 kullanıldı.
- ✅ **Migration `007_appointment_reminders.sql`** UYGULANDI (2026-06-23) →
  `appointment_reminders` tablosu (appointment_id, tenant_id, channel sms/email/push,
  scheduled_at, sent_at, failed_at, error) + kısmi index + UNIQUE(appointment,channel,
  scheduled_at) + RLS (politika yok = sadece service role). Randevu oluşunca
  (`POST /api/book` + admin modal → `POST /api/reminders/schedule`) `reminder_hours`'a
  göre satırlar planlanır (kanal sadece `smsConfigured()`/`emailConfigured()` ise).
  `GET/POST /api/cron/reminders` (`CRON_SECRET` Bearer korumalı) zamanı gelenleri
  gönderir; `vercel.json` 5 dk'da bir tetikler. `lib/reminders.ts` = planlama + TR
  şablonları. Görevde "005" istendi ama 007 kullanıldı (005/006 dolu).
- ✅ **Migration `008_push_tokens.sql`** UYGULANDI (2026-06-23) →
  `push_tokens` (profile_id, **tenant_id nullable**, token, platform ios/android,
  UNIQUE(profile_id,token)) + RLS (politika yok = service role). Sapma: görevde
  `tenant_id NOT NULL` ve "00X" denmişti; çoğu profilde tenant_id null olduğu için
  NULLABLE yapıldı, numara 008. Mobil token kaydı `POST /api/push-token` (Bearer auth,
  upsert). `lib/notifications.ts`'e `sendPush()` eklendi (Expo API, `DeviceNotRegistered`
  → cron token'ı siler). Reminder planlayıcı, müşterinin bağlı profilinde token varsa
  `channel='push'` satırı da oluşturur; cron push'u gönderir. `notifications/status`
  push'u tenant müşterilerinin token sayısına göre döner. Mobil: `lib/push.ts`
  (izin+token+POST), `_layout.tsx` PushManager + foreground handler. `app.json`
  expo-notifications plugin zaten ekliydi.
- **Web `.env.local`** → public booking için `SUPABASE_SERVICE_ROLE_KEY` gerekli.
- **Cron** → otomatik hatırlatma için `CRON_SECRET` env var'ı gerekli (Vercel Cron
  otomatik `Authorization: Bearer <CRON_SECRET>` gönderir). Kanallar için `NETGSM_*` /
  `RESEND_API_KEY`. Bunlar yoksa hatırlatma satırı oluşturulmaz (özellik pasif).
- **SMS/E-posta** → `NETGSM_*` / `RESEND_API_KEY` set edilince otomatik aktifleşir (yoksa "Yapılandırılmadı").
- **Mobile** → `cd apps/mobile && npm install` (yeni `expo-device` eklendi; `npx expo install expo-device`).
  Push'un gerçek çalışması için: `EXPO_PUBLIC_API_URL` (web backend) + `app.json`'a EAS
  `projectId` (Expo push token bunu ister) + fiziksel cihaz. Yoksa `registerPushToken()`
  sessizce no-op olur.

## Sonraki adımlar (opsiyonel)
- Stripe ile abonelik yükseltme akışı
