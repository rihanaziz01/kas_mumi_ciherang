<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PendapatanKaryawan extends Model
{
    use HasFactory;

    protected $table = 'pendapatan_karyawan';

    protected $fillable = [
        'anggota_id',
        'bulan',
        'tahun',
        'pendapatan',
    ];

    protected $appends = [
        'nominal_qurban',
    ];

    protected function casts(): array
    {
        return [
            'pendapatan' => 'float',
            'tahun' => 'integer',
        ];
    }

    public function anggota(): BelongsTo
    {
        return $this->belongsTo(Anggota::class, 'anggota_id');
    }

    /**
     * Sesuai PRD Aturan Khusus Qurban Karyawan:
     * Qurban = 2% x Pendapatan 1 Bulan
     */
    public function getNominalQurbanAttribute(): float
    {
        return round((float) $this->pendapatan * 0.02, 2);
    }
}
