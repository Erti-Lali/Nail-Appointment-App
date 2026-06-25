# NailStudio 101 — Claude Code Prompt'ları

Her prompt bağımsızdır — Claude Code'a tek tek verilebilir. Önerilen sıra: 1 → 2 → 3 → 4 → 5.

---

## Prompt 1: slot_duration_minutes ve auto_confirm'i Booking Akışına Bağla

```
CLAUDE.md'yi oku ve projeyi tanı.

## Görev
`slot_duration_minutes` ve `auto_confirm` alanları `tenants` tablosunda zaten var (migration 004) ve Settings'ten kaydediliyor ama booking akışı bunları kullanmıyor. Bağla.

## Yapılacaklar

### 1. GET /api/book — tenant ayarlarını döndür
`apps/web/src/app/api/book/route.ts` → GET handler'ında:
- Mevcut `staffId` ve `date` parametrelerinin yanına `tenantId` parametresi ekle
- `tenants` tablosundan `slot_duration_minutes` ve `auto_confirm` değerlerini çek
- Response'a `slotDuration` (number) ve `autoConfirm` (boolean) ekle
- tenantId yoksa veya tenant bulunamazsa default değerleri kullan (30, false)

### 2. POST /api/book — auto_confirm desteği
Aynı dosyadaki POST handler'ında:
- Gelen `tenantId` ile `tenants`'tan `auto_confirm` değerini çek
- `auto_confirm === true` ise appointment `status: "confirmed"` olarak oluştur
- `auto_confirm === false` ise mevcut `status: "pending"` kalsın

### 3. booking-client.tsx — dinamik slot süresi
`apps/web/src/app/book/[studioSlug]/booking-client.tsx`:
- Satır 15'teki `const SLOT_STEP = 30;` hardcoded değerini kaldır
- API'den gelen `slotDuration` değerini state olarak tut
- `useMemo` içindeki slot üretme döngüsünde `SLOT_STEP` yerine bu dinamik değeri kullan
- API çağrısını güncelleyerek `tenantId`'yi query param olarak gönder

### 4. Mobile booking
`apps/mobile/app/booking/[studioSlug].tsx`:
- Aynı mantığı mobile'da da uygula — API'den gelen slotDuration'ı kullan

## ⚠️ Dikkat
- Tailwind tema override'ları: `bg-[#FFFFFF]` kullan, `bg-white` DEĞİL
- Mevcut testleri/importları bozmadan çalış
- `database.types.ts` zaten `slot_duration_minutes` ve `auto_confirm` kolonlarını içeriyor
```

---

## Prompt 2: Supabase Storage — Görsel Yükleme

```
CLAUDE.md'yi oku ve projeyi tanı.

## Görev
Content sayfası (`/content`) şu an URL ile görsel ekliyor. Supabase Storage bucket'ı kur ve doğrudan dosya yükleme desteği ekle.

## Yapılacaklar

### 1. Supabase Migration (005)
`supabase/migrations/005_storage_bucket.sql`:
- `tenant-content` adında public bir storage bucket oluştur
- RLS policy: authenticated kullanıcılar kendi tenant_id'leri altındaki path'lere upload/delete yapabilsin
- Path yapısı: `{tenant_id}/{filename}`
- Dosya boyutu limiti: 5MB
- İzin verilen MIME'ler: image/jpeg, image/png, image/webp, image/gif

### 2. Upload API endpoint
`apps/web/src/app/api/upload/route.ts`:
- POST: multipart/form-data ile dosya al
- Auth kontrolü: request'ten user session'ı doğrula
- Dosyayı `tenant-content/{tenantId}/{uuid}-{originalName}` path'ine yükle
- Public URL döndür
- Dosya boyutu (max 5MB) ve MIME type validasyonu

### 3. Content client güncelle
`apps/web/src/components/content/content-client.tsx`:
- Mevcut URL input'unun yanına "Dosya Yükle" butonu/alanı ekle
- Drag & drop veya file input ile görsel seçtirme
- Upload sırasında loading/progress göster
- Upload bitince dönen URL'yi `media_url` alanına set et
- Yükleme başarılı olunca thumbnail preview göster

### 4. Gallery'de görsel silme
- Content silindiğinde Storage'dan da dosyayı sil (eğer URL tenant-content bucket'ından geliyorsa)

