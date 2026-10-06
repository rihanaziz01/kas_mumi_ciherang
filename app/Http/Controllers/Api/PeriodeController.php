<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PeriodeKeuangan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PeriodeController extends Controller
{
    public function index(): JsonResponse
    {
        $periodes = PeriodeKeuangan::orderByDesc('id')->get()->map(function ($p) {
            $rincian = $p->calculateRincianSaldo();

            return [
                'id' => $p->id,
                'nama_periode' => $p->nama_periode,
                'tanggal_mulai' => $p->tanggal_mulai?->format('Y-m-d'),
                'tanggal_selesai' => $p->tanggal_selesai?->format('Y-m-d'),
                'saldo_awal' => (float) $p->saldo_awal,
                'saldo_akhir_tercatat' => (float) $p->saldo_akhir,
                'saldo_akhir_kalkulasi' => $rincian['saldo_akhir_kalkulasi'],
                'total_masuk' => $rincian['total_masuk'],
                'total_keluar' => $rincian['total_keluar'],
                'saldo_kas_kelompok' => $rincian['saldo_kas_kelompok'],
                'saldo_olahraga' => $rincian['saldo_olahraga'],
                'saldo_keputrian' => $rincian['saldo_keputrian'],
                'saldo_desa' => $rincian['saldo_desa'],
                'saldo_qurban' => $rincian['saldo_qurban'],
                'saldo_bisa_dibawa' => $rincian['saldo_bisa_dibawa'],
                'status' => $p->status,
                'created_at' => $p->created_at?->format('Y-m-d H:i'),
            ];
        });

        return response()->json($periodes);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nama_periode' => 'required|string|max:50|unique:periode_keuangan,nama_periode',
            'tanggal_mulai' => 'required|date',
            'saldo_awal' => 'nullable|numeric|min:0',
            'status' => 'nullable|in:aktif,ditutup',
        ]);

        $periode = PeriodeKeuangan::create([
            'nama_periode' => $validated['nama_periode'],
            'tanggal_mulai' => $validated['tanggal_mulai'],
            'saldo_awal' => $validated['saldo_awal'] ?? 0.00,
            'saldo_akhir' => $validated['saldo_awal'] ?? 0.00,
            'status' => $validated['status'] ?? 'aktif',
        ]);

        return response()->json([
            'message' => 'Periode keuangan berhasil dibuat.',
            'data' => $periode,
        ], 201);
    }

    /**
     * Fitur Kunci PRD: Siklus Reset Keuangan (Tutup Buku Pasca-Qurban)
     */
    public function tutupBuku(Request $request, int $id): JsonResponse
    {
        $periodeLama = PeriodeKeuangan::findOrFail($id);

        if ($periodeLama->status === 'ditutup') {
            return response()->json([
                'message' => 'Periode ini sudah dalam status ditutup.',
            ], 422);
        }

        $validated = $request->validate([
            'bawa_saldo' => 'required|boolean',
            'nama_periode_baru' => 'required|string|max:50|unique:periode_keuangan,nama_periode',
            'tanggal_mulai_baru' => 'required|date',
        ], [
            'nama_periode_baru.unique' => 'Nama periode baru sudah digunakan. Harap masukkan nama yang berbeda (contoh: Periode 2026/2027 atau Periode 2027).',
            'nama_periode_baru.required' => 'Nama periode baru wajib diisi.',
            'tanggal_mulai_baru.required' => 'Tanggal mulai periode baru wajib diisi.',
            'tanggal_mulai_baru.date' => 'Format tanggal mulai baru tidak valid.',
        ]);

        return DB::transaction(function () use ($periodeLama, $validated) {
            // 1. Hitung rincian saldo riil periode lama
            $rincian = $periodeLama->calculateRincianSaldo();
            $saldoAkhir = $rincian['saldo_akhir_kalkulasi'];
            $saldoBisaDibawa = $rincian['saldo_bisa_dibawa'];

            // 2. Kunci periode lama menjadi 'ditutup'
            $periodeLama->update([
                'saldo_akhir' => $saldoAkhir,
                'status' => 'ditutup',
                'tanggal_selesai' => now()->format('Y-m-d'),
            ]);

            // 3. Tentukan saldo awal periode baru:
            // Sesuai aturan kas: saldo yang boleh dibawa HANYA:
            // 1. Kas Kelompok
            // 2. Uang Olahraga dan Keputrian
            // Kas Desa (titipan) & Tabungan Qurban (dibelanjakan untuk qurban) tidak dibawa.
            $saldoAwalBaru = $validated['bawa_saldo'] ? max(0, $saldoBisaDibawa) : 0.00;

            // 4. Nonaktifkan periode lain yang aktif jika ada
            PeriodeKeuangan::where('status', 'aktif')->update(['status' => 'ditutup']);

            // 5. Buat periode baru
            $periodeBaru = PeriodeKeuangan::create([
                'nama_periode' => $validated['nama_periode_baru'],
                'tanggal_mulai' => $validated['tanggal_mulai_baru'],
                'saldo_awal' => $saldoAwalBaru,
                'saldo_akhir' => $saldoAwalBaru,
                'status' => 'aktif',
            ]);

            return response()->json([
                'message' => 'Tutup buku berhasil! '.$periodeLama->nama_periode.' telah ditutup, dan '.$periodeBaru->nama_periode.' telah diaktifkan.'.($validated['bawa_saldo'] ? ' Saldo kas paguyuban yang dibawa (Kas Kelompok + Olahraga & Keputrian): Rp '.number_format($saldoAwalBaru, 0, ',', '.') : ' Dimulai dari saldo Rp 0.'),
                'periode_lama' => $periodeLama,
                'periode_baru' => $periodeBaru,
                'saldo_akhir_lama' => $saldoAkhir,
                'saldo_bisa_dibawa' => $saldoBisaDibawa,
                'saldo_awal_baru' => $saldoAwalBaru,
                'rincian_saldo' => $rincian,
            ]);
        });
    }

    /**
     * Buka kembali / Jadikan suatu periode sebagai periode aktif utama.
     */
    public function setAktif(int $id): JsonResponse
    {
        $targetPeriode = PeriodeKeuangan::findOrFail($id);

        if ($targetPeriode->status === 'aktif') {
            return response()->json([
                'message' => "Periode {$targetPeriode->nama_periode} saat ini sudah aktif.",
            ], 422);
        }

        return DB::transaction(function () use ($targetPeriode) {
            // 1. Nonaktifkan periode lain yang sedang aktif
            PeriodeKeuangan::where('status', 'aktif')->update([
                'status' => 'ditutup',
                'tanggal_selesai' => now()->format('Y-m-d'),
            ]);

            // 2. Aktifkan target periode
            $targetPeriode->update([
                'status' => 'aktif',
                'tanggal_selesai' => null,
            ]);

            return response()->json([
                'message' => "Berhasil! {$targetPeriode->nama_periode} sekarang aktif kembali sebagai periode kerja utama.",
                'data' => $targetPeriode,
            ]);
        });
    }

    /**
     * Hapus periode tertentu dan seluruh transaksi terkait (hanya untuk periode non-aktif).
     */
    public function destroy(int $id): JsonResponse
    {
        $periode = PeriodeKeuangan::findOrFail($id);

        if ($periode->status === 'aktif') {
            return response()->json([
                'message' => 'Tidak dapat menghapus periode yang sedang aktif. Silakan aktifkan periode lain terlebih dahulu sebelum menghapus periode ini.',
            ], 422);
        }

        if (PeriodeKeuangan::count() <= 1) {
            return response()->json([
                'message' => 'Tidak dapat menghapus periode terakhir dalam sistem.',
            ], 422);
        }

        return DB::transaction(function () use ($periode) {
            $nama = $periode->nama_periode;

            // Hapus data transaksi pembayaran, pemasukan, dan pengeluaran terkait periode ini
            $totalPembayaran = $periode->pembayaran()->count();
            $totalPemasukan = $periode->pemasukan()->count();
            $totalPengeluaran = $periode->pengeluaran()->count();

            $periode->pembayaran()->delete();
            $periode->pemasukan()->delete();
            $periode->pengeluaran()->delete();
            $periode->delete();

            return response()->json([
                'message' => "Periode {$nama} berhasil dihapus beserta {$totalPembayaran} data pembayaran, {$totalPemasukan} pemasukan, dan {$totalPengeluaran} pengeluaran terkait.",
            ]);
        });
    }
}
