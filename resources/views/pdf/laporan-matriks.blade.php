<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Laporan Matriks Iuran - {{ $periode->nama_periode }}</title>
    <style>
        @page {
            size: a4 landscape;
            margin: 8mm 8mm 10mm 8mm;
        }
        body {
            font-family: 'DejaVu Sans', Helvetica, Arial, sans-serif;
            font-size: 8pt;
            color: #1e293b;
            line-height: 1.25;
            margin: 0;
            padding: 0;
        }
        .header-table {
            width: 100%;
            border-collapse: collapse;
            border-bottom: 2px solid #0f172a;
            padding-bottom: 6px;
            margin-bottom: 8px;
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
            font-size: 7pt;
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
        .summary-boxes {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 8px;
        }
        .summary-boxes td {
            padding: 5px 8px;
            background-color: #f8fafc;
            border: 1px solid #cbd5e1;
            font-size: 7.5pt;
        }
        .summary-boxes .label {
            color: #64748b;
            font-size: 6.5pt;
            text-transform: uppercase;
            font-weight: bold;
            display: block;
        }
        .summary-boxes .val {
            font-weight: bold;
            font-size: 8.5pt;
            color: #0f172a;
            margin-top: 1px;
        }
        .matrix-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 7pt;
            margin-bottom: 12px;
        }
        .matrix-table thead {
            display: table-header-group;
        }
        .matrix-table th {
            background-color: #f1f5f9;
            color: #0f172a;
            font-weight: bold;
            border: 1px solid #cbd5e1;
            padding: 4px 2px;
            text-align: center;
        }
        .matrix-table td {
            border: 1px solid #e2e8f0;
            padding: 3px 2px;
            vertical-align: middle;
        }
        .matrix-table tbody tr:nth-child(even) {
            background-color: #f8fafc;
        }
        .text-center { text-align: center; }
        .text-left { text-align: left; }
        .text-right { text-align: right; }
        .paid-dot {
            color: #059669;
            font-weight: bold;
            font-size: 8pt;
        }
        .unpaid-dot {
            color: #cbd5e1;
            font-size: 8pt;
        }
        .total-row td {
            background-color: #e2e8f0 !important;
            font-weight: bold;
            border-top: 2px solid #0f172a !important;
            border-bottom: 2px solid #0f172a !important;
            font-size: 7.5pt;
        }
        .signatures {
            width: 100%;
            border-collapse: collapse;
            margin-top: 14px;
            page-break-inside: avoid;
        }
        .signatures td {
            width: 50%;
            text-align: center;
            font-size: 8pt;
            vertical-align: top;
        }
        .signature-space {
            height: 40px;
        }
        .signee-name {
            font-weight: bold;
            text-decoration: underline;
        }
        .signee-title {
            color: #64748b;
            font-size: 7pt;
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
                <h1 class="org-title">PAGUYUBAN MUDA-MUDI CIHERANG</h1>
                <p class="org-subtitle">Sistem Administrasi & Transparansi Keuangan (Ciherang Fams)</p>
                <p class="org-address">Kp. Ciherang • Laporan Pertanggungjawaban Resmi (LPJ Finansial)</p>
            </td>
            <td style="text-align: right; width: 220px;">
                <div class="badge-periode">
                    REKAP MATRIKS IURAN 12 BULAN<br>
                    <span style="font-size: 9pt; color: #047857;">{{ $periode->nama_periode }}</span>
                </div>
                <div style="font-size: 6.5pt; color: #64748b; margin-top: 3px;">
                    Dicetak: {{ date('d F Y, H:i') }} WIB
                </div>
            </td>
        </tr>
    </table>

    <!-- Ringkasan Global -->
    <table class="summary-boxes">
        <tr>
            <td style="width: 18%;">
                <span class="label">Total Anggota</span>
                <div class="val">{{ $total_anggota }} Orang</div>
            </td>
            <td style="width: 20%;">
                <span class="label">Kas Kelompok (12 Bulan)</span>
                <div class="val">Rp {{ number_format($grand_total_kelompok, 0, ',', '.') }}</div>
            </td>
            <td style="width: 20%;">
                <span class="label">Kas Desa (12 Bulan)</span>
                <div class="val">Rp {{ number_format($grand_total_desa, 0, ',', '.') }}</div>
            </td>
            <td style="width: 20%;">
                <span class="label">Tabungan Qurban</span>
                <div class="val">Rp {{ number_format($grand_total_qurban, 0, ',', '.') }}</div>
            </td>
            <td style="width: 22%; background-color: #ecfdf5; border-color: #a7f3d0;">
                <span class="label" style="color: #065f46;">Grand Total Iuran</span>
                <div class="val" style="color: #065f46;">Rp {{ number_format($grand_total_iuran, 0, ',', '.') }}</div>
            </td>
        </tr>
    </table>

    <!-- Matriks Iuran 12 Bulan -->
    <table class="matrix-table">
        <thead>
            <tr>
                <th rowspan="2" style="width: 22px;">No</th>
                <th rowspan="2" style="width: 130px; text-align: left; padding-left: 4px;">Nama Anggota</th>
                <th rowspan="2" style="width: 65px;">Status</th>
                <th colspan="12">Kelunasan Kas Kelompok (12 Bulan)</th>
                <th rowspan="2" style="width: 75px;">Total Kelompok</th>
                <th rowspan="2" style="width: 75px;">Total Desa</th>
                <th rowspan="2" style="width: 95px;">Iuran Qurban</th>
                <th rowspan="2" style="width: 85px;">Grand Total</th>
            </tr>
            <tr>
                @foreach(['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'] as $bln)
                    <th style="width: 18px; font-size: 6.5pt;">{{ $bln }}</th>
                @endforeach
            </tr>
        </thead>
        <tbody>
            @foreach($rows as $idx => $row)
                <tr>
                    <td class="text-center">{{ $idx + 1 }}</td>
                    <td class="text-left" style="font-weight: bold; padding-left: 4px;">
                        @if(!empty($row['kode_anggota']))
                            <span style="font-family: monospace; font-size: 6.5pt; color: #047857; margin-right: 2px;">{{ $row['kode_anggota'] }}</span>
                        @endif
                        {{ $row['nama'] }}
                    </td>
                    <td class="text-center" style="font-size: 6.5pt; color: #475569;">{{ $row['status'] }}</td>
                    
                    @foreach($bulan_list as $bln)
                        <td class="text-center">
                            @if(!empty($row['kelompok'][$bln]))
                                <span class="paid-dot">&#x25CF;</span>
                            @else
                                <span class="unpaid-dot">&#x25CB;</span>
                            @endif
                        </td>
                    @endforeach

                    <td class="text-right" style="padding-right: 3px;">Rp {{ number_format($row['total_kelompok'], 0, ',', '.') }}</td>
                    <td class="text-right" style="padding-right: 3px;">Rp {{ number_format($row['total_desa'], 0, ',', '.') }}</td>
                    <td class="text-center" style="font-size: 6.5pt;">
                        {{ $row['qurban']['info'] }}
                    </td>
                    <td class="text-right" style="font-weight: bold; padding-right: 3px;">
                        Rp {{ number_format($row['grand_total_member'], 0, ',', '.') }}
                    </td>
                </tr>
            @endforeach
        </tbody>
        <tfoot>
            <tr class="total-row">
                <td colspan="15" class="text-right" style="padding-right: 6px; text-transform: uppercase;">
                    TOTAL KESELURUHAN:
                </td>
                <td class="text-right" style="padding-right: 3px;">Rp {{ number_format($grand_total_kelompok, 0, ',', '.') }}</td>
                <td class="text-right" style="padding-right: 3px;">Rp {{ number_format($grand_total_desa, 0, ',', '.') }}</td>
                <td class="text-center" style="font-size: 7pt;">Rp {{ number_format($grand_total_qurban, 0, ',', '.') }}</td>
                <td class="text-right" style="color: #065f46; font-size: 8pt; padding-right: 3px;">
                    Rp {{ number_format($grand_total_iuran, 0, ',', '.') }}
                </td>
            </tr>
        </tfoot>
    </table>

    <div style="font-size: 6.5pt; color: #64748b; margin-top: 4px;">
        * Keterangan Simbol: &#x25CF; = Lunas &bull; &#x25CB; = Belum Lunas &bull; Dokumen sah diterbitkan melalui Sistem Keuangan Ciherang Fams.
    </div>

    <!-- Tanda Tangan Pengurus -->
    <table class="signatures">
        <tr>
            <td>
                Mengetahui,<br>
                <strong>Ketua Paguyuban Muda-Mudi</strong>
                <div class="signature-space"></div>
                <span class="signee-name">( ............................................ )</span><br>
                <span class="signee-title">Ketua Pemuda Ciherang</span>
            </td>
            <td>
                Ciherang, {{ date('d F Y') }}<br>
                <strong>Bendahara Paguyuban</strong>
                <div class="signature-space"></div>
                <span class="signee-name">( Rihan / Azza )</span><br>
                <span class="signee-title">Bendahara Kas Keuangan</span>
            </td>
        </tr>
    </table>
</body>
</html>