## ⚠️ Dikkat
- Migration'ı `supabase/migrations/005_storage_bucket.sql` olarak kaydet
- Mevcut URL ile ekleme yöntemi de çalışmaya devam etsin (backward compatible)
- RLS: `is_staff_member()` fonksiyonu zaten var, policy'lerde kullan
- Secret'ları tenants tablosuna KOYMA (tenants public-read RLS'li)
- Tailwind: `bg-[#FFFFFF]` kullan, `bg-white` DEĞİL
```

---

## Prompt 3: Otomatik Randevu Hatırlatması (SMS/E-posta)

```
CLAUDE.md'yi oku ve projeyi tanı.

## Görev
Randevu oluşturulduğunda otomatik SMS ve e-posta hatırlatması planla. Settings'teki `reminder_hours` alanı zaten kaydediliyor (varsayılan: [24, 2] — 24 saat ve 2 saat önce).

## Yapılacaklar

### 1. Hatırlatma tablosu — Migration 005 (veya sonraki sıra numarası)
`supabase/migrations/00X_appointment_reminders.sql`:
```sql
CREATE TABLE IF NOT EXISTS appointment_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  channel TEXT NOT NULL CHECK (channel IN ('sms', 'email', 'push')),
  scheduled_at TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_reminders_pending ON appointment_reminders(scheduled_at)
  WHERE sent_at IS NULL AND failed_at IS NULL;
```
- RLS: sadece service role erişebilsin

