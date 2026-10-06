import React, { useState, useEffect } from 'react';
import api from '../../api';
import {
    FileText,
    CheckCircle2,
    XCircle,
    Download,
    Calendar,
    Wallet,
    TrendingUp,
    Loader2
} from 'lucide-react';

export default function Laporan() {
    const [periodes, setPeriodes] = useState([]);
    const [selectedPeriodeId, setSelectedPeriodeId] = useState('');
    const [rekapData, setRekapData] = useState(null);
    const [neracaData, setNeracaData] = useState(null);
    const [tab, setTab] = useState('matriks'); // 'matriks' | 'neraca'
    const [loading, setLoading] = useState(true);
    const [downloadingPdf, setDownloadingPdf] = useState(false);

    const formatRupiah = (num) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(num || 0);
    };

    useEffect(() => {
        fetchPeriodes();
    }, []);

    const fetchPeriodes = async () => {
        try {
            const res = await api.get('/public/periode-list');
            setPeriodes(res.data);
            const active = res.data.find((p) => p.status === 'aktif') || res.data[0];
            if (active) {
                setSelectedPeriodeId(active.id);
                loadLaporan(active.id);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const loadLaporan = async (periodeId) => {
        setLoading(true);
        try {
            const [resRekap, resNeraca] = await Promise.all([
                api.get(`/admin/laporan/rekap-iuran?periode_id=${periodeId}`),
                api.get(`/admin/laporan/neraca?periode_id=${periodeId}`),
            ]);
            setRekapData(resRekap.data);
            setNeracaData(resNeraca.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handlePeriodeChange = (e) => {
        const id = e.target.value;
        setSelectedPeriodeId(id);
        loadLaporan(id);
    };

    const handleDownloadPdf = async () => {
        if (!selectedPeriodeId || downloadingPdf) return;
        setDownloadingPdf(true);
        try {
            const res = await api.get('/admin/laporan/export-pdf', {
                params: {
                    periode_id: selectedPeriodeId,
                    tab: tab,
                },
                responseType: 'blob',
            });

            const blob = new Blob([res.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            const currentPeriode = periodes.find((p) => String(p.id) === String(selectedPeriodeId));
            const safeName = (currentPeriode?.nama_periode || 'Periode').replace(/\s+/g, '_');
            link.setAttribute(
                'download',
                tab === 'neraca'
                    ? `Laporan_Neraca_${safeName}.pdf`
                    : `Laporan_Matriks_Iuran_${safeName}.pdf`
            );
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Gagal mengunduh PDF:', err);
            alert('Gagal mengunduh file PDF laporan. Silakan coba lagi.');
        } finally {
            setDownloadingPdf(false);
        }
    };

    return (
        <div className="space-y-6 pb-12 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                        <FileText className="w-6 h-6 text-emerald-600" />
                        Rekapitulasi Laporan Keuangan Mumi Ciherang
                    </h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Matriks 12 bulan seluruh anggota, kas masuk & keluar, dan unduh dokumen resmi PDF.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <select
                        value={selectedPeriodeId}
                        onChange={handlePeriodeChange}
                        className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-bold text-slate-900 dark:text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                        {periodes.map((p) => (
                            <option key={p.id} value={p.id}>
                                {p.nama_periode} {p.status === 'aktif' ? '(Aktif)' : '(Ditutup)'}
                            </option>
                        ))}
                    </select>

                    <button
                        onClick={handleDownloadPdf}
                        disabled={downloadingPdf || loading}
                        className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {downloadingPdf ? (
                            <>
                                <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
                                <span>Mengunduh PDF...</span>
                            </>
                        ) : (
                            <>
                                <Download className="w-4 h-4 text-emerald-400 dark:text-white" />
                                <span>Unduh PDF ({tab === 'neraca' ? 'Neraca' : 'Matriks'})</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Kop Surat / Header Resmi Cetak */}
            <div className="hidden print:block mb-4 pb-3 border-b-2 border-slate-900 text-slate-900">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                        <img
                            src="/images/logo-cropped.png"
                            alt="Ciherang Fams"
                            className="h-16 w-auto object-contain"
                        />
                        <div>
                            <h2 className="text-base font-black tracking-wider uppercase text-slate-900 leading-tight">
                                MUDA-MUDI CIHERANG
                            </h2>
                            <p className="text-[11px] font-bold text-slate-700 tracking-wide uppercase mt-0.5">
                                Sistem Administrasi & Transparansi Keuangan (Ciherang Fams)
                            </p>
                            <p className="text-[10px] text-slate-500">
                                Kp. Ciherang • Laporan Resmi Pertanggungjawaban Finansial
                            </p>
                        </div>
                    </div>
                    <div className="text-right text-[11px]">
                        <div className="inline-block px-3 py-1 bg-slate-100 border border-slate-300 rounded font-black text-slate-900 uppercase text-[10px]">
                            {tab === 'matriks' ? 'Rekap Matriks Iuran 12 Bulan' : 'Neraca Saldo Arus Kas'}
                        </div>
                        <p className="mt-1 font-bold text-slate-900">
                            {rekapData?.periode?.nama_periode || 'Periode Aktif'}
                        </p>
                        <p className="text-[10px] text-slate-500">
                            Dicetak: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                    </div>
                </div>
                <div className="border-b border-slate-400 mt-2"></div>
            </div>

            {/* Tab Switcher (Print: hidden) */}
            <div className="flex rounded-2xl bg-slate-200/80 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 p-1.5 max-w-sm print:hidden transition-colors">
                <button
                    onClick={() => setTab('matriks')}
                    className={`flex-1 py-2 rounded-xl font-extrabold text-xs transition ${tab === 'matriks'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                >
                    Matriks 12 Bulan Mumi
                </button>
                <button
                    onClick={() => setTab('neraca')}
                    className={`flex-1 py-2 rounded-xl font-extrabold text-xs transition ${tab === 'neraca'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                >
                    Neraca Saldo Kas
                </button>
            </div>

            {/* Content: Matriks 12 Bulan */}
            {tab === 'matriks' && rekapData && (
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 print:border-none print:shadow-none print:p-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4 print:hidden">
                        <div>
                            <h2 className="text-base font-bold text-slate-900 dark:text-white">
                                Matriks Pembayaran Iuran ({rekapData.periode?.nama_periode})
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Total Kas Kelompok: <strong className="text-slate-700 dark:text-slate-200">{formatRupiah(rekapData.grand_total_kelompok)}</strong> • Kas Desa: <strong className="text-slate-700 dark:text-slate-200">{formatRupiah(rekapData.grand_total_desa)}</strong> • Qurban: <strong className="text-slate-700 dark:text-slate-200">{formatRupiah(rekapData.grand_total_qurban)}</strong>
                            </p>
                        </div>
                        <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800/60">
                            Total Iuran Terkumpul: {formatRupiah(rekapData.grand_total_iuran)}
                        </span>
                    </div>

                    <div className="overflow-x-auto print:overflow-visible">
                        <table className="w-full text-left text-[11px] print:text-[9.5px] border-collapse border border-slate-300 dark:border-slate-700 print:border-black">
                            <thead>
                                <tr className="border-b border-slate-300 dark:border-slate-700 print:border-black text-slate-800 dark:text-slate-200 uppercase bg-slate-100 dark:bg-slate-800 print:bg-slate-100 font-black">
                                    <th className="py-2 px-1.5 border border-slate-300 dark:border-slate-700 print:border-slate-400 text-center w-7">No</th>
                                    <th className="py-2 px-2.5 border border-slate-300 dark:border-slate-700 print:border-slate-400 font-black">Nama Anggota</th>
                                    <th className="py-2 px-2 border border-slate-300 dark:border-slate-700 print:border-slate-400 text-center">Status</th>
                                    <th className="py-1 px-1 border border-slate-300 dark:border-slate-700 print:border-slate-400 text-center" colSpan={12}>
                                        Kas Kelompok (Jan - Des)
                                    </th>
                                    <th className="py-2 px-2 border border-slate-300 dark:border-slate-700 print:border-slate-400 text-right whitespace-nowrap">Tot. Kelompok</th>
                                    <th className="py-2 px-2 border border-slate-300 dark:border-slate-700 print:border-slate-400 text-right whitespace-nowrap">Tot. Desa</th>
                                    <th className="py-2 px-2 border border-slate-300 dark:border-slate-700 print:border-slate-400 text-center">Qurban</th>
                                    <th className="py-2 px-2.5 border border-slate-300 dark:border-slate-700 print:border-slate-400 text-right whitespace-nowrap font-black">Grand Total</th>
                                </tr>
                                <tr className="border-b border-slate-300 dark:border-slate-700 print:border-black text-slate-600 dark:text-slate-400 text-[9px] uppercase bg-slate-50 dark:bg-slate-800/60 print:bg-slate-50 font-bold">
                                    <th className="border border-slate-300 dark:border-slate-700 print:border-slate-400"></th>
                                    <th className="border border-slate-300 dark:border-slate-700 print:border-slate-400"></th>
                                    <th className="border border-slate-300 dark:border-slate-700 print:border-slate-400"></th>
                                    {(rekapData.bulan_detail || rekapData.bulan_list || []).map((b, idx) => {
                                        const char = typeof b === 'object' ? (b.singkat || b.nama.charAt(0)) : b.charAt(0);
                                        const title = typeof b === 'object' ? b.label : b;
                                        return (
                                            <th key={idx} title={title} className="py-0.5 px-0.5 text-center border border-slate-300 dark:border-slate-700 print:border-slate-400 font-extrabold w-4 text-[8.5px]">
                                                {char}
                                            </th>
                                        );
                                    })}
                                    <th className="border border-slate-300 dark:border-slate-700 print:border-slate-400"></th>
                                    <th className="border border-slate-300 dark:border-slate-700 print:border-slate-400"></th>
                                    <th className="border border-slate-300 dark:border-slate-700 print:border-slate-400"></th>
                                    <th className="border border-slate-300 dark:border-slate-700 print:border-slate-400"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 print:divide-slate-300">
                                {rekapData.rows.map((row, idx) => (
                                    <tr key={row.anggota_id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 print:break-inside-avoid">
                                        <td className="py-1.5 px-1.5 text-center text-slate-500 dark:text-slate-400 print:text-black border border-slate-200 dark:border-slate-800 font-medium">{idx + 1}</td>
                                        <td className="py-1.5 px-2.5 font-bold text-slate-900 dark:text-white print:text-black border border-slate-200 dark:border-slate-800 whitespace-nowrap">
                                            {row.nama}
                                        </td>
                                        <td className="py-1.5 px-2 text-center text-slate-600 dark:text-slate-400 print:text-black border border-slate-200 dark:border-slate-800 text-[10px] whitespace-nowrap">{row.status}</td>

                                        {/* 12 Months Kelompok indicators */}
                                        {rekapData.bulan_list.map((b) => (
                                            <td key={b} className="py-1 px-0.5 text-center border border-slate-200 dark:border-slate-800">
                                                {row.kelompok[b] ? (
                                                    <span className="text-emerald-700 dark:text-emerald-400 print:text-black font-black text-xs leading-none">●</span>
                                                ) : (
                                                    <span className="text-slate-300 dark:text-slate-700 print:text-slate-300 text-xs leading-none">○</span>
                                                )}
                                            </td>
                                        ))}

                                        <td className="py-1.5 px-2 text-right font-semibold text-slate-700 dark:text-slate-300 print:text-black border border-slate-200 dark:border-slate-800 whitespace-nowrap">
                                            {formatRupiah(row.total_kelompok)}
                                        </td>
                                        <td className="py-1.5 px-2 text-right font-semibold text-slate-700 dark:text-slate-300 print:text-black border border-slate-200 dark:border-slate-800 whitespace-nowrap">
                                            {formatRupiah(row.total_desa)}
                                        </td>
                                        <td className="py-1.5 px-2 text-center border border-slate-200 dark:border-slate-800 whitespace-nowrap">
                                            <span className={`px-1.5 py-0.5 rounded text-[9.5px] font-bold ${row.qurban.status ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 print:bg-transparent print:text-black print:border print:border-slate-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 print:bg-transparent print:text-slate-500'
                                                }`}>
                                                {row.qurban.info}
                                            </span>
                                        </td>
                                        <td className="py-1.5 px-2.5 text-right font-black text-slate-900 dark:text-white print:text-black border border-slate-200 dark:border-slate-800 whitespace-nowrap">
                                            {formatRupiah(row.grand_total_member)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="border-t-2 border-slate-400 dark:border-slate-700 print:border-black bg-slate-100 dark:bg-slate-800/80 font-black text-slate-900 dark:text-white print:text-black">
                                <tr className="print:break-inside-avoid">
                                    <td colSpan={15} className="py-2 px-3 text-right uppercase text-[10px] font-black border border-slate-300 dark:border-slate-700 print:border-slate-400">
                                        Total Seluruh Anggota:
                                    </td>
                                    <td className="py-2 px-2 text-right font-black border border-slate-300 dark:border-slate-700 print:border-slate-400 whitespace-nowrap">
                                        {formatRupiah(rekapData.grand_total_kelompok)}
                                    </td>
                                    <td className="py-2 px-2 text-right font-black border border-slate-300 dark:border-slate-700 print:border-slate-400 whitespace-nowrap">
                                        {formatRupiah(rekapData.grand_total_desa)}
                                    </td>
                                    <td className="py-2 px-2 text-center font-bold text-[10px] border border-slate-300 dark:border-slate-700 print:border-slate-400 whitespace-nowrap">
                                        {formatRupiah(rekapData.grand_total_qurban)}
                                    </td>
                                    <td className="py-2 px-2.5 text-right text-emerald-700 dark:text-emerald-400 print:text-black text-xs font-black border border-slate-300 dark:border-slate-700 print:border-slate-400 whitespace-nowrap">
                                        {formatRupiah(rekapData.grand_total_iuran)}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            )}

            {/* Content: Neraca Saldo */}
            {tab === 'neraca' && neracaData && (
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 print:border-none print:shadow-none print:p-0">
                    <h2 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
                        Laporan Arus Kas ({neracaData.periode?.nama_periode})
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                        {/* Pemasukan */}
                        <div className="space-y-3 p-5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60">
                            <h3 className="font-extrabold text-sm text-emerald-950 dark:text-emerald-300 uppercase tracking-wider flex items-center justify-between">
                                <span>A. Total Kas Masuk</span>
                                <span>{formatRupiah(neracaData.pemasukan?.total)}</span>
                            </h3>
                            <div className="space-y-2 text-slate-700 dark:text-slate-300">
                                <div className="flex justify-between">
                                    <span>- Iuran Kas Kelompok:</span>
                                    <strong className="text-slate-900 dark:text-white">{formatRupiah(neracaData.pemasukan?.iuran_kelompok)}</strong>
                                </div>
                                <div className="flex justify-between">
                                    <span>- Iuran Kas Desa:</span>
                                    <strong className="text-slate-900 dark:text-white">{formatRupiah(neracaData.pemasukan?.iuran_desa)}</strong>
                                </div>
                                <div className="flex justify-between">
                                    <span>- Iuran Qurban:</span>
                                    <strong className="text-slate-900 dark:text-white">{formatRupiah(neracaData.pemasukan?.iuran_qurban)}</strong>
                                </div>
                                {neracaData.pemasukan?.pemasukan_lain?.map((pl) => (
                                    <div key={pl.kategori} className="flex justify-between">
                                        <span>- {pl.kategori}:</span>
                                        <strong className="text-slate-900 dark:text-white">{formatRupiah(pl.total)}</strong>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Pengeluaran */}
                        <div className="space-y-3 p-5 rounded-2xl bg-rose-50/50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60">
                            <h3 className="font-extrabold text-sm text-rose-950 dark:text-rose-300 uppercase tracking-wider flex items-center justify-between">
                                <span>B. Total Kas Keluar</span>
                                <span>{formatRupiah(neracaData.pengeluaran?.total)}</span>
                            </h3>
                            <div className="space-y-2 text-slate-700 dark:text-slate-300">
                                {neracaData.pengeluaran?.per_kategori?.map((pk) => (
                                    <div key={pk.kategori} className="flex justify-between">
                                        <span>- Operasional {pk.kategori}:</span>
                                        <strong className="text-slate-900 dark:text-white">{formatRupiah(pk.total)}</strong>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Pos Alokasi Saldo Kas Terpisah */}
                    {neracaData.pos_alokasi && (
                        <div className="space-y-3 pt-2">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                                    <span>🏛️</span>
                                    <span>Pemisahan Pos Alokasi Saldo Kas (Keputrian & Olahraga di Luar Kas Kelompok)</span>
                                </h3>
                                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                                    Alokasi riil per pos keuangan
                                </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                                {/* Kas Kelompok */}
                                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="font-extrabold text-xs text-slate-800 dark:text-white">
                                            💼 {neracaData.pos_alokasi.kas_kelompok?.nama}
                                        </span>
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                                            Kas Kelompok
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Sisa Saldo Kas Kelompok:</span>
                                        <p className="text-lg font-black text-slate-900 dark:text-white">
                                            {formatRupiah(neracaData.pos_alokasi.kas_kelompok?.saldo)}
                                        </p>
                                    </div>
                                    <div className="text-[10px] text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-700 pt-1.5 flex justify-between">
                                        <span>Masuk: +{formatRupiah(neracaData.pos_alokasi.kas_kelompok?.masuk)}</span>
                                        <span>Keluar: -{formatRupiah(neracaData.pos_alokasi.kas_kelompok?.keluar)}</span>
                                    </div>
                                </div>

                                {/* Uang Keputrian */}
                                <div className="p-4 rounded-2xl bg-pink-50/70 dark:bg-pink-950/30 border border-pink-200 dark:border-pink-900/50 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="font-extrabold text-xs text-pink-900 dark:text-pink-300">
                                            🌸 {neracaData.pos_alokasi.uang_keputrian?.nama}
                                        </span>
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-200/80 dark:bg-pink-900/60 text-pink-800 dark:text-pink-300">
                                            Di Luar Kas Kelompok
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-pink-700 dark:text-pink-400 block">Sisa Saldo Uang Keputrian:</span>
                                        <p className="text-lg font-black text-pink-950 dark:text-pink-100">
                                            {formatRupiah(neracaData.pos_alokasi.uang_keputrian?.saldo)}
                                        </p>
                                    </div>
                                    <div className="text-[10px] text-pink-700 dark:text-pink-400 border-t border-pink-200 dark:border-pink-900/50 pt-1.5 flex justify-between">
                                        <span>Masuk: +{formatRupiah(neracaData.pos_alokasi.uang_keputrian?.masuk)}</span>
                                        <span>Keluar: -{formatRupiah(neracaData.pos_alokasi.uang_keputrian?.keluar)}</span>
                                    </div>
                                </div>

                                {/* Uang Olahraga */}
                                <div className="p-4 rounded-2xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-900/50 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="font-extrabold text-xs text-sky-900 dark:text-sky-300">
                                            ⚽ {neracaData.pos_alokasi.uang_olahraga?.nama}
                                        </span>
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-200/80 dark:bg-sky-900/60 text-sky-800 dark:text-sky-300">
                                            Di Luar Kas Kelompok
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-sky-700 dark:text-sky-400 block">Sisa Saldo Uang Olahraga:</span>
                                        <p className="text-lg font-black text-sky-950 dark:text-sky-100">
                                            {formatRupiah(neracaData.pos_alokasi.uang_olahraga?.saldo)}
                                        </p>
                                    </div>
                                    <div className="text-[10px] text-sky-700 dark:text-sky-400 border-t border-sky-200 dark:border-sky-900/50 pt-1.5 flex justify-between">
                                        <span>Masuk: +{formatRupiah(neracaData.pos_alokasi.uang_olahraga?.masuk)}</span>
                                        <span>Keluar: -{formatRupiah(neracaData.pos_alokasi.uang_olahraga?.keluar)}</span>
                                    </div>
                                </div>

                                {/* Kas Desa */}
                                <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="font-extrabold text-xs text-emerald-900 dark:text-emerald-300">
                                            🏡 {neracaData.pos_alokasi.kas_desa?.nama}
                                        </span>
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
                                            Kas Desa
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-emerald-700 dark:text-emerald-400 block">Total Iuran Desa Terkumpul:</span>
                                        <p className="text-lg font-black text-emerald-950 dark:text-emerald-100">
                                            {formatRupiah(neracaData.pos_alokasi.kas_desa?.saldo)}
                                        </p>
                                    </div>
                                    <div className="text-[10px] text-emerald-700 dark:text-emerald-400 border-t border-emerald-200 dark:border-emerald-900/50 pt-1.5">
                                        <span>Titipan warga untuk kas desa</span>
                                    </div>
                                </div>

                                {/* Tabungan Qurban */}
                                <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="font-extrabold text-xs text-amber-900 dark:text-amber-300">
                                            🐑 {neracaData.pos_alokasi.kas_qurban?.nama}
                                        </span>
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300">
                                            Qurban
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-amber-700 dark:text-amber-400 block">Total Tabungan Qurban:</span>
                                        <p className="text-lg font-black text-amber-950 dark:text-amber-100">
                                            {formatRupiah(neracaData.pos_alokasi.kas_qurban?.saldo)}
                                        </p>
                                    </div>
                                    <div className="text-[10px] text-amber-700 dark:text-amber-400 border-t border-amber-200 dark:border-amber-900/50 pt-1.5">
                                        <span>Tabungan khusus qurban tahunan</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Summary Balance */}
                    <div className="p-6 rounded-2xl bg-slate-900 dark:bg-slate-950 text-white border border-transparent dark:border-slate-800 space-y-3 print:bg-white print:text-black print:border-2 print:border-black print:p-4">
                        <div className="flex justify-between text-xs text-slate-300 print:text-black">
                            <span>Saldo Awal Periode:</span>
                            <span className="font-bold">{formatRupiah(neracaData.saldo_awal)}</span>
                        </div>
                        <div className="flex justify-between text-xs text-emerald-400 print:text-black">
                            <span>Total Masuk (+):</span>
                            <span className="font-bold">+{formatRupiah(neracaData.pemasukan?.total)}</span>
                        </div>
                        <div className="flex justify-between text-xs text-rose-400 print:text-black">
                            <span>Total Keluar (-):</span>
                            <span className="font-bold">-{formatRupiah(neracaData.pengeluaran?.total)}</span>
                        </div>
                        <div className="pt-3 border-t border-white/20 print:border-black flex justify-between items-baseline">
                            <span className="text-sm font-extrabold text-emerald-400 print:text-black uppercase tracking-wider">
                                Total Likuiditas Seluruh Kas:
                            </span>
                            <span className="text-2xl font-black text-white print:text-black">
                                {formatRupiah(neracaData.saldo_akhir)}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Tanda Tangan Resmi Pengurus untuk Hasil Cetak (Print) */}
            <div className="hidden print:block mt-8 pt-4 break-inside-avoid text-slate-900">
                <div className="grid grid-cols-2 gap-12 text-center text-xs">
                    <div>
                        <p className="text-slate-600">Mengetahui,</p>
                        <p className="font-bold text-slate-900 mt-0.5">Ketua Muda-Mudi</p>
                        <div className="h-16"></div>
                        <p className="font-bold text-slate-900 border-b border-slate-900 inline-block px-10 pb-0.5">
                            ( ........................................ )
                        </p>
                    </div>
                    <div>
                        <p className="text-slate-600">
                            Ciherang, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                        <p className="font-bold text-slate-900 mt-0.5">Bendahara Keuangan</p>
                        <div className="h-16"></div>
                        <p className="font-bold text-slate-900 border-b border-slate-900 inline-block px-10 pb-0.5">
                            ( Rihan / Azza )
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
