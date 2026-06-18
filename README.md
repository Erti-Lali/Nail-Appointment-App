# NailStudio 101

Nail stüdyoları için SaaS randevu yönetim sistemi.

## Stack
- **Monorepo**: Turborepo
- **Web**: Next.js 14 (App Router) — `apps/web`
- **Mobile**: Expo React Native — `apps/mobile`
- **Backend**: Supabase
- **Shared**: `packages/shared` (utils, types, formatters)

## Özellikler
- Randevu yönetimi (personel zaman çizelgesi, çoklu hizmet, çift-rezervasyon koruması)
- Public online booking (`/book/[studioSlug]`)
- Müşteri / personel / vardiya / hizmet yönetimi
- Analitik panel
- Süper-admin platform paneli (`/admin`) — stüdyo, kullanıcı, abonelik yönetimi
- Landing page + fiyatlandırma

## Geliştirme
```bash
cd apps/web && npm install && npm run dev   # http://localhost:3000
```

### Ortam değişkenleri
`apps/web/.env.local` (bkz. `.env.local.example`):
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (public booking + admin API — **gizli, commit etme**)

## Mimari
Konvansiyonlar için `apps/web/ARCHITECTURE.md` dosyasına bakın (UI kit, tema token'ları, tipler, hook'lar).
