# Nusa Warrior

Nusa Warrior (v1.10.1) adalah game kartu strategi digital (TCG / Card Battler) bertema sejarah, kebudayaan, dan tokoh-tokoh Nusantara. Pemain dapat mengumpulkan kartu karakter dan instrumen pusaka, meracik deck taktis, menantang AI dalam mode PvE maupun Story Mode, berpartisipasi dalam Liga Turnamen PvP, menciptakan kartu original sendiri melalui Card Forge Studio, serta mengelola ekonomi kartu menggunakan sistem Nusa Point (NP).

Setiap kartu terinspirasi dari faksi dan kerajaan Nusantara—seperti Majapahit, Pajajaran, Demak-Cirebon, Banten, Daha-Kadiri, hingga Portugis—lengkap dengan konteks sejarah autentik, kutipan naskah/sumber rujukan, dan status kurasi aset.

---

## Fitur Utama

- **Katalog Kartu & Eksplorasi Lore**: Katalog kartu Karakter dan Instrumen lengkap dalam 3 bahasa (Indonesia `/id`, Inggris `/en`, Mandarin `/zh`), detail statistik, konteks sejarah, kutipan naskah kuno, serta status verifikasi historis.
- **Mode Cerita (Story Mode)**: Alur kampanye naratif berbasis chapter dan stage bertema perang dan diplomasi kerajaan Nusantara, dialog karakter interaktif, tantangan battle khusus, serta reward kartu dan Nusa Points eksklusif.
- **Battle Engine (PvE & Liga Turnamen)**:
  - **PvE Battle**: Pertarungan kartu taktis melawan AI bot dengan engine deterministic berbasis server-authoritative state.
  - **League & Turnamen PvP**: Sistem kamar turnamen (Public & Private League), pencarian lawan cepat (Quick Match), struktur ronde bracket, penanganan forfeit/timeout otomatis, serta escrow hadiah transparan.
- **Card Forge Studio (Pembuatan Kartu Kustom)**: Studio kreasi kartu original bagi pemain untuk merancang kartu tokoh sejarah orisinal dengan visual rendering berbasis server (`sharp`, `canvas`, `ag-psd`, `opentype.js`), penyeimbangan stat poin, dan integrasi penyimpanan CDN / remote storage.
- **Koleksi & Deck Builder**: Manajemen kepemilikan kartu pemain, aturan validasi deck (karakter vs instrumen), slot preset deck ganda, serta starter pack kerajaan.
- **Ekonomi Nusa Point (NP) & Shop**:
  - Mata uang universal in-game (Nusa Point) yang diperoleh melalui kemenangan pertempuran, juara liga, penyelesaian kampanye Story Mode, atau paket top-up.
  - Shop in-game untuk membeli Starter Pack, Deck Preset, dan Top-Up Nusa Point dengan integrasi payment gateway / bridge (QRIS, Virtual Account via Menu Kita / iPaymu Sandbox).
  - Halaman riwayat transaksi dan status pembayaran terperinci bagi pemain.
- **Admin CMS & Pengawasan Game**: Dasbor admin terpadu untuk kurasi kartu, moderasi laporan koreksi sejarah, pengelolaan campaign & stage Story Mode, pengaturan payment gateway, manajemen pengguna, serta audit ledger transaksi.
- **Penyimpanan Ganda Fleksibel**: Mode development cepat dengan driver lokal embedded JSON (`.data/nusantara-db.json`) atau database PostgreSQL production melalui Prisma 7.

---

