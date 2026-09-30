<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Anggota;
use App\Models\PendapatanKaryawan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PendapatanKaryawanController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = PendapatanKaryawan::with('anggota');

        if ($request->filled('tahun')) {
            $query->where('tahun', $request->query('tahun'));
        }

        if ($request->filled('anggota_id')) {
            $query->where('anggota_id', $request->query('anggota_id'));
        }

        $list = $query->orderByDesc('tahun')
            ->orderBy('bulan')
            ->get();

        return response()->json($list);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'anggota_id' => 'required|exists:anggota,id',
            'bulan' => 'required|string',
            'tahun' => 'required|integer|min:2020|max:2050',
            'pendapatan' => 'required|numeric|min:0',
        ]);

        $anggota = Anggota::findOrFail($validated['anggota_id']);
        if (! in_array($anggota->status, ['Karyawan A', 'Karyawan B'])) {
            return response()->json([
                'message' => 'Pencatatan pendapatan hanya berlaku untuk status Karyawan A atau Karyawan B.',
            ], 422);
        }

        $record = PendapatanKaryawan::updateOrCreate(
            [
                'anggota_id' => $validated['anggota_id'],
                'bulan' => $validated['bulan'],
                'tahun' => $validated['tahun'],
            ],
            [
                'pendapatan' => $validated['pendapatan'],
            ]
        );

        $record->load('anggota');

        return response()->json([
            'message' => 'Data pendapatan berhasil disimpan. Kewajiban Qurban (2%) otomatis terhitung: Rp '.number_format($record->nominal_qurban, 0, ',', '.'),
            'data' => $record,
        ], 201);
    }

    public function destroy(int $id): JsonResponse
    {
        $record = PendapatanKaryawan::findOrFail($id);
        $record->delete();

        return response()->json([
            'message' => 'Data pendapatan berhasil dihapus.',
        ]);
    }
}
