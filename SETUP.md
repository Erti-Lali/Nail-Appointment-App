# NailStudio 101 — Kurulum Kılavuzu

## Proje Yapısı

```
nailstudio101/
├── apps/
│   ├── web/          # Next.js 14 — Admin Panel & Landing
│   └── mobile/       # Expo (React Native) — Müşteri Uygulaması
├── packages/
│   └── shared/       # TypeScript types, utils, constants
├── supabase/
│   ├── migrations/   # SQL şema migration'ları
│   └── functions/    # Edge Functions
└── turbo.json        # Turborepo config
```

## 1. Supabase Kurulumu

1. [supabase.com](https://supabase.com) → Yeni proje oluştur
2. SQL Editor → `supabase/migrations/001_initial_schema.sql` çalıştır
3. SQL Editor → `supabase/migrations/002_row_level_security.sql` çalıştır
4. Project Settings → API → URL ve anon key'i kopyala

## 2. Web (Next.js) Kurulumu

```bash
cd apps/web
cp .env.local.example .env.local
# .env.local dosyasını düzenle
npm install
npm run dev
# http://localhost:3000
```

## 3. Mobile (Expo) Kurulumu

```bash
cd apps/mobile
npm install
npm run dev
# Expo Go uygulamasıyla QR okut
```

## 4. Tüm Projeyi Birlikte Çalıştır

```bash
# Kök dizinde
npm install
npm run dev  # web + mobile birlikte
```

## Sonraki Adımlar

### Yapılacaklar (Sırayla):
- [ ] Appointments sayfası — tam takvim görünümü
- [ ] Customers sayfası — müşteri listesi + detay
- [ ] Staff yönetimi — çalışma saatleri, izinler
- [ ] Services yönetimi — kategori + hizmet CRUD
- [ ] Analytics sayfası — grafikler ve raporlar
- [ ] SMS entegrasyonu (Netgsm)
- [ ] E-posta entegrasyonu (Resend)
- [ ] AI Asistan (OpenAI)
- [ ] Stripe ödeme entegrasyonu
- [ ] Push notification (Expo + Supabase)
- [ ] Instagram DM bağlantısı

## Tech Stack Özeti

| Katman | Teknoloji |
|--------|-----------|
| Web Admin | Next.js 14, Tailwind CSS |
| Mobile App | Expo (React Native) |
| Backend | Supabase (PostgreSQL + Auth + Realtime + Storage) |
| Shared | TypeScript, date-fns, Zustand |
| Deployment | Vercel (web) + EAS Build (mobile) |
