<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TarifIuran;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TarifController extends Controller
{
    public function index(): JsonResponse
    {
        $tarifs = TarifIuran::orderBy('status_anggota')
            ->orderBy('jenis_iuran')
            ->get();

        return response()->json($tarifs);
    }

    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'status_anggota' => 'required|in:Pelajar,Mahasiswa,Pencaker,Pedagang,Karyawan A,Karyawan B',
            'jenis_iuran' => 'required|in:Kelompok,Desa,Qurban,Keputrian,Olahraga',
            'nominal' => 'required|numeric|min:0',
        ]);

        $tarif = TarifIuran::updateOrCreate(
            [
                'status_anggota' => $validated['status_anggota'],
                'jenis_iuran' => $validated['jenis_iuran'],
            ],
            [
                'nominal' => $validated['nominal'],
            ]
        );

        return response()->json([
            'message' => 'Tarif iuran berhasil diperbarui.',
            'data' => $tarif,
        ]);
    }
}
