<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('anggota', function (Blueprint $table) {
            $table->string('kode_anggota', 20)->nullable()->unique()->after('id');
        });

        // Tetapkan kode_anggota berurutan berdasarkan alfabetis nama (Ajeng => MM-001, dst)
        $anggotas = DB::table('anggota')->orderBy('nama')->get();
        $counter = 1;
        foreach ($anggotas as $anggota) {
            DB::table('anggota')
                ->where('id', $anggota->id)
                ->update([
                    'kode_anggota' => sprintf('MM-%03d', $counter++),
                ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('anggota', function (Blueprint $table) {
            $table->dropColumn('kode_anggota');
        });
    }
};
