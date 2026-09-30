<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Laporan Neraca Arus Kas - {{ $periode->nama_periode }}</title>
    <style>
        @page {
            size: a4 portrait;
            margin: 10mm 12mm 12mm 12mm;
        }
        body {
            font-family: 'DejaVu Sans', Helvetica, Arial, sans-serif;
            font-size: 8.5pt;
            color: #1e293b;
            line-height: 1.35;
            margin: 0;
            padding: 0;
        }
        .header-table {
            width: 100%;
            border-collapse: collapse;
            border-bottom: 2px solid #0f172a;
            padding-bottom: 8px;
            margin-bottom: 12px;
        }
        .header-table td {
            vertical-align: middle;
        }
        .logo {
            height: 48px;
            width: auto;
        }
        .org-title {
            font-size: 13pt;
            font-weight: bold;
            color: #047857;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin: 0;
        }
        .org-subtitle {
            font-size: 8pt;
            font-weight: bold;
            color: #334155;
            margin: 1px 0 0 0;
            text-transform: uppercase;
        }
        .org-address {
            font-size: 7.5pt;
            color: #64748b;
            margin: 1px 0 0 0;
        }
        .badge-periode {
            background-color: #ecfdf5;
            border: 1px solid #a7f3d0;
            color: #065f46;
            font-weight: bold;
            font-size: 8pt;
            padding: 4px 8px;
            border-radius: 4px;
            display: inline-block;
            text-align: right;
        }
        .section-title {
            font-size: 9.5pt;
            font-weight: bold;
            color: #0f172a;
            text-transform: uppercase;
            border-bottom: 1px solid #cbd5e1;
            padding-bottom: 3px;
            margin-top: 10px;
            margin-bottom: 6px;
        }
        .card-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10px;
        }
        .card-table td {
            width: 50%;
            vertical-align: top;
            padding: 0 4px;
        }
        .box {
            border: 1px solid #cbd5e1;
            border-radius: 4px;
            padding: 8px 10px;
            background-color: #f8fafc;
        }
        .box-title {
            font-weight: bold;
            font-size: 8.5pt;
            text-transform: uppercase;
            padding-bottom: 4px;
            border-bottom: 1px dashed #cbd5e1;
            margin-bottom: 6px;
        }
        .line-item {
            width: 100%;
            border-collapse: collapse;
            font-size: 8pt;
            margin-bottom: 3px;
        }
        .line-item td {
            padding: 2px 0;
        }
        .line-item .label {
            color: #475569;
            text-align: left;
        }
        .line-item .amount {
            font-weight: bold;
            text-align: right;
            color: #0f172a;
        }
        .data-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 8pt;
            margin-bottom: 10px;
        }
        .data-table th {
            background-color: #f1f5f9;
            border: 1px solid #cbd5e1;
            padding: 5px 6px;
            text-align: left;
            font-weight: bold;
            color: #0f172a;
        }
        .data-table td {
            border: 1px solid #e2e8f0;
            padding: 4px 6px;
        }
        .data-table tbody tr:nth-child(even) {
            background-color: #f8fafc;
        }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .highlight-green {
            background-color: #ecfdf5 !important;
            color: #065f46 !important;
            font-weight: bold;
        }
        .signatures {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            page-break-inside: avoid;
        }
        .signatures td {
            width: 50%;
            text-align: center;
            font-size: 8.5pt;
            vertical-align: top;
        }
        .signature-space {
            height: 48px;
        }
        .signee-name {
            font-weight: bold;
            text-decoration: underline;
        }
        .signee-title {
            color: #64748b;
            font-size: 7.5pt;
        }
    </style>
