<?php

namespace Tests\Feature;

use App\Models\Anggota;
use App\Models\PeriodeKeuangan;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ApiFeatureTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
    }

    public function test_public_ringkasan_returns_expected_data(): void
    {
        $response = $this->getJson('/api/public/ringkasan');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'periode',
                'saldo_awal',
                'total_iuran',
                'total_pemasukan_lain',
                'total_masuk',
                'total_keluar',
                'saldo_bersih',
                'total_anggota_aktif',
            ]);
    }

    public function test_public_cek_iuran_returns_valid_grid(): void
    {
        $anggota = Anggota::first();
        $response = $this->getJson("/api/public/cek-iuran/{$anggota->id}");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'anggota',
                'periode',
                'kas_kelompok' => ['grid', 'total_lunas', 'tarif_bulanan'],
                'kas_desa' => ['grid', 'total_lunas', 'tarif_bulanan'],
                'qurban' => ['tipe', 'lunas'],
            ]);
    }

    public function test_admin_can_login_and_access_protected_routes(): void
    {
        // 1. Login dengan email Rihan
        $responseRihan = $this->postJson('/api/auth/login', [
            'email' => 'rihan@ciherang.com',
            'password' => 'rihan123',
        ]);

        $responseRihan->assertStatus(200)
            ->assertJsonStructure(['token', 'user'])
            ->assertJsonPath('user.name', 'Rihan');

        $tokenRihan = $responseRihan->json('token');

        $meResponse = $this->withHeader('Authorization', "Bearer {$tokenRihan}")
            ->getJson('/api/auth/me');

        $meResponse->assertStatus(200)
            ->assertJsonPath('user.email', 'rihan@ciherang.com');

        // 2. Login dengan username Azza
        $responseAzza = $this->postJson('/api/auth/login', [
            'email' => 'Azza',
            'password' => 'azza123',
        ]);

        $responseAzza->assertStatus(200)
            ->assertJsonStructure(['token', 'user'])
            ->assertJsonPath('user.name', 'Azza');

        // 3. Pastikan akun demo lama (admin@ciherang.com) ditolak
        $responseDemo = $this->postJson('/api/auth/login', [
            'email' => 'admin@ciherang.com',
            'password' => 'admin123',
        ]);
        $responseDemo->assertStatus(422);
    }

    public function test_admin_can_record_bulk_payments(): void
    {
        $user = User::where('email', 'rihan@ciherang.com')->first();
        $token = $user->createToken('test_token')->plainTextToken;

        $anggota = Anggota::where('nama', 'Ardina')->first();
        $periode = PeriodeKeuangan::where('status', 'aktif')->first();

        $payload = [
            'anggota_id' => $anggota->id,
            'periode_id' => $periode->id,
            'tanggal_bayar' => '2026-03-01',
            'catatan' => 'Test bayar 2 bulan',
            'items' => [
                [
                    'jenis_iuran' => 'Kelompok',
                    'bulan_list' => ['Maret', 'April'],
                ],
            ],
        ];

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/admin/pembayaran/bulk', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('created_count', 2);

        // Percobaan kedua dengan bulan dan jenis yang sama harus ditolak (anti duplikasi)
        $duplicateResponse = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/admin/pembayaran/bulk', $payload);

        $duplicateResponse->assertStatus(422)
            ->assertJsonPath('message', 'Semua tagihan untuk bulan dan jenis iuran yang dipilih sudah lunas sebelumnya. Tidak ada transaksi baru yang disimpan.');
    }

    public function test_employee_income_and_qurban_censored_for_public_and_visible_for_admin(): void
    {
        $azi = Anggota::where('nama', 'Azi')->first();

        // 1. Request Tanpa Login (Masyarakat Umum / Publik)
        $publicResponse = $this->getJson("/api/public/cek-iuran/{$azi->id}");
        $publicResponse->assertStatus(200);

        $qurbanPublic = $publicResponse->json('qurban');
        $this->assertEquals('dinamis_karyawan', $qurbanPublic['tipe']);
        $this->assertTrue($qurbanPublic['disensor']);
        $this->assertFalse($qurbanPublic['is_admin_viewer']);

        $januariPublic = collect($qurbanPublic['bulan_breakdown'])->firstWhere('bulan', 'Januari');
        $this->assertTrue($januariPublic['disensor']);
        $this->assertNull($januariPublic['pendapatan'], 'Pendapatan harus null untuk publik');
        $this->assertNull($januariPublic['kewajiban_2persen'], 'Kewajiban 2% harus null untuk publik');

        // 2. Request Dengan Token Admin (Pengurus)
        $user = User::where('email', 'rihan@ciherang.com')->first();
        $token = $user->createToken('admin_test_token')->plainTextToken;

        $adminResponse = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson("/api/public/cek-iuran/{$azi->id}");
        $adminResponse->assertStatus(200);

        $qurbanAdmin = $adminResponse->json('qurban');
        $this->assertFalse($qurbanAdmin['disensor']);
        $this->assertTrue($qurbanAdmin['is_admin_viewer']);

        $januariAdmin = collect($qurbanAdmin['bulan_breakdown'])->firstWhere('bulan', 'Januari');
        $this->assertFalse($januariAdmin['disensor']);
        $this->assertEquals(6000000.0, (float) $januariAdmin['pendapatan']);
        $this->assertEquals(120000.0, (float) $januariAdmin['kewajiban_2persen']);
    }

    public function test_qurban_is_monthly_with_12_month_grid_and_bulk_payment(): void
    {
        $pelajar = Anggota::where('status', 'Pelajar')->first();
        $periode = PeriodeKeuangan::where('status', 'aktif')->first();

        // 1. Cek response grid 12 bulan untuk Qurban Pelajar
        $response = $this->getJson("/api/public/cek-iuran/{$pelajar->id}");
        $response->assertStatus(200);

        $qurban = $response->json('qurban');
        $this->assertEquals('statis', $qurban['tipe']);
        $this->assertEquals(17000.0, (float) $qurban['tarif_bulanan']);
        $this->assertCount(12, $qurban['grid']);
        $this->assertEquals('Januari', $qurban['grid'][0]['bulan']);
        $this->assertEquals(17000.0, (float) $qurban['grid'][0]['nominal']);

        // 2. Admin bayar Qurban 2 bulan (Januari & Februari) untuk Pelajar
        $user = User::where('email', 'rihan@ciherang.com')->first();
        $token = $user->createToken('admin_token')->plainTextToken;

        $payload = [
            'anggota_id' => $pelajar->id,
            'periode_id' => $periode->id,
            'tanggal_bayar' => '2026-02-10',
            'items' => [
                [
                    'jenis_iuran' => 'Qurban',
                    'bulan_list' => ['Januari', 'Februari'],
                ],
            ],
        ];

        $payResponse = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/admin/pembayaran/bulk', $payload);

        $payResponse->assertStatus(201)
            ->assertJsonPath('created_count', 2)
            ->assertJsonPath('total_nominal', 34000);

        // 3. Cek kembali, pastikan Januari & Februari tercatat lunas di grid
        $updatedResponse = $this->getJson("/api/public/cek-iuran/{$pelajar->id}");
        $updatedQurban = $updatedResponse->json('qurban');
        $this->assertEquals(2, $updatedQurban['total_lunas']);
        $this->assertTrue($updatedQurban['grid'][0]['lunas']); // Januari
        $this->assertTrue($updatedQurban['grid'][1]['lunas']); // Februari
        $this->assertFalse($updatedQurban['grid'][2]['lunas']); // Maret
    }

    public function test_kas_operasional_keputrian_dan_olahraga(): void
    {
        $this->seed(DatabaseSeeder::class);

        $periode = PeriodeKeuangan::where('status', 'aktif')->first();
        $user = User::where('email', 'rihan@ciherang.com')->first();
        $token = $user->createToken('admin_token')->plainTextToken;

        // Admin mencatat Pemasukan Kas Operasional untuk Uang Keputrian dan Uang Olahraga
        $resMasukKeputrian = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/admin/pemasukan', [
                'periode_id' => $periode->id,
                'kategori' => 'Uang Keputrian',
                'nominal' => 150000,
                'tanggal' => '2026-03-01',
                'keterangan' => 'Kas keputrian kegiatan muslimah',
            ]);
        $resMasukKeputrian->assertStatus(201);

        $resMasukOlahraga = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/admin/pemasukan', [
                'periode_id' => $periode->id,
                'kategori' => 'Uang Olahraga',
                'nominal' => 200000,
                'tanggal' => '2026-03-02',
                'keterangan' => 'Iuran futsal kas bersama',
            ]);
        $resMasukOlahraga->assertStatus(201);

        // Verifikasi pada Neraca
        $neraca = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson("/api/admin/laporan/neraca?periode_id={$periode->id}");
        $neraca->assertStatus(200);

        $pemasukanLain = collect($neraca->json('pemasukan.pemasukan_lain'));
        $itemKeputrian = $pemasukanLain->firstWhere('kategori', 'Uang Keputrian');
        $itemOlahraga = $pemasukanLain->firstWhere('kategori', 'Uang Olahraga');

        $this->assertNotNull($itemKeputrian);
        $this->assertEquals(400000, $itemKeputrian['total']); // 250k seed + 150k baru
        $this->assertEquals(400000, $itemOlahraga['total']);  // 200k seed + 200k baru

        // Verifikasi Pemisahan Pos Alokasi Kas (di luar Kas Kelompok)
        $posAlokasi = $neraca->json('pos_alokasi');
        $this->assertNotNull($posAlokasi);
        $this->assertEquals(400000, $posAlokasi['uang_keputrian']['masuk']);
        $this->assertEquals(400000, $posAlokasi['uang_olahraga']['masuk']);
        $this->assertArrayHasKey('kas_kelompok', $posAlokasi);
    }

    public function test_admin_can_update_profile_and_password(): void
    {
        $user = User::where('email', 'rihan@ciherang.com')->first();
        $token = $user->createToken('admin_token')->plainTextToken;

        // 1. Update nama dan email
        $resUpdate = $this->withHeader('Authorization', "Bearer {$token}")
            ->putJson('/api/admin/profil', [
                'name' => 'Pengurus Inti Baru',
                'email' => 'pengurusbaru@ciherang.com',
            ]);

        $resUpdate->assertStatus(200)
            ->assertJsonPath('user.name', 'Pengurus Inti Baru')
            ->assertJsonPath('user.email', 'pengurusbaru@ciherang.com');

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'name' => 'Pengurus Inti Baru',
            'email' => 'pengurusbaru@ciherang.com',
        ]);

        // 2. Gagal ganti password jika current_password salah
        $resWrongPass = $this->withHeader('Authorization', "Bearer {$token}")
            ->putJson('/api/admin/profil', [
                'name' => 'Pengurus Inti Baru',
                'email' => 'pengurusbaru@ciherang.com',
                'current_password' => 'passwordsalah',
                'password' => 'passwordbaru123',
                'password_confirmation' => 'passwordbaru123',
            ]);

        $resWrongPass->assertStatus(422)
            ->assertJsonValidationErrors(['current_password']);

        // 3. Sukses ganti password jika current_password benar
        $resRightPass = $this->withHeader('Authorization', "Bearer {$token}")
            ->putJson('/api/admin/profil', [
                'name' => 'Pengurus Inti Baru',
                'email' => 'pengurusbaru@ciherang.com',
                'current_password' => 'rihan123',
                'password' => 'passwordbaru123',
                'password_confirmation' => 'passwordbaru123',
            ]);

        $resRightPass->assertStatus(200);

        // 4. Verifikasi login dengan password baru
        $loginRes = $this->postJson('/api/auth/login', [
            'email' => 'pengurusbaru@ciherang.com',
            'password' => 'passwordbaru123',
        ]);
        $loginRes->assertStatus(200);
    }

    public function test_admin_can_access_statistik_endpoint(): void
    {
        $user = User::where('email', 'rihan@ciherang.com')->first();
        $token = $user->createToken('admin_token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/admin/statistik');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'periode' => ['id', 'nama_periode', 'status', 'saldo_awal'],
                'periodes',
                'ringkasan' => [
                    'total_iuran',
                    'total_iuran_kelompok',
                    'total_iuran_desa',
                    'total_iuran_qurban',
                    'total_pemasukan_kas',
                    'total_pengeluaran_kas',
                    'total_kas_masuk',
                    'saldo_bersih',
                    'total_anggota',
                    'overall_compliance',
                ],
                'tren_bulanan',
                'distribusi_status',
                'kepatuhan_distribusi',
                'top_tertib',
                'perlu_perhatian',
                'kategori_kas' => ['pemasukan', 'pengeluaran'],
            ]);

        $this->assertCount(12, $response->json('tren_bulanan'));
    }

    public function test_admin_can_export_matriks_pdf(): void
    {
        $user = User::where('email', 'rihan@ciherang.com')->first();
        $token = $user->createToken('admin_token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->get('/api/admin/laporan/export-pdf?tab=matriks');

        $response->assertStatus(200);
        $this->assertEquals('application/pdf', $response->headers->get('content-type'));
        $this->assertStringContainsString('.pdf', $response->headers->get('content-disposition'));
        $this->assertNotEmpty($response->getContent());
    }

    public function test_admin_can_export_neraca_pdf(): void
    {
        $user = User::where('email', 'rihan@ciherang.com')->first();
        $token = $user->createToken('admin_token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->get('/api/admin/laporan/export-pdf?tab=neraca');

        $response->assertStatus(200);
        $this->assertEquals('application/pdf', $response->headers->get('content-type'));
        $this->assertStringContainsString('.pdf', $response->headers->get('content-disposition'));
        $this->assertNotEmpty($response->getContent());
    }

    public function test_anggota_has_kode_anggota_and_can_be_searched_by_code(): void
    {
        $user = User::where('email', 'rihan@ciherang.com')->first();
        $token = $user->createToken('admin_token')->plainTextToken;

        // 1. Verifikasi MM-001 dimiliki oleh Ajeng
        $ajeng = Anggota::where('nama', 'Ajeng')->first();
        $this->assertNotNull($ajeng);
        $this->assertEquals('MM-001', $ajeng->kode_anggota);

        // 2. Pencarian admin via search kode
        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/admin/anggota?search=MM-001');

        $response->assertStatus(200);
        $this->assertCount(1, $response->json());
        $this->assertEquals('Ajeng', $response->json('0.nama'));

        // 3. Tambah anggota baru tanpa kode_anggota otomatis dapat next MM-xxx
        $createRes = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/admin/anggota', [
                'nama' => 'Zulfa Baru',
                'status' => 'Pelajar',
                'status_aktif' => true,
            ]);

        $createRes->assertStatus(201);
        $this->assertStringStartsWith('MM-', $createRes->json('data.kode_anggota'));

        // 4. Verifikasi public anggota-list menyertakan kode_anggota
        $publicList = $this->getJson('/api/public/anggota-list');
        $publicList->assertStatus(200);
        $firstMember = $publicList->json('0');
        $this->assertArrayHasKey('kode_anggota', $firstMember);
        $this->assertEquals('MM-001', $firstMember['kode_anggota']);
    }
}
