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
        Schema::create('pendapatan_karyawan', function (Blueprint $table) {
            $table->id();
            $table->foreignId('anggota_id')->constrained('anggota')->cascadeOnDelete();
            $table->string('bulan', 20); // Januari .. Desember
            $table->integer('tahun');    // 2026
            $table->decimal('pendapatan', 15, 2);
            $table->timestamps();

            $table->unique(['anggota_id', 'bulan', 'tahun'], 'uq_pendapatan_anggota_periode');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pendapatan_karyawan');
    }
};
