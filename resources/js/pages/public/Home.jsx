import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api';
import {
    Coins,
    Wallet,
    ArrowUpRight,
    ArrowDownRight,
    Calendar,
    CheckCircle2,
    BookOpen,
    Users,
    ShieldAlert,
    Sparkles,
    TrendingUp,
    RefreshCw
} from 'lucide-react';

export default function Home() {
    const [ringkasan, setRingkasan] = useState(null);
    const [periodes, setPeriodes] = useState([]);
    const [selectedPeriodeId, setSelectedPeriodeId] = useState('');
    const [loading, setLoading] = useState(true);

    const formatRupiah = (num) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(num || 0);
    };

    useEffect(() => {
        const fetchInitial = async () => {
            try {
                const [resPeriodes, resRingkasan] = await Promise.all([
                    api.get('/public/periode-list'),
                    api.get('/public/ringkasan'),
                ]);
                setPeriodes(resPeriodes.data);
                setRingkasan(resRingkasan.data);
                if (resRingkasan.data.periode) {
                    setSelectedPeriodeId(resRingkasan.data.periode.id);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchInitial();
    }, []);

    const handlePeriodeChange = async (e) => {
        const id = e.target.value;
        setSelectedPeriodeId(id);
        setLoading(true);
        try {
            const res = await api.get(`/public/ringkasan?periode_id=${id}`);
            setRingkasan(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 pb-12">
            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-5 sm:p-8 lg:p-10 shadow-sm dark:shadow-2xl transition-colors">
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-60 h-60 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none"></div>
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-3 sm:space-y-4 max-w-2xl">
                        <div className="flex items-center gap-3.5 sm:gap-4">
                            <img
                                src="/images/logo-cropped.png"
                                alt="Ciherang Fams"
                                className="h-14 sm:h-20 w-auto object-contain rounded-2xl bg-white dark:bg-slate-800 p-1.5 sm:p-2 border border-slate-200/80 dark:border-slate-700/80 shadow-md shrink-0"
                            />
                            <div>
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[11px] sm:text-xs font-bold border border-emerald-200/80 dark:border-emerald-800/60">
                                    <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-600 dark:text-emerald-400" />
                                    100% Open Financial Transparency
                                </div>
                                <h1 className="text-xl sm:text-3xl lg:text-4xl font-black tracking-tight mt-1 text-slate-900 dark:text-white">
                                    Portal Transparansi Kas <br />
                                    <span className="text-emerald-600 dark:text-emerald-400">
                                        Ciherang Fams
                                    </span>
                                </h1>
                            </div>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm sm:leading-relaxed">
                            Mewujudkan tata kelola finansial pemuda yang akuntabel, terbuka, dan terpercaya. Seluruh transaksi kas masuk, kas keluar, dan status iuran dapat dipantau bersama tanpa batasan.
                        </p>
                    </div>

                    {/* Periode Switcher Widget */}
                    <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700/80 p-3.5 sm:p-4 rounded-2xl flex flex-col gap-2.5 w-full md:w-auto md:min-w-[270px] shadow-xs">
                        <div className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 font-semibold">
                            <span className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                Pilih Periode:
                            </span>
                            {ringkasan?.periode?.status === 'aktif' ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/60">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                    Aktif
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 dark:text-slate-300 bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                                    Arsip Ditutup
                                </span>
                            )}
                        </div>
                        <select
                            value={selectedPeriodeId}
                            onChange={handlePeriodeChange}
                            className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs sm:text-sm font-semibold rounded-xl border border-slate-300 dark:border-slate-700 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 shadow-2xs transition"
                        >
                            {periodes.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.nama_periode} {p.status === 'aktif' ? '(🟢 Aktif)' : '(Arsip Ditutup)'}
                                </option>
                            ))}
                        </select>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            Pilih periode untuk melihat laporan arsip tahun lampau.
                        </p>
                    </div>
                </div>
            </div>

            {/* Financial Summary Cards */}
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 animate-pulse">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    {/* Saldo Kas Kelompok */}
                    <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition">
                        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Saldo Kas Kelompok</span>
                            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
                                <Wallet className="w-5 h-5" />
                            </div>
                        </div>
                        <p className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                            {formatRupiah(ringkasan?.total_kas_kelompok ?? ringkasan?.pos_kas?.kas_kelompok?.saldo)}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1">
                            <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            Kas operasional kelompok saat ini
                        </p>
                    </div>

                    {/* Pemasukan Kas Desa */}
                    <div className="rounded-2xl bg-white dark:bg-slate-900 p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition">
                        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400">Pemasukan Kas Desa</span>
                            <div className="w-9 h-9 rounded-xl bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 flex items-center justify-center">
                                <ArrowUpRight className="w-5 h-5" />
                            </div>
                        </div>
                        <p className="text-xl sm:text-2xl lg:text-3xl font-black text-teal-900 dark:text-teal-300 tracking-tight">
                            {formatRupiah(ringkasan?.total_kas_desa ?? ringkasan?.pos_kas?.kas_desa?.saldo)}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                            Pemasukan kas desa saat ini
                        </p>
                    </div>

                    {/* Pengeluaran Kelompok */}
                    <div className="rounded-2xl bg-white dark:bg-slate-900 p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition">
                        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">Pengeluaran Kelompok</span>
                            <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 flex items-center justify-center">
                                <ArrowDownRight className="w-5 h-5" />
                            </div>
                        </div>
                        <p className="text-xl sm:text-2xl lg:text-3xl font-black text-rose-900 dark:text-rose-300 tracking-tight">
                            {formatRupiah(ringkasan?.pengeluaran_kas_kelompok ?? ringkasan?.pos_kas?.kas_kelompok?.keluar)}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                            Pengeluaran operasional kelompok saat ini
                        </p>
                    </div>

                    {/* Total Qurban */}
                    <div className="rounded-2xl bg-white dark:bg-slate-900 p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition">
                        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">Total Qurban</span>
                            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold text-base">
                                🐑
                            </div>
                        </div>
                        <p className="text-xl sm:text-2xl lg:text-3xl font-black text-amber-950 dark:text-amber-300 tracking-tight">
                            {formatRupiah(ringkasan?.total_qurban ?? ringkasan?.pos_kas?.kas_qurban?.saldo)}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                            Tabungan qurban tahunan anggota
                        </p>
                    </div>
                </div>
            )}

            {/* Matriks Tarif Iuran Resmi */}
            <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-6 lg:p-8 shadow-xs transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                    <div>
                        <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                            <Coins className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            Matriks Tarif Iuran Paguyuban (Resmi)
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Besaran tarif disesuaikan secara berkeadilan menurut status pekerjaan/sosial anggota.
                        </p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/60 px-3 py-1 rounded-full self-start shrink-0">
                        Pedoman Resmi Muda-Mudi
                    </span>
                </div>

                {/* 1. Mobile Cards Layout (Tampil Rapi di HP) */}
                <div className="block lg:hidden space-y-3">
                    {[
                        {
                            status: 'Pelajar',
                            kelompok: 5000,
                            desa: 5000,
                            qurban: 'Rp 17.000 / bln',
                            qurbanBadge: 'statis',
                            keterangan: 'Tarif khusus pelajar sekolah',
                        },
                        {
                            status: 'Mahasiswa',
                            kelompok: 5000,
                            desa: 5000,
                            qurban: 'Rp 30.000 / bln',
                            qurbanBadge: 'statis',
                            keterangan: 'Tarif mahasiswa perguruan tinggi',
                        },
                        {
                            status: 'Pencaker (Pencari Kerja)',
                            kelompok: 5000,
                            desa: 5000,
                            qurban: 'Rp 21.000 / bln',
                            qurbanBadge: 'statis',
                            keterangan: 'Keringanan tarif qurban pemuda',
                        },
                        {
                            status: 'Pedagang',
                            kelompok: 5000,
                            desa: 10000,
                            qurban: 'Bebas Iuran Qurban',
                            qurbanBadge: 'bebas',
                            keterangan: 'Bebas dari kewajiban qurban pemuda',
                        },
                        {
                            status: 'Karyawan A',
                            kelompok: 5000,
                            desa: 15000,
                            qurban: '2% Pendapatan / bln',
                            qurbanBadge: 'dinamis',
                            keterangan: 'Dihitung otomatis per bulan sesuai gaji',
                        },
                        {
                            status: 'Karyawan B',
                            kelompok: 5000,
                            desa: 20000,
                            qurban: '2% Pendapatan / bln',
                            qurbanBadge: 'dinamis',
                            keterangan: 'Dihitung otomatis per bulan sesuai gaji',
                        },
                    ].map((item, idx) => (
                        <div
                            key={idx}
                            className="p-3.5 sm:p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-2.5"
                        >
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-lg">{item.icon}</span>
                                    <span className="font-black text-sm text-slate-900 dark:text-white">
                                        {item.status}
                                    </span>
                                </div>
                                <span
                                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${item.qurbanBadge === 'bebas'
                                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60'
                                        : item.qurbanBadge === 'dinamis'
                                            ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60'
                                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
                                        }`}
                                >
                                    {item.qurbanBadge === 'bebas' ? 'Bebas Qurban' : item.qurbanBadge === 'dinamis' ? '2% Gaji' : 'Tarif Tetap'}
                                </span>
                            </div>

                            {/* 3 Pills: Kelompok, Desa, Qurban */}
                            <div className="grid grid-cols-3 gap-2 text-center">
                                <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 shadow-2xs">
                                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block">
                                        Kas Kelompok
                                    </span>
                                    <span className="text-xs font-black text-slate-900 dark:text-white mt-0.5 block">
                                        {formatRupiah(item.kelompok)}
                                    </span>
                                    <span className="text-[9px] text-slate-400 dark:text-slate-500 block">/bln</span>
                                </div>

                                <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 shadow-2xs">
                                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block">
                                        Kas Desa
                                    </span>
                                    <span className="text-xs font-black text-slate-900 dark:text-white mt-0.5 block">
                                        {formatRupiah(item.desa)}
                                    </span>
                                    <span className="text-[9px] text-slate-400 dark:text-slate-500 block">/bln</span>
                                </div>

                                <div className={`p-2 rounded-xl border shadow-2xs ${item.qurbanBadge === 'bebas'
                                    ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/40 text-amber-900 dark:text-amber-200'
                                    : item.qurbanBadge === 'dinamis'
                                        ? 'bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800/40 text-indigo-900 dark:text-indigo-200'
                                        : 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/40 text-emerald-900 dark:text-emerald-200'
                                    }`}>
                                    <span className="text-[10px] font-bold block opacity-90">
                                        Qurban
                                    </span>
                                    <span className="text-[11px] font-black mt-0.5 block leading-tight">
                                        {item.qurban}
                                    </span>
                                </div>
                            </div>

                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                ℹ️ {item.keterangan}
                            </p>
                        </div>
                    ))}
                </div>

                {/* 2. Desktop & Tablet Table View (Tampil Lengkap di Layar Besar) */}
                <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase bg-slate-50/80 dark:bg-slate-800/60">
                                <th className="py-3 px-4 rounded-l-xl">Status Anggota</th>
                                <th className="py-3 px-4">Kas Kelompok (Bulan)</th>
                                <th className="py-3 px-4">Kas Desa (Bulan)</th>
                                <th className="py-3 px-4">Qurban</th>
                                <th className="py-3 px-4 rounded-r-xl">Keterangan / Kebijakan</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                            {[
                                {
                                    status: 'Pelajar',
                                    icon: '🎓',
                                    kelompok: 5000,
                                    desa: 5000,
                                    qurban: 'Rp 17.000 / bulan',
                                    qurbanBadge: 'statis',
                                    keterangan: 'Tarif khusus pelajar sekolah',
                                },
                                {
                                    status: 'Mahasiswa',
                                    icon: '📚',
                                    kelompok: 5000,
                                    desa: 5000,
                                    qurban: 'Rp 30.000 / bulan',
                                    qurbanBadge: 'statis',
                                    keterangan: 'Tarif mahasiswa perguruan tinggi',
                                },
                                {
                                    status: 'Pencaker (Pencari Kerja)',
                                    icon: '💼',
                                    kelompok: 5000,
                                    desa: 5000,
                                    qurban: 'Rp 21.000 / bulan',
                                    qurbanBadge: 'statis',
                                    keterangan: 'Keringanan tarif qurban pemuda',
                                },
                                {
                                    status: 'Pedagang',
                                    icon: '🏪',
                                    kelompok: 5000,
                                    desa: 10000,
                                    qurban: 'Bebas Iuran Qurban',
                                    qurbanBadge: 'bebas',
                                    keterangan: 'Bebas dari kewajiban qurban pemuda',
                                },
                                {
                                    status: 'Karyawan A',
                                    icon: '🏢',
                                    kelompok: 5000,
                                    desa: 15000,
                                    qurban: '2% Pendapatan / bulan',
                                    qurbanBadge: 'dinamis',
                                    keterangan: 'Dihitung otomatis per bulan sesuai gaji',
                                },
                                {
                                    status: 'Karyawan B',
                                    icon: '🏢',
                                    kelompok: 5000,
                                    desa: 20000,
                                    qurban: '2% Pendapatan / bulan',
                                    qurbanBadge: 'dinamis',
                                    keterangan: 'Dihitung otomatis per bulan sesuai gaji',
                                },
                            ].map((item, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                        <span>{item.icon}</span>
                                        <span>{item.status}</span>
                                    </td>
                                    <td className="py-3.5 px-4 font-semibold">{formatRupiah(item.kelompok)}</td>
                                    <td className="py-3.5 px-4 font-semibold">{formatRupiah(item.desa)}</td>
                                    <td className="py-3.5 px-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-bold ${item.qurbanBadge === 'bebas'
                                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                                            : item.qurbanBadge === 'dinamis'
                                                ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300'
                                                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                                            }`}>
                                            {item.qurban}
                                        </span>
                                    </td>
                                    <td className="py-3.5 px-4 text-xs text-slate-500 dark:text-slate-400">{item.keterangan}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
