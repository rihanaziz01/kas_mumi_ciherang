import React, { useState, useEffect } from 'react';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';
import {
    BookOpen,
    ArrowUpRight,
    ArrowDownRight,
    Calendar,
    Filter,
    Search,
    Coins,
    Lock,
    Eye,
    EyeOff,
    ShieldCheck
} from 'lucide-react';

export default function BukuKas() {
    const { isAuthenticated } = useAuth();
    const [periodes, setPeriodes] = useState([]);
    const [selectedPeriodeId, setSelectedPeriodeId] = useState('');
    const [transaksi, setTransaksi] = useState([]);
    const [filterTipe, setFilterTipe] = useState('semua');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [revealedIds, setRevealedIds] = useState([]);

    const formatRupiah = (num) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(num || 0);
    };

    const formatTanggal = (dateStr) => {
        if (!dateStr) return '-';
        try {
            const cleanStr = String(dateStr).split('T')[0];
            const parts = cleanStr.split('-');
            if (parts.length === 3) {
                const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
                return new Intl.DateTimeFormat('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                }).format(d);
            }
            return cleanStr;
        } catch {
            return String(dateStr);
        }
    };

    const getBulanTahunLabel = (dateStr, fallbackBulan = '') => {
        if (!dateStr) return fallbackBulan ? `Bulan ${fallbackBulan}` : 'Transaksi';
        try {
            const cleanStr = String(dateStr).split('T')[0];
            const parts = cleanStr.split('-');
            if (parts.length >= 2) {
                const year = Number(parts[0]);
                const month = Number(parts[1]) - 1;
                const day = Number(parts[2] || 1);
                const d = new Date(year, month, day);
                return new Intl.DateTimeFormat('id-ID', {
                    month: 'long',
                    year: 'numeric',
                }).format(d);
            }
            return fallbackBulan || cleanStr;
        } catch {
            return fallbackBulan || String(dateStr);
        }
    };

    const getMonthKey = (item) => {
        if (item?.tanggal) {
            const cleanStr = String(item.tanggal).split('T')[0];
            const parts = cleanStr.split('-');
            if (parts.length >= 2) {
                return `${parts[0]}-${parts[1]}`;
            }
        }
        return item?.bulan || 'unknown';
    };

    useEffect(() => {
        const fetchPeriodes = async () => {
            try {
                const res = await api.get('/public/periode-list');
                setPeriodes(res.data);
                const active = res.data.find((p) => p.status === 'aktif') || res.data[0];
                if (active) {
                    setSelectedPeriodeId(active.id);
                    fetchFeed(active.id);
                }
            } catch (err) {
                console.error(err);
            }
        };
        fetchPeriodes();
    }, []);

    const fetchFeed = async (periodeId) => {
        setLoading(true);
        try {
            const res = await api.get(`/public/buku-kas?periode_id=${periodeId}`);
            setTransaksi(res.data.transaksi || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handlePeriodeChange = (e) => {
        const id = e.target.value;
        setSelectedPeriodeId(id);
        fetchFeed(id);
    };

    const filtered = transaksi.filter((item) => {
        const matchTipe = filterTipe === 'semua' || item.tipe === filterTipe;
        const matchQuery =
            item.deskripsi.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.kategori.toLowerCase().includes(searchQuery.toLowerCase());
        return matchTipe && matchQuery;
    });

    const totalMasuk = filtered
        .filter((t) => t.tipe === 'masuk')
        .reduce((acc, curr) => acc + curr.nominal, 0);

    const totalKeluar = filtered
        .filter((t) => t.tipe === 'keluar')
        .reduce((acc, curr) => acc + curr.nominal, 0);

    return (
        <div className="space-y-6 pb-12 max-w-5xl mx-auto">
            {/* Header */}
            <div className="text-center space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 text-brand-800 border border-brand-200/80 text-xs font-bold uppercase tracking-wider">
                    <BookOpen className="w-3.5 h-3.5 text-brand-600" />
                    Transparansi Aliran Dana
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    Buku Kas Terbuka Muda-Mudi Ciherang
                </h1>
                <p className="text-slate-500 text-sm max-w-xl mx-auto">
                    Arsip kronologis seluruh kas masuk (iuran mumi, sodaqoh) dan kas keluar operasional yang dipublikasikan secara nyata.
                </p>
            </div>

            {/* Filter Bar */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                    {/* Period Switcher */}
                    <div className="sm:col-span-4">
                        <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                            Pilih Periode:
                        </label>
                        <select
                            value={selectedPeriodeId}
                            onChange={handlePeriodeChange}
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                        >
                            {periodes.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.nama_periode} {p.status === 'aktif' ? '(🟢 Aktif)' : '(Ditutup)'}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Filter Type */}
                    <div className="sm:col-span-4">
                        <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                            Filter Aliran:
                        </label>
                        <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
                            <button
                                type="button"
                                onClick={() => setFilterTipe('semua')}
                                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${filterTipe === 'semua'
                                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                    }`}
                            >
                                Semua
                            </button>
                            <button
                                type="button"
                                onClick={() => setFilterTipe('masuk')}
                                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${filterTipe === 'masuk'
                                    ? 'bg-emerald-600 text-white shadow-sm'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400'
                                    }`}
                            >
                                Masuk (+)
                            </button>
                            <button
                                type="button"
                                onClick={() => setFilterTipe('keluar')}
                                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${filterTipe === 'keluar'
                                    ? 'bg-rose-600 text-white shadow-sm'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-rose-700 dark:hover:text-rose-400'
                                    }`}
                            >
                                Keluar (-)
                            </button>
                        </div>
                    </div>

                    {/* Search description */}
                    <div className="sm:col-span-4">
                        <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                            Cari Transaksi:
                        </label>
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                            <input
                                type="text"
                                placeholder="Ketik deskripsi / nama..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Subtotal Pill Bar */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">
                        Menampilkan <strong>{filtered.length}</strong> transaksi pada feed.
                    </span>
                    <div className="flex items-center gap-3">
                        <span className="text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800/60">
                            Masuk: +{formatRupiah(totalMasuk)}
                        </span>
                        <span className="text-rose-700 dark:text-rose-400 font-bold bg-rose-50 dark:bg-rose-950/60 px-2.5 py-1 rounded-lg border border-rose-200 dark:border-rose-800/60">
                            Keluar: -{formatRupiah(totalKeluar)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Transaction Feed */}
            {loading ? (
                <div className="space-y-3 animate-pulse">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="h-20 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 space-y-2">
                    <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                        <BookOpen className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Tidak ada transaksi ditemukan</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        Coba ubah filter atau kata kunci pencarian Anda.
                    </p>
                </div>
            ) : (
                <div className="space-y-2.5">
                    {filtered.map((item, idx) => {
                        const isMasuk = item.tipe === 'masuk';
                        const currentMonthKey = getMonthKey(item);
                        const prevMonthKey = idx > 0 ? getMonthKey(filtered[idx - 1]) : null;
                        const isNewMonth = idx === 0 || currentMonthKey !== prevMonthKey;

                        return (
                            <React.Fragment key={item.id}>
                                {isNewMonth && (
                                    <div className={`flex items-center gap-3 ${idx === 0 ? 'pt-1 pb-1' : 'pt-5 pb-1'}`}>
                                        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-200 to-slate-300 dark:via-slate-800 dark:to-slate-700"></div>
                                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-2xs">
                                            <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                            <span className="text-xs font-black tracking-wide text-slate-800 dark:text-slate-100 uppercase">
                                                {getBulanTahunLabel(item.tanggal, item.bulan)}
                                            </span>
                                        </div>
                                        <div className="flex-1 h-px bg-gradient-to-l from-transparent via-slate-200 to-slate-300 dark:via-slate-800 dark:to-slate-700"></div>
                                    </div>
                                )}

                                <div
                                    className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                                >
                                    <div className="flex items-start gap-3.5">
                                        <div
                                            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${isMasuk
                                                ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400'
                                                : 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-400'
                                                }`}
                                        >
                                            {isMasuk ? (
                                                <ArrowUpRight className="w-5 h-5" />
                                            ) : (
                                                <ArrowDownRight className="w-5 h-5" />
                                            )}
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span
                                                    className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${isMasuk
                                                        ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300'
                                                        : 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300'
                                                        }`}
                                                >
                                                    {item.kategori}
                                                </span>
                                                <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {formatTanggal(item.tanggal)}
                                                </span>
                                            </div>
                                            <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                                                {item.deskripsi}
                                            </h4>
                                            {item.catatan && (
                                                <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                                                    Catatan: "{item.catatan}"
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="sm:text-right shrink-0 pl-13 sm:pl-0">
                                        {item.is_qurban_karyawan ? (
                                            revealedIds.includes(item.id) ? (
                                                <div className="flex items-center gap-1.5 sm:justify-end">
                                                    <span className="text-base sm:text-lg font-black tracking-tight text-emerald-700 dark:text-emerald-400">
                                                        {isMasuk ? '+' : '-'} {formatRupiah(item.nominal)}
                                                    </span>
                                                    {isAuthenticated && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setRevealedIds((prev) => prev.filter((x) => x !== item.id))}
                                                            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                                                            title="Sembunyikan nominal kembali"
                                                        >
                                                            <EyeOff className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                                                        </button>
                                                    )}
                                                </div>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (isAuthenticated) {
                                                            setRevealedIds((prev) => [...prev, item.id]);
                                                        } else {
                                                            alert('Nominal iuran qurban 2% karyawan disensor demi menjaga privasi besaran gaji warga.');
                                                        }
                                                    }}
                                                    className={`inline-flex items-center gap-1.5 font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/60 px-2.5 py-1 rounded-lg text-xs sm:text-sm shadow-xs transition ${isAuthenticated ? 'hover:bg-emerald-100 dark:hover:bg-emerald-900/40 cursor-pointer' : 'cursor-default'
                                                        }`}
                                                    title={
                                                        isAuthenticated
                                                            ? 'Klik untuk melihat nominal (Akses Admin)'
                                                            : 'Disensor demi privasi besaran gaji warga'
                                                    }
                                                >
                                                    <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                                    <span>Rp ••••••</span>
                                                </button>
                                            )
                                        ) : (
                                            <span
                                                className={`text-base sm:text-lg font-black tracking-tight ${isMasuk ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'
                                                    }`}
                                            >
                                                {isMasuk ? '+' : '-'} {formatRupiah(item.nominal)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </React.Fragment>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
