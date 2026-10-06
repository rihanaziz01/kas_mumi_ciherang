<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Anggota;
use App\Models\Pemasukan;
use App\Models\Pembayaran;
use App\Models\PendapatanKaryawan;
use App\Models\Pengeluaran;
use App\Models\PeriodeKeuangan;
use App\Models\TarifIuran;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PublicController extends Controller
{
    /**
     * Ringkasan Keuangan Transparan (Dashboard Publik)
     */
    public function ringkasan(Request $request): JsonResponse
    {
        $periodeId = $request->query('periode_id');

        if ($periodeId) {
            $periode = PeriodeKeuangan::find($periodeId);
        } else {
            $periode = PeriodeKeuangan::where('status', 'aktif')->latest()->first();
        }

        if (! $periode) {
            $periode = PeriodeKeuangan::latest()->first();
        }

        if (! $periode) {
            return response()->json([
                'message' => 'Belum ada data periode keuangan.',
            ], 404);
        }

        // Kalkulasi Keuangan
        $totalIuran = (float) Pembayaran::where('periode_id', $periode->id)->sum('nominal');
        $iuranKelompok = (float) Pembayaran::where('periode_id', $periode->id)->where('jenis_iuran', 'Kelompok')->sum('nominal');
        $iuranDesa = (float) Pembayaran::where('periode_id', $periode->id)->where('jenis_iuran', 'Desa')->sum('nominal');
        $iuranQurban = (float) Pembayaran::where('periode_id', $periode->id)->where('jenis_iuran', 'Qurban')->sum('nominal');

        $allPemasukan = Pemasukan::where('periode_id', $periode->id)->get();
        $allPengeluaran = Pengeluaran::where('periode_id', $periode->id)->get();

        $totalPemasukanLain = (float) $allPemasukan->sum('nominal');
        $totalMasuk = $totalIuran + $totalPemasukanLain;
        $totalKeluar = (float) $allPengeluaran->sum('nominal');
        $saldoAwal = (float) $periode->saldo_awal;
        $saldoKasBersih = $saldoAwal + $totalMasuk - $totalKeluar;

        // Pemisahan Pos Kas (Uang Keputrian & Olahraga terpisah di luar Kas Kelompok)
        $masukKeputrian = (float) $allPemasukan->whereIn('kategori', ['Uang Keputrian', 'Keputrian'])->sum('nominal');
        $keluarKeputrian = (float) $allPengeluaran->whereIn('kategori', ['Uang Keputrian', 'Keputrian'])->sum('nominal');
        $saldoKeputrian = $masukKeputrian - $keluarKeputrian;

        $masukOlahraga = (float) $allPemasukan->whereIn('kategori', ['Uang Olahraga', 'Olahraga'])->sum('nominal');
        $keluarOlahraga = (float) $allPengeluaran->whereIn('kategori', ['Uang Olahraga', 'Olahraga'])->sum('nominal');
        $saldoOlahraga = $masukOlahraga - $keluarOlahraga;

        // Pos Kas Desa
        $keluarDesa = (float) $allPengeluaran->whereIn('kategori', ['Setor Kas Desa', 'Kas Desa'])->sum('nominal');
        $saldoDesa = max(0, $iuranDesa - $keluarDesa);

        $pemasukanLainKelompok = (float) $allPemasukan->whereNotIn('kategori', ['Uang Keputrian', 'Keputrian', 'Uang Olahraga', 'Olahraga'])->sum('nominal');
        $masukKelompok = $iuranKelompok + $pemasukanLainKelompok;
        $keluarKelompok = (float) $allPengeluaran->whereNotIn('kategori', ['Uang Keputrian', 'Keputrian', 'Uang Olahraga', 'Olahraga', 'Setor Kas Desa', 'Kas Desa'])->sum('nominal');
        $saldoKasKelompok = $saldoAwal + $masukKelompok - $keluarKelompok;

        $totalAnggota = Anggota::where('status_aktif', true)->count();

        return response()->json([
            'periode' => $periode,
            'saldo_awal' => $saldoAwal,
            'total_iuran' => $totalIuran,
            'total_pemasukan_lain' => $totalPemasukanLain,
            'total_masuk' => $totalMasuk,
            'total_keluar' => $totalKeluar,
            'saldo_bersih' => $saldoKasBersih,
            'total_anggota_aktif' => $totalAnggota,
            'total_kas_kelompok' => $saldoKasKelompok,
            'pemasukan_kas_kelompok' => $masukKelompok,
            'pengeluaran_kas_kelompok' => $keluarKelompok,
            'total_kas_desa' => $saldoDesa,
            'keluar_kas_desa' => $keluarDesa,
            'total_qurban' => $iuranQurban,
            'pos_kas' => [
                'kas_kelompok' => [
                    'nama' => 'Kas Kelompok',
                    'masuk' => $masukKelompok,
                    'keluar' => $keluarKelompok,
                    'saldo' => $saldoKasKelompok,
                ],
                'uang_keputrian' => [
                    'nama' => 'Uang Keputrian',
                    'masuk' => $masukKeputrian,
                    'keluar' => $keluarKeputrian,
                    'saldo' => $saldoKeputrian,
                ],
                'uang_olahraga' => [
                    'nama' => 'Uang Olahraga',
                    'masuk' => $masukOlahraga,
                    'keluar' => $keluarOlahraga,
                    'saldo' => $saldoOlahraga,
                ],
                'kas_desa' => [
                    'nama' => 'Kas Desa',
                    'masuk' => $iuranDesa,
                    'keluar' => $keluarDesa,
                    'saldo' => $saldoDesa,
                ],
                'kas_qurban' => [
                    'nama' => 'Tabungan Qurban',
                    'masuk' => $iuranQurban,
                    'saldo' => $iuranQurban,
                ],
            ],
        ]);
    }

    /**
     * Daftar Semua Periode untuk Selector Arsip
     */
    public function periodeList(): JsonResponse
    {
        $periodes = PeriodeKeuangan::orderByDesc('id')->get();

        return response()->json($periodes);
    }

    /**
     * Daftar Anggota Aktif untuk Dropdown & Live Search
     */
    public function anggotaList(): JsonResponse
    {
        $anggotas = Anggota::where('status_aktif', true)
            ->orderBy('nama')
            ->get(['id', 'nama', 'status', 'status_aktif']);

        return response()->json($anggotas);
    }

    /**
     * Fitur Terbuka: Cek Iuran Anggota (12 Bulan Kelompok, Desa, & Qurban)
     */
    public function cekIuran(int $anggotaId, Request $request): JsonResponse
    {
        $anggota = Anggota::findOrFail($anggotaId);

        $periodeId = $request->query('periode_id');
        if ($periodeId) {
            $periode = PeriodeKeuangan::find($periodeId);
        } else {
            $periode = PeriodeKeuangan::where('status', 'aktif')->latest()->first()
                ?? PeriodeKeuangan::latest()->first();
        }

        if (! $periode) {
            return response()->json(['message' => 'Periode keuangan tidak ditemukan.'], 404);
        }

        $bulanDetail = $periode->getBulanDetail();
        $bulanList = $periode->getBulanList();

        // Ambil semua pembayaran anggota pada periode ini
        $pembayarans = Pembayaran::where('anggota_id', $anggota->id)
            ->where('periode_id', $periode->id)
            ->get();

        // Ambil tarif iuran anggota
        $tarifs = TarifIuran::where('status_anggota', $anggota->status)
            ->pluck('nominal', 'jenis_iuran');

        $tarifKelompok = (float) ($tarifs['Kelompok'] ?? 5000);
        $tarifDesa = (float) ($tarifs['Desa'] ?? 5000);
        $tarifQurban = (float) ($tarifs['Qurban'] ?? 0);

        // 1. Grid Kas Kelompok (12 Bulan)
        $gridKelompok = [];
        $totalKelompokLunas = 0;
        foreach ($bulanDetail as $b) {
            $bulan = $b['nama'];
            $bayar = $pembayarans->first(function ($p) use ($bulan) {
                return $p->jenis_iuran === 'Kelompok' && $p->periode_bayar === $bulan;
            });

            $nominalDibayar = $bayar ? (float) $bayar->nominal : 0;
            $isLunas = ! is_null($bayar) && ($tarifKelompok <= 0 || $nominalDibayar >= $tarifKelompok);
            if ($isLunas) {
                $totalKelompokLunas++;
            }

            $gridKelompok[] = [
                'bulan' => $bulan,
                'tahun' => $b['tahun'],
                'label' => $b['label'],
                'singkat' => $b['singkat'],
                'lunas' => $isLunas,
                'nominal' => $nominalDibayar > 0 ? $nominalDibayar : $tarifKelompok,
                'nominal_dibayar' => $nominalDibayar,
                'kurang' => max(0, $tarifKelompok - $nominalDibayar),
                'tanggal_bayar' => $bayar?->tanggal_bayar?->format('Y-m-d'),
            ];
        }

        // 2. Grid Kas Desa (12 Bulan)
        $gridDesa = [];
        $totalDesaLunas = 0;
        foreach ($bulanDetail as $b) {
            $bulan = $b['nama'];
            $bayar = $pembayarans->first(function ($p) use ($bulan) {
                return $p->jenis_iuran === 'Desa' && $p->periode_bayar === $bulan;
            });

            $nominalDibayar = $bayar ? (float) $bayar->nominal : 0;
            $isLunas = ! is_null($bayar) && ($tarifDesa <= 0 || $nominalDibayar >= $tarifDesa);
            if ($isLunas) {
                $totalDesaLunas++;
            }

            $gridDesa[] = [
                'bulan' => $bulan,
                'tahun' => $b['tahun'],
                'label' => $b['label'],
                'singkat' => $b['singkat'],
                'lunas' => $isLunas,
                'nominal' => $nominalDibayar > 0 ? $nominalDibayar : $tarifDesa,
                'nominal_dibayar' => $nominalDibayar,
                'kurang' => max(0, $tarifDesa - $nominalDibayar),
                'tanggal_bayar' => $bayar?->tanggal_bayar?->format('Y-m-d'),
            ];
        }

        // 3. Status Qurban
        // Cek apakah Pedagang (Bebas)
        $qurbanData = [
            'tipe' => 'statis', // 'bebas', 'statis', 'dinamis_karyawan'
            'lunas' => false,
            'keterangan' => '',
            'nominal' => $tarifQurban,
            'bulan_breakdown' => [],
        ];

        if ($anggota->status === 'Pedagang') {
            $qurbanData['tipe'] = 'bebas';
            $qurbanData['keterangan'] = 'Bebas Iuran Qurban (Pedagang)';
            $qurbanData['lunas'] = true;
        } elseif (in_array($anggota->status, ['Karyawan A', 'Karyawan B'])) {
            // Dinamis Karyawan: 2% per bulan dari pendapatan tercatat
            $qurbanData['tipe'] = 'dinamis_karyawan';
            $isAdmin = auth('sanctum')->check();

            $years = array_unique(array_column($bulanDetail, 'tahun'));
            $pendapatans = PendapatanKaryawan::where('anggota_id', $anggota->id)
                ->whereIn('tahun', $years)
                ->get();

            $breakdown = [];
            $gridQurban = [];
            $totalQurbanLunas = 0;
            $allLunas = true;
            $hasIncome = false;

            foreach ($bulanDetail as $b) {
                $bulan = $b['nama'];
                $tahunBulan = $b['tahun'];
                $pendapatanRecord = $pendapatans->first(fn ($p) => $p->bulan === $bulan && (int) $p->tahun === $tahunBulan);

                $bayar = $pembayarans->first(function ($p) use ($bulan, $tahunBulan) {
                    return $p->jenis_iuran === 'Qurban' &&
                        ($p->periode_bayar === $bulan || $p->periode_bayar === (string) $tahunBulan || $p->periode_bayar === 'Tahunan');
                });

                $nominalKewajiban = $pendapatanRecord ? (float) $pendapatanRecord->nominal_qurban : (float) $tarifQurban;
                $nominalDibayar = $bayar ? (float) $bayar->nominal : 0;
                $isLunas = ! is_null($bayar) && ($nominalKewajiban <= 0 || $nominalDibayar >= $nominalKewajiban);
                if ($isLunas) {
                    $totalQurbanLunas++;
                }

                $kurang = max(0, $nominalKewajiban - $nominalDibayar);

                if ($pendapatanRecord) {
                    $hasIncome = true;
                    if (! $isLunas) {
                        $allLunas = false;
                    }

                    $breakdown[] = [
                        'bulan' => $bulan,
                        'tahun' => $tahunBulan,
                        'label' => $b['label'],
                        'pendapatan' => $isAdmin ? (float) $pendapatanRecord->pendapatan : null,
                        'kewajiban_2persen' => $isAdmin ? $nominalKewajiban : null,
                        'lunas' => $isLunas,
                        'nominal_dibayar' => $bayar ? ($isAdmin ? (float) $bayar->nominal : null) : 0,
                        'kurang' => $isAdmin ? $kurang : null,
                        'tanggal_bayar' => $bayar?->tanggal_bayar?->format('Y-m-d'),
                        'ada_data' => true,
                        'disensor' => ! $isAdmin,
                    ];
                } else {
                    // Belum ada data pendapatan untuk bulan ini
                    $breakdown[] = [
                        'bulan' => $bulan,
                        'tahun' => $tahunBulan,
                        'label' => $b['label'],
                        'pendapatan' => null,
                        'kewajiban_2persen' => null,
                        'lunas' => $isLunas,
                        'nominal_dibayar' => $bayar ? ($isAdmin ? (float) $bayar->nominal : null) : 0,
                        'kurang' => $isAdmin ? $kurang : null,
                        'tanggal_bayar' => $bayar?->tanggal_bayar?->format('Y-m-d'),
                        'ada_data' => false,
                        'disensor' => ! $isAdmin,
                    ];
                }

                $gridQurban[] = [
                    'bulan' => $bulan,
                    'tahun' => $tahunBulan,
                    'label' => $b['label'],
                    'singkat' => $b['singkat'],
                    'lunas' => $isLunas,
                    'nominal' => $nominalDibayar > 0 ? $nominalDibayar : $nominalKewajiban,
                    'nominal_dibayar' => $nominalDibayar,
                    'kurang' => $kurang,
                    'tanggal_bayar' => $bayar?->tanggal_bayar?->format('Y-m-d'),
                ];
            }

            $qurbanData['bulan_breakdown'] = $breakdown;
            $qurbanData['grid'] = $gridQurban;
            $qurbanData['total_lunas'] = $totalQurbanLunas;
            $qurbanData['tarif_bulanan'] = $tarifQurban;
            $qurbanData['nominal'] = $tarifQurban;
            $qurbanData['lunas'] = $totalQurbanLunas === 12;
            $qurbanData['disensor'] = ! $isAdmin;
            $qurbanData['is_admin_viewer'] = $isAdmin;
            $qurbanData['keterangan'] = $tarifQurban > 0
                ? 'Tarif Bulanan: Rp '.number_format($tarifQurban, 0, ',', '.').' / bulan'
                : 'Iuran Qurban Paguyuban';
        } else {
            // Pelajar, Mahasiswa, Pencaker (Tarif bulanan tetap)
            $gridQurban = [];
            $totalQurbanLunas = 0;
            foreach ($bulanDetail as $b) {
                $bulan = $b['nama'];
                $tahunBulan = $b['tahun'];
                $bayar = $pembayarans->first(function ($p) use ($bulan, $tahunBulan) {
                    return $p->jenis_iuran === 'Qurban' &&
                        ($p->periode_bayar === $bulan || $p->periode_bayar === (string) $tahunBulan || $p->periode_bayar === 'Tahunan');
                });

                $nominalDibayar = $bayar ? (float) $bayar->nominal : 0;
                $isLunas = ! is_null($bayar) && ($tarifQurban <= 0 || $nominalDibayar >= $tarifQurban);
                if ($isLunas) {
                    $totalQurbanLunas++;
                }

                $kurang = max(0, $tarifQurban - $nominalDibayar);

                $gridQurban[] = [
                    'bulan' => $bulan,
                    'tahun' => $tahunBulan,
                    'label' => $b['label'],
                    'singkat' => $b['singkat'],
                    'lunas' => $isLunas,
                    'nominal' => $nominalDibayar > 0 ? $nominalDibayar : $tarifQurban,
                    'nominal_dibayar' => $nominalDibayar,
                    'kurang' => $kurang,
                    'tanggal_bayar' => $bayar?->tanggal_bayar?->format('Y-m-d'),
                ];
            }

            $qurbanData['tipe'] = 'statis';
            $qurbanData['tarif_bulanan'] = $tarifQurban;
            $qurbanData['nominal'] = $tarifQurban;
            $qurbanData['grid'] = $gridQurban;
            $qurbanData['total_lunas'] = $totalQurbanLunas;
            $qurbanData['lunas'] = $totalQurbanLunas === 12;
            $qurbanData['keterangan'] = 'Tarif Bulanan: Rp '.number_format($tarifQurban, 0, ',', '.').' / bulan';
        }

        return response()->json([
            'anggota' => $anggota,
            'periode' => $periode,
            'kas_kelompok' => [
                'grid' => $gridKelompok,
                'total_lunas' => $totalKelompokLunas,
                'tarif_bulanan' => $tarifKelompok,
            ],
            'kas_desa' => [
                'grid' => $gridDesa,
                'total_lunas' => $totalDesaLunas,
                'tarif_bulanan' => $tarifDesa,
            ],
            'qurban' => $qurbanData,
        ]);
    }

    /**
     * Feed Buku Kas Terbuka (Publik)
     */
    public function bukuKas(Request $request): JsonResponse
    {
        $periodeId = $request->query('periode_id');
        if (! $periodeId) {
            $periode = PeriodeKeuangan::where('status', 'aktif')->latest()->first()
                ?? PeriodeKeuangan::latest()->first();
            $periodeId = $periode?->id;
        }

        if (! $periodeId) {
            return response()->json(['data' => []]);
        }

        $isAdmin = auth('sanctum')->check();

        $bulanMap = [
            1 => 'Januari', 2 => 'Februari', 3 => 'Maret', 4 => 'April',
            5 => 'Mei', 6 => 'Juni', 7 => 'Juli', 8 => 'Agustus',
            9 => 'September', 10 => 'Oktober', 11 => 'November', 12 => 'Desember',
        ];

        // Ambil semua transaksi masuk dan keluar
        $pembayarans = Pembayaran::with('anggota')
            ->where('periode_id', $periodeId)
            ->get()
            ->map(function ($p) use ($isAdmin, $bulanMap) {
                $isQurbanKaryawan = $p->jenis_iuran === 'Qurban'
                    && $p->anggota
                    && str_contains(strtolower($p->anggota->status), 'karyawan');

                return [
                    'id' => 'pembayaran_'.$p->id,
                    'tipe' => 'masuk',
                    'kategori' => 'Iuran '.$p->jenis_iuran,
                    'nominal' => (float) $p->nominal,
                    'tanggal' => $p->tanggal_bayar->format('Y-m-d'),
                    'bulan' => $p->periode_bayar ?: ($bulanMap[(int) $p->tanggal_bayar->format('n')] ?? null),
                    'deskripsi' => 'Pembayaran Kas '.$p->jenis_iuran.' ('.$p->periode_bayar.') oleh '.$p->anggota?->nama,
                    'catatan' => $p->catatan,
                    'is_qurban_karyawan' => $isQurbanKaryawan,
                    'disensor' => $isQurbanKaryawan && ! $isAdmin,
                ];
            });

        $pemasukans = Pemasukan::where('periode_id', $periodeId)
            ->get()
            ->map(function ($p) use ($bulanMap) {
                return [
                    'id' => 'pemasukan_'.$p->id,
                    'tipe' => 'masuk',
                    'kategori' => $p->kategori,
                    'nominal' => (float) $p->nominal,
                    'tanggal' => $p->tanggal->format('Y-m-d'),
                    'bulan' => $bulanMap[(int) $p->tanggal->format('n')] ?? null,
                    'deskripsi' => $p->keterangan ?: 'Pemasukan Lain - '.$p->kategori,
                    'catatan' => null,
                    'is_qurban_karyawan' => false,
                    'disensor' => false,
                ];
            });

        $pengeluarans = Pengeluaran::where('periode_id', $periodeId)
            ->get()
            ->map(function ($p) use ($bulanMap) {
                return [
                    'id' => 'pengeluaran_'.$p->id,
                    'tipe' => 'keluar',
                    'kategori' => $p->kategori,
                    'nominal' => (float) $p->nominal,
                    'tanggal' => $p->tanggal->format('Y-m-d'),
                    'bulan' => $bulanMap[(int) $p->tanggal->format('n')] ?? null,
                    'deskripsi' => $p->keterangan ?: 'Pengeluaran - '.$p->kategori,
                    'catatan' => null,
                    'is_qurban_karyawan' => false,
                    'disensor' => false,
                ];
            });

        $allFeed = $pembayarans->concat($pemasukans)->concat($pengeluarans)
            ->sortByDesc('tanggal')
            ->values();

        // Optional category filter
        if ($request->filled('kategori')) {
            $kat = strtolower($request->query('kategori'));
            $allFeed = $allFeed->filter(function ($item) use ($kat) {
                return str_contains(strtolower($item['kategori']), $kat)
                    || str_contains(strtolower($item['tipe']), $kat);
            })->values();
        }

        return response()->json([
            'periode_id' => $periodeId,
            'total_transaksi' => $allFeed->count(),
            'transaksi' => $allFeed,
        ]);
    }
}
