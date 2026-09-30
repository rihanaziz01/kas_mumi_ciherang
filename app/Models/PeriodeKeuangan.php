<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PeriodeKeuangan extends Model
{
    use HasFactory;

    protected $table = 'periode_keuangan';

    protected $fillable = [
        'nama_periode',
        'tanggal_mulai',
        'tanggal_selesai',
        'saldo_awal',
        'saldo_akhir',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'tanggal_mulai' => 'date',
            'tanggal_selesai' => 'date',
            'saldo_awal' => 'float',
            'saldo_akhir' => 'float',
        ];
    }

    public function pembayaran(): HasMany
    {
        return $this->hasMany(Pembayaran::class, 'periode_id');
    }

    public function pemasukan(): HasMany
    {
        return $this->hasMany(Pemasukan::class, 'periode_id');
    }

    public function pengeluaran(): HasMany
    {
        return $this->hasMany(Pengeluaran::class, 'periode_id');
    }
}
