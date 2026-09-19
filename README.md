# MyRegisterBot — WhatsApp Register Bot (Next.js 16)

Website registrasi nomor WhatsApp ke database online **JVault**, dengan UI premium terinspirasi Saweria — clean, rounded card, soft gradient, micro-interaction halus, mobile-first.

URL utama: `https://bot.acamedia.xyz` dengan parameter `?nomor=6288213292687`

## Fitur

- **Auto-read `?nomor`** — nomor otomatis dinormalisasi & masked (`+62 882-••••-687`)
- **Validasi & normalisasi** `088...` / `+62...` → `628...`
- **Idempotent register** — tidak ada duplikat, sudah terdaftar tetap sukses
- **JVault API** server-side only (ENV `JVAULT_API_KEY` tidak pernah ke browser)
- **Lanjutkan ke WhatsApp** — link `https://wa.me/{botPhone}?text={encoded}` dari setting admin
- **Admin panel** `/admin` (tersembunyi, tidak ada link publik) dengan PIN & HttpOnly Secure cookie (jose JWT HS256)
- **Rate limiting** register (10/menit) & login admin (5/menit) in-memory
- **Security headers**, sanitasi input, validasi server-side

## Teknologi

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS 4
- Framer Motion, Lucide React, Zod, jose

## Struktur Folder

```
src/
  app/
    page.tsx                # Homepage register flow
    admin/page.tsx          # Admin login
    admin/dashboard/page.tsx
    api/
      register/route.ts
      config/route.ts
      admin/login/route.ts
      admin/logout/route.ts
      admin/settings/route.ts
  lib/
    jvault.ts
    validation.ts
    whatsapp.ts
    auth.ts
    rate-limit.ts
  components/
    RegisterCard.tsx
    AdminLoginForm.tsx
    AdminDashboard.tsx
    Toast.tsx
middleware.ts
```

## Setup

```bash
npm install
cp .env.example .env.local
# edit .env.local
```

`.env.example`:
```env
JVAULT_API_URL=https://jvault.aerialstudio.tech/api?bin_id=1971982d-eb61-456b-bd54-92ad885fa550
JVAULT_API_KEY=
ADMIN_PIN=
```

Wajib isi:
- `JVAULT_API_KEY=jv_...` (dari JVault)
- `ADMIN_PIN=1221` (sesuai spec)

```bash
npm run dev    # http://localhost:3000
npm run build
npm start
```

## JVault Data Shape

```json
{
  "users": [{ "phone": "6288213292687", "registeredAt": "2026-09-19T00:00:00.000Z" }],
  "config": {
    "botPhone": "6281234567890",
    "whatsappButtonText": "Lanjutkan ke WhatsApp",
    "whatsappMessage": "Halo, saya sudah melakukan registrasi bot."
  }
}
```

### API

- `POST /api/register` `{ phone }` → `{ status: "registered"|"already_registered", waLink, buttonText }`
- `GET /api/config` → `{ botPhone, whatsappButtonText, waLink }` (public, untuk tombol WA)
- `POST /api/admin/login` `{ pin }` → set HttpOnly cookie `admin_session`
- `GET /api/admin/settings` (auth required) → `{ config }`
- `PUT /api/admin/settings` (auth required) `{ botPhone, whatsappButtonText, whatsappMessage }`

## Alur User

1. Buka `/?nomor=6288213292687` → nomor otomatis terbaca & masked
2. Klik `Daftarkan Nomor` → `POST /api/register`
3. Server validasi → `GET` JVault → cek duplikat → `PUT` jika baru
4. Tampilkan sukses + tombol `Lanjutkan ke WhatsApp` (`https://wa.me/...`)

Jika `?nomor` tidak ada → tampilkan empty state.

## Admin

- Buka `/admin` (tidak ada link publik)
- Masukkan PIN → cookie `admin_session` (HttpOnly, Secure prod, SameSite=Lax, 12h, JWT HS256)
- Ubah `Nomor Bot`, `Teks Tombol`, `Pesan WhatsApp` → `PUT /api/admin/settings` → persist ke JVault

## Keamanan

- JVault & PIN hanya di server (Route Handlers + middleware)
- Tidak ada `localStorage` auth
- Validasi Zod + sanitasi, rate limit, no raw error leak, WA redirect hanya ke `https://wa.me/`

## Deployment

Set ENV di Vercel/hosting:
`JVAULT_API_URL`, `JVAULT_API_KEY`, `ADMIN_PIN`

Pastikan HTTPS (cookie Secure otomatis di production).

## Catatan JVault

`lib/jvault.ts` mengirim header `x-api-key`, `Authorization: Bearer`, `x-jvault-key` untuk kompatibilitas dan mencoba `PUT → POST → PATCH` agar tahan terhadap varian API JVault. Response dinormalisasi untuk wrapper `data|record|result`.
