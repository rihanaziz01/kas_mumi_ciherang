<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TarifIuran extends Model
{
    use HasFactory;

    protected $table = 'tarif_iuran';

    protected $fillable = [
        'status_anggota',
        'jenis_iuran',
        'nominal',
    ];

    protected function casts(): array
    {
        return [
            'nominal' => 'float',
        ];
    }
}