</head>
<body>
    <!-- Kop Surat -->
    <table class="header-table">
        <tr>
            <td style="width: 50px;">
                @if(!empty($logo_base64))
                    <img src="{{ $logo_base64 }}" class="logo" alt="Logo">
                @endif
            </td>
            <td style="padding-left: 8px;">
                <h1 class="org-title">MUDA-MUDI CIHERANG</h1>
                <p class="org-subtitle">Sistem Administrasi & Transparansi Keuangan (Ciherang Fams)</p>
                <p class="org-address">Kp. Ciherang • Laporan Pertanggungjawaban Resmi (LPJ Finansial)</p>
            </td>
            <td style="text-align: right; width: 200px;">
                <div class="badge-periode">
                    LAPORAN ARUS KAS<br>
                    <span style="font-size: 9pt; color: #047857;">{{ $periode->nama_periode }}</span>
                </div>
                <div style="font-size: 6.5pt; color: #64748b; margin-top: 3px;">
                    Dicetak: {{ date('d F Y, H:i') }} WIB
                </div>
            </td>
        </tr>
    </table>

    <!-- Ringkasan Arus Kas Masuk & Keluar -->
    <table class="card-table">
        <tr>
            <td style="padding-left: 0;">
                <div class="box" style="border-color: #a7f3d0; background-color: #f0fdf4;">
                    <div class="box-title" style="color: #065f46;">
                        A. Total Kas Masuk (Pemasukan)
                    </div>
                    <table class="line-item">
                        <tr>
                            <td class="label">- Iuran Kas Kelompok</td>
                            <td class="amount">Rp {{ number_format($pemasukan['iuran_kelompok'], 0, ',', '.') }}</td>
                        </tr>
                        <tr>
                            <td class="label">- Iuran Kas Desa</td>
                            <td class="amount">Rp {{ number_format($pemasukan['iuran_desa'], 0, ',', '.') }}</td>
                        </tr>
                        <tr>
                            <td class="label">- Iuran Tabungan Qurban</td>
                            <td class="amount">Rp {{ number_format($pemasukan['iuran_qurban'], 0, ',', '.') }}</td>
                        </tr>
                        @foreach($pemasukan['pemasukan_lain'] as $pl)
                            <tr>
                                <td class="label">- {{ $pl['kategori'] }}</td>
                                <td class="amount">Rp {{ number_format($pl['total'], 0, ',', '.') }}</td>
                            </tr>
                        @endforeach
                        <tr style="border-top: 1px solid #86efac;">
                            <td class="label" style="font-weight: bold; color: #065f46; padding-top: 4px;">TOTAL PENERIMAAN KAS:</td>
                            <td class="amount" style="font-size: 9.5pt; color: #065f46; padding-top: 4px;">Rp {{ number_format($pemasukan['total'], 0, ',', '.') }}</td>
                        </tr>
                    </table>
                </div>
            </td>
            <td style="padding-right: 0;">
                <div class="box" style="border-color: #fecdd3; background-color: #fff1f2;">
                    <div class="box-title" style="color: #9f1239;">
                        B. Total Kas Keluar (Pengeluaran)
                    </div>
                    <table class="line-item">
                        @if(empty($pengeluaran['per_kategori']) || count($pengeluaran['per_kategori']) === 0)
                            <tr>
                                <td class="label" style="font-style: italic; color: #94a3b8;">Belum ada pengeluaran kas</td>
                                <td class="amount">Rp 0</td>
                            </tr>
                        @else
                            @foreach($pengeluaran['per_kategori'] as $pk)
                                <tr>
                                    <td class="label">- {{ $pk['kategori'] }}</td>
                                    <td class="amount">Rp {{ number_format($pk['total'], 0, ',', '.') }}</td>
                                </tr>
                            @endforeach
                        @endif
                        <tr style="border-top: 1px solid #fda4af;">
                            <td class="label" style="font-weight: bold; color: #9f1239; padding-top: 4px;">TOTAL PENGELUARAN KAS:</td>
                            <td class="amount" style="font-size: 9.5pt; color: #9f1239; padding-top: 4px;">Rp {{ number_format($pengeluaran['total'], 0, ',', '.') }}</td>
                        </tr>
                    </table>
                </div>
            </td>
        </tr>
    </table>

    <!-- Ringkasan Saldo Buku -->
    <div class="section-title">Rekapitulasi Saldo Kas Paguyuban</div>
    <table class="data-table">
        <thead>
            <tr>
                <th style="width: 25%;">Komponen Keuangan</th>
                <th style="width: 25%; text-align: right;">Saldo Awal</th>
                <th style="width: 25%; text-align: right;">Total Arus Kas Masuk (+)</th>
                <th style="width: 25%; text-align: right;">Total Arus Kas Keluar (-)</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td style="font-weight: bold;">Akumulasi Seluruh Kas</td>
                <td class="text-right">Rp {{ number_format($saldo_awal, 0, ',', '.') }}</td>
                <td class="text-right" style="color: #059669; font-weight: bold;">+ Rp {{ number_format($pemasukan['total'], 0, ',', '.') }}</td>
                <td class="text-right" style="color: #e11d48; font-weight: bold;">- Rp {{ number_format($pengeluaran['total'], 0, ',', '.') }}</td>
            </tr>
            <tr class="highlight-green">
                <td colspan="2" style="font-size: 9pt; text-transform: uppercase;">SALDO AKHIR (TOTAL LIKUIDITAS NYATA):</td>
                <td colspan="2" class="text-right" style="font-size: 10.5pt; font-weight: bold; color: #047857;">
                    Rp {{ number_format($saldo_akhir, 0, ',', '.') }}
                </td>
            </tr>
        </tbody>
    </table>

    <!-- Rincian Pos Alokasi Kas Finansial -->
    <div class="section-title">Pemisahan Pos Alokasi Kas (Buku Khusus)</div>
    <table class="data-table">
        <thead>
            <tr>
                <th style="width: 26%;">Nama Pos Kas</th>
                <th style="width: 18%; text-align: right;">Masuk</th>
                <th style="width: 18%; text-align: right;">Keluar</th>
                <th style="width: 20%; text-align: right;">Saldo Pos Saat Ini</th>
                <th style="width: 18%;">Kebijakan / Keterangan</th>
            </tr>
        </thead>
        <tbody>
            @foreach($pos_alokasi as $pos)
                <tr>
                    <td style="font-weight: bold;">{{ $pos['nama'] }}</td>
                    <td class="text-right" style="color: #059669;">+ Rp {{ number_format($pos['masuk'], 0, ',', '.') }}</td>
                    <td class="text-right" style="color: #e11d48;">- Rp {{ number_format($pos['keluar'], 0, ',', '.') }}</td>
                    <td class="text-right" style="font-weight: bold; font-size: 8.5pt;">Rp {{ number_format($pos['saldo'], 0, ',', '.') }}</td>
                    <td style="font-size: 7pt; color: #64748b;">{{ $pos['keterangan'] }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <div style="font-size: 7pt; color: #64748b; margin-top: 4px;">
        * Rekapitulasi pos kas di atas menjamin pemisahan dana operasional kelompok dari dana titipan desa dan tabungan qurban.
    </div>

    <!-- Tanda Tangan Pengurus -->
    <table class="signatures">
        <tr>
            <td>
                Mengetahui,<br>
                <strong>Ketua Muda-Mudi</strong>
                <div class="signature-space"></div>
                <span class="signee-name">( ............................................ )</span><br>
                <span class="signee-title">Ketua Pemuda Ciherang</span>
            </td>
            <td>
                Ciherang, {{ date('d F Y') }}<br>
                <strong>Bendahara Muda-Mudi</strong>
                <div class="signature-space"></div>
                <span class="signee-name">( Rihan / Azza )</span><br>
                <span class="signee-title">Bendahara Kas Keuangan</span>
            </td>
        </tr>
    </table>
</body>
</html>
