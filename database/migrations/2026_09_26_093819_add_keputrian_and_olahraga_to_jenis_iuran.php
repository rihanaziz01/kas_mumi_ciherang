<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE tarif_iuran MODIFY COLUMN jenis_iuran ENUM('Kelompok', 'Desa', 'Qurban', 'Keputrian', 'Olahraga') NOT NULL");
            DB::statement("ALTER TABLE pembayaran MODIFY COLUMN jenis_iuran ENUM('Kelompok', 'Desa', 'Qurban', 'Keputrian', 'Olahraga') NOT NULL");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE tarif_iuran MODIFY COLUMN jenis_iuran ENUM('Kelompok', 'Desa', 'Qurban') NOT NULL");
            DB::statement("ALTER TABLE pembayaran MODIFY COLUMN jenis_iuran ENUM('Kelompok', 'Desa', 'Qurban') NOT NULL");
        }
    }
};