### 2. Randevu oluşturulunca hatırlatma kayıtları oluştur
`apps/web/src/app/api/book/route.ts` → POST handler'ının sonunda:
- `tenants` tablosundan `reminder_hours` değerini çek (zaten POST'ta tenantId var)
- Her reminder_hour için `appointment_reminders` tablosuna satır ekle
- `scheduled_at = starts_at - reminder_hours saat`
- SMS ve email için ayrı satırlar (ilgili kanal yapılandırılmışsa — `smsConfigured()` / `emailConfigured()`)

### 3. Cron API endpoint
`apps/web/src/app/api/cron/reminders/route.ts`:
- GET veya POST (Vercel Cron uyumlu)
- `CRON_SECRET` header kontrolü (unauthorized erişimi engelle)
- `appointment_reminders` tablosundan `scheduled_at <= now()` ve `sent_at IS NULL` ve `failed_at IS NULL` olanları çek
- Her biri için ilgili appointment + customer bilgisini join et
- `sendSms()` veya `sendEmail()` ile gönder (mevcut `lib/notifications.ts`'i kullan)
- Başarılıysa `sent_at` güncelle, başarısızsa `failed_at` + `error` yaz
- Geçmiş/iptal randevuları atla (status = canceled/no_show ise gönderme)
- Batch limiti: tek seferde max 50

### 4. Vercel cron config
`vercel.json` (apps/web veya root'ta):
```json
{ "crons": [{ "path": "/api/cron/reminders", "schedule": "*/5 * * * *" }] }
```

### 5. Admin panel entegrasyonu
- `apps/web/src/components/appointments/new-appointment-modal.tsx` → admin'den manuel randevu oluşturulduğunda da hatırlatma kayıtları oluştur (aynı mantık)

## Mesaj Template'leri (Türkçe)
- SMS: "Merhaba {firstName}, {date} tarihinde saat {time}'deki randevunuzu hatırlatmak isteriz. {studioName}"
- Email: HTML template, stüdyo adı + randevu detayları + iptal linki (opsiyonel)

## ⚠️ Dikkat
- `lib/notifications.ts`'teki mevcut `sendSms()` ve `sendEmail()` fonksiyonlarını kullan
- `smsConfigured()` / `emailConfigured()` ile kanal kontrolü — yoksa o kanal için reminder satırı oluşturma
- CRON_SECRET env var'ını kontrol et
- Secret'ları tenants tablosuna KOYMA
```

---

## Prompt 4: Expo Push Notification

```
CLAUDE.md'yi oku ve projeyi tanı.

## Görev
Mobile uygulamada (Expo React Native) push notification desteği ekle: token kaydı + hatırlatma gönderimi.

## Yapılacaklar

### 1. Migration
`supabase/migrations/00X_push_tokens.sql`:
```sql
CREATE TABLE IF NOT EXISTS push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  token TEXT NOT NULL,
  platform TEXT CHECK (platform IN ('ios', 'android')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(profile_id, token)
);
```

### 2. Push token kayıt API
`apps/web/src/app/api/push-token/route.ts`:
- POST: `{ token, platform }` al
- Auth'tan user session'ı doğrula (Authorization header veya cookie)
- profiles'tan tenant_id'yi bul
- push_tokens tablosuna upsert et (conflict on profile_id+token → update platform)

### 3. Mobile — token kaydı
`apps/mobile/lib/push.ts` (yeni dosya):
- `expo-notifications` ile push permission iste
- `Notifications.getExpoPushTokenAsync()` ile Expo push token al
- API'ye POST et
- App her açıldığında (ve login sonrası) `registerPushToken()` çağır

`apps/mobile/app/_layout.tsx`:
- Auth olan kullanıcılar için `registerPushToken()` çağır
- Notification received handler ekle (foreground'da da göster)

### 4. Push gönderim fonksiyonu
`apps/web/src/lib/notifications.ts`'ye ekle:
```typescript
export async function sendPush(expoPushToken: string, title: string, body: string): Promise<SendResult> {
  // Expo Push API: POST https://exp.host/--/api/v2/push/send
  // Body: { to: expoPushToken, title, body, sound: 'default' }
}
```

### 5. Cron'a push entegrasyonu
`apps/web/src/app/api/cron/reminders/route.ts` (Prompt 3'te oluşturuldu):
- `channel === 'push'` olan reminder'lar için:
  - appointment → customer → profile_id bul
  - push_tokens tablosundan token'ları çek
  - `sendPush()` ile gönder
- Token expire/invalid hatası alınırsa o tokeni sil

### 6. Notification status güncelle
`apps/web/src/app/api/notifications/status/route.ts`:
- `push: false` hardcoded değerini kaldır
- push_tokens tablosunda bu tenant'a ait kayıt var mı kontrol et

## ⚠️ Dikkat
- expo-notifications paketi: `npx expo install expo-notifications expo-device expo-constants`
- iOS simulator'da push çalışmaz, fiziksel cihaz gerekir
- `app.json`'da `expo.plugins`'e `expo-notifications` ekle
- Mobile Supabase client `lib/supabase.ts`'te SecureStore ile chunk'lı auth kullanıyor — bunu bozma
- Bu prompt, Prompt 3'teki cron altyapısına bağımlıdır — önce 3'ü tamamla
```

---

## Prompt 5: Stripe Abonelik Sistemi

```
CLAUDE.md'yi oku ve projeyi tanı.

## Görev
Settings sayfasındaki Abonelik bölümü şu an read-only. Stripe ile gerçek abonelik yönetimi ekle.

## Yapılacaklar

### 1. Migration
`supabase/migrations/00X_stripe_subscriptions.sql`:
```sql
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'trial'
  CHECK (subscription_status IN ('trial','active','past_due','canceled','expired'));
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'free'
  CHECK (subscription_plan IN ('free','starter','pro','enterprise'));
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ DEFAULT (now() + interval '14 days');
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ;
```

### 2. Stripe kurulum
`apps/web`'de: `npm install stripe`

`apps/web/src/lib/stripe.ts`:
```typescript
import Stripe from 'stripe';
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' });
```

### 3. Checkout API
`apps/web/src/app/api/stripe/checkout/route.ts`:
- POST: `{ plan }` al, auth kontrolü → tenantId bul
- Stripe customer yoksa oluştur, `stripe_customer_id`'yi tenants'a kaydet
- `stripe.checkout.sessions.create()` ile checkout session oluştur
- Plan'a göre price_id seç (env var: `STRIPE_PRICE_STARTER`, `STRIPE_PRICE_PRO`)
- Session URL döndür

### 4. Webhook API
`apps/web/src/app/api/stripe/webhook/route.ts`:
- POST: Stripe webhook event'lerini işle
- `STRIPE_WEBHOOK_SECRET` ile signature doğrula
- ⚠️ Next.js App Router'da `bodyParser: false` config KULLANILMAZ — raw body için `request.text()` kullan
- Event handler'lar:
  - `checkout.session.completed` → subscription_status='active', plan güncelle
  - `invoice.paid` → current_period_end güncelle
  - `invoice.payment_failed` → subscription_status='past_due'
  - `customer.subscription.deleted` → subscription_status='canceled'
  - `customer.subscription.updated` → plan/status güncelle

### 5. Billing Portal API
`apps/web/src/app/api/stripe/portal/route.ts`:
- POST: Stripe Customer Portal session oluştur
- Portal URL döndür (fatura geçmişi, plan değişikliği, iptal)

### 6. Settings UI güncelle
`apps/web/src/components/settings/settings-client.tsx` → `SubscriptionView` bileşeni:
- Mevcut read-only görünümü gerçek verilerle doldur (subscription_status, subscription_plan, trial_ends_at, current_period_end)
- "Plan Yükselt" butonu → checkout API → Stripe Checkout'a yönlendir
- "Faturaları Yönet" butonu → portal API → Stripe Portal'a yönlendir
- Trial kalan gün sayacı
- Plan karşılaştırma kartları: Free / Starter (₺99/ay) / Pro (₺249/ay)

## Env vars
```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_STARTER=price_...
STRIPE_PRICE_PRO=price_...
```

## ⚠️ Dikkat
- Stripe customer ID `tenants`'a kaydedilir ama secret key asla DB'ye KONMAZ
- Webhook raw body: `await request.text()` kullan, `request.json()` DEĞİL
- Tailwind: `bg-[#FFFFFF]` kullan, `bg-white` DEĞİL
- Test modu: Stripe test key'leri ile çalış
```

---

## Prompt 6: Müşteri Paneli — Tasarım İyileştirme + Yeni Özellikler

```
CLAUDE.md'yi oku ve projeyi tanı.

## Görev
Müşteri paneli (`/hesabim/*`) zaten çalışıyor: kayıt, giriş, randevu listesi mevcut. Tasarımı iyileştir ve 3 yeni özellik ekle: randevu iptal/değiştirme, profil düzenleme, favori stüdyo/hizmet.

## Mevcut Dosyalar
- `apps/web/src/app/hesabim/page.tsx` — ana panel (randevu listesi)
- `apps/web/src/app/hesabim/giris/page.tsx` — giriş
- `apps/web/src/app/hesabim/kayit/page.tsx` — kayıt
- `apps/web/src/app/api/customer/appointments/route.ts` — randevu API

## A) Tasarım İyileştirme

### Layout yeniden tasarla
Mevcut: tek kolon, basit liste. Hedef: modern müşteri dashboard'u.

- **Sol sidebar (desktop) / alt tab bar (mobil):** Randevularım, Profilim, Favorilerim ikonu + label
- **Header:** Stüdyo logosu + müşteri adı avatar'ı + bildirim ikonu (ileride push için)
- **Randevu kartları:** Daha zengin:
  - Sol: tarih bloğu (gün/ay büyük, yıl küçük)
  - Orta: hizmet adı (bold), personel adı, stüdyo adı, süre
  - Sağ: durum badge'i + fiyat
  - Alt: aksiyon butonları (iptal, tekrar al, değiştir)
- **Empty state:** İllüstratif SVG + "İlk randevunuzu alın" CTA butonu
- **Animasyonlar:** Framer-motion ile kartlarda fade-in, tab geçişlerinde slide

### Renk paleti
Müşteri tarafı için mevcut tema CSS variable'larını kullan:
- `bg-canvas` (sayfa bg), `bg-surface` (kart bg), `border-line`, `text-ink`, `text-ink-subtle`
- `bg-brand` (accent), `text-brand`
- ⚠️ `bg-[#FFFFFF]` kullan, `bg-white` DEĞİL (Tailwind override)

## B) Randevu İptal / Değiştirme

### İptal
- Her yaklaşan randevu kartına "İptal Et" butonu ekle
- Tıklayınca onay modal'ı göster: "Randevunuzu iptal etmek istediğinize emin misiniz?"
- Onayda → API çağrısı

`apps/web/src/app/api/customer/appointments/cancel/route.ts` (yeni):
- POST: `{ appointmentId }` al
- Auth kontrolü (token → user → customer eşleşmesi doğrula)
- `tenants`'tan `cancellation_hours` oku (veya default 24)
- `starts_at - now() < cancellation_hours` ise → hata: "İptal süresi geçmiş"
- Geçerliyse → `appointments` tablosunda `status = 'canceled'` yap
- Service role kullan (müşteri RLS'den geçemez)

### Tarih/Saat Değiştirme
- "Değiştir" butonu → mevcut booking flow'un 3. adımını (tarih/saat seçimi) modal olarak aç
- Yeni tarih seçilince:

`apps/web/src/app/api/customer/appointments/reschedule/route.ts` (yeni):
- POST: `{ appointmentId, newStartsAt }` al
- Auth kontrolü + cancellation_hours kontrolü (aynı iptal mantığı)
- Yeni saat müsait mi kontrol et (mevcut GET /api/book busy slot mantığı)
- Müsaitse → `starts_at` ve `ends_at` güncelle
- Müsait değilse → hata: "Bu saat dolu"

## C) Profil Düzenleme

`apps/web/src/app/hesabim/profil/page.tsx` (yeni):
- Form: ad, soyad, telefon, email, doğum tarihi
- `profiles` tablosundan oku, `profiles` tablosuna yaz
- Telefon değiştiğinde → `customers` tablosundaki eşleşme güncellenmeli (eski telefon → yeni telefon)
- Şifre değiştirme bölümü: mevcut şifre + yeni şifre + onay
- Avatar: baş harf dairesi (şimdilik, ileride fotoğraf yükleme)

`apps/web/src/app/api/customer/profile/route.ts` (yeni):
- GET: auth → profiles'tan user bilgisi
- PUT: auth → profiles update + customers phone update (eğer değiştiyse)

## D) Favori Stüdyo / Hizmet

### Migration (00X)
`supabase/migrations/00X_customer_favorites.sql`:
```sql
CREATE TABLE IF NOT EXISTS customer_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('studio', 'service')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(profile_id, tenant_id, service_id, type)
);
-- RLS: kullanıcı kendi favorilerini okuyup yazabilsin
ALTER TABLE customer_favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_favorites" ON customer_favorites
  FOR ALL USING (profile_id = auth.uid());
```

### API
`apps/web/src/app/api/customer/favorites/route.ts` (yeni):
- GET: kullanıcının favorilerini döndür (tenant + service bilgileriyle join)
- POST: `{ type, tenantId?, serviceId? }` → favori ekle
- DELETE: `{ favoriteId }` → favori sil

### UI
`apps/web/src/app/hesabim/favoriler/page.tsx` (yeni):
- İki sekme: "Stüdyolar" ve "Hizmetler"
- Stüdyo kartı: stüdyo adı, şehir, "Randevu Al" butonu
- Hizmet kartı: hizmet adı, stüdyo adı, süre, fiyat, "Randevu Al" butonu
- Boş durum: "Henüz favoriniz yok. Randevu aldıktan sonra stüdyo veya hizmeti favorilere ekleyebilirsiniz."

### Favori ekleme noktaları
- Booking tamamlandığında: "Favorilere ekle" checkbox'u (stüdyo + seçilen hizmetler)
- Randevularım'da: her randevu kartında kalp ikonu (toggle)

## ⚠️ Genel Dikkat
- Tailwind: `bg-[#FFFFFF]` kullan, `bg-white` DEĞİL
- Modal backdrop: `bg-[#00000066]` kullan, `bg-black/70` DEĞİL
- Mevcut booking flow'u (`/book/[studioSlug]`) bozma
- Müşteri auth ayrı route'larda (`/hesabim/*`), admin auth (`/auth/*`) ile karışmasın
- `framer-motion` zaten kurulu, animasyonlarda kullan
- Responsive: mobilde tab bar, desktop'ta sidebar
- Service role API'lerde auth token doğrulaması mutlaka yap
```

---

## Özet

| # | Prompt | Bağımlılık | Zorluk |
|---|--------|-----------|--------|
| 1 | slot_duration + auto_confirm bağlama | Yok | Kolay |
| 2 | Supabase Storage (görsel yükleme) | Yok | Orta |
| 3 | Otomatik SMS/email hatırlatma | Yok | Orta |
| 4 | Expo Push Notification | Prompt 3 (cron altyapısı) | Orta-Zor |
| 5 | Stripe Abonelik | Yok | Zor |
| 6 | Müşteri Paneli (tasarım + iptal/değiştir + profil + favoriler) | Yok | Zor |

Prompt 1–3 birbirinden bağımsız, paralel verilebilir. Prompt 4, Prompt 3'teki cron altyapısına dayanır. Prompt 5 ve 6 tamamen bağımsız.
