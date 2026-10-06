<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Anggota;
use App\Models\Pemasukan;
use App\Models\Pembayaran;
use App\Models\Pengeluaran;
use App\Models\PeriodeKeuangan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class KasController extends Controller
{
    // ==================== PEMASUKAN ====================

    public function indexPemasukan(Request $request): JsonResponse
    {
        $query = Pemasukan::with('periode');

        if ($request->filled('periode_id')) {
            $query->where('periode_id', $request->query('periode_id'));
        }

        if ($request->filled('kategori')) {
            $query->where('kategori', $request->query('kategori'));
        }

        $list = $query->orderByDesc('tanggal')->get();

        return response()->json($list);
    }

    public function storePemasukan(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'periode_id' => 'required|exists:periode_keuangan,id',
            'kategori' => 'required|string|max:100',
            'nominal' => 'required|numeric|min:1',
            'tanggal' => 'required|date',
            'keterangan' => 'nullable|string',
        ]);

        $periode = PeriodeKeuangan::findOrFail($validated['periode_id']);
        if ($periode->status === 'ditutup') {
            return response()->json(['message' => 'Tidak dapat menambah transaksi pada periode yang telah ditutup.'], 422);
        }

        $pemasukan = Pemasukan::create($validated);

        return response()->json([
            'message' => 'Pemasukan berhasil dicatat.',
            'data' => $pemasukan,
        ], 201);
    }

    public function destroyPemasukan(int $id): JsonResponse
    {
        $pemasukan = Pemasukan::with('periode')->findOrFail($id);

        if ($pemasukan->periode && $pemasukan->periode->status === 'ditutup') {
            return response()->json(['message' => 'Tidak dapat menghapus transaksi pada periode yang telah ditutup.'], 422);
        }

        $pemasukan->delete();

        return response()->json(['message' => 'Pemasukan berhasil dihapus.']);
    }

    // ==================== PENGELUARAN ====================

    public function indexPengeluaran(Request $request): JsonResponse
    {
        $query = Pengeluaran::with('periode');

        if ($request->filled('periode_id')) {
            $query->where('periode_id', $request->query('periode_id'));
        }

        if ($request->filled('kategori')) {
            $query->where('kategori', $request->query('kategori'));
        }

        $list = $query->orderByDesc('tanggal')->get();

        return response()->json($list);
    }

    public function storePengeluaran(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'periode_id' => 'required|exists:periode_keuangan,id',
            'kategori' => 'required|string|max:100',
            'bulan' => 'nullable|string|max:50',
            'nominal' => 'required|numeric|min:1',
            'tanggal' => 'required|date',
            'keterangan' => 'nullable|string',
        ]);

        $periode = PeriodeKeuangan::findOrFail($validated['periode_id']);
        if ($periode->status === 'ditutup') {
            return response()->json(['message' => 'Tidak dapat menambah pengeluaran pada periode yang telah ditutup.'], 422);
        }

        $pengeluaran = Pengeluaran::create($validated);

        return response()->json([
            'message' => 'Pengeluaran berhasil dicatat.',
            'data' => $pengeluaran,
        ], 201);
    }

    public function destroyPengeluaran(int $id): JsonResponse
    {
        $pengeluaran = Pengeluaran::with('periode')->findOrFail($id);

        if ($pengeluaran->periode && $pengeluaran->periode->status === 'ditutup') {
            return response()->json(['message' => 'Tidak dapat menghapus transaksi pada periode yang telah ditutup.'], 422);
        }

        $pengeluaran->delete();

        return response()->json(['message' => 'Pengeluaran berhasil dihapus.']);
    }

    // ==================== SETORAN KAS DESA (BULANAN) ====================

    /**
     * Rekapitulasi 12 bulan setoran Kas Desa ke Desa
     */
    public function indexSetoranDesa(Request $request): JsonResponse
    {
        $periodeId = $request->query('periode_id');
        $periode = $periodeId
            ? PeriodeKeuangan::find($periodeId)
            : PeriodeKeuangan::where('status', 'aktif')->latest()->first() ?? PeriodeKeuangan::latest()->first();

        if (! $periode) {
            return response()->json(['message' => 'Periode tidak ditemukan.'], 404);
        }

        $bulanDetail = $periode->getBulanDetail();
        $totalAnggota = Anggota::where('status_aktif', true)->count();

        // Ambil semua iuran kas desa pada periode ini
        $desaPayments = Pembayaran::where('periode_id', $periode->id)
            ->where('jenis_iuran', 'Desa')
            ->get();

        // Ambil semua pengeluaran setoran kas desa pada periode ini
        $desaPengeluarans = Pengeluaran::where('periode_id', $periode->id)
            ->whereIn('kategori', ['Setor Kas Desa', 'Kas Desa'])
            ->orderByDesc('tanggal')
            ->get();

        $bulanData = [];
        $totalIuranTerkumpul = (float) $desaPayments->sum('nominal');
        $totalDisetor = (float) $desaPengeluarans->sum('nominal');

        foreach ($bulanDetail as $idx => $b) {
            $bulanNama = $b['nama'];
            $tahun = $b['tahun'];
            $label = $b['label'];

            // Pembayaran warga untuk bulan ini
            $paysInMonth = $desaPayments->where('periode_bayar', $bulanNama);
            $iuranTerkumpul = (float) $paysInMonth->sum('nominal');
            $anggotaLunas = $paysInMonth->pluck('anggota_id')->unique()->count();

            // Setoran ke desa untuk bulan ini (jika dicatat per bulan spesifik)
            $setoran = $desaPengeluarans->first(function ($p) use ($bulanNama) {
                return $p->bulan === $bulanNama || str_contains(strtolower($p->keterangan ?? ''), strtolower($bulanNama));
            });

            $isSudahDisetor = ! is_null($setoran);
            $nominalDisetor = $isSudahDisetor ? (float) $setoran->nominal : 0;

            $bulanData[] = [
                'index' => $idx + 1,
                'bulan' => $bulanNama,
                'tahun' => $tahun,
                'label' => $label,
                'singkat' => $b['singkat'],
                'total_anggota' => $totalAnggota,
                'anggota_lunas_count' => $anggotaLunas,
                'iuran_terkumpul' => $iuranTerkumpul,
                'sudah_disetor' => $isSudahDisetor,
                'nominal_disetor' => $nominalDisetor,
                'sisa_belum_disetor' => max(0, $iuranTerkumpul - $nominalDisetor),
                'pengeluaran_id' => $setoran?->id,
                'tanggal_setor' => $setoran?->tanggal?->format('Y-m-d'),
                'keterangan' => $setoran?->keterangan,
            ];
        }

        $riwayatSetoran = $desaPengeluarans->map(function ($p) {
            return [
                'id' => $p->id,
                'tanggal' => $p->tanggal ? $p->tanggal->format('Y-m-d') : null,
                'tanggal_formatted' => $p->tanggal ? $p->tanggal->format('d/m/Y') : '-',
                'nominal' => (float) $p->nominal,
                'bulan' => $p->bulan,
                'keterangan' => $p->keterangan,
                'created_at' => $p->created_at ? $p->created_at->format('d/m/Y H:i') : null,
            ];
        });

        return response()->json([
            'periode' => $periode,
            'total_iuran_terkumpul' => $totalIuranTerkumpul,
            'total_disetor' => $totalDisetor,
            'sisa_belum_disetor' => max(0, $totalIuranTerkumpul - $totalDisetor),
            'total_bulan_disetor' => collect($bulanData)->where('sudah_disetor', true)->count(),
            'riwayat_setoran' => $riwayatSetoran,
            'bulan_data' => $bulanData,
        ]);
    }

    /**
     * Catat pengeluaran setoran Kas Desa (bisa bulanan, 12 bulan sekaligus, atau nominal bebas)
     */
    public function storeSetoranDesa(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'periode_id' => 'required|exists:periode_keuangan,id',
            'nominal' => 'required|numeric|min:1',
            'tanggal' => 'required|date',
            'bulan' => 'nullable|string|max:100',
            'keterangan' => 'nullable|string|max:255',
        ]);

        $periode = PeriodeKeuangan::findOrFail($validated['periode_id']);
        if ($periode->status === 'ditutup') {
            return response()->json(['message' => 'Tidak dapat menambah setoran pada periode yang telah ditutup.'], 422);
        }

        $bulanText = $validated['bulan'] ?? null;
        $defaultKet = $bulanText ? "Setoran Kas Desa ({$bulanText}) ke Desa" : 'Setoran Kas Desa ke Desa';
        $keterangan = $validated['keterangan'] ?: $defaultKet;

        $pengeluaran = Pengeluaran::create([
            'periode_id' => $validated['periode_id'],
            'kategori' => 'Setor Kas Desa',
            'bulan' => $bulanText,
            'nominal' => $validated['nominal'],
            'tanggal' => $validated['tanggal'],
            'keterangan' => $keterangan,
        ]);

        return response()->json([
            'message' => 'Setoran Kas Desa sebesar Rp '.number_format($validated['nominal'], 0, ',', '.').' berhasil dicatat.',
            'data' => $pengeluaran,
        ], 201);
    }

    /**
     * Hapus / Batalkan setoran Kas Desa
     */
    public function destroySetoranDesa(int $id): JsonResponse
    {
        $pengeluaran = Pengeluaran::with('periode')->findOrFail($id);

        if ($pengeluaran->periode && $pengeluaran->periode->status === 'ditutup') {
            return response()->json(['message' => 'Tidak dapat menghapus setoran pada periode yang telah ditutup.'], 422);
        }

        $pengeluaran->delete();

        return response()->json(['message' => 'Setoran Kas Desa berhasil dibatalkan/dihapus.']);
    }
}
