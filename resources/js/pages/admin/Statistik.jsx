import React, { useState, useEffect } from 'react';
import api from '../../api';
import {
    BarChart3,
    TrendingUp,
    PieChart,
    Award,
    AlertCircle,
    CheckCircle2,
    Calendar,
    Users,
    Wallet,
    Coins,
    RefreshCw,
    ArrowUpRight,
    ArrowDownRight,
    Filter,
    ShieldCheck,
    ChevronDown,
    Building2,
    Clock,
} from 'lucide-react';

export default function Statistik() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [selectedPeriodeId, setSelectedPeriodeId] = useState('');
    const [chartMode, setChartMode] = useState('iuran'); // 'iuran' | 'arus_kas' | 'net'
    const [hoveredMonth, setHoveredMonth] = useState(null);

    const formatRupiah = (num) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(num || 0);
    };

    const formatAngka = (num) => {
        return new Intl.NumberFormat('id-ID').format(num || 0);
    };

    const fetchStatistik = async (periodeId = '') => {
        try {
            setError(null);
            const url = periodeId ? `/admin/statistik?periode_id=${periodeId}` : '/admin/statistik';
            const res = await api.get(url);
            setData(res.data);
            if (!selectedPeriodeId && res.data.periode?.id) {
                setSelectedPeriodeId(res.data.periode.id);
            }
        } catch (err) {
            console.error('Gagal mengambil data statistik:', err);
            setError('Gagal memuat data statistik keuangan. Silakan coba beberapa saat lagi.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchStatistik(selectedPeriodeId);
    }, [selectedPeriodeId]);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchStatistik(selectedPeriodeId);
    };

    if (loading) {
        return (
            <div className="space-y-6 animate-pulse pb-12">
                <div className="h-28 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800"></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-32 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800"></div>
                    ))}
                </div>
                <div className="h-80 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800"></div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="h-64 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800"></div>
                    <div className="h-64 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800"></div>
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-3xl p-8 text-center max-w-xl mx-auto my-12">
                <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-rose-900 dark:text-rose-200 mb-2">Terjadi Kesalahan</h3>
                <p className="text-sm text-rose-700 dark:text-rose-300 mb-6">{error || 'Data tidak tersedia'}</p>
                <button
                    onClick={handleRefresh}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-medium text-sm transition-colors shadow-xs"
                >
                    <RefreshCw className="w-4 h-4" />
                    Coba Muat Ulang
                </button>
            </div>
        );
    }

    const { ringkasan, tren_bulanan, distribusi_status, kepatuhan_distribusi, top_tertib, perlu_perhatian, kategori_kas, periode, periodes } = data;

    // Kalkulasi nilai maksimum chart untuk visual scaling
    const maxIuran = Math.max(...tren_bulanan.map((b) => b.total_iuran), 50000);
    const maxArus = Math.max(...tren_bulanan.map((b) => Math.max(b.kas_masuk, b.kas_keluar)), 50000);
    const maxNet = Math.max(...tren_bulanan.map((b) => Math.abs(b.net_kas)), 50000);

    return (
        <div className="space-y-8 pb-12">
            {/* Header Page & Periode Selector */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <BarChart3 className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2.5 flex-wrap">
                            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                                Statistik & Analitik Keuangan
                            </h1>
                            <span
                                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                                    periode?.status === 'aktif'
                                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                                }`}
                            >
                                {periode?.status === 'aktif' ? 'Periode Aktif' : 'Arsip'}
                            </span>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Laporan analitis kepatuhan iuran, performa arus kas, dan demografi kas Muda-Mudi Ciherang.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 self-start md:self-auto shrink-0">
                    {/* Periode Dropdown */}
                    <div className="relative">
                        <select
                            id="periode-select"
                            value={selectedPeriodeId}
                            onChange={(e) => setSelectedPeriodeId(e.target.value)}
                            className="appearance-none bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm font-semibold rounded-xl pl-3.5 pr-8 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-xs"
                        >
                            {periodes?.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.nama_periode} {p.status === 'aktif' ? '(Aktif)' : ''}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>

                    {/* Refresh Button */}
                    <button
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-300 dark:hover:border-emerald-600/50 transition-colors shadow-xs disabled:opacity-50"
                        title="Segarkan Data"
                    >
                        <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-emerald-600' : ''}`} />
                    </button>
                </div>
            </div>

            {/* KPI Highlights Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Kepatuhan Keseluruhan */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden transition-colors group">
                    <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Tingkat Kepatuhan
                        </span>
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                            {ringkasan.overall_compliance}%
                        </span>
                        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                            Terkumpul
                        </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
                        <div
                            className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, ringkasan.overall_compliance)}%` }}
                        ></div>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                        <span>Kelompok: {ringkasan.kepatuhan_kelompok}%</span>
                        <span>Desa: {ringkasan.kepatuhan_desa}%</span>
                    </div>
                </div>

                {/* 2. Total Iuran Terkumpul */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden transition-colors group">
                    <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Pemasukan Iuran
                        </span>
                        <div className="w-9 h-9 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                            <Wallet className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                            {formatRupiah(ringkasan.total_iuran)}
                        </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                        Dari total <span className="font-semibold text-slate-700 dark:text-slate-200">{formatAngka(ringkasan.transaksi_iuran_count)} transaksi</span> iuran anggota.
                    </p>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                        <span className="inline-block w-2 h-2 rounded-full bg-blue-500"></span>
                        <span>Kelompok: {formatRupiah(ringkasan.total_iuran_kelompok)}</span>
                    </div>
                </div>

                {/* 3. Kas Operasional Masuk & Keluar */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden transition-colors group">
                    <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Kas Operasional
                        </span>
                        <div className="w-9 h-9 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                            <Coins className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                            {formatRupiah(ringkasan.total_pemasukan_kas - ringkasan.total_pengeluaran_kas)}
                        </span>
                    </div>
                    <div className="flex items-center justify-between text-xs mt-2 font-medium">
                        <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                            <ArrowUpRight className="w-3.5 h-3.5" />
                            {formatRupiah(ringkasan.total_pemasukan_kas)}
                        </span>
                        <span className="text-rose-600 dark:text-rose-400 flex items-center gap-0.5">
                            <ArrowDownRight className="w-3.5 h-3.5" />
                            {formatRupiah(ringkasan.total_pengeluaran_kas)}
                        </span>
                    </div>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2">
                        Pemasukan lain & biaya operasional
                    </p>
                </div>

                {/* 4. Saldo Bersih Saat Ini */}
                <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl p-5 text-white shadow-md shadow-emerald-600/20 relative overflow-hidden">
                    <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="text-xs font-bold text-emerald-100 uppercase tracking-wider">
                            Saldo Kas Bersih
                        </span>
                        <div className="w-9 h-9 rounded-xl bg-white/15 text-white flex items-center justify-center backdrop-blur-xs">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="text-2xl sm:text-3xl font-black tracking-tight">
                        {formatRupiah(ringkasan.saldo_bersih)}
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-emerald-100/90 mt-3 pt-2.5 border-t border-white/15">
                        <span>Saldo Awal: {formatRupiah(periode?.saldo_awal)}</span>
                        <span>{ringkasan.total_anggota} Anggota</span>
                    </div>
                </div>
            </div>

            {/* Interactive Trend Chart Section */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                                Tren Arus Kas 12 Bulan
                            </h2>
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                                ({periode?.nama_periode})
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Arahkan kursor pada batang bulan untuk melihat rincian angka pemasukan dan pengeluaran.
                        </p>
                    </div>

                    {/* Chart Mode Toggle */}
                    <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 text-xs font-bold self-start sm:self-auto">
                        <button
                            onClick={() => setChartMode('iuran')}
                            className={`px-3 py-1.5 rounded-xl transition-all ${
                                chartMode === 'iuran'
                                    ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                        >
                            Pemasukan Iuran
                        </button>
                        <button
                            onClick={() => setChartMode('arus_kas')}
                            className={`px-3 py-1.5 rounded-xl transition-all ${
                                chartMode === 'arus_kas'
                                    ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                        >
                            Masuk vs Keluar
                        </button>
                        <button
                            onClick={() => setChartMode('net')}
                            className={`px-3 py-1.5 rounded-xl transition-all ${
                                chartMode === 'net'
                                    ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                        >
                            Net Kas Bersih
                        </button>
                    </div>
                </div>

                {/* Chart Area */}
                <div className="relative pt-6 pb-2">
                    <div className="h-64 flex items-end justify-between gap-1.5 sm:gap-3 px-1">
                        {tren_bulanan.map((b) => {
                            const isHovered = hoveredMonth?.index === b.index;

                            // Tentukan tinggi batang berdasarkan mode
                            let barHeight1 = 4;
                            let barHeight2 = 0;
                            let barHeight3 = 0;

                            if (chartMode === 'iuran') {
                                barHeight1 = Math.max(4, (b.iuran_kelompok / maxIuran) * 100);
                                barHeight2 = Math.max(4, (b.iuran_desa / maxIuran) * 100);
                                barHeight3 = Math.max(4, (b.iuran_qurban / maxIuran) * 100);
                            } else if (chartMode === 'arus_kas') {
                                const totalMasukBulan = b.total_iuran + b.kas_masuk;
                                barHeight1 = Math.max(4, (totalMasukBulan / (maxArus + maxIuran)) * 100);
                                barHeight2 = Math.max(4, (b.kas_keluar / (maxArus + maxIuran)) * 100);
                            } else {
                                barHeight1 = Math.max(6, (Math.abs(b.net_kas) / maxNet) * 100);
                            }

                            return (
                                <div
                                    key={b.index}
                                    onMouseEnter={() => setHoveredMonth(b)}
                                    onMouseLeave={() => setHoveredMonth(null)}
                                    className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
                                >
                                    <div className="w-full flex items-end justify-center gap-0.5 sm:gap-1 h-52">
                                        {chartMode === 'iuran' && (
                                            <>
                                                {/* Bar Kelompok */}
                                                <div
                                                    style={{ height: `${barHeight1}%` }}
                                                    className={`w-full max-w-[12px] sm:max-w-[18px] rounded-t-md transition-all ${
                                                        isHovered ? 'bg-emerald-500 scale-y-105' : 'bg-emerald-400 dark:bg-emerald-500/80 group-hover:bg-emerald-500'
                                                    }`}
                                                ></div>
                                                {/* Bar Desa */}
                                                <div
                                                    style={{ height: `${barHeight2}%` }}
                                                    className={`w-full max-w-[12px] sm:max-w-[18px] rounded-t-md transition-all ${
                                                        isHovered ? 'bg-blue-500 scale-y-105' : 'bg-blue-400 dark:bg-blue-500/80 group-hover:bg-blue-500'
                                                    }`}
                                                ></div>
                                                {/* Bar Qurban */}
                                                <div
                                                    style={{ height: `${barHeight3}%` }}
                                                    className={`w-full max-w-[12px] sm:max-w-[18px] rounded-t-md transition-all ${
                                                        isHovered ? 'bg-amber-500 scale-y-105' : 'bg-amber-400 dark:bg-amber-500/80 group-hover:bg-amber-500'
                                                    }`}
                                                ></div>
                                            </>
                                        )}

                                        {chartMode === 'arus_kas' && (
                                            <>
                                                {/* Bar Total Masuk */}
                                                <div
                                                    style={{ height: `${barHeight1}%` }}
                                                    className={`w-full max-w-[16px] sm:max-w-[24px] rounded-t-md transition-all ${
                                                        isHovered ? 'bg-emerald-500 scale-y-105' : 'bg-emerald-400 dark:bg-emerald-500/80 group-hover:bg-emerald-500'
                                                    }`}
                                                ></div>
                                                {/* Bar Pengeluaran */}
                                                <div
                                                    style={{ height: `${barHeight2}%` }}
                                                    className={`w-full max-w-[16px] sm:max-w-[24px] rounded-t-md transition-all ${
                                                        isHovered ? 'bg-rose-500 scale-y-105' : 'bg-rose-400 dark:bg-rose-500/80 group-hover:bg-rose-500'
                                                    }`}
                                                ></div>
                                            </>
                                        )}

                                        {chartMode === 'net' && (
                                            <div
                                                style={{ height: `${barHeight1}%` }}
                                                className={`w-full max-w-[20px] sm:max-w-[30px] rounded-t-md transition-all ${
                                                    b.net_kas >= 0
                                                        ? isHovered ? 'bg-emerald-500 scale-y-105' : 'bg-emerald-400 dark:bg-emerald-500/80 group-hover:bg-emerald-500'
                                                        : isHovered ? 'bg-rose-500 scale-y-105' : 'bg-rose-400 dark:bg-rose-500/80 group-hover:bg-rose-500'
                                                }`}
                                            ></div>
                                        )}
                                    </div>

                                    {/* Month Label */}
                                    <span
                                        className={`text-[10px] sm:text-xs font-semibold mt-2 transition-colors ${
                                            isHovered
                                                ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                                                : 'text-slate-400 dark:text-slate-500'
                                        }`}
                                    >
                                        {b.singkat}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Tooltip Detail Card for Active/Hovered Month */}
                {hoveredMonth && (
                    <div className="mt-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 animate-fadeIn transition-all">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                <span className="font-bold text-sm text-slate-900 dark:text-white">
                                    Rincian Bulan {hoveredMonth.nama}
                                </span>
                            </div>
                            <div className="flex items-center gap-4 text-xs font-medium flex-wrap">
                                <div>
                                    <span className="text-slate-500 dark:text-slate-400">Kas Kelompok: </span>
                                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                        {formatRupiah(hoveredMonth.iuran_kelompok)}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-slate-500 dark:text-slate-400">Kas Desa: </span>
                                    <span className="font-bold text-blue-600 dark:text-blue-400">
                                        {formatRupiah(hoveredMonth.iuran_desa)}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-slate-500 dark:text-slate-400">Qurban: </span>
                                    <span className="font-bold text-amber-600 dark:text-amber-400">
                                        {formatRupiah(hoveredMonth.iuran_qurban)}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-slate-500 dark:text-slate-400">Total Iuran: </span>
                                    <span className="font-bold text-slate-900 dark:text-white">
                                        {formatRupiah(hoveredMonth.total_iuran)}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-slate-500 dark:text-slate-400">Kas Masuk: </span>
                                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                        {formatRupiah(hoveredMonth.kas_masuk)}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-slate-500 dark:text-slate-400">Pengeluaran: </span>
                                    <span className="font-bold text-rose-600 dark:text-rose-400">
                                        {formatRupiah(hoveredMonth.kas_keluar)}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-slate-500 dark:text-slate-400">Net: </span>
                                    <span className={`font-bold ${hoveredMonth.net_kas >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                        {formatRupiah(hoveredMonth.net_kas)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Legend */}
                <div className="flex items-center justify-center gap-4 sm:gap-6 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs font-medium text-slate-600 dark:text-slate-400 flex-wrap">
                    {chartMode === 'iuran' && (
                        <>
                            <span className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-md bg-emerald-500"></span>
                                Kas Kelompok (Wajib)
                            </span>
                            <span className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-md bg-blue-500"></span>
                                Kas Desa
                            </span>
                            <span className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-md bg-amber-500"></span>
                                Tabungan Qurban
                            </span>
                        </>
                    )}
                    {chartMode === 'arus_kas' && (
                        <>
                            <span className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-md bg-emerald-500"></span>
                                Total Masuk (Iuran + Kas Masuk)
                            </span>
                            <span className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-md bg-rose-500"></span>
                                Total Pengeluaran Kas
                            </span>
                        </>
                    )}
                    {chartMode === 'net' && (
                        <>
                            <span className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-md bg-emerald-500"></span>
                                Surplus Bulanan
                            </span>
                            <span className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-md bg-rose-500"></span>
                                Defisit Bulanan
                            </span>
                        </>
                    )}
                </div>
            </div>

            {/* Dua Kolom: Kepatuhan Iuran Spesifik & Distribusi Status Anggota */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 1. Detail Kepatuhan Kas Kelompok & Kas Desa */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs transition-colors space-y-6">
                    <div>
                        <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                            Kolektivitas & Kepatuhan Iuran
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            Perbandingan capaian riil vs target perkiraan tahunan 12 bulan seluruh anggota aktif.
                        </p>
                    </div>

                    {/* Progress Kas Kelompok */}
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                                <span className="text-sm font-bold text-slate-900 dark:text-white">
                                    Kas Kelompok (Muda-Mudi)
                                </span>
                            </div>
                            <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                                {ringkasan.kepatuhan_kelompok}%
                            </span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                            <div
                                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(100, ringkasan.kepatuhan_kelompok)}%` }}
                            ></div>
                        </div>
                        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                            <span>Terkumpul: {formatRupiah(ringkasan.total_iuran_kelompok)}</span>
                            <span>Target: {formatRupiah(ringkasan.target_kelompok)}</span>
                        </div>
                    </div>

                    {/* Progress Kas Desa */}
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                                <span className="text-sm font-bold text-slate-900 dark:text-white">
                                    Kas Desa
                                </span>
                            </div>
                            <span className="text-sm font-black text-blue-600 dark:text-blue-400">
                                {ringkasan.kepatuhan_desa}%
                            </span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                            <div
                                className="bg-blue-500 h-full rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(100, ringkasan.kepatuhan_desa)}%` }}
                            ></div>
                        </div>
                        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                            <span>Terkumpul: {formatRupiah(ringkasan.total_iuran_desa)}</span>
                            <span>Target: {formatRupiah(ringkasan.target_desa)}</span>
                        </div>
                    </div>

                    {/* Summary Tabungan Qurban */}
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                                <Building2 className="w-5 h-5" />
                            </div>
                            <div>
                                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                    Total Tabungan Qurban
                                </span>
                                <div className="text-base font-black text-slate-900 dark:text-white">
                                    {formatRupiah(ringkasan.total_iuran_qurban)}
                                </div>
                            </div>
                        </div>
                        <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            Khusus Idul Adha
                        </span>
                    </div>
                </div>

                {/* 2. Demografi & Kepatuhan Anggota */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs transition-colors space-y-6">
                    <div>
                        <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                            Demografi & Status Anggota
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            Distribusi {ringkasan.total_anggota} anggota aktif menurut kategori profesi dan ketercapaian pembayaran.
                        </p>
                    </div>

                    {/* Status Kepatuhan 3 Segmen */}
                    <div className="grid grid-cols-3 gap-3">
                        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/40 text-center">
                            <div className="text-2xl font-black text-emerald-700 dark:text-emerald-300">
                                {kepatuhan_distribusi.lunas_penuh}
                            </div>
                            <div className="text-[11px] font-bold text-emerald-800 dark:text-emerald-400 mt-0.5">
                                Lunas Penuh
                            </div>
                            <div className="text-[10px] text-emerald-600 dark:text-emerald-500">
                                12 Bulan Lunas
                            </div>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-800/40 text-center">
                            <div className="text-2xl font-black text-blue-700 dark:text-blue-300">
                                {kepatuhan_distribusi.sebagian}
                            </div>
                            <div className="text-[11px] font-bold text-blue-800 dark:text-blue-400 mt-0.5">
                                Sebagian
                            </div>
                            <div className="text-[10px] text-blue-600 dark:text-blue-500">
                                1 - 11 Bulan
                            </div>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-800/40 text-center">
                            <div className="text-2xl font-black text-rose-700 dark:text-rose-300">
                                {kepatuhan_distribusi.belum_bayar}
                            </div>
                            <div className="text-[11px] font-bold text-rose-800 dark:text-rose-400 mt-0.5">
                                Belum Bayar
                            </div>
                            <div className="text-[10px] text-rose-600 dark:text-rose-500">
                                Perlu Follow-up
                            </div>
                        </div>
                    </div>

                    {/* Breakdown Status Profesi Anggota */}
                    <div className="space-y-3 pt-2">
                        <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Kategori Profesi Anggota
                        </div>
                        <div className="space-y-2.5">
                            {distribusi_status?.map((st) => (
                                <div key={st.status} className="space-y-1">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                                            {st.status}
                                        </span>
                                        <span className="text-slate-500 dark:text-slate-400 font-bold">
                                            {st.count} orang ({st.persen}%)
                                        </span>
                                    </div>
                                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                                        <div
                                            className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                                            style={{ width: `${st.persen}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Leaderboard & Monitoring List */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 1. Top 5 Anggota Paling Tertib */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                                <Award className="w-4 h-4" />
                            </div>
                            <div>
                                <h3 className="font-black text-slate-900 dark:text-white text-base">
                                    Top 5 Anggota Paling Tertib
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Anggota dengan pembayaran terlengkap & tepat waktu
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {top_tertib?.map((agt, idx) => (
                            <div key={agt.id} className="py-3 flex items-center justify-between gap-3 first:pt-0 last:pb-0">
                                <div className="flex items-center gap-3">
                                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                                        idx === 0
                                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                                            : idx === 1
                                            ? 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                            : idx === 2
                                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800/60 dark:text-slate-400'
                                    }`}>
                                        {idx + 1}
                                    </span>
                                    <div>
                                        <div className="font-bold text-sm text-slate-900 dark:text-white">
                                            {agt.nama}
                                        </div>
                                        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                            <span>{agt.status}</span>
                                            <span>•</span>
                                            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                                                {agt.total_slots} Bulan Terbayar
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right shrink-0">
                                    <div className="font-black text-sm text-slate-900 dark:text-white">
                                        {formatRupiah(agt.total_nominal)}
                                    </div>
                                    <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                        {agt.kategori_kepatuhan}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 2. Daftar Perhatian (Menunggak Terbanyak) */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                                <AlertCircle className="w-4 h-4" />
                            </div>
                            <div>
                                <h3 className="font-black text-slate-900 dark:text-white text-base">
                                    Daftar Perhatian (Tunggakan)
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Prioritas pengingat untuk penagihan iuran pengurus
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {perlu_perhatian?.length === 0 ? (
                            <div className="py-8 text-center text-sm text-emerald-600 dark:text-emerald-400 font-semibold">
                                Luar biasa! Seluruh anggota telah melunasi iuran tahunan.
                            </div>
                        ) : (
                            perlu_perhatian?.map((agt) => (
                                <div key={agt.id} className="py-3 flex items-center justify-between gap-3 first:pt-0 last:pb-0">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center shrink-0">
                                            {agt.nama.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="font-bold text-sm text-slate-900 dark:text-white">
                                                {agt.nama}
                                            </div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                                <span>{agt.status}</span>
                                                <span>•</span>
                                                <span className="text-slate-600 dark:text-slate-300">
                                                    Baru bayar {agt.total_slots} bln
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60">
                                            Tunggakan {agt.tunggakan_bulan} Slot
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Breakdown Kategori Kas Operasional */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pemasukan Operasional */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="font-black text-slate-900 dark:text-white text-base">
                                Kategori Pemasukan Operasional
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Sumber penerimaan kas di luar iuran wajib bulanan
                            </p>
                        </div>
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                            {formatRupiah(ringkasan.total_pemasukan_kas)}
                        </span>
                    </div>

                    <div className="space-y-3">
                        {kategori_kas?.pemasukan?.length === 0 ? (
                            <p className="text-xs text-slate-400 py-4 text-center">Belum ada catatan pemasukan operasional.</p>
                        ) : (
                            kategori_kas?.pemasukan?.map((item) => (
                                <div key={item.kategori} className="space-y-1">
                                    <div className="flex items-center justify-between text-xs font-semibold">
                                        <span className="text-slate-800 dark:text-slate-200">{item.kategori}</span>
                                        <span className="text-slate-900 dark:text-white font-bold">{formatRupiah(item.total)} ({item.count}x)</span>
                                    </div>
                                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                                        <div
                                            className="bg-emerald-500 h-full rounded-full"
                                            style={{
                                                width: `${ringkasan.total_pemasukan_kas > 0 ? (item.total / ringkasan.total_pemasukan_kas) * 100 : 0}%`,
                                            }}
                                        ></div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Pengeluaran Operasional */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="font-black text-slate-900 dark:text-white text-base">
                                Kategori Pengeluaran Kas
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Alokasi penggunaan dana untuk kegiatan & operasional
                            </p>
                        </div>
                        <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                            {formatRupiah(ringkasan.total_pengeluaran_kas)}
                        </span>
                    </div>

                    <div className="space-y-3">
                        {kategori_kas?.pengeluaran?.length === 0 ? (
                            <p className="text-xs text-slate-400 py-4 text-center">Belum ada catatan pengeluaran operasional.</p>
                        ) : (
                            kategori_kas?.pengeluaran?.map((item) => (
                                <div key={item.kategori} className="space-y-1">
                                    <div className="flex items-center justify-between text-xs font-semibold">
                                        <span className="text-slate-800 dark:text-slate-200">{item.kategori}</span>
                                        <span className="text-slate-900 dark:text-white font-bold">{formatRupiah(item.total)} ({item.count}x)</span>
                                    </div>
                                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                                        <div
                                            className="bg-rose-500 h-full rounded-full"
                                            style={{
                                                width: `${ringkasan.total_pengeluaran_kas > 0 ? (item.total / ringkasan.total_pengeluaran_kas) * 100 : 0}%`,
                                            }}
                                        ></div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
