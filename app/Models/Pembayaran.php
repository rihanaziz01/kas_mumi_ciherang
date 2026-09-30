<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Pembayaran extends Model
{
    use HasFactory;

    protected $table = 'pembayaran';

    protected $fillable = [
        'anggota_id',
        'periode_id',
        'jenis_iuran',
        'periode_bayar',
        'nominal',
        'tanggal_bayar',
        'catatan',
    ];

    protected function casts(): array
    {
        return [
            'nominal' => 'float',
            'tanggal_bayar' => 'date:Y-m-d',
        ];
    }

    public function anggota(): BelongsTo
    {
        return $this->belongsTo(Anggota::class, 'anggota_id');
    }

    public function periode(): BelongsTo
    {
        return $this->belongsTo(PeriodeKeuangan::class, 'periode_id');
    }
}
