<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Pemasukan;
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
}
