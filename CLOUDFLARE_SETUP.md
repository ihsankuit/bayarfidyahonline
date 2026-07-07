# Setup Cloudflare Pages: D1 + R2 + Admin Blog

Panduan ini untuk setup pertama kali sahaja. Selepas siap, awak boleh terus
publish blog dari `/admin` setiap kali tanpa perlu ulang langkah-langkah ini.

## 0. Keperluan

- Install Wrangler CLI (jika belum): `npm install -g wrangler`
- Login: `wrangler login`

## 1. Cipta D1 database

```bash
wrangler d1 create bayarfidyah_db
```

Command ini akan output `database_id`. Salin nilai tu dan tampal dalam
`wrangler.toml`, gantikan `REPLACE_WITH_YOUR_D1_DATABASE_ID`.

## 2. Jalankan migration (cipta jadual)

```bash
wrangler d1 execute bayarfidyah_db --remote --file=./migrations/0001_init.sql
```

## 3. Cipta R2 bucket (untuk simpan gambar)

```bash
wrangler r2 bucket create bayarfidyah-images
```

Nama bucket dalam `wrangler.toml` (`bucket_name`) mesti sama dengan nama yang
dicipta di sini.

## 4. Set secrets (rahsia) untuk Pages project

Gantikan `<nama-projek-pages>` dengan nama projek Cloudflare Pages sebenar
(nama yang tertera di dashboard Cloudflare Pages awak).

```bash
wrangler pages secret put SESSION_SECRET --project-name=<nama-projek-pages>
wrangler pages secret put SETUP_TOKEN --project-name=<nama-projek-pages>
```

- **SESSION_SECRET**: rentetan rawak panjang (contoh: hasil dari
  `openssl rand -hex 32`). Digunakan untuk sahkan sesi login admin. Jangan
  kongsi nilai ini dengan sesiapa.
- **SETUP_TOKEN**: kata laluan sementara yang awak reka sendiri, hanya
  digunakan SEKALI untuk cipta akaun admin pertama melalui `/admin`. Selepas
  akaun admin pertama dicipta, token ini tidak boleh digunakan lagi.

Sambungkan juga binding D1 dan R2 kepada Pages project awak melalui dashboard
Cloudflare (**Pages → Settings → Functions → D1 database bindings** dan
**R2 bucket bindings**), guna nama binding yang sama seperti dalam
`wrangler.toml` (`DB` dan `IMAGES`).

## 5. Deploy

```bash
wrangler pages deploy . --project-name=<nama-projek-pages>
```

Atau terus push ke branch yang disambungkan dengan Cloudflare Pages (jika
guna Git integration), Cloudflare akan auto-deploy.

## 6. Cipta akaun admin pertama

1. Pergi ke `https://<domain-awak>/admin`
2. Kerana belum ada akaun admin, borang "Setup akaun admin pertama" akan
   dipaparkan.
3. Isi username, kata laluan (min. 8 aksara), dan **Setup token** (nilai
   `SETUP_TOKEN` yang awak tetapkan di langkah 4).
4. Selepas berjaya, log masuk dengan username & kata laluan tadi.

Borang setup ini automatik mati selepas satu akaun admin wujud — selamat
untuk dibiarkan dalam kod.

## 7. Guna admin panel

- **Tulis post**: klik "+ Post Baharu", isi tajuk, ringkasan, kandungan,
  upload gambar cover (jika ada), pilih status **Draf** atau **Terbitkan**,
  klik Simpan.
- **Edit/Padam**: klik mana-mana post dalam senarai sebelah kiri untuk edit,
  atau klik Padam untuk buang terus.
- Post berstatus **Terbitkan** akan terus muncul di seksyen Blog laman utama
  dan boleh diakses di `/blog/<slug>`.

## Nota keselamatan

- Jangan kongsi `SESSION_SECRET` atau `SETUP_TOKEN` dalam chat/mesej —
  simpan terus sebagai Wrangler secret.
- Gambar yang diupload disimpan di R2 dan disajikan melalui `/images/...`
  (bukan akses terus ke bucket), jadi tiada keperluan aktifkan akses awam R2.
