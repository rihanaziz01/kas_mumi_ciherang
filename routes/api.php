<?php

use App\Http\Controllers\Api\AnggotaController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\KasController;
use App\Http\Controllers\Api\LaporanController;
use App\Http\Controllers\Api\PembayaranController;
use App\Http\Controllers\Api\PendapatanKaryawanController;
use App\Http\Controllers\Api\PeriodeController;
use App\Http\Controllers\Api\PublicController;
use App\Http\Controllers\Api\StatistikController;
use App\Http\Controllers\Api\TarifController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes - Sistem Keuangan Muda-Mudi Ciherang
|--------------------------------------------------------------------------
*/

// ==========================================
// 1. PUBLIC ROUTES (Tanpa Login / Open Access)
// ==========================================
Route::prefix('public')->group(function () {
    Route::get('/ringkasan', [PublicController::class, 'ringkasan']);
    Route::get('/periode-list', [PublicController::class, 'periodeList']);
    Route::get('/anggota-list', [PublicController::class, 'anggotaList']);
    Route::get('/cek-iuran/{anggotaId}', [PublicController::class, 'cekIuran']);
    Route::get('/buku-kas', [PublicController::class, 'bukuKas']);
});

// ==========================================
// 2. AUTHENTICATION ROUTE
// ==========================================
Route::post('/auth/login', [AuthController::class, 'login']);

// ==========================================
// 3. ADMIN PROTECTED ROUTES (Wajib Login Sanctum)
// ==========================================
Route::middleware('auth:sanctum')->group(function () {
    // Auth & Profil Admin
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::put('/admin/profil', [AuthController::class, 'updateProfile']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    // Periode Keuangan & Tutup Buku
    Route::get('/admin/periode', [PeriodeController::class, 'index']);
    Route::post('/admin/periode', [PeriodeController::class, 'store']);
    Route::post('/admin/periode/{id}/tutup-buku', [PeriodeController::class, 'tutupBuku']);
    Route::post('/admin/periode/{id}/set-aktif', [PeriodeController::class, 'setAktif']);
    Route::delete('/admin/periode/{id}', [PeriodeController::class, 'destroy']);

    // Master Anggota
    Route::get('/admin/anggota', [AnggotaController::class, 'index']);
    Route::post('/admin/anggota', [AnggotaController::class, 'store']);
    Route::put('/admin/anggota/{id}', [AnggotaController::class, 'update']);
    Route::delete('/admin/anggota/{id}', [AnggotaController::class, 'destroy']);

    // Master Tarif Iuran
    Route::get('/admin/tarif', [TarifController::class, 'index']);
    Route::put('/admin/tarif', [TarifController::class, 'update']);

    // Pendapatan Karyawan (Dinamis 2% Qurban)
    Route::get('/admin/pendapatan-karyawan', [PendapatanKaryawanController::class, 'index']);
    Route::post('/admin/pendapatan-karyawan', [PendapatanKaryawanController::class, 'store']);
    Route::delete('/admin/pendapatan-karyawan/{id}', [PendapatanKaryawanController::class, 'destroy']);

    // Transaksi Pembayaran Iuran (Termasuk 12 Bulan Sekaligus)
    Route::get('/admin/pembayaran', [PembayaranController::class, 'index']);
    Route::post('/admin/pembayaran/bulk', [PembayaranController::class, 'storeBulk']);
    Route::delete('/admin/pembayaran/{id}', [PembayaranController::class, 'destroy']);

    // Pemasukan & Pengeluaran Kas
    Route::get('/admin/pemasukan', [KasController::class, 'indexPemasukan']);
    Route::post('/admin/pemasukan', [KasController::class, 'storePemasukan']);
    Route::delete('/admin/pemasukan/{id}', [KasController::class, 'destroyPemasukan']);

    Route::get('/admin/pengeluaran', [KasController::class, 'indexPengeluaran']);
    Route::post('/admin/pengeluaran', [KasController::class, 'storePengeluaran']);
    Route::delete('/admin/pengeluaran/{id}', [KasController::class, 'destroyPengeluaran']);

    // Setoran Kas Desa Bulanan ke Desa
    Route::get('/admin/setoran-desa', [KasController::class, 'indexSetoranDesa']);
    Route::post('/admin/setoran-desa', [KasController::class, 'storeSetoranDesa']);
    Route::delete('/admin/setoran-desa/{id}', [KasController::class, 'destroySetoranDesa']);

    // Rekapitulasi & Laporan
    Route::get('/admin/laporan/rekap-iuran', [LaporanController::class, 'rekapIuran']);
    Route::get('/admin/laporan/neraca', [LaporanController::class, 'neraca']);
    Route::get('/admin/laporan/export-pdf', [LaporanController::class, 'exportPdf']);

    // Statistik & Analitik
    Route::get('/admin/statistik', [StatistikController::class, 'index']);
});
