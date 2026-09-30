<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Pemasukan extends Model
{
    use HasFactory;

    protected $table = 'pemasukan';

    protected $fillable = [
        'periode_id',
        'kategori',
        'nominal',
        'tanggal',
        'keterangan',
    ];

    protected function casts(): array
    {
        return [
            'nominal' => 'float',
            'tanggal' => 'date:Y-m-d',
        ];
    }

    public function periode(): BelongsTo
    {
        return $this->belongsTo(PeriodeKeuangan::class, 'periode_id');
    }
}
