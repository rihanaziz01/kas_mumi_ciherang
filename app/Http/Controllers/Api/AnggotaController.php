<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Anggota;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AnggotaController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Anggota::query();

        if ($request->filled('search')) {
            $s = $request->query('search');
            $query->where(function ($q) use ($s) {
                $q->where('nama', 'like', "%{$s}%")
                    ->orWhere('kode_anggota', 'like', "%{$s}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        if ($request->filled('status_aktif')) {
            $query->where('status_aktif', filter_var($request->query('status_aktif'), FILTER_VALIDATE_BOOLEAN));
        }

        $anggota = $query->orderBy('kode_anggota')->orderBy('nama')->get();

        return response()->json($anggota);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'kode_anggota' => 'nullable|string|max:20|unique:anggota,kode_anggota',
            'nama' => 'required|string|max:150',
            'status' => 'required|in:Pelajar,Mahasiswa,Pencaker,Pedagang,Karyawan A,Karyawan B',
            'status_aktif' => 'nullable|boolean',
        ]);

        $anggota = Anggota::create([
            'kode_anggota' => ! empty($validated['kode_anggota']) ? strtoupper(trim($validated['kode_anggota'])) : null,
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
            'kode_anggota' => ['sometimes', 'nullable', 'string', 'max:20', Rule::unique('anggota', 'kode_anggota')->ignore($id)],
            'nama' => 'sometimes|required|string|max:150',
            'status' => 'sometimes|required|in:Pelajar,Mahasiswa,Pencaker,Pedagang,Karyawan A,Karyawan B',
            'status_aktif' => 'sometimes|required|boolean',
        ]);

        if (array_key_exists('kode_anggota', $validated)) {
            $validated['kode_anggota'] = ! empty($validated['kode_anggota'])
                ? strtoupper(trim($validated['kode_anggota']))
                : $anggota->kode_anggota;
        }

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
