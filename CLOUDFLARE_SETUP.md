# Setup Cloudflare Pages: D1 + R2 + Admin Blog

Panduan ini untuk setup pertama kali sahaja, semua melalui **Cloudflare
Dashboard** (tiada keperluan install apa-apa di komputer awak). Selepas siap,
awak boleh terus publish blog dari `/admin` setiap kali tanpa perlu ulang
langkah-langkah ini.

Log masuk dahulu ke [dashboard.cloudflare.com](https://dash.cloudflare.com).

## 1. Cipta D1 database

1. Dashboard → **Storage & Databases** (atau **Workers & Pages → D1** pada
   sesetengah akaun) → **D1 SQL Database**.
2. Klik **Create database**.
3. Nama database: `bayarfidyah_db` → **Create**.
4. Selepas database dicipta, salin **Database ID** yang dipaparkan (rentetan
   panjang macam `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`). Awak akan perlukan
   ini di Langkah 2 dan 5.

## 2. Jalankan migration (cipta semua jadual)

Dalam database `bayarfidyah_db`, klik tab **Console**. Jalankan **tiga** fail
migration ini satu demi satu (copy semua isi, paste, klik **Execute**):

1. `migrations/0001_init.sql` → jadual `admins`, `posts`
2. `migrations/0002_gallery.sql` → jadual `gallery_images` (6 slot galeri)
3. `migrations/0003_donations.sql` → jadual `donations` (rekod derma/fidyah)

Sahkan tiada ralat selepas setiap satu.

## 3. Cipta R2 bucket (untuk simpan gambar)

1. Dashboard → **R2 Object Storage** → **Create bucket**.
2. Nama bucket: `bayarfidyah-images` → **Create bucket**.
3. Tak perlu aktifkan "Public access" — gambar akan disajikan melalui laman
   web sendiri (`/images/...`), bukan akses terus ke R2.

## 4. Sambungkan D1 dan R2 ke Pages project

1. Dashboard → **Workers & Pages** → pilih projek Pages awak
   (`bayarfidyahonline` atau nama yang awak beri semasa deploy).
2. Klik tab **Settings** → **Bindings** (atau **Functions** pada versi
   dashboard lama).
3. Tambah binding:
   - **D1 database binding**: Variable name = `DB`, pilih database
     `bayarfidyah_db`.
   - **R2 bucket binding**: Variable name = `IMAGES`, pilih bucket
     `bayarfidyah-images`.
4. **Save**.

## 5. Tambah secrets (rahsia)

Masih di halaman **Settings** projek Pages awak → **Environment variables**
(atau **Variables and Secrets**):

1. Tambah variable `SESSION_SECRET`:
   - Tandakan sebagai **Secret** (encrypted).
   - Nilai (contoh rentetan rawak yang sudah dijana, boleh terus guna):
     ```
     9bc776d9586fd8477d65acd3e47596463a5767b4f651816e957281bdc5a98092
     ```
   - Ini untuk sahkan sesi log masuk admin. Jangan kongsi nilai ni dengan
     sesiapa lagi.
2. Tambah variable `SETUP_TOKEN`:
   - Tandakan sebagai **Secret**.
   - Nilai: reka kata laluan sementara sendiri (contoh: rentetan yang susah
     diteka). Ini hanya digunakan **sekali** untuk cipta akaun admin pertama
     di Langkah 7.

### Secret untuk bayaran (Billplz) & email resit (Resend)

Tambah pula variable-variable ini (semua tandakan **Secret**):

| Variable | Dari mana | Catatan |
| --- | --- | --- |
| `BILLPLZ_API_KEY` | Billplz → **Settings → Account Settings** (Secret Key) | Guna kunci **sandbox** dulu untuk ujian |
| `BILLPLZ_COLLECTION_ID` | Billplz → **Billing → Collections** (cipta satu Collection, salin ID) | |
| `BILLPLZ_X_SIGNATURE_KEY` | Billplz → **Settings → Account Settings → X Signature Key** | Untuk sahkan webhook |
| `BILLPLZ_MODE` | Taip sendiri: `sandbox` atau `production` | Biar `sandbox` semasa ujian. Bukan Secret pun tak apa |
| `RESEND_API_KEY` | Resend → **API Keys → Create** | |
| `RESEND_FROM` | cth `Ihsan Fidyah <resit@bayarfidyahonline.com>` | Domain mesti disahkan di Resend dulu |

Nota:
- **Billplz sandbox**: log masuk di `www.billplz-sandbox.com` untuk dapatkan
  kunci ujian. Bila dah puas hati, tukar ke akaun production dan set
  `BILLPLZ_MODE=production` + kunci production.
- **Resend domain**: di Resend → **Domains → Add Domain**, masukkan
  `bayarfidyahonline.com`, ikut arahan tambah rekod DNS (SPF/DKIM) di
  Cloudflare. Selepas disahkan, barulah `RESEND_FROM` boleh guna domain itu.
  Sementara belum disahkan, boleh guna `onboarding@resend.dev` untuk ujian.

Selepas semua ditambah, **Save** — Cloudflare akan minta redeploy untuk env
vars baru berkuat kuasa (lihat Langkah 6).

## 6. Deploy semula

Selepas tambah binding & secrets, projek perlu di-redeploy supaya
perubahan berkuat kuasa:

- Cara paling mudah: pergi ke tab **Deployments**, klik **⋯** pada deployment
  terkini → **Retry deployment**. Atau push apa-apa commit baharu ke branch
  yang disambungkan, Cloudflare akan auto-deploy.

## 7. Cipta akaun admin pertama

1. Pergi ke `https://<domain-awak>/admin`.
2. Kerana belum ada akaun admin, borang "Setup akaun admin pertama" akan
   dipaparkan.
3. Isi username, kata laluan (min. 8 aksara), dan **Setup token** (nilai
   `SETUP_TOKEN` yang awak tetapkan di Langkah 5).
4. Selepas berjaya, log masuk dengan username & kata laluan tadi.

Borang setup ini automatik mati selepas satu akaun admin wujud — selamat
untuk dibiarkan dalam kod.

## 8. Guna admin panel

Di `/admin` ada tiga tab:

- **Post**: klik "+ Post Baharu", isi tajuk, ringkasan, kandungan, upload
  gambar cover, pilih **Draf**/**Terbitkan**, klik Simpan. Post **Terbitkan**
  muncul di seksyen Blog laman utama & di `/blog/<slug>`.
- **Galeri**: upload 6 gambar untuk seksyen Galeri di halaman utama.
- **Derma**: lihat senarai derma/fidyah masuk, status bayaran, dan jumlah
  terkumpul (berjaya).

## 9. Uji aliran bayaran (Billplz sandbox)

1. Buka laman utama → kalkulator fidyah → klik **Bayar Fidyah Sekarang**.
2. Isi nama + email, klik **Teruskan Bayaran** → dibawa ke halaman Billplz.
3. Dalam **sandbox**, tandakan bil sebagai "paid" (Billplz sandbox ada butang
   simulasi bayaran) → anda diredirect ke halaman "Terima kasih".
4. Semak: (a) email resit sampai, (b) tab **Derma** di admin tunjuk status
   **Berjaya**.

Bila semua elok, tukar ke akaun **production** Billplz: kemas kini
`BILLPLZ_API_KEY`, `BILLPLZ_COLLECTION_ID`, `BILLPLZ_X_SIGNATURE_KEY` dengan
kunci production dan set `BILLPLZ_MODE=production`, kemudian redeploy.

## Nota keselamatan

- Jangan kongsi `SESSION_SECRET`, `SETUP_TOKEN`, `BILLPLZ_API_KEY`,
  `BILLPLZ_X_SIGNATURE_KEY` atau `RESEND_API_KEY` dengan sesiapa — kekalkan
  hanya dalam Environment variables (Secret) Cloudflare.
- Status bayaran disahkan melalui **webhook Billplz** (`/api/donate/callback`)
  yang mengesahkan `X-Signature`, bukan bergantung pada redirect sahaja — jadi
  status derma tak boleh dipalsukan dari pihak pengguna.
- Gambar yang diupload disimpan di R2 dan disajikan melalui `/images/...`
  (bukan akses terus ke bucket), jadi tiada keperluan aktifkan akses awam R2.

---

## Alternatif: guna Wrangler CLI (pilihan, bukan wajib)

Kalau awak lebih selesa command line di komputer sendiri (bukan dalam sesi
Claude Code ni):

```bash
npm install -g wrangler
wrangler login

wrangler d1 create bayarfidyah_db
# salin database_id output ke wrangler.toml

wrangler d1 execute bayarfidyah_db --remote --file=./migrations/0001_init.sql

wrangler r2 bucket create bayarfidyah-images

wrangler pages secret put SESSION_SECRET --project-name=<nama-projek-pages>
wrangler pages secret put SETUP_TOKEN --project-name=<nama-projek-pages>

wrangler pages deploy . --project-name=<nama-projek-pages>
```

Binding D1/R2 masih perlu disambungkan melalui dashboard (Langkah 4 di atas)
walaupun guna CLI untuk bahagian lain.
