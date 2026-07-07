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

## 2. Jalankan migration (cipta jadual `admins` dan `posts`)

1. Dalam database `bayarfidyah_db` yang baru dicipta, klik tab **Console**.
2. Buka fail `migrations/0001_init.sql` dalam repo ni, copy **semua** isi
   kandungannya.
3. Paste ke dalam kotak Console, klik **Execute** (atau **Run**).
4. Sahkan tiada ralat — patut nampak 2 jadual berjaya dicipta (`admins`,
   `posts`).

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
3. **Save** — Cloudflare akan minta redeploy untuk env vars baru berkuat
   kuasa (lihat Langkah 6).

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

- **Tulis post**: klik "+ Post Baharu", isi tajuk, ringkasan, kandungan,
  upload gambar cover (jika ada), pilih status **Draf** atau **Terbitkan**,
  klik Simpan.
- **Edit/Padam**: klik mana-mana post dalam senarai sebelah kiri untuk edit,
  atau klik Padam untuk buang terus.
- Post berstatus **Terbitkan** akan terus muncul di seksyen Blog laman utama
  dan boleh diakses di `/blog/<slug>`.

## Nota keselamatan

- Jangan kongsi `SESSION_SECRET` atau `SETUP_TOKEN` dengan sesiapa — kekalkan
  hanya dalam Environment variables (Secret) Cloudflare.
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
