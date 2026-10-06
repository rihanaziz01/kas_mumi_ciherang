# 🪙 KASMM — Sistem Informasi Keuangan & Iuran Muda-Mudi Ciherang

Aplikasi web modern, transparan, dan terintegrasi untuk pengelolaan iuran kas anggota, pencatatan kas terbuka, penyaluran kas desa, tabungan qurban, dan pelaporan keuangan berkala **Muda-Mudi Ciherang (Ciherang Fams)**.

---

## 🌟 Fitur Utama

### 1. Transparansi Publik (Tanpa Login / Open Access)
- **Ringkasan Saldo Real-Time**: Informasi total kas kelompok, kas operasional, saldo titipan kas desa, dan tabungan qurban yang dapat dipantau oleh seluruh pemuda/i secara terbuka.
- **Buku Kas Terbuka**: Rincian arus kas mutasi pemasukan dan pengeluaran kas kelompok serta operasional lengkap dengan tanggal, kategori, dan deskripsi.
- **Cek Iuran Mandiri**: Setiap anggota dapat mengecek riwayat pembayaran iuran 12 bulan (Januari - Desember) secara mandiri cukup dengan memilih nama atau memasukkan Kode Anggota. Status lunas, belum lunas, dan sisa kekurangan ditampilkan secara detail dan transparan.

### 2. Pengelolaan Iuran Modular & Bertingkat
- **Kas Kelompok**: Iuran seragam untuk seluruh anggota (Rp 5.000 / bulan).
- **Kas Desa**: Iuran titipan berjenjang sesuai status keanggotaan (Pelajar Rp 5.000, Mahasiswa Rp 7.000, Pencaker Rp 5.000, Pedagang Rp 10.000, Karyawan A Rp 15.000, Karyawan B Rp 20.000).
- **Tabungan Qurban**:
  - **Tarif Tetap**: Pelajar (Rp 17.000), Mahasiswa (Rp 30.000), Pencaker (Rp 21.000).
  - **Tarif Dinamis**: Karyawan A & B (2% dari gaji bulanan yang tercatat).
  - **Bebas/Fleksibel**: Pedagang (sukarela/bebas).
  - **Dukungan Input Manual & Pembayaran Cicil**: Mendukung pembayaran qurban bertahap. Jika nominal yang dibayar kurang dari tarif yang ditentukan, sistem secara otomatis menandai status **"Belum Lunas ⚠️"**, mencatat sisa kekurangan, dan menyediakan opsi pelunasan cepat.
- **Kas Operasional**: Sub-kas khusus Keputrian (Rp 5.000) dan Olahraga (Rp 5.000) untuk kebutuhan operasional kegiatan pemuda-pemudi.

### 3. Panel Administrasi & Pengurus (Terproteksi Sanctum)
- **Dashboard & Analitik**: Statistik ringkasan kas, persentase kepatuhan bayar anggota, dan grafik tren arus kas bulanan.
- **Transaksi Pembayaran Fleksibel**:
  - Pembayaran per bulan atau multi-bulan (1–12 bulan sekaligus).
  - Mode Total Langsung atau Per Bulan dengan input manual nominal Qurban.
  - Fitur pelunasan sisa kekurangan iuran qurban dalam satu klik.
  - Pembatalan transaksi pembayaran iuran (rollback).
- **Pencatatan Pemasukan & Pengeluaran**: Manajemen kas mandiri di luar iuran wajib dengan kategorisasi dan keterangan transaksi.
- **Penyaluran Setoran Kas Desa**: Modul khusus untuk mencatat histori penyerahan dana titipan kas desa dari pemuda/i ke bendahara desa.
- **Master Data Anggota**: Pendataan anggota lengkap dengan kode unik, status pekerjaan, jenis kelamin, dan nomor kontak.
- **Master Tarif & Slip Pendapatan**: Penyesuaian konfigurasi nominal tarif iuran dan pencatatan riwayat gaji bulanan karyawan untuk kalkulasi 2% Qurban.
- **Manajemen Periode Keuangan & Tutup Buku**: Pengarsipan riwayat pembukuan tahun buku lampau dan peralihan saldo awal tanpa menghapus data historis.
- **Rekapitulasi & Ekspor Laporan Resmi**: Laporan neraca keuangan, rekapitulasi iuran per anggota, dan cetak laporan PDF (*DomPDF*).
- **Profil Admin**: Pengelolaan profil, email, dan kata sandi akun bendahara/pengurus.

---

## 📊 Matriks Tarif Iuran Bulanan

| Status Anggota | Kas Kelompok | Kas Desa | Qurban | Keputrian | Olahraga | Catatan Qurban |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **Pelajar** | Rp 5.000 | Rp 5.000 | Rp 17.000 | Rp 5.000 | Rp 5.000 | Tarif tetap |
| **Mahasiswa** | Rp 5.000 | **Rp 7.000** | Rp 30.000 | Rp 5.000 | Rp 5.000 | Tarif tetap |
| **Pencaker** | Rp 5.000 | Rp 5.000 | Rp 21.000 | Rp 5.000 | Rp 5.000 | Tarif tetap |
| **Pedagang** | Rp 5.000 | Rp 10.000 | *Bebas (Rp 0)* | Rp 5.000 | Rp 5.000 | Sukarela / Bebas |
| **Karyawan A** | Rp 5.000 | Rp 15.000 | *2% Gaji* | Rp 5.000 | Rp 5.000 | Otomatis 2% dari slip gaji |
| **Karyawan B** | Rp 5.000 | Rp 20.000 | *2% Gaji* | Rp 5.000 | Rp 5.000 | Otomatis 2% dari slip gaji |

