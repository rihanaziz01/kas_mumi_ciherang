<?php

namespace Tests\Feature;

use App\Models\Anggota;
use App\Models\Pemasukan;
use App\Models\Pembayaran;
use App\Models\Pengeluaran;
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

    public function test_periode_has_dynamic_12_month_cycle_starting_from_tanggal_mulai(): void
    {
        // 1. Test Periode mulai Juni 2026
        $periodeJuni = PeriodeKeuangan::create([
            'nama_periode' => 'Periode Pasca Qurban 2026',
            'tanggal_mulai' => '2026-06-01',
            'saldo_awal' => 0,
            'saldo_akhir' => 0,
            'status' => 'ditutup',
        ]);

        $expectedMonths = ['Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember', 'Januari', 'Februari', 'Maret', 'April', 'Mei'];
        $this->assertEquals($expectedMonths, $periodeJuni->getBulanList());

        $details = $periodeJuni->getBulanDetail();
        $this->assertCount(12, $details);
        $this->assertEquals('Juni', $details[0]['nama']);
        $this->assertEquals(2026, $details[0]['tahun']);
        $this->assertEquals('Mei', $details[11]['nama']);
        $this->assertEquals(2027, $details[11]['tahun']);

        // 2. Test cekIuran API returns this exact order
        $anggota = Anggota::first();
        $response = $this->getJson("/api/public/cek-iuran/{$anggota->id}?periode_id={$periodeJuni->id}");
        $response->assertStatus(200);

        $gridMonths = array_column($response->json('kas_kelompok.grid'), 'bulan');
        $this->assertEquals($expectedMonths, $gridMonths);
    }

    public function test_tutup_buku_only_carries_over_kas_kelompok_dan_uang_olahraga_keputrian(): void
    {
        // 1. Buat periode baru khusus pengujian tutup buku
        $periodeTest = PeriodeKeuangan::create([
            'nama_periode' => 'Periode Uji Tutup Buku',
            'tanggal_mulai' => '2026-01-01',
            'saldo_awal' => 100000, // Saldo awal kas kelompok
            'saldo_akhir' => 100000,
            'status' => 'aktif',
        ]);

        $anggota = Anggota::first();

        // 2. Input Pembayaran berbagai pos
        // Kas Kelompok: 50.000
        Pembayaran::create([
            'anggota_id' => $anggota->id,
            'periode_id' => $periodeTest->id,
            'jenis_iuran' => 'Kelompok',
            'periode_bayar' => 'Januari',
            'nominal' => 50000,
            'tanggal_bayar' => '2026-01-05',
        ]);

        // Kas Desa: 30.000 (titipan, tidak boleh dibawa)
        Pembayaran::create([
            'anggota_id' => $anggota->id,
            'periode_id' => $periodeTest->id,
            'jenis_iuran' => 'Desa',
            'periode_bayar' => 'Januari',
            'nominal' => 30000,
            'tanggal_bayar' => '2026-01-05',
        ]);

        // Tabungan Qurban: 200.000 (dibelanjakan qurban, tidak boleh dibawa)
        Pembayaran::create([
            'anggota_id' => $anggota->id,
            'periode_id' => $periodeTest->id,
            'jenis_iuran' => 'Qurban',
            'periode_bayar' => 'Januari',
            'nominal' => 200000,
            'tanggal_bayar' => '2026-01-05',
        ]);

        // Pemasukan Uang Olahraga: 75.000
        Pemasukan::create([
            'periode_id' => $periodeTest->id,
            'kategori' => 'Uang Olahraga',
            'nominal' => 75000,
            'tanggal' => '2026-01-10',
            'keterangan' => 'Uang futsal',
        ]);

        // Pemasukan Uang Keputrian: 40.000
        Pemasukan::create([
            'periode_id' => $periodeTest->id,
            'kategori' => 'Uang Keputrian',
            'nominal' => 40000,
            'tanggal' => '2026-01-10',
            'keterangan' => 'Kas keputrian',
        ]);

        // Pengeluaran Kas Kelompok (Umum): 20.000
        Pengeluaran::create([
            'periode_id' => $periodeTest->id,
            'kategori' => 'Konsumsi',
            'nominal' => 20000,
            'tanggal' => '2026-01-15',
            'keterangan' => 'Konsumsi rapat',
        ]);

        // Pengeluaran Olahraga: 15.000
        Pengeluaran::create([
            'periode_id' => $periodeTest->id,
            'kategori' => 'Uang Olahraga',
            'nominal' => 15000,
            'tanggal' => '2026-01-16',
            'keterangan' => 'Sewa lapangan',
        ]);

        // Perhitungan yang diharapkan:
        // Kas Kelompok: 100.000 (awal) + 50.000 (masuk) - 20.000 (keluar) = 130.000
        // Uang Olahraga: 75.000 - 15.000 = 60.000
        // Uang Keputrian: 40.000 - 0 = 40.000
        // Saldo yang BISA DIBAWA: 130.000 + 60.000 + 40.000 = 230.000
        // Kas Desa: 30.000 (tidak dibawa)
        // Tabungan Qurban: 200.000 (tidak dibawa)
        // Saldo Total Akhir Periode: 230.000 + 30.000 + 200.000 = 460.000

        $rincian = $periodeTest->calculateRincianSaldo();
        $this->assertEquals(130000.0, $rincian['saldo_kas_kelompok']);
        $this->assertEquals(60000.0, $rincian['saldo_olahraga']);
        $this->assertEquals(40000.0, $rincian['saldo_keputrian']);
        $this->assertEquals(30000.0, $rincian['saldo_desa']);
        $this->assertEquals(200000.0, $rincian['saldo_qurban']);
        $this->assertEquals(230000.0, $rincian['saldo_bisa_dibawa']);
        $this->assertEquals(460000.0, $rincian['saldo_akhir_kalkulasi']);

        // 3. Admin eksekusi Tutup Buku dengan bawa_saldo = true
        $user = User::where('email', 'rihan@ciherang.com')->first();
        $token = $user->createToken('admin_token')->plainTextToken;

        $tutupResponse = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/admin/periode/{$periodeTest->id}/tutup-buku", [
                'bawa_saldo' => true,
                'nama_periode_baru' => 'Periode Baru Pasca Uji',
                'tanggal_mulai_baru' => '2027-01-01',
            ]);

        $tutupResponse->assertStatus(200)
            ->assertJsonPath('saldo_bisa_dibawa', 230000)
            ->assertJsonPath('saldo_awal_baru', 230000)
            ->assertJsonPath('saldo_akhir_lama', 460000);

        // Pastikan periode baru di database memiliki saldo_awal tepat 230.000 (bukan 460.000)
        $periodeBaru = PeriodeKeuangan::where('nama_periode', 'Periode Baru Pasca Uji')->first();
        $this->assertNotNull($periodeBaru);
        $this->assertEquals(230000.0, (float) $periodeBaru->saldo_awal);
        $this->assertEquals('aktif', $periodeBaru->status);

        // Pastikan periode lama statusnya ditutup dengan saldo_akhir 460.000
        $periodeTest->refresh();
        $this->assertEquals('ditutup', $periodeTest->status);
        $this->assertEquals(460000.0, (float) $periodeTest->saldo_akhir);

        // 4. Test Opsi 2: Tutup buku dengan bawa_saldo = false (Reset ke Rp 0)
        $tutupResetResponse = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/admin/periode/{$periodeBaru->id}/tutup-buku", [
                'bawa_saldo' => false,
                'nama_periode_baru' => 'Periode Nol Saldo',
                'tanggal_mulai_baru' => '2028-01-01',
            ]);

        $tutupResetResponse->assertStatus(200)
            ->assertJsonPath('saldo_awal_baru', 0);

        $periodeNol = PeriodeKeuangan::where('nama_periode', 'Periode Nol Saldo')->first();
        $this->assertEquals(0.0, (float) $periodeNol->saldo_awal);
    }
}
