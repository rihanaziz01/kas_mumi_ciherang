<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Anggota;
use App\Models\Pemasukan;
use App\Models\Pembayaran;
use App\Models\Pengeluaran;
use App\Models\PeriodeKeuangan;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class LaporanController extends Controller
{
    private function resolvePeriode(?string $periodeId): ?PeriodeKeuangan
    {
        return $periodeId
            ? PeriodeKeuangan::find($periodeId)
            : PeriodeKeuangan::where('status', 'aktif')->latest()->first() ?? PeriodeKeuangan::latest()->first();
    }

    private function getRekapIuranData(PeriodeKeuangan $periode): array
    {
        $bulanList = $periode->getBulanList();
        $bulanDetail = $periode->getBulanDetail();

        $anggotas = Anggota::where('status_aktif', true)->orderBy('nama')->get();
        $pembayarans = Pembayaran::where('periode_id', $periode->id)->get();

        $rows = [];
        $grandTotalKelompok = 0;
        $grandTotalDesa = 0;
        $grandTotalQurban = 0;

        foreach ($anggotas as $anggota) {
            $userPayments = $pembayarans->where('anggota_id', $anggota->id);

            // Kelompok 12 bulan
            $kelompokBulan = [];
            $totalKelompokMember = 0;
            foreach ($bulanList as $b) {
                $pay = $userPayments->first(fn ($p) => $p->jenis_iuran === 'Kelompok' && $p->periode_bayar === $b);
                $isPaid = ! is_null($pay);
                $nom = $isPaid ? (float) $pay->nominal : 0;
                $totalKelompokMember += $nom;
                $kelompokBulan[$b] = $isPaid;
            }

            // Desa 12 bulan
            $desaBulan = [];
            $totalDesaMember = 0;
            foreach ($bulanList as $b) {
                $pay = $userPayments->first(fn ($p) => $p->jenis_iuran === 'Desa' && $p->periode_bayar === $b);
                $isPaid = ! is_null($pay);
                $nom = $isPaid ? (float) $pay->nominal : 0;
                $totalDesaMember += $nom;
                $desaBulan[$b] = $isPaid;
            }

            // Qurban
            $qurbanNominal = 0;

            if ($anggota->status === 'Pedagang') {
                $qurbanStatus = true;
                $qurbanInfo = 'Bebas Qurban';
            } else {
                $qPays = $userPayments->where('jenis_iuran', 'Qurban');
                $qurbanNominal = (float) $qPays->sum('nominal');
                $qCount = $qPays->count();
                $qurbanStatus = $qCount >= 12;
                $qurbanInfo = $qCount.' / 12 Bulan (Rp '.number_format($qurbanNominal, 0, ',', '.').')';
            }

            $grandTotalKelompok += $totalKelompokMember;
            $grandTotalDesa += $totalDesaMember;
            $grandTotalQurban += $qurbanNominal;

            $rows[] = [
                'anggota_id' => $anggota->id,
                'nama' => $anggota->nama,
                'status' => $anggota->status,
                'kelompok' => $kelompokBulan,
                'total_kelompok' => $totalKelompokMember,
                'desa' => $desaBulan,
                'total_desa' => $totalDesaMember,
                'qurban' => [
                    'status' => $qurbanStatus,
                    'info' => $qurbanInfo,
                    'nominal' => $qurbanNominal,
                ],
                'grand_total_member' => $totalKelompokMember + $totalDesaMember + $qurbanNominal,
            ];
        }

        return [
            'periode' => $periode,
            'bulan_list' => $bulanList,
            'bulan_detail' => $bulanDetail,
            'total_anggota' => count($rows),
            'grand_total_kelompok' => $grandTotalKelompok,
            'grand_total_desa' => $grandTotalDesa,
            'grand_total_qurban' => $grandTotalQurban,
            'grand_total_iuran' => $grandTotalKelompok + $grandTotalDesa + $grandTotalQurban,
            'rows' => $rows,
        ];
    }

    private function getNeracaData(PeriodeKeuangan $periode): array
    {
        $iuranKelompok = (float) Pembayaran::where('periode_id', $periode->id)->where('jenis_iuran', 'Kelompok')->sum('nominal');
        $iuranDesa = (float) Pembayaran::where('periode_id', $periode->id)->where('jenis_iuran', 'Desa')->sum('nominal');
        $iuranQurban = (float) Pembayaran::where('periode_id', $periode->id)->where('jenis_iuran', 'Qurban')->sum('nominal');
        $totalIuran = $iuranKelompok + $iuranDesa + $iuranQurban;

        $allPemasukan = Pemasukan::where('periode_id', $periode->id)->get();
        $allPengeluaran = Pengeluaran::where('periode_id', $periode->id)->get();

        $pemasukanLainGroup = Pemasukan::where('periode_id', $periode->id)
            ->selectRaw('kategori, SUM(nominal) as total')
            ->groupBy('kategori')
            ->get();
        $totalPemasukanLain = (float) $pemasukanLainGroup->sum('total');

        $totalMasuk = $totalIuran + $totalPemasukanLain;

        $pengeluaranGroup = Pengeluaran::where('periode_id', $periode->id)
            ->selectRaw('kategori, SUM(nominal) as total')
            ->groupBy('kategori')
            ->get();
        $totalPengeluaran = (float) $pengeluaranGroup->sum('total');

        $saldoAwal = (float) $periode->saldo_awal;
        $saldoAkhir = $saldoAwal + $totalMasuk - $totalPengeluaran;

        // Pemisahan Pos Alokasi Kas (Uang Keputrian & Olahraga terpisah di luar Kas Kelompok)
        $masukKeputrian = (float) $allPemasukan->whereIn('kategori', ['Uang Keputrian', 'Keputrian'])->sum('nominal');
        $keluarKeputrian = (float) $allPengeluaran->whereIn('kategori', ['Uang Keputrian', 'Keputrian'])->sum('nominal');
        $saldoKeputrian = $masukKeputrian - $keluarKeputrian;

        $masukOlahraga = (float) $allPemasukan->whereIn('kategori', ['Uang Olahraga', 'Olahraga'])->sum('nominal');
        $keluarOlahraga = (float) $allPengeluaran->whereIn('kategori', ['Uang Olahraga', 'Olahraga'])->sum('nominal');
        $saldoOlahraga = $masukOlahraga - $keluarOlahraga;

        $pemasukanLainKelompok = (float) $allPemasukan->whereNotIn('kategori', ['Uang Keputrian', 'Keputrian', 'Uang Olahraga', 'Olahraga'])->sum('nominal');
        $masukKelompok = $iuranKelompok + $pemasukanLainKelompok;
        $keluarKelompok = (float) $allPengeluaran->whereNotIn('kategori', ['Uang Keputrian', 'Keputrian', 'Uang Olahraga', 'Olahraga'])->sum('nominal');
        $saldoKasKelompok = $saldoAwal + $masukKelompok - $keluarKelompok;

        return [
            'periode' => $periode,
            'saldo_awal' => $saldoAwal,
            'pemasukan' => [
                'iuran_kelompok' => $iuranKelompok,
                'iuran_desa' => $iuranDesa,
                'iuran_qurban' => $iuranQurban,
                'total_iuran' => $totalIuran,
                'pemasukan_lain' => $pemasukanLainGroup->toArray(),
                'total_pemasukan_lain' => $totalPemasukanLain,
                'total' => $totalMasuk,
            ],
            'pengeluaran' => [
                'per_kategori' => $pengeluaranGroup->toArray(),
                'total' => $totalPengeluaran,
            ],
            'saldo_akhir' => $saldoAkhir,
            'pos_alokasi' => [
                'kas_kelompok' => [
                    'nama' => 'Kas Kelompok (Umum)',
                    'saldo_awal' => $saldoAwal,
                    'masuk' => $masukKelompok,
                    'keluar' => $keluarKelompok,
                    'saldo' => $saldoKasKelompok,
                    'keterangan' => 'Iuran warga kelompok + kas lain - operasional umum',
                ],
                'uang_keputrian' => [
                    'nama' => 'Kas Uang Keputrian',
                    'masuk' => $masukKeputrian,
                    'keluar' => $keluarKeputrian,
                    'saldo' => $saldoKeputrian,
                    'keterangan' => 'Dana khusus keputrian (terpisah dari kas kelompok)',
                ],
                'uang_olahraga' => [
                    'nama' => 'Kas Uang Olahraga',
                    'masuk' => $masukOlahraga,
                    'keluar' => $keluarOlahraga,
                    'saldo' => $saldoOlahraga,
                    'keterangan' => 'Dana khusus olahraga (terpisah dari kas kelompok)',
                ],
                'kas_desa' => [
                    'nama' => 'Kas Desa',
                    'masuk' => $iuranDesa,
                    'keluar' => 0,
                    'saldo' => $iuranDesa,
                    'keterangan' => 'Titipan iuran warga untuk kas desa',
                ],
                'kas_qurban' => [
                    'nama' => 'Tabungan Qurban',
                    'masuk' => $iuranQurban,
                    'keluar' => 0,
                    'saldo' => $iuranQurban,
                    'keterangan' => 'Tabungan qurban tahunan anggota',
                ],
            ],
        ];
    }

    /**
     * Rekapitulasi Matriks Iuran 12 Bulan Seluruh Anggota
     */
    public function rekapIuran(Request $request): JsonResponse
    {
        $periode = $this->resolvePeriode($request->query('periode_id'));

        if (! $periode) {
            return response()->json(['message' => 'Periode tidak ditemukan.'], 404);
        }

        return response()->json($this->getRekapIuranData($periode));
    }

    /**
     * Neraca Keuangan Lengkap
     */
    public function neraca(Request $request): JsonResponse
    {
        $periode = $this->resolvePeriode($request->query('periode_id'));

        if (! $periode) {
            return response()->json(['message' => 'Periode tidak ditemukan.'], 404);
        }

        return response()->json($this->getNeracaData($periode));
    }

    /**
     * Export PDF Resmi Laporan (Matriks Iuran atau Neraca Kas)
     */
    public function exportPdf(Request $request): Response
    {
        $periode = $this->resolvePeriode($request->query('periode_id'));

        if (! $periode) {
            return response()->json(['message' => 'Periode tidak ditemukan.'], 404);
        }

        $tab = $request->query('tab', 'matriks');

        $logoPath = public_path('images/logo-cropped.png');
        $logoBase64 = file_exists($logoPath)
            ? 'data:image/png;base64,'.base64_encode(file_get_contents($logoPath))
            : '';

        if ($tab === 'neraca') {
            $data = $this->getNeracaData($periode);
            $data['logo_base64'] = $logoBase64;
            $pdf = Pdf::loadView('pdf.laporan-neraca', $data)->setPaper('a4', 'portrait');
            $safeName = preg_replace('/[^A-Za-z0-9_-]/', '_', $periode->nama_periode);

            return $pdf->download("Laporan_Neraca_{$safeName}.pdf");
        }

        $data = $this->getRekapIuranData($periode);
        $data['logo_base64'] = $logoBase64;
        $pdf = Pdf::loadView('pdf.laporan-matriks', $data)->setPaper('a4', 'landscape');
        $safeName = preg_replace('/[^A-Za-z0-9_-]/', '_', $periode->nama_periode);

        return $pdf->download("Laporan_Matriks_Iuran_{$safeName}.pdf");
    }
}
