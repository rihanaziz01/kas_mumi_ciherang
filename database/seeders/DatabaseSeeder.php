<?php

namespace Database\Seeders;

use App\Models\Anggota;
use App\Models\Pemasukan;
use App\Models\Pembayaran;
use App\Models\PendapatanKaryawan;
use App\Models\Pengeluaran;
use App\Models\PeriodeKeuangan;
use App\Models\TarifIuran;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Akun Admin Pengurus (Rihan & Azza)
        User::updateOrCreate(
            ['email' => 'rihan@ciherang.com'],
            [
                'name' => 'Rihan',
                'password' => Hash::make('rihan123'),
            ]
        );

        User::updateOrCreate(
            ['email' => 'azza@ciherang.com'],
            [
                'name' => 'Azza',
                'password' => Hash::make('azza123'),
            ]
        );

        // 2. Periode Keuangan Aktif 2026
        $periode2026 = PeriodeKeuangan::firstOrCreate(
            ['nama_periode' => 'Periode 2026'],
            [
                'tanggal_mulai' => '2026-01-01',
                'tanggal_selesai' => null,
                'saldo_awal' => 500000.00,
                'saldo_akhir' => 500000.00,
                'status' => 'aktif',
            ]
        );

        // 3. Matriks Tarif Iuran sesuai PRD
        $tarifData = [
            // Pelajar
            ['status_anggota' => 'Pelajar', 'jenis_iuran' => 'Kelompok', 'nominal' => 5000],
            ['status_anggota' => 'Pelajar', 'jenis_iuran' => 'Desa', 'nominal' => 5000],
            ['status_anggota' => 'Pelajar', 'jenis_iuran' => 'Qurban', 'nominal' => 17000],
            ['status_anggota' => 'Pelajar', 'jenis_iuran' => 'Keputrian', 'nominal' => 5000],
            ['status_anggota' => 'Pelajar', 'jenis_iuran' => 'Olahraga', 'nominal' => 5000],
            // Mahasiswa
            ['status_anggota' => 'Mahasiswa', 'jenis_iuran' => 'Kelompok', 'nominal' => 5000],
            ['status_anggota' => 'Mahasiswa', 'jenis_iuran' => 'Desa', 'nominal' => 7000],
            ['status_anggota' => 'Mahasiswa', 'jenis_iuran' => 'Qurban', 'nominal' => 30000],
            ['status_anggota' => 'Mahasiswa', 'jenis_iuran' => 'Keputrian', 'nominal' => 5000],
            ['status_anggota' => 'Mahasiswa', 'jenis_iuran' => 'Olahraga', 'nominal' => 5000],
            // Pencaker
            ['status_anggota' => 'Pencaker', 'jenis_iuran' => 'Kelompok', 'nominal' => 5000],
            ['status_anggota' => 'Pencaker', 'jenis_iuran' => 'Desa', 'nominal' => 5000],
            ['status_anggota' => 'Pencaker', 'jenis_iuran' => 'Qurban', 'nominal' => 21000],
            ['status_anggota' => 'Pencaker', 'jenis_iuran' => 'Keputrian', 'nominal' => 5000],
            ['status_anggota' => 'Pencaker', 'jenis_iuran' => 'Olahraga', 'nominal' => 5000],
            // Pedagang (Bebas Qurban)
            ['status_anggota' => 'Pedagang', 'jenis_iuran' => 'Kelompok', 'nominal' => 5000],
            ['status_anggota' => 'Pedagang', 'jenis_iuran' => 'Desa', 'nominal' => 10000],
            ['status_anggota' => 'Pedagang', 'jenis_iuran' => 'Qurban', 'nominal' => 0],
            ['status_anggota' => 'Pedagang', 'jenis_iuran' => 'Keputrian', 'nominal' => 5000],
            ['status_anggota' => 'Pedagang', 'jenis_iuran' => 'Olahraga', 'nominal' => 5000],
            // Karyawan A (Qurban 2% dinamis bulanan)
            ['status_anggota' => 'Karyawan A', 'jenis_iuran' => 'Kelompok', 'nominal' => 5000],
            ['status_anggota' => 'Karyawan A', 'jenis_iuran' => 'Desa', 'nominal' => 15000],
            ['status_anggota' => 'Karyawan A', 'jenis_iuran' => 'Qurban', 'nominal' => 0],
            ['status_anggota' => 'Karyawan A', 'jenis_iuran' => 'Keputrian', 'nominal' => 5000],
            ['status_anggota' => 'Karyawan A', 'jenis_iuran' => 'Olahraga', 'nominal' => 5000],
            // Karyawan B (Qurban 2% dinamis bulanan)
            ['status_anggota' => 'Karyawan B', 'jenis_iuran' => 'Kelompok', 'nominal' => 5000],
            ['status_anggota' => 'Karyawan B', 'jenis_iuran' => 'Desa', 'nominal' => 20000],
            ['status_anggota' => 'Karyawan B', 'jenis_iuran' => 'Qurban', 'nominal' => 0],
            ['status_anggota' => 'Karyawan B', 'jenis_iuran' => 'Keputrian', 'nominal' => 5000],
            ['status_anggota' => 'Karyawan B', 'jenis_iuran' => 'Olahraga', 'nominal' => 5000],
        ];

        foreach ($tarifData as $t) {
            TarifIuran::updateOrCreate(
                [
                    'status_anggota' => $t['status_anggota'],
                    'jenis_iuran' => $t['jenis_iuran'],
                ],
                ['nominal' => $t['nominal']]
            );
        }

        // 4. Reset & Data Master Anggota Baru Sesuai Permintaan
        Schema::disableForeignKeyConstraints();
        Pembayaran::truncate();
        PendapatanKaryawan::truncate();
        Anggota::truncate();
        Schema::enableForeignKeyConstraints();

        $anggotaList = [
            // Karyawan A (9 orang)
            ['nama' => 'Bagus', 'status' => 'Karyawan A', 'status_aktif' => true],
            ['nama' => 'Beni', 'status' => 'Karyawan A', 'status_aktif' => true],
            ['nama' => 'Daus', 'status' => 'Karyawan A', 'status_aktif' => true],
            ['nama' => 'Fiqi', 'status' => 'Karyawan A', 'status_aktif' => true],
            ['nama' => 'Liani', 'status' => 'Karyawan A', 'status_aktif' => true],
            ['nama' => 'Nahda', 'status' => 'Karyawan A', 'status_aktif' => true],
            ['nama' => 'Raja', 'status' => 'Karyawan A', 'status_aktif' => true],
            ['nama' => 'Sonja', 'status' => 'Karyawan A', 'status_aktif' => true],
            ['nama' => 'Yogi', 'status' => 'Karyawan A', 'status_aktif' => true],

            // Karyawan B (3 orang)
            ['nama' => 'Azi', 'status' => 'Karyawan B', 'status_aktif' => true],
            ['nama' => 'Fitri', 'status' => 'Karyawan B', 'status_aktif' => true],
            ['nama' => 'Soni', 'status' => 'Karyawan B', 'status_aktif' => true],

            // Mahasiswa (6 orang)
            ['nama' => 'Avwa', 'status' => 'Mahasiswa', 'status_aktif' => true],
            ['nama' => 'Dafi', 'status' => 'Mahasiswa', 'status_aktif' => true],
            ['nama' => 'Dini', 'status' => 'Mahasiswa', 'status_aktif' => true],
            ['nama' => 'Filza', 'status' => 'Mahasiswa', 'status_aktif' => true],
            ['nama' => 'Ningsih', 'status' => 'Mahasiswa', 'status_aktif' => true],
            ['nama' => 'Rihan', 'status' => 'Mahasiswa', 'status_aktif' => true],

            // Pelajar (4 orang)
            ['nama' => 'Ardina', 'status' => 'Pelajar', 'status_aktif' => true],
            ['nama' => 'Isti', 'status' => 'Pelajar', 'status_aktif' => true],
            ['nama' => 'Rangga', 'status' => 'Pelajar', 'status_aktif' => true],
            ['nama' => 'Sabela', 'status' => 'Pelajar', 'status_aktif' => true],

            // Pencaker (15 orang)
            ['nama' => 'Ajeng', 'status' => 'Pencaker', 'status_aktif' => true],
            ['nama' => 'Arju', 'status' => 'Pencaker', 'status_aktif' => true],
            ['nama' => 'Ashiila', 'status' => 'Pencaker', 'status_aktif' => true],
            ['nama' => 'Aulia', 'status' => 'Pencaker', 'status_aktif' => true],
            ['nama' => 'Azza', 'status' => 'Pencaker', 'status_aktif' => true],
            ['nama' => 'Cantika', 'status' => 'Pencaker', 'status_aktif' => true],
            ['nama' => 'Izal', 'status' => 'Pencaker', 'status_aktif' => true],
            ['nama' => 'Levi', 'status' => 'Pencaker', 'status_aktif' => true],
            ['nama' => 'Mayang', 'status' => 'Pencaker', 'status_aktif' => true],
            ['nama' => 'Nafiat', 'status' => 'Pencaker', 'status_aktif' => true],
            ['nama' => 'Rahayu', 'status' => 'Pencaker', 'status_aktif' => true],
            ['nama' => 'Roikhan', 'status' => 'Pencaker', 'status_aktif' => true],
            ['nama' => 'Widya', 'status' => 'Pencaker', 'status_aktif' => true],
            ['nama' => 'Wiliam', 'status' => 'Pencaker', 'status_aktif' => true],
            ['nama' => 'Zacky', 'status' => 'Pencaker', 'status_aktif' => true],
        ];

        usort($anggotaList, fn ($a, $b) => strcmp($a['nama'], $b['nama']));

        $createdAnggota = [];
        foreach ($anggotaList as $a) {
            $createdAnggota[$a['nama']] = Anggota::create([
                'nama' => $a['nama'],
                'status' => $a['status'],
                'status_aktif' => $a['status_aktif'],
            ]);
        }

        // 5. Pendapatan Karyawan Contoh (Bagus - Karyawan A)
        $bagus = $createdAnggota['Bagus'];
        PendapatanKaryawan::create([
            'anggota_id' => $bagus->id,
            'bulan' => 'Januari',
            'tahun' => 2026,
            'pendapatan' => 4000000.00, // Qurban 2% = 80.000
        ]);
        PendapatanKaryawan::create([
            'anggota_id' => $bagus->id,
            'bulan' => 'Februari',
            'tahun' => 2026,
            'pendapatan' => 4200000.00, // Qurban 2% = 84.000
        ]);
        PendapatanKaryawan::create([
            'anggota_id' => $bagus->id,
            'bulan' => 'Maret',
            'tahun' => 2026,
            'pendapatan' => 4500000.00, // Qurban 2% = 90.000
        ]);

        // Azi (Karyawan B)
        $azi = $createdAnggota['Azi'];
        PendapatanKaryawan::create([
            'anggota_id' => $azi->id,
            'bulan' => 'Januari',
            'tahun' => 2026,
            'pendapatan' => 6000000.00, // Qurban 2% = 120.000
        ]);

        // 6. Data Pembayaran Contoh (Simulasi Riil)
        $bulanNames = [
            'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
            'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
        ];

        // Rihan bayar Kas Kelompok 12 Bulan Sekaligus (Jan - Des)
        $rihan = $createdAnggota['Rihan'];
        foreach ($bulanNames as $b) {
            Pembayaran::create([
                'anggota_id' => $rihan->id,
                'periode_id' => $periode2026->id,
                'jenis_iuran' => 'Kelompok',
                'periode_bayar' => $b,
                'nominal' => 5000,
                'tanggal_bayar' => '2026-01-15',
                'catatan' => 'Lunas 12 bulan sekaligus',
            ]);
        }

        // Rihan bayar Kas Desa Jan & Feb
        foreach (['Januari', 'Februari'] as $b) {
            Pembayaran::create([
                'anggota_id' => $rihan->id,
                'periode_id' => $periode2026->id,
                'jenis_iuran' => 'Desa',
                'periode_bayar' => $b,
                'nominal' => 5000,
                'tanggal_bayar' => '2026-01-15',
                'catatan' => null,
            ]);
        }

        // Rihan bayar Qurban Januari
        Pembayaran::create([
            'anggota_id' => $rihan->id,
            'periode_id' => $periode2026->id,
            'jenis_iuran' => 'Qurban',
            'periode_bayar' => 'Januari',
            'nominal' => 30000,
            'tanggal_bayar' => '2026-01-15',
            'catatan' => 'Qurban Januari Mahasiswa',
        ]);

        // Bagus (Karyawan A): bayar Kelompok Jan-Mar, Desa Jan-Mar, Qurban Januari (80.000)
        foreach (['Januari', 'Februari', 'Maret'] as $b) {
            Pembayaran::create([
                'anggota_id' => $bagus->id,
                'periode_id' => $periode2026->id,
                'jenis_iuran' => 'Kelompok',
                'periode_bayar' => $b,
                'nominal' => 5000,
                'tanggal_bayar' => '2026-01-20',
                'catatan' => null,
            ]);
            Pembayaran::create([
                'anggota_id' => $bagus->id,
                'periode_id' => $periode2026->id,
                'jenis_iuran' => 'Desa',
                'periode_bayar' => $b,
                'nominal' => 15000,
                'tanggal_bayar' => '2026-01-20',
                'catatan' => null,
            ]);
        }
        Pembayaran::create([
            'anggota_id' => $bagus->id,
            'periode_id' => $periode2026->id,
            'jenis_iuran' => 'Qurban',
            'periode_bayar' => 'Januari',
            'nominal' => 80000,
            'tanggal_bayar' => '2026-01-20',
            'catatan' => 'Qurban Karyawan 2% Gaji Jan (Rp 4.000.000)',
        ]);

        // 7. Pemasukan Kas Operasional Khusus (Uang Keputrian & Uang Olahraga)
        Pemasukan::firstOrCreate(
            [
                'periode_id' => $periode2026->id,
                'kategori' => 'Uang Keputrian',
                'nominal' => 250000.00,
                'tanggal' => '2026-01-10',
            ],
            ['keterangan' => 'Kas Keputrian kegiatan muslimah']
        );
        Pemasukan::firstOrCreate(
            [
                'periode_id' => $periode2026->id,
                'kategori' => 'Uang Olahraga',
                'nominal' => 200000.00,
                'tanggal' => '2026-02-05',
            ],
            ['keterangan' => 'Kas Olahraga rutinan pemuda']
        );

        // 8. Pengeluaran Operasional
        Pengeluaran::firstOrCreate(
            [
                'periode_id' => $periode2026->id,
                'kategori' => 'Konsumsi',
                'nominal' => 150000.00,
                'tanggal' => '2026-01-12',
            ],
            ['keterangan' => 'Konsumsi Rapat Kerja Tahunan Pemuda']
        );
        Pengeluaran::firstOrCreate(
            [
                'periode_id' => $periode2026->id,
                'kategori' => 'Alat/Perlengkapan',
                'nominal' => 85000.00,
                'tanggal' => '2026-01-25',
            ],
            ['keterangan' => 'Cetak banner dan ATK pembukuan']
        );
    }
}
