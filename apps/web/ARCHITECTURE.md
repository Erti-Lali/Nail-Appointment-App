# Mimari & Konvansiyonlar (apps/web)

Bu dosya, projeyi uzun vadede tutarlı ve ölçeklenebilir tutmak için **yeni/refactor edilen kodun uyması gereken** kuralları tanımlar.

## Klasör yapısı
```
src/
  app/                 Next.js App Router (route'lar)
    (dashboard)/       Stüdyo paneli (AuthGuard + DashboardShell + UserProvider)
    admin/             Süper-admin paneli (super_admin rolü)
    book/[studioSlug]/ Public booking (anonim)
    auth/              login / register
    api/               Route handler'lar (server)
  components/
    ui/                ♻️ Paylaşılan UI kit (Button, Input, Modal, Card, Badge…)
    layout/            Shell, Sidebar, Header
    <feature>/         Özelliğe özel bileşenler (appointments, customers, staff…)
    providers/         Context provider'lar (UserProvider…)
  lib/                 Yardımcılar (supabase, hooks, constants, datetime, types)
packages/shared/       Web + mobil ortak util/sabit/tip (formatPrice, DAY_LABELS…)
```

## Tipler — `any` yazma
- Supabase client **tiplidir** (`createClient()` → `SupabaseClient<Database>`).
  `.from("x").select()` artık gerçek satır tipini döndürür.
- Satır/insert tipleri için: `Tables<"customers">`, `TablesInsert<"appointments">`,
  enum için `Enum<"appointment_status">` (`@/lib/database.types`).
- Şema değişince tipleri **yeniden üret** (Supabase `gen types` / MCP) ve
  `src/lib/database.types.ts` dosyasını güncelle.

## UI kit (`@/components/ui`) — primitifleri tekrar yazma
`Button`, `Input`, `Textarea`, `Field`, `Label`, `Card`, `Modal`, `Badge`,
`StatusBadge`, `Spinner`, `FullPageSpinner`. Yeni modal/form bunları kullanır.
Örnek: `components/customers/new-customer-modal.tsx`.

## Renkler — sabit hex yazma, **token kullan**
Tema token'ları `tailwind.config.js` içinde tek kaynaktır:
- `bg-brand` / `hover:bg-brand-dark` / `text-brand` / `bg-brand-soft`
- `bg-surface` (kart), `bg-surface-soft` (input), `bg-canvas` (sayfa)
- `border-line`, `text-ink` / `text-ink-muted` / `text-ink-subtle`

⚠️ **Footgun:** Bu temada Tailwind `white` = koyu (#1A0A14), `black` = pembe.
Yani `text-white`/`bg-white`/`bg-black` **beklediğin gibi davranmaz**.
- Gerçek beyaz için `text-[#FFFFFF]` / `bg-[#FFFFFF]`.
- Modal arka planı için `bg-[#00000066]` (Modal bileşeni zaten halleder).

## Sabitler & etiketler — `@/lib/constants`
`APPOINTMENT_STATUS` (label+badge), `USER_ROLE_LABELS`, `STAFF_ROLE_LABELS`,
`BOOKED_VIA_LABELS`, `PLANS`/`PLAN_LABELS`. Etiket map'lerini bileşende tekrar tanımlama.

## Hook'lar — `@/lib/hooks`
- `useTenantId()` — UserProvider context'inden tenant id (dashboard içinde).
  Sayfalarda tenant_id'yi tekrar fetch etme.
- `useAuthedFetch()` — oturum token'ını Bearer olarak ekleyen fetch (örn. `/api/admin/*`).

## Tarih/saat — `@/lib/datetime`
Randevu saatleri **duvar saati** (UTC bileşeni) olarak gösterilir:
`wallTime(ts)`, `wallMinutes(ts)`. `parseISO(...).getHours()` ile gösterme
(saat dilimi kayması yapar).

## API route'ları (admin)
Service-role doğrulaması `@/lib/admin-auth`'tadır:
`adminClient()` + `verifySuperAdmin(req, admin)`. Her admin endpoint önce bunu çağırır.

## Süregelen refactor (TODO)
UI kit'e taşınanlar: `new-customer-modal`, `category-form-modal`, `new-staff-modal`.
Kalan: `new-appointment-modal`, `service-form-modal`, `appointment-detail-modal`,
admin sayfa içi modalleri; tablo/sayfa sabit hex renkleri → `brand`/`surface`/`ink` token;
sayfaların `getSession→profile→tenantId` bloğu → `useTenantId`.
