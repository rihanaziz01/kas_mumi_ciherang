<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Anggota;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AnggotaController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Anggota::query();

        if ($request->filled('search')) {
            $s = $request->query('search');
            $query->where('nama', 'like', "%{$s}%");
        }

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        if ($request->filled('status_aktif')) {
            $query->where('status_aktif', filter_var($request->query('status_aktif'), FILTER_VALIDATE_BOOLEAN));
        }

        $anggota = $query->orderBy('nama')->get();

        return response()->json($anggota);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nama' => 'required|string|max:150',
            'status' => 'required|in:Pelajar,Mahasiswa,Pencaker,Pedagang,Karyawan A,Karyawan B',
            'status_aktif' => 'nullable|boolean',
        ]);

        $anggota = Anggota::create([
            'nama' => $validated['nama'],
            'status' => $validated['status'],
            'status_aktif' => $validated['status_aktif'] ?? true,
        ]);

        return response()->json([
            'message' => 'Data anggota berhasil ditambahkan.',
            'data' => $anggota,
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $anggota = Anggota::findOrFail($id);

        $validated = $request->validate([
            'nama' => 'sometimes|required|string|max:150',
            'status' => 'sometimes|required|in:Pelajar,Mahasiswa,Pencaker,Pedagang,Karyawan A,Karyawan B',
            'status_aktif' => 'sometimes|required|boolean',
        ]);

        $anggota->update($validated);

        return response()->json([
            'message' => 'Data anggota berhasil diperbarui.',
            'data' => $anggota,
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $anggota = Anggota::findOrFail($id);

        if ($anggota->pembayaran()->exists()) {
            // Sesuai aturan PRD (Data Preservation): jika sudah ada riwayat transaksi, ubah status non-aktif
            $anggota->update(['status_aktif' => false]);

            return response()->json([
                'message' => 'Anggota memiliki riwayat pembayaran, status telah diubah menjadi non-aktif.',
                'data' => $anggota,
            ]);
        }

        $anggota->delete();

        return response()->json([
            'message' => 'Data anggota berhasil dihapus.',
        ]);
    }
}
