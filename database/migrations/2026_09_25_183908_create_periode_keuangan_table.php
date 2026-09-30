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
        Schema::create('periode_keuangan', function (Blueprint $table) {
            $table->id();
            $table->string('nama_periode', 50); // e.g. "Periode 2026"
            $table->date('tanggal_mulai');
            $table->date('tanggal_selesai')->nullable();
            $table->decimal('saldo_awal', 15, 2)->default(0.00);
            $table->decimal('saldo_akhir', 15, 2)->default(0.00);
            $table->enum('status', ['aktif', 'ditutup'])->default('aktif');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('periode_keuangan');
    }
};
