# JojoBot — Login & Register (Next.js + JVault)

CRUD login/register dengan tampilan seperti gambar (kartu split putih + ungu).

## Fitur
- **Register**: nomor WhatsApp + username + password → tersimpan di JVault (`users`)
- **Login**: username + password (bcrypt). Admin `admin / 35151278` otomatis ke panel admin
- **Dashboard user**: tombol hijau **Lanjutkan di JojoBot** → buka `wa.me/<bot_number>` + nomor user dicatat ke `continuations`
- **Panel admin** (`/admin`): ganti nomor bot, lihat/hapus users, lihat log lanjutan

## Database (JVault)
Bin: `255feaaa-e64c-4b4e-b2de-5f2ec0ee54b3`
```json
{ "users": [], "bot_number": "6281234567890", "continuations": [] }
```
- Baca: `GET /api?bin_id=...` + header `X-API-Key`
- Tulis: `PUT /api?bin_id=...` (ganti seluruh isi — paling stabil)
- `PATCH ?action=merge` bisa dipakai tapi server balas 500 walau data tetap tersimpan, jadi project ini pakai GET+PUT.

## Jalankan
```bash
npm install
npm run dev    # http://localhost:3000
```
Config ada di `.env.local` (JVAULT_API_KEY, JVAULT_BIN_ID, JWT_SECRET, ADMIN_*).
Ganti `bot_number` default lewat panel admin, bukan hardcode.

## Login Google (OAuth)
Tombol Facebook sudah dihapus, diganti login Google asli (authorization code flow).

1. Buka Google Cloud Console → APIs & Services → Credentials → Create Credentials → OAuth client ID → tipe **Web application**.
2. Isi persis seperti ini:
   - **Authorized JavaScript origins**:
     - `http://localhost:3000` (development)
     - `https://DOMAIN-PRODUKSI-KAMU` (production, tanpa path)
   - **Authorized redirect URIs**:
     - `http://localhost:3000/api/auth/google/callback` (development)
     - `https://DOMAIN-PRODUKSI-KAMU/api/auth/google/callback` (production)
3. Copy Client ID & Client Secret ke `.env.local`:
   ```
   GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=xxx
   ```
4. Restart (`npm run dev`). User Google baru otomatis dibuatkan akun (username dari email) lalu diminta melengkapi nomor WhatsApp di dashboard sebelum bisa klik Lanjutkan.

| API baru | Fungsi |
|---|---|
| `GET /api/auth/google` | Redirect ke consent Google |
| `GET /api/auth/google/callback` | Tukar code, buat/cari user, redirect sukses |
| `PUT /api/profile` | Simpan nomor WA (user Google) |

## Rute
| Halaman | Path |
|---|---|
| Login | `/` |
| Register | `/register` |
| Dashboard user | `/dashboard` |
| Admin | `/admin` |
| API | `/api/auth/register`, `/api/auth/login`, `/api/auth/me`, `/api/bot-number`, `/api/users`, `/api/continue` |
