<?php

namespace Database\Seeders;

use App\Models\TarifIuran;
use Illuminate\Database\Seeder;

class TarifKeputrianOlahragaSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $statuses = ['Pelajar', 'Mahasiswa', 'Pencaker', 'Pedagang', 'Karyawan A', 'Karyawan B'];

        foreach ($statuses as $st) {
            TarifIuran::updateOrCreate(
                ['status_anggota' => $st, 'jenis_iuran' => 'Keputrian'],
                ['nominal' => 5000]
            );
            TarifIuran::updateOrCreate(
                ['status_anggota' => $st, 'jenis_iuran' => 'Olahraga'],
                ['nominal' => 5000]
            );
        }
    }
}