## Arsitektur & Teknologi

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Server Components, Route Handlers, Server Actions)
- **UI & Styling**: [React 19](https://react.dev/), [TypeScript 7](https://www.typescriptlang.org/), [Tailwind CSS 4](https://tailwindcss.com/) (`@tailwindcss/postcss`), [Lucide React](https://lucide.dev/)
- **State & DI**: [Zustand](https://github.com/pmndrs/zustand) (Client State), [@needle-di/core](https://github.com/needle-di/needle) (Clean Architecture Dependency Injection)
- **Database & ORM**: [PostgreSQL](https://www.postgresql.org/) & [Prisma 7](https://www.prisma.io/) dengan `@prisma/adapter-pg` driver adapter
- **Compositing & Graphics Engine**: [Sharp](https://sharp.pixelplumbing.com/), [Canvas](https://github.com/Automattic/node-canvas), [ag-psd](https://github.com/Agamotto/ag-psd) (PSD template extraction), [opentype.js](https://opentype.js.org/) (vektor tipografi historis)
- **Keamanan & Autentikasi**: [jose](https://github.com/panva/jose) (JWT sessions), [bcryptjs](https://github.com/dcodeIO/bcrypt.js) (password hashing), Google OAuth 2.0 SSO, Guest Sign-In, RNG Encryption Key, API Rate Limiting
- **QR & Scanner**: `qrcode.react` (tampilan kode QRIS/pembayaran), `@zxing/browser` (pemindaian barcode/QR)
- **Testing & Tooling**: [Vitest 5](https://vitest.dev/), ESLint, `tsx`

---

## Prasyarat Sistem

- **Node.js**: `20.9.0` atau versi LTS yang lebih baru
- **Package Manager**: [pnpm](https://pnpm.io/) (`>= 9.0`)
- **PostgreSQL**: Diperlukan jika menggunakan `NUSANTARA_STORAGE_DRIVER="prisma"` (opsional jika menggunakan driver `embedded`)
- **Dependensi Sistem (Opsional untuk Komposit Kartu Canvas/Sharp lokal)**: `cairo`, `pango`, `libpng`, `libjpeg`, `giflib`, `librsvg` (pada macOS dapat dipasang via `brew install pkg-config cairo pango libpng jpeg giflib librsvg`).

---

## Menjalankan Proyek secara Lokal

### 1. Kloning & Pemasangan Dependensi

```bash
git clone <repository-url>
cd nusantara-card-project
pnpm install
```

### 2. Konfigurasi Lingkungan

Salin template variabel lingkungan:

```bash
cp .env.example .env
```

Buat secret JWT unik (minimal 32 karakter):

```bash
openssl rand -hex 32
```

Lalu masukkan hasil secret ke dalam variabel `JWT_SECRET` di `.env`.

### 3. Mode Penyimpanan

#### Opsi A: Driver Embedded (Tanpa Konfigurasi Database Eksternal)

Sangat cocok untuk pengujian lokal instan tanpa perlu menyiapkan server PostgreSQL:

1. Pastikan di `.env`:
   ```env
   NUSANTARA_STORAGE_DRIVER="embedded"
   ```
2. Jalankan server development:
   ```bash
   pnpm dev
   ```
3. Buka [http://localhost:3000](http://localhost:3000). Data lokal disimpan otomatis di `.data/nusantara-db.json`.

#### Opsi B: Driver PostgreSQL (Prisma)

Direkomendasikan untuk stabilitas fitur penuh (relasi data, Story Mode, transaksi, dan pengujian multi-sesi):

1. Pastikan server PostgreSQL aktif dan atur koneksi di `.env`:
   ```env
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/nusantara_card?schema=public"
   NUSANTARA_STORAGE_DRIVER="prisma"
   ```
2. Sinkronisasikan schema ke database dan generate Prisma client:
   ```bash
   pnpm db:push
   pnpm db:generate
   ```
3. Jalankan seed awal data katalog kartu, starter pack, dan konten sistem:
   ```bash
   pnpm db:seed
   ```
4. Jalankan server development:
   ```bash
   pnpm dev
   ```

---

## Variabel Lingkungan (.env)

| Variabel | Tipe / Contoh | Kegunaan |
| --- | --- | --- |
| `DATABASE_URL` | URL PostgreSQL | Connection string database PostgreSQL untuk Prisma ORM dan seed. |
| `LEGACY_DATABASE_URL` | URL PostgreSQL *(Opsional)* | Database sumber saat melakukan migrasi satu kali via `pnpm db:migrate:data`. |
| `NUSANTARA_STORAGE_DRIVER` | `"embedded"` \| `"prisma"` | Menentukan driver penyimpanan data aplikasi. Default `.env.example`: `embedded`. |
| `JWT_SECRET` | String (min. 32 char) | Kunci rahasia untuk enkripsi token sesi JWT pengguna & admin. |
| `NEXT_PUBLIC_APP_URL` | URL (`http://localhost:3000`) | Base origin aplikasi yang digunakan untuk verifikasi callback, CORS, dan redirect. |
| `GOOGLE_CLIENT_ID` | String OAuth | Client ID dari Google Cloud Console untuk SSO Google OAuth 2.0. |
| `GOOGLE_CLIENT_SECRET` | String OAuth | Client Secret Google OAuth 2.0. |
| `GOOGLE_REDIRECT_URI` | URL | Endpoint callback OAuth (contoh: `http://localhost:3000/api/v1/auth/google/callback`). |
| `ADMIN_USERNAME` | String | Username akun admin sistem. |
| `ADMIN_PASSWORD_HASH` | String Bcrypt | Hash bcrypt password admin untuk production (`cost 10+`). |
| `ADMIN_PASSWORD` | String *(Dev)* | Password admin plain-text khusus lingkungan development lokal. |
| `BATTLE_RNG_ENCRYPTION_KEY` | Hex 64 Karakter | Kunci enkripsi 32-byte untuk mengamankan seed RNG deterministik pada pertempuran. |
| `BATTLE_SWEEP_SECRET` | String (min. 32 char) | Bearer token otentikasi cron maintenance sweep room/timeout battle internal. |
| `MENU_KITA_PAYMENT_BRIDGE_URL` | URL API | Origin API payment bridge Menu Kita / iPaymu untuk transaksi top-up & shop. |
| `NUSA_WARRIOR_PAYMENT_BRIDGE_KEY` | String | Kunci akses API client bridge pembayaran. |
| `NUSA_WARRIOR_PAYMENT_CALLBACK_SECRET` | String | Shared secret untuk memvalidasi webhook / callback status pembayaran dari payment gateway. |
| `REMOTE_STORAGE_URL` | URL API | URL remote storage service utama untuk hosting asset gambar kustom & kartu. |
| `REMOTE_STORAGE_2_URL` | URL API *(Fallback)* | URL remote storage cadangan / fallback route. |
| `REMOTE_STORAGE_TOKEN` | Bearer Token | Token otorisasi API untuk upload file ke remote storage CDN. |

> [!WARNING]
> Jangan pernah mem-push file `.env` atau credential production ke repositori publik. Selalu gunakan secret manager pada platform deployment Anda.

---

## Skrip & Perintah Proyek

| Perintah | Deskripsi |
| --- | --- |
| `pnpm dev` | Menjalankan Next.js development server pada port 3000. |
| `pnpm build` | Melakukan generate Prisma Client dan kompilasi production build Next.js. |
| `pnpm start` | Menjalankan server aplikasi Next.js hasil build production. |
| `pnpm lint` | Menjalankan static analysis menggunakan ESLint. |
| `pnpm typecheck` | Menjalankan pemeriksaan tipe statis TypeScript (`tsc --noEmit`). |
| `pnpm test` | Menjalankan unit test suite menggunakan Vitest. |
| `pnpm db:generate` | Menghasilkan kembali Prisma Client dari `prisma/schema.prisma`. |
| `pnpm db:push` | Mendorong perubahan skema Prisma langsung ke database tanpa file migrasi. |
| `pnpm db:migrate:deploy` | Menjalankan migrasi Prisma yang tertunda pada database production. |
| `pnpm db:seed` | Mengisi data bawaan katalog kartu, preset deck, starter pack, dan aset sistem. |
| `pnpm db:migrate:data` | Skrip transfer data skema dari `LEGACY_DATABASE_URL` ke `DATABASE_URL`. |
| `npx tsx scripts/migrate-embedded-to-prisma.ts` | Migrasi data dari file lokal `.data/nusantara-db.json` ke database PostgreSQL Prisma. |
| `npx tsx scripts/extract-psd-templates.ts` | Mengekstrak layer frame & background dari file template PSD kerajaan. |
| `bash scripts/hash-password.sh` | Utilitas bash untuk membuat hash bcrypt yang aman bagi `ADMIN_PASSWORD_HASH`. |

---

## Struktur Direktori

```text
nusantara-card-project/
├── .data/                     # File database lokal embedded (nusantara-db.json)
├── docs/                      # Dokumentasi teknis, PRD, aturan game, arsitektur integritas
├── prisma/
│   ├── migrations/            # Riwayat migrasi PostgreSQL
│   ├── schema.prisma          # Skema model data Prisma ORM
│   └── seed.ts                # Data katalog kartu, starter pack, dan seeding awal
├── public/
│   ├── cards/                 # Aset ilustrasi kartu resmi bawaan
│   └── fonts/                 # Tipografi autentik untuk compositing kartu
├── scripts/                   # Skrip operasional, migrasi database, dan ekstrak aset PSD
└── src/
    ├── app/                   # Next.js App Router
    │   ├── [lang]/            # Halaman UI multibahasa (/id, /en, /zh)
    │   │   ├── admin/         # Panel manajemen Admin (Cards, Story Mode, Payment, Users)
    │   │   ├── user/          # Dasbor pemain (Battle, Story Mode, Forge, Leagues, Decks, Shop)
    │   │   ├── catalog/       # Katalog kartu publik & detail kartu
    │   │   ├── tutorial/      # Tutorial interaktif aturan bermain
    │   │   └── contact/       # Halaman kontak & masukan
    │   └── api/v1/            # REST API endpoints (Auth, Cards, Story, Leagues, Shop, Admin)
    ├── client/                # Kode Clean Architecture sisi klien
    │   ├── data/              # Remote/local datasources & repositories implementation
    │   ├── domain/            # Entities, contracts, dan client use cases
    │   └── presentation/      # Komponen React, hooks, store Zustand, dan views
    ├── core/                  # Dependency Injection container (@needle-di/core), HTTP client, i18n
    └── server/                # Kode Clean Architecture sisi server
        ├── modules/           # Modul bisnis per domain:
        │   ├── admin/         # Modul operasional CMS & kontrol admin
        │   ├── auth/          # Sesi JWT, password, dan integrasi OAuth
        │   ├── battle/        # Game engine, RNG, validasi aksi turn-based
        │   ├── card/          # Logika kartu, pricing, dan custom card compositor engine
        │   ├── collection/    # Kepemilikan kartu & ledger pemain
        │   ├── deck/          # Validasi struktur deck & aturan kerajaan
        │   ├── league/        # Manajemen kamar turnamen, matchmaking, & bracket
        │   ├── nusa-points/   # Transaksi, ledger, dan saldo mata uang Nusa Point
        │   ├── payment/       # Payment gateway bridge, integrasi QRIS/VA, callback webhook
        │   ├── shop/          # Katalog item, starter packs, dan pesanan top-up
        │   └── story-mode/    # Campaign progression, stage battle, narasi & reward
        └── shared/            # Database client, auth middleware, rate-limiter, remote storage
```

---

## Peta Halaman (Routes)

Semua rute antarmuka pengguna diawali kode bahasa (`/{lang}`, contoh: `/id` atau `/en`).

| Rute | Halaman & Deskripsi |
| --- | --- |
| `/{lang}` | Beranda utama Nusa Warrior. |
| `/{lang}/catalog` | Katalog interaktif kartu Karakter & Instrumen. |
| `/{lang}/catalog/{slug}` | Detail kartu, statistik, lore sejarah, serta rujukan naskah. |
| `/{lang}/tutorial` | Panduan interaktif tata cara dan fase pertempuran kartu. |
| `/{lang}/contact` | Formulir kontak pengembang dan pelaporan koreksi sejarah. |
| `/{lang}/login` | Halaman login pemain (Email/Password, Google OAuth, atau Mode Tamu). |
| `/{lang}/user/dashboard` | Dasbor utama pemain (status saldo NP, ringkasan koleksi, riwayat match). |
| `/{lang}/user/battle` | Arena pertempuran taktis PvE melawan AI bot. |
| `/{lang}/user/story-mode` | Mode Cerita Sejarah berbasis campaign chapter, dialog penceritaan, dan stage battle. |
| `/{lang}/user/cards/create` | **Card Forge Studio**: Pembuat kartu kustom original pemain dengan real-time compositor. |
| `/{lang}/user/leagues` | Arena Liga & Turnamen PvP (Public / Private Room, Matchmaking & Bracket). |
| `/{lang}/user/decks` | Manajemen koleksi kartu dan peracik deck (Deck Builder). |
| `/{lang}/user/shop` | Toko kartu (Starter Pack, Deck Preset) dan Top-Up Nusa Point. |
| `/{lang}/user/transaction` | Riwayat pesanan pembelian deck, invoice pembayaran, dan riwayat top-up NP. |
| `/{lang}/admin/dashboard` | Dasbor statistik sistem admin dan laporan ringkas. |
| `/{lang}/admin/cards` | Pengelolaan data kartu resmi, persetujuan aset, dan audit log. |
| `/{lang}/admin/story-mode` | CMS pengelolaan chapter, stage, konten dialog cerita, dan aset media Story Mode. |
| `/{lang}/admin/payment-gateway`| Konfigurasi integrasi payment gateway Menu Kita / iPaymu bridge. |
| `/{lang}/admin/users` | Pengelolaan akun pengguna, status peran, dan verifikasi. |
| `/{lang}/admin/contact` | Manajemen laporan masukan dan usulan koreksi histori dari komunitas. |

---

## Grup Endpoint API (`/api/v1`)

- **/auth**: Endpoint login, registrasi, refresh sesi JWT, logout, sesi tamu (*guest*), dan Google OAuth callback.
- **/cards & /cards/{slug}**: Pengambilan katalog kartu publik, filter faksi kerajaan, detail kartu, dan pengajuan laporan koreksi sejarah.
- **/user/custom-cards**: Pembuatan kartu kustom via Card Forge Studio, kalkulasi harga Nusa Point, dan rendering komposisi gambar kartu.
- **/story-mode**: Inisialisasi perjalanan cerita, pengambilan alur stage & dialog, submit penyelesaian stage, dan klaim hadiah kartu/poin.
- **/battles**: Pembuatan sesi battle baru, pengambilan state terenkripsi, pengiriman aksi pemain (*draw, summon, attack, end turn*), dan reconnect state.
- **/leagues**: Manajemen kamar turnamen liga, pendaftaran partisipan, bracket matchmaking, dan eksekusi putaran pertandingan.
- **/decks**: CRUD konfigurasi deck pemain serta validasi kepatuhan aturan formasi kartu.
- **/collection**: Daftar kepemilikan kartu pemain yang tercatat pada ledger database.
- **/shop**:
  - `/shop/decks` & `/shop/claim-starter`: Pembelian dan klaim starter pack pemain baru.
  - `/shop/topup/tiers`, `/shop/topup/checkout`, `/shop/topup/orders`: Katalog paket tier Nusa Point, inisiasi pesanan top-up, dan pengecekan status transaksi.
  - `/shop/payments/menu-kita/callback`: Webhook callback penanganan konfirmasi status pembayaran masuk dari payment bridge.
- **/admin**: Operasi hak akses tinggi untuk CRUD kartu, publikasi aset, CMS Story Mode, manajemen user, dan audit ledger.
- **/internal/battles/sweep**: Endpoint pembersihan berkala (*scheduled cron*) untuk timeout battle yang menggantung dan kadaluwarsa escrow turnamen liga (memerlukan `BATTLE_SWEEP_SECRET`).

---

## Catatan Integritas, Keamanan, & Deployment

1. **Server Authority Gameplay**: Battle engine Nusa Warrior berjalan deterministik di mana server Next.js memegang kendali mutlak atas kebenaran state permainan (*server authority*). Klien web hanya mengirimkan aksi (perintah), dan server yang melakukan kalkulasi giliran, efek instrumen, kalkulasi ATK/DEF, serta keputusan kemenangan guna mencegah modifikasi state ilegal.
2. **Database Migrations & Production Readiness**:
   - Selalu terapkan migrasi database via `pnpm db:migrate:deploy` pada production.
   - Migrasi Prisma mencakup skema kepemilikan kartu, integritas sesi game, turnamen liga, reward strike instrumen, mata uang Nusa Point, kampanye Story Mode, CMS draft konten, hingga kartu kustom pemain.
3. **Penyimpanan Gambar & CDN**:
   - Ilustrasi kartu bawaan disajikan melalui `public/cards/`.
   - Kartu orisinal hasil kreasi Card Forge Studio di-render ke format WebP teroptimasi dan diunggah secara otomatis ke remote storage CDN (`REMOTE_STORAGE_URL` & `REMOTE_STORAGE_2_URL`) menggunakan `RemoteFileStorageService`.
4. **Maintenance Sweep Cron**:
   - Pasang scheduled cron runner (misal via Vercel Cron, GitHub Actions, atau crontab server) untuk memanggil `POST /api/v1/internal/battles/sweep` setiap 5 menit dengan header `Authorization: Bearer <BATTLE_SWEEP_SECRET>` guna melepaskan escrow pertandingan yang usang dan merapikan sesi pertempuran tidak aktif.
5. **Autentikasi Admin di Production**:
   - Buat hash password admin yang aman menggunakan `bash scripts/hash-password.sh` atau perintah `node` dengan salt bcrypt cost minimal 10. Letakkan hasil hash di variabel `ADMIN_PASSWORD_HASH`.

---

## Dokumentasi Pendukung

- [PRD & Peraturan Permainan Kartu](docs/PRD_Nusantara_Card.md)
- [Panduan Desain & Style UI](docs/DESIGN.md)
- [Arsitektur Server Authority Battle](docs/battle-server-authority.md)
- [Model Kepemilikan Kartu & Ledger](docs/card-ownership.md)
- [Prinsip Integritas Game & Anti-Cheat](docs/game-integrity.md)
