<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Anggota;
use App\Models\Pemasukan;
use App\Models\Pembayaran;
use App\Models\Pengeluaran;
use App\Models\PeriodeKeuangan;
use App\Models\TarifIuran;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StatistikController extends Controller
{
    /**
     * Dapatkan Statistik & Analitik Keuangan Komprehensif
     */
    public function index(Request $request): JsonResponse
    {
        $periodeId = $request->query('periode_id');
        $periode = $periodeId
            ? PeriodeKeuangan::find($periodeId)
            : PeriodeKeuangan::where('status', 'aktif')->latest()->first() ?? PeriodeKeuangan::latest()->first();

        if (! $periode) {
            return response()->json([
                'message' => 'Periode keuangan tidak ditemukan.',
            ], 404);
        }

        $periodes = PeriodeKeuangan::select('id', 'nama_periode', 'status')
            ->orderByDesc('id')
            ->get();

        $anggotas = Anggota::where('status_aktif', true)->orderBy('nama')->get();
        $totalAnggota = $anggotas->count();

        // 1. Matriks Tarif untuk estimasi target
        $tarifs = TarifIuran::all();

        // 2. Transaksi dalam periode
        $pembayarans = Pembayaran::where('periode_id', $periode->id)->get();
        $pemasukans = Pemasukan::where('periode_id', $periode->id)->get();
        $pengeluarans = Pengeluaran::where('periode_id', $periode->id)->get();

        // 3. Ringkasan Total
        $totalIuran = (float) $pembayarans->sum('nominal');
        $totalIuranKelompok = (float) $pembayarans->where('jenis_iuran', 'Kelompok')->sum('nominal');
        $totalIuranDesa = (float) $pembayarans->where('jenis_iuran', 'Desa')->sum('nominal');
        $totalIuranQurban = (float) $pembayarans->where('jenis_iuran', 'Qurban')->sum('nominal');

        $totalPemasukanKas = (float) $pemasukans->sum('nominal');
        $totalPengeluaranKas = (float) $pengeluarans->sum('nominal');
        $saldoAwal = (float) $periode->saldo_awal;
        $totalKasMasuk = $totalIuran + $totalPemasukanKas;
        $saldoBersih = $saldoAwal + $totalKasMasuk - $totalPengeluaranKas;

        // 4. Kepatuhan & Slot Pembayaran (12 bulan x total anggota)
        $totalExpectedSlots = $totalAnggota * 12;
        $paidSlotsKelompok = $pembayarans->where('jenis_iuran', 'Kelompok')->count();
        $paidSlotsDesa = $pembayarans->where('jenis_iuran', 'Desa')->count();
        $paidSlotsQurban = $pembayarans->where('jenis_iuran', 'Qurban')->count();

        $kepatuhanKelompok = $totalExpectedSlots > 0
            ? round(($paidSlotsKelompok / $totalExpectedSlots) * 100, 1)
            : 0;
        $kepatuhanDesa = $totalExpectedSlots > 0
            ? round(($paidSlotsDesa / $totalExpectedSlots) * 100, 1)
            : 0;

        $overallCompliance = ($totalExpectedSlots * 2) > 0
            ? round((($paidSlotsKelompok + $paidSlotsDesa) / ($totalExpectedSlots * 2)) * 100, 1)
            : 0;

        // Target Proyeksi Tahunan
        $targetKelompokTahunan = 0;
        $targetDesaTahunan = 0;
        foreach ($anggotas as $agt) {
            $tarifK = $tarifs->first(fn ($t) => $t->status_anggota === $agt->status && $t->jenis_iuran === 'Kelompok');
            $tarifD = $tarifs->first(fn ($t) => $t->status_anggota === $agt->status && $t->jenis_iuran === 'Desa');
            $nomK = $tarifK ? (float) $tarifK->nominal : 5000;
            $nomD = $tarifD ? (float) $tarifD->nominal : 5000;
            $targetKelompokTahunan += ($nomK * 12);
            $targetDesaTahunan += ($nomD * 12);
        }

        // 5. Tren Bulanan (12 Bulan Siklus Periode)
        $bulanList = $periode->getBulanDetail();

        $trenBulanan = [];
        foreach ($bulanList as $b) {
            $kelBulan = (float) $pembayarans
                ->where('jenis_iuran', 'Kelompok')
                ->where('periode_bayar', $b['nama'])
                ->sum('nominal');

            $desBulan = (float) $pembayarans
                ->where('jenis_iuran', 'Desa')
                ->where('periode_bayar', $b['nama'])
                ->sum('nominal');

            $qurBulan = (float) $pembayarans
                ->where('jenis_iuran', 'Qurban')
                ->where('periode_bayar', $b['nama'])
                ->sum('nominal');

            $totalIuranBulan = $kelBulan + $desBulan + $qurBulan;

            // Pemasukan & Pengeluaran kas operasional bulan bersangkutan
            $masukBulan = (float) $pemasukans->filter(function ($item) use ($b) {
                if (! $item->tanggal) {
                    return false;
                }
                $timestamp = strtotime((string) $item->tanggal);

                return date('m', $timestamp) === $b['kode'] && (int) date('Y', $timestamp) === (int) $b['tahun'];
            })->sum('nominal');

            $keluarBulan = (float) $pengeluarans->filter(function ($item) use ($b) {
                if (! $item->tanggal) {
                    return false;
                }
                $timestamp = strtotime((string) $item->tanggal);

                return date('m', $timestamp) === $b['kode'] && (int) date('Y', $timestamp) === (int) $b['tahun'];
            })->sum('nominal');

            $netBulan = $totalIuranBulan + $masukBulan - $keluarBulan;

            $trenBulanan[] = [
                'index' => $b['index'],
                'nama' => $b['nama'],
                'tahun' => $b['tahun'],
                'label' => $b['label'],
                'singkat' => $b['singkat'],
                'iuran_kelompok' => $kelBulan,
                'iuran_desa' => $desBulan,
                'iuran_qurban' => $qurBulan,
                'total_iuran' => $totalIuranBulan,
                'kas_masuk' => $masukBulan,
                'kas_keluar' => $keluarBulan,
                'net_kas' => $netBulan,
            ];
        }

        // 6. Distribusi Anggota & Status
        $distribusiStatus = $anggotas->groupBy('status')->map(function ($items, $st) use ($totalAnggota) {
            $cnt = $items->count();

            return [
                'status' => $st,
                'count' => $cnt,
                'persen' => $totalAnggota > 0 ? round(($cnt / $totalAnggota) * 100, 1) : 0,
            ];
        })->values()->sortByDesc('count')->values();

        // 7. Kepatuhan Anggota & Ranking
        $anggotaStats = [];
        $lunasPenuhCount = 0;
        $sebagianCount = 0;
        $belumBayarCount = 0;

        foreach ($anggotas as $agt) {
            $userPays = $pembayarans->where('anggota_id', $agt->id);
            $countKelompok = $userPays->where('jenis_iuran', 'Kelompok')->pluck('periode_bayar')->unique()->count();
            $countDesa = $userPays->where('jenis_iuran', 'Desa')->pluck('periode_bayar')->unique()->count();
            $countQurban = $userPays->where('jenis_iuran', 'Qurban')->pluck('periode_bayar')->unique()->count();
            $totalBayar = (float) $userPays->sum('nominal');
            $totalSlotsPaid = $countKelompok + $countDesa;

            if ($countKelompok >= 12 && $countDesa >= 12) {
                $lunasPenuhCount++;
                $kategoriKepatuhan = 'Lunas Penuh';
            } elseif ($totalSlotsPaid > 0) {
                $sebagianCount++;
                $kategoriKepatuhan = 'Sebagian';
            } else {
                $belumBayarCount++;
                $kategoriKepatuhan = 'Belum Bayar';
            }

            $anggotaStats[] = [
                'id' => $agt->id,
                'nama' => $agt->nama,
                'status' => $agt->status,
                'bulan_kelompok' => $countKelompok,
                'bulan_desa' => $countDesa,
                'bulan_qurban' => $countQurban,
                'total_slots' => $totalSlotsPaid,
                'total_nominal' => $totalBayar,
                'kategori_kepatuhan' => $kategoriKepatuhan,
                'tunggakan_bulan' => max(0, 24 - $totalSlotsPaid),
            ];
        }

        // Top 5 Tertib (terbanyak lunas & nominal)
        $topTertib = collect($anggotaStats)
            ->sortByDesc(fn ($a) => [$a['total_slots'], $a['total_nominal']])
            ->take(5)
            ->values();

        // 5 Anggota Menunggak Terbanyak
        $perluPerhatian = collect($anggotaStats)
            ->filter(fn ($a) => $a['tunggakan_bulan'] > 0)
            ->sortByDesc('tunggakan_bulan')
            ->take(5)
            ->values();

        // 8. Kategori Kas Operasional Breakdown
        $pemasukanKategori = $pemasukans->groupBy('kategori')->map(function ($items, $kat) {
            return [
                'kategori' => $kat ?: 'Lainnya',
                'total' => (float) $items->sum('nominal'),
                'count' => $items->count(),
            ];
        })->values()->sortByDesc('total')->values();

        $pengeluaranKategori = $pengeluarans->groupBy('kategori')->map(function ($items, $kat) {
            return [
                'kategori' => $kat ?: 'Lainnya',
                'total' => (float) $items->sum('nominal'),
                'count' => $items->count(),
            ];
        })->values()->sortByDesc('total')->values();

        return response()->json([
            'periode' => [
                'id' => $periode->id,
                'nama_periode' => $periode->nama_periode,
                'status' => $periode->status,
                'saldo_awal' => $saldoAwal,
            ],
            'periodes' => $periodes,
            'ringkasan' => [
                'total_iuran' => $totalIuran,
                'total_iuran_kelompok' => $totalIuranKelompok,
                'total_iuran_desa' => $totalIuranDesa,
                'total_iuran_qurban' => $totalIuranQurban,
                'total_pemasukan_kas' => $totalPemasukanKas,
                'total_pengeluaran_kas' => $totalPengeluaranKas,
                'total_kas_masuk' => $totalKasMasuk,
                'saldo_bersih' => $saldoBersih,
                'total_anggota' => $totalAnggota,
                'transaksi_iuran_count' => $pembayarans->count(),
                'overall_compliance' => $overallCompliance,
                'kepatuhan_kelompok' => $kepatuhanKelompok,
                'kepatuhan_desa' => $kepatuhanDesa,
                'target_kelompok' => $targetKelompokTahunan,
                'target_desa' => $targetDesaTahunan,
            ],
            'tren_bulanan' => $trenBulanan,
            'distribusi_status' => $distribusiStatus,
            'kepatuhan_distribusi' => [
                'lunas_penuh' => $lunasPenuhCount,
                'sebagian' => $sebagianCount,
                'belum_bayar' => $belumBayarCount,
                'total' => $totalAnggota,
            ],
            'top_tertib' => $topTertib,
            'perlu_perhatian' => $perluPerhatian,
            'kategori_kas' => [
                'pemasukan' => $pemasukanKategori,
                'pengeluaran' => $pengeluaranKategori,
            ],
        ]);
    }
}
