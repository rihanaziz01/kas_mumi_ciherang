<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('pembayaran', function (Blueprint $table) {
            $table->id();
            $table->foreignId('anggota_id')->constrained('anggota')->restrictOnDelete();
            $table->foreignId('periode_id')->constrained('periode_keuangan')->restrictOnDelete();
            $table->enum('jenis_iuran', ['Kelompok', 'Desa', 'Qurban', 'Keputrian', 'Olahraga']);
            $table->string('periode_bayar', 20); // Januari .. Desember or 2026
            $table->decimal('nominal', 15, 2);
            $table->date('tanggal_bayar');
            $table->text('catatan')->nullable();
            $table->timestamps();

            $table->unique(
                ['anggota_id', 'periode_id', 'jenis_iuran', 'periode_bayar'],
                'uq_pembayaran_periode'
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pembayaran');
    }
};
