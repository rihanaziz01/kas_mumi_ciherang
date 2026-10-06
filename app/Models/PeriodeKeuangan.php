<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PeriodeKeuangan extends Model
{
    use HasFactory;

    protected $table = 'periode_keuangan';

    protected $fillable = [
        'nama_periode',
        'tanggal_mulai',
        'tanggal_selesai',
        'saldo_awal',
        'saldo_akhir',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'tanggal_mulai' => 'date',
            'tanggal_selesai' => 'date',
            'saldo_awal' => 'float',
            'saldo_akhir' => 'float',
        ];
    }

    protected $appends = [
        'bulan_list',
        'bulan_detail',
    ];

    public const ALL_BULAN = [
        1 => 'Januari',
        2 => 'Februari',
        3 => 'Maret',
        4 => 'April',
        5 => 'Mei',
        6 => 'Juni',
        7 => 'Juli',
        8 => 'Agustus',
        9 => 'September',
        10 => 'Oktober',
        11 => 'November',
        12 => 'Desember',
    ];

    /**
     * Get 12 dynamic consecutive month names based on tanggal_mulai.
     * e.g. If tanggal_mulai is 2026-06-01:
     * returns ['Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember', 'Januari', 'Februari', 'Maret', 'April', 'Mei']
     *
     * @return array<string>
     */
    public function getBulanList(): array
    {
        $startMonth = $this->tanggal_mulai ? (int) $this->tanggal_mulai->format('n') : 1;
        $list = [];

        for ($i = 0; $i < 12; $i++) {
            $monthNum = (($startMonth - 1 + $i) % 12) + 1;
            $list[] = self::ALL_BULAN[$monthNum];
        }

        return $list;
    }

    /**
     * Get 12 dynamic consecutive months with full details (year, short name, label).
     *
     * @return array<array{index: int, nama: string, tahun: int, label: string, singkat: string, kode: string}>
     */
    public function getBulanDetail(): array
    {
        $startMonth = $this->tanggal_mulai ? (int) $this->tanggal_mulai->format('n') : 1;
        $startYear = $this->tanggal_mulai ? (int) $this->tanggal_mulai->format('Y') : (int) date('Y');
        $details = [];

        for ($i = 0; $i < 12; $i++) {
            $monthNum = (($startMonth - 1 + $i) % 12) + 1;
            $yearOffset = (int) floor(($startMonth - 1 + $i) / 12);
            $year = $startYear + $yearOffset;
            $monthName = self::ALL_BULAN[$monthNum];
            $kode = str_pad((string) $monthNum, 2, '0', STR_PAD_LEFT);
            $singkat = mb_substr($monthName, 0, 3);

            $details[] = [
                'index' => $i + 1,
                'nama' => $monthName,
                'tahun' => $year,
                'label' => $monthName.' '.$year,
                'singkat' => $singkat,
                'kode' => $kode,
            ];
        }

        return $details;
    }

    public function getBulanListAttribute(): array
    {
        return $this->getBulanList();
    }

    public function getBulanDetailAttribute(): array
    {
        return $this->getBulanDetail();
    }

    public function pembayaran(): HasMany
    {
        return $this->hasMany(Pembayaran::class, 'periode_id');
    }

    public function pemasukan(): HasMany
    {
        return $this->hasMany(Pemasukan::class, 'periode_id');
    }

    public function pengeluaran(): HasMany
    {
        return $this->hasMany(Pengeluaran::class, 'periode_id');
    }

    /**
     * Hitung rincian saldo dan pos kas untuk periode ini.
     * Saldo yang berhak dibawa ke periode baru: Kas Kelompok + Uang Olahraga & Keputrian.
     * Kas Desa (titipan) & Tabungan Qurban (dibelanjakan) tidak dibawa ke saldo awal periode baru.
     *
     * @return array{
     *     total_masuk: float,
     *     total_keluar: float,
     *     saldo_akhir_kalkulasi: float,
     *     saldo_kas_kelompok: float,
     *     saldo_olahraga: float,
     *     saldo_keputrian: float,
     *     saldo_desa: float,
     *     saldo_qurban: float,
     *     saldo_bisa_dibawa: float
     * }
     */
    public function calculateRincianSaldo(): array
    {
        $iuranKelompok = (float) Pembayaran::where('periode_id', $this->id)->where('jenis_iuran', 'Kelompok')->sum('nominal');
        $iuranDesa = (float) Pembayaran::where('periode_id', $this->id)->where('jenis_iuran', 'Desa')->sum('nominal');
        $iuranQurban = (float) Pembayaran::where('periode_id', $this->id)->where('jenis_iuran', 'Qurban')->sum('nominal');
        $iuranOlahraga = (float) Pembayaran::where('periode_id', $this->id)->where('jenis_iuran', 'Olahraga')->sum('nominal');
        $iuranKeputrian = (float) Pembayaran::where('periode_id', $this->id)->where('jenis_iuran', 'Keputrian')->sum('nominal');
        $totalIuran = $iuranKelompok + $iuranDesa + $iuranQurban + $iuranOlahraga + $iuranKeputrian;

        $allPemasukan = Pemasukan::where('periode_id', $this->id)->get();
        $allPengeluaran = Pengeluaran::where('periode_id', $this->id)->get();

        $totalPemasukanLain = (float) $allPemasukan->sum('nominal');
        $totalMasuk = $totalIuran + $totalPemasukanLain;
        $totalKeluar = (float) $allPengeluaran->sum('nominal');
        $saldoAwal = (float) $this->saldo_awal;
        $saldoAkhirKalkulasi = $saldoAwal + $totalMasuk - $totalKeluar;

        // Pos Keputrian
        $masukKeputrian = (float) $allPemasukan->whereIn('kategori', ['Uang Keputrian', 'Keputrian'])->sum('nominal') + $iuranKeputrian;
        $keluarKeputrian = (float) $allPengeluaran->whereIn('kategori', ['Uang Keputrian', 'Keputrian'])->sum('nominal');
        $saldoKeputrian = $masukKeputrian - $keluarKeputrian;

        // Pos Olahraga
        $masukOlahraga = (float) $allPemasukan->whereIn('kategori', ['Uang Olahraga', 'Olahraga'])->sum('nominal') + $iuranOlahraga;
        $keluarOlahraga = (float) $allPengeluaran->whereIn('kategori', ['Uang Olahraga', 'Olahraga'])->sum('nominal');
        $saldoOlahraga = $masukOlahraga - $keluarOlahraga;

        // Pos Kas Desa
        $keluarDesa = (float) $allPengeluaran->whereIn('kategori', ['Setor Kas Desa', 'Kas Desa'])->sum('nominal');
        $saldoDesa = max(0, $iuranDesa - $keluarDesa);

        // Pos Kas Kelompok (Umum)
        $pemasukanKelompok = (float) $allPemasukan->whereNotIn('kategori', ['Uang Keputrian', 'Keputrian', 'Uang Olahraga', 'Olahraga'])->sum('nominal');
        $keluarKelompok = (float) $allPengeluaran->whereNotIn('kategori', ['Uang Keputrian', 'Keputrian', 'Uang Olahraga', 'Olahraga', 'Setor Kas Desa', 'Kas Desa'])->sum('nominal');
        $saldoKasKelompok = $saldoAwal + $iuranKelompok + $pemasukanKelompok - $keluarKelompok;

        // Saldo yang berhak dibawa ke periode baru: Kas Kelompok + Olahraga & Keputrian
        $saldoBisaDibawa = $saldoKasKelompok + $saldoOlahraga + $saldoKeputrian;

        return [
            'total_masuk' => $totalMasuk,
            'total_keluar' => $totalKeluar,
            'saldo_akhir_kalkulasi' => $saldoAkhirKalkulasi,
            'saldo_kas_kelompok' => $saldoKasKelompok,
            'saldo_olahraga' => $saldoOlahraga,
            'saldo_keputrian' => $saldoKeputrian,
            'saldo_desa' => $saldoDesa,
            'keluar_desa' => $keluarDesa,
            'saldo_qurban' => $iuranQurban,
            'saldo_bisa_dibawa' => $saldoBisaDibawa,
        ];
    }
}