*Catatan: Iuran Keputrian hanya dibebankan kepada anggota perempuan, dan Iuran Olahraga dibebankan kepada anggota laki-laki.*

---

## 🛠️ Teknologi & Stack

- **Backend**:
  - [PHP 8.3+](https://www.php.net/)
  - [Laravel 12](https://laravel.com/)
  - [Laravel Sanctum](https://laravel.com/docs/sanctum) (Autentikasi Token SPA)
  - [Barryvdh Laravel-DomPDF](https://github.com/barryvdh/laravel-dompdf) (Ekspor Laporan PDF)
  - Database: SQLite / MySQL
- **Frontend**:
  - [React 19](https://react.dev/)
  - [React Router DOM v7](https://reactrouter.com/)
  - [Vite 8](https://vitejs.dev/) & `@vitejs/plugin-react`
  - [Tailwind CSS v4](https://tailwindcss.com/)
  - [Lucide React](https://lucide.dev/) (Icons)
  - [Axios](https://axios-http.com/) (HTTP Client)
- **Testing**:
  - [PHPUnit 12](https://phpunit.de/)

---

## 🚀 Panduan Instalasi & Menjalankan

### 1. Prasyarat Sistem
Pastikan perangkat Anda telah terpasang:
- PHP >= 8.3 (dengan ekstensi `pdo`, `sqlite`/`mysql`, `bcmath`, `mbstring`, `gd`)
- Composer >= 2.x
- Node.js >= 20.x & NPM >= 10.x

### 2. Kloning Repositori & Instalasi Dependensi
```bash
# Clone repositori
git clone https://github.com/rihanaziz01/kas_mumi_ciherang.git
cd kas_mumi_ciherang

# Instal dependensi PHP
composer install

# Instal dependensi JavaScript/Frontend
npm install
```

### 3. Konfigurasi Lingkungan (.env)
Salin berkas konfigurasi lingkungan dan buat kunci enkripsi aplikasi:
```bash
cp .env.example .env
php artisan key:generate
```

Secara default, aplikasi menggunakan database **SQLite**. Pastikan file database tersedia atau sesuaikan koneksi database MySQL pada `.env` bila diperlukan:
```env
DB_CONNECTION=sqlite
```

### 4. Migrasi & Data Seeder
Jalankan migrasi database beserta data awal (admin pengurus, periode aktif 2026, matriks tarif, dan data anggota contoh):
```bash
php artisan migrate --seed
```

### 5. Kompilasi Aset Frontend
Untuk mode produksi:
```bash
npm run build
```

### 6. Menjalankan Server Pengembangan
Anda dapat menjalankan backend dan frontend secara bersamaan dengan perintah:
```bash
composer run dev
```
Atau di dua terminal terpisah:
```bash
# Terminal 1: Backend Server
php artisan serve

# Terminal 2: Vite Dev Server
npm run dev
```

Aplikasi dapat diakses melalui browser pada:
- **Halaman Publik**: `http://localhost:8000/`
- **Cek Iuran Mandiri**: `http://localhost:8000/cek-iuran`
- **Buku Kas Terbuka**: `http://localhost:8000/buku-kas`
- **Login Admin**: `http://localhost:8000/admin/login`

---

## 🧪 Pengujian & Kualitas Kode

Aplikasi ini dilengkapi pengujian fitur dan unit komprehensif menggunakan PHPUnit:

```bash
# Menjalankan seluruh test suite
php artisan test --compact

# Menjalankan test dengan filter spesifik
php artisan test --filter=test_pembayaran_qurban_parsial_dan_pelunasan
```

Untuk memformat kode PHP sesuai standar Laravel Pint:
```bash
vendor/bin/pint --format agent
```

---

## 📁 Struktur Direktori Proyek

```text
kasmm/
├── app/
│   ├── Http/Controllers/Api/   # Controller REST API (Auth, Kas, Pembayaran, Laporan, dll.)
│   └── Models/                 # Eloquent Models (Anggota, Pembayaran, PeriodeKeuangan, dll.)
├── database/
│   ├── migrations/             # Skema tabel database
│   └── seeders/                # Data seeder pengurus, tarif, dan anggota
├── resources/
│   ├── js/
│   │   ├── components/         # Komponen UI reusable (Modal, Card, Tabel, dll.)
│   │   ├── context/            # AuthContext & State management
│   │   ├── layouts/            # PublicLayout & AdminLayout
│   │   ├── pages/
│   │   │   ├── admin/          # Halaman Panel Admin (Dashboard, Pembayaran, Kas, dll.)
│   │   │   └── public/         # Halaman Terbuka (Home, CekIuran, BukuKas)
│   │   └── app.jsx             # Inisialisasi React & Routing
│   └── views/
│       └── app.blade.php       # Template shell Blade utama SPA
├── routes/
│   ├── api.php                 # Rute API publik & rute terproteksi auth:sanctum
│   └── web.php                 # SPA Catch-all router
└── tests/
    └── Feature/                # Feature & Integration Tests (ApiFeatureTest, dll.)
```

---

## 🤝 Kontribusi & Lisensi

Aplikasi ini dikembangkan dan dikelola khusus untuk transparansi keuangan **Pemuda/i Ciherang Fams (Muda-Mudi Ciherang)**. Dilisensikan di bawah [MIT License](LICENSE).
