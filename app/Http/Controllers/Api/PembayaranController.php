<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Anggota;
use App\Models\Pembayaran;
use App\Models\PendapatanKaryawan;
use App\Models\PeriodeKeuangan;
use App\Models\TarifIuran;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PembayaranController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Pembayaran::with(['anggota', 'periode']);

        if ($request->filled('periode_id')) {
            $query->where('periode_id', $request->query('periode_id'));
        }

        if ($request->filled('anggota_id')) {
            $query->where('anggota_id', $request->query('anggota_id'));
        }

        if ($request->filled('jenis_iuran')) {
            $query->where('jenis_iuran', $request->query('jenis_iuran'));
        }

        $list = $query->orderByDesc('tanggal_bayar')
            ->orderByDesc('id')
            ->paginate($request->query('per_page', 25));

        return response()->json($list);
    }

    /**
     * Input Pembayaran Fleksibel & Bulk (Termasuk 12 Bulan Sekaligus)
     */
    public function storeBulk(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'anggota_id' => 'required|exists:anggota,id',
            'periode_id' => 'required|exists:periode_keuangan,id',
            'tanggal_bayar' => 'required|date',
            'catatan' => 'nullable|string',
            // items array: [ { jenis_iuran: 'Kelompok', bulan_list: ['Januari', 'Februari', ...] }, ... ]
            'items' => 'required|array|min:1',
            'items.*.jenis_iuran' => 'required|in:Kelompok,Desa,Qurban,Keputrian,Olahraga',
            'items.*.bulan_list' => 'required|array|min:1',
            'items.*.nominal_override' => 'nullable|numeric|min:0',
        ]);

        $anggota = Anggota::findOrFail($validated['anggota_id']);
        $periode = PeriodeKeuangan::findOrFail($validated['periode_id']);

        if ($periode->status === 'ditutup') {
            return response()->json([
                'message' => 'Tidak dapat menambahkan pembayaran pada periode yang telah ditutup.',
            ], 422);
        }

        // Ambil tarif dasar anggota
        $tarifs = TarifIuran::where('status_anggota', $anggota->status)
            ->pluck('nominal', 'jenis_iuran');

        $createdRecords = [];
        $skippedRecords = [];
        $totalNominal = 0;

        $tahunPeriode = (int) ($periode->tanggal_mulai ? $periode->tanggal_mulai->format('Y') : date('Y'));

        DB::beginTransaction();
        try {
            foreach ($validated['items'] as $item) {
                $jenis = $item['jenis_iuran'];
                $bulanList = $item['bulan_list'];
                $override = $item['nominal_override'] ?? null;

                // Jika status Pedagang dan iuran Qurban -> lewati karena Bebas
                if ($anggota->status === 'Pedagang' && $jenis === 'Qurban') {
                    $skippedRecords[] = 'Qurban dilewati karena status Pedagang bebas qurban.';

                    continue;
                }

                foreach ($bulanList as $bulan) {
                    // Validasi Anti-Duplikasi
                    $exists = Pembayaran::where('anggota_id', $anggota->id)
                        ->where('periode_id', $periode->id)
                        ->where('jenis_iuran', $jenis)
                        ->where('periode_bayar', $bulan)
                        ->exists();

                    if ($exists) {
                        $skippedRecords[] = "{$jenis} untuk {$bulan} sudah lunas sebelumnya.";

                        continue;
                    }

                    // Tentukan nominal bayar
                    $nominal = 0;
                    if ($override !== null && $override > 0) {
                        $nominal = (float) $override;
                    } elseif ($jenis === 'Qurban' && in_array($anggota->status, ['Karyawan A', 'Karyawan B'])) {
                        // Cek 2% dari Pendapatan Karyawan bulan tersebut
                        $pendapatanRecord = PendapatanKaryawan::where('anggota_id', $anggota->id)
                            ->where('bulan', $bulan)
                            ->where('tahun', $tahunPeriode)
                            ->first();

                        if ($pendapatanRecord) {
                            $nominal = (float) $pendapatanRecord->nominal_qurban;
                        } else {
                            // Default fallback jika belum input pendapatan tapi mau bayar
                            $nominal = (float) ($tarifs['Qurban'] ?? 0);
                        }
                    } else {
                        $nominal = (float) ($tarifs[$jenis] ?? 5000);
                    }

                    $pembayaran = Pembayaran::create([
                        'anggota_id' => $anggota->id,
                        'periode_id' => $periode->id,
                        'jenis_iuran' => $jenis,
                        'periode_bayar' => $bulan,
                        'nominal' => $nominal,
                        'tanggal_bayar' => $validated['tanggal_bayar'],
                        'catatan' => $validated['catatan'] ?? null,
                    ]);

                    $createdRecords[] = $pembayaran;
                    $totalNominal += $nominal;
                }
            }

            if (empty($createdRecords)) {
                DB::rollBack();

                return response()->json([
                    'message' => 'Semua tagihan untuk bulan dan jenis iuran yang dipilih sudah lunas sebelumnya. Tidak ada transaksi baru yang disimpan.',
                    'skipped_records' => $skippedRecords,
                ], 422);
            }

            DB::commit();

            return response()->json([
                'message' => count($createdRecords).' item pembayaran berhasil disimpan. Total: Rp '.number_format($totalNominal, 0, ',', '.'),
                'total_nominal' => $totalNominal,
                'created_count' => count($createdRecords),
                'created_records' => $createdRecords,
                'skipped_records' => $skippedRecords,
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Terjadi kesalahan saat memproses pembayaran: '.$e->getMessage(),
            ], 500);
        }
    }

    public function destroy(int $id): JsonResponse
    {
        $pembayaran = Pembayaran::with('periode')->findOrFail($id);

        if ($pembayaran->periode && $pembayaran->periode->status === 'ditutup') {
            return response()->json([
                'message' => 'Tidak dapat menghapus transaksi pada periode keuangan yang telah ditutup.',
            ], 422);
        }

        $pembayaran->delete();

        return response()->json([
            'message' => 'Data pembayaran berhasil dihapus.',
        ]);
    }
}
