<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Anggota extends Model
{
    use HasFactory;

    protected $table = 'anggota';

    protected $fillable = [
        'kode_anggota',
        'nama',
        'status',
        'status_aktif',
    ];

    protected function casts(): array
    {
        return [
            'status_aktif' => 'boolean',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (Anggota $anggota) {
            if (empty($anggota->kode_anggota)) {
                $anggota->kode_anggota = static::generateNextKode();
            }
        });
    }

    /**
     * Generate kode anggota berikutnya (contoh: MM-001, MM-002, dst)
     */
    public static function generateNextKode(): string
    {
        $allKodes = static::whereNotNull('kode_anggota')->pluck('kode_anggota');
        $maxNum = 0;
        foreach ($allKodes as $kode) {
            if (preg_match('/^MM-(\d+)$/i', $kode, $matches)) {
                $num = (int) $matches[1];
                if ($num > $maxNum) {
                    $maxNum = $num;
                }
            }
        }

        return sprintf('MM-%03d', $maxNum + 1);
    }

    public function pembayaran(): HasMany
    {
        return $this->hasMany(Pembayaran::class, 'anggota_id');
    }

    public function pendapatanKaryawan(): HasMany
    {
        return $this->hasMany(PendapatanKaryawan::class, 'anggota_id');
    }
}
