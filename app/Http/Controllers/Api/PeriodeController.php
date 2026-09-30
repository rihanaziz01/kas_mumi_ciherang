<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Pemasukan;
use App\Models\Pembayaran;
use App\Models\Pengeluaran;
use App\Models\PeriodeKeuangan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PeriodeController extends Controller
{
    public function index(): JsonResponse
    {
        $periodes = PeriodeKeuangan::orderByDesc('id')->get()->map(function ($p) {
            $totalIuran = (float) Pembayaran::where('periode_id', $p->id)->sum('nominal');
            $totalPemasukan = (float) Pemasukan::where('periode_id', $p->id)->sum('nominal');
            $totalMasuk = $totalIuran + $totalPemasukan;
            $totalKeluar = (float) Pengeluaran::where('periode_id', $p->id)->sum('nominal');
            $saldoAkhirHitung = (float) $p->saldo_awal + $totalMasuk - $totalKeluar;

            return [
                'id' => $p->id,
                'nama_periode' => $p->nama_periode,
                'tanggal_mulai' => $p->tanggal_mulai?->format('Y-m-d'),
                'tanggal_selesai' => $p->tanggal_selesai?->format('Y-m-d'),
                'saldo_awal' => (float) $p->saldo_awal,
                'saldo_akhir_tercatat' => (float) $p->saldo_akhir,
                'saldo_akhir_kalkulasi' => $saldoAkhirHitung,
                'total_masuk' => $totalMasuk,
                'total_keluar' => $totalKeluar,
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
        ]);

        return DB::transaction(function () use ($periodeLama, $validated) {
            // 1. Hitung saldo akhir riil periode lama
            $totalIuran = (float) Pembayaran::where('periode_id', $periodeLama->id)->sum('nominal');
            $totalPemasukan = (float) Pemasukan::where('periode_id', $periodeLama->id)->sum('nominal');
            $totalKeluar = (float) Pengeluaran::where('periode_id', $periodeLama->id)->sum('nominal');
            $saldoAkhir = (float) $periodeLama->saldo_awal + ($totalIuran + $totalPemasukan) - $totalKeluar;

            // 2. Kunci periode lama menjadi 'ditutup'
            $periodeLama->update([
                'saldo_akhir' => $saldoAkhir,
                'status' => 'ditutup',
                'tanggal_selesai' => now()->format('Y-m-d'),
            ]);

            // 3. Tentukan saldo awal periode baru (Opsi bawa saldo vs reset Rp 0)
            $saldoAwalBaru = $validated['bawa_saldo'] ? $saldoAkhir : 0.00;

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
                'message' => 'Tutup buku berhasil! '.$periodeLama->nama_periode.' telah ditutup, dan '.$periodeBaru->nama_periode.' telah diaktifkan.',
                'periode_lama' => $periodeLama,
                'periode_baru' => $periodeBaru,
                'saldo_akhir_lama' => $saldoAkhir,
                'saldo_awal_baru' => $saldoAwalBaru,
            ]);
        });
    }
}
