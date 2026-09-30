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
        Schema::create('tarif_iuran', function (Blueprint $table) {
            $table->id();
            $table->enum('status_anggota', [
                'Pelajar',
                'Mahasiswa',
                'Pencaker',
                'Pedagang',
                'Karyawan A',
                'Karyawan B',
            ]);
            $table->enum('jenis_iuran', ['Kelompok', 'Desa', 'Qurban', 'Keputrian', 'Olahraga']);
            $table->decimal('nominal', 15, 2)->default(0.00);
            $table->timestamps();

            $table->unique(['status_anggota', 'jenis_iuran'], 'uq_status_jenis');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tarif_iuran');
    }
};
