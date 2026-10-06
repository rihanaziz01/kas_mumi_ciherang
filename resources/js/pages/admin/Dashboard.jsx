import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';
import {
    CreditCard,
    Users,
    ArrowUpRight,
    ArrowDownRight,
    BarChart3,
} from 'lucide-react';

export default function Dashboard() {
    const { user } = useAuth();
    const [ringkasan, setRingkasan] = useState(null);
    const [recentPembayaran, setRecentPembayaran] = useState([]);
    const [loading, setLoading] = useState(true);

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

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const [resRingkasan, resBayar] = await Promise.all([
                    api.get('/public/ringkasan'),
                    api.get('/admin/pembayaran?per_page=6'),
                ]);
                setRingkasan(resRingkasan.data);
                setRecentPembayaran(resBayar.data.data || []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboard();
    }, []);

    if (loading) {
        return (
            <div className="space-y-6 animate-pulse pb-12">
                <div className="h-28 bg-white rounded-3xl border border-slate-200"></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="h-32 bg-white rounded-2xl border border-slate-200"></div>
                    ))}
                </div>
                <div className="h-44 bg-white rounded-3xl border border-slate-200"></div>
                <div className="h-64 bg-white rounded-3xl border border-slate-200"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-12">
            {/* Header Greeting */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-white p-1 border border-slate-200 dark:border-slate-700 shadow-xs hidden sm:flex items-center justify-center shrink-0">
                        <img
                            src="/images/logo-cropped.png"
                            alt="Ciherang Fams"
                            className="h-full w-auto object-contain"
                        />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                                <span>Selamat Datang, </span>
                                <span>{user?.name || 'Pengurus'}</span>
                                <span>!</span>
                            </h1>
                            <span className="w-2 h-2 rounded-full bg-brand-500 animate-ping"></span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            Sistem Manajemen & Kontrol Keuangan Terpadu Ciherang Fams (Muda-Mudi Ciherang).
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 shrink-0">
                    <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-brand-50 dark:bg-slate-800 text-brand-800 dark:text-emerald-300 border border-brand-200 dark:border-slate-700 text-xs font-bold whitespace-nowrap shrink-0">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        {ringkasan?.periode?.nama_periode || 'Periode Aktif'}
                    </span>
                    <Link
                        to="/admin/statistik"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 text-xs font-bold transition shadow-xs whitespace-nowrap shrink-0"
                    >
                        <BarChart3 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        Statistik
                    </Link>
                    <Link
                        to="/admin/pembayaran"
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-md shadow-emerald-500/25 transition whitespace-nowrap shrink-0 active:scale-95"
                    >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>+ Transaksi Baru</span>
                    </Link>
                </div>
            </div>

            {/* Financial Metrics - 5 Fokus Kas Diminta: Total Kas Kelompok, Pemasukan Kelompok, Pengeluaran Kelompok, Kas Desa, Total Qurban */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                        <span>📊</span> Ringkasan Keuangan Utama:
                    </h2>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500">
                        Pembaruan real-time {ringkasan?.periode?.nama_periode}
                    </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
                    {/* 1. Total Kas Kelompok */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-emerald-200/80 dark:border-emerald-800/60 shadow-sm relative overflow-hidden transition-colors">
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5">
                                <span>💼</span> Total Kas Kelompok
                            </span>
                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                                Saldo Bersih
                            </span>
                        </div>
                        <p className="text-2xl font-black text-slate-900 dark:text-emerald-400 tracking-tight">
                            {formatRupiah(ringkasan?.total_kas_kelompok ?? ringkasan?.pos_kas?.kas_kelompok?.saldo)}
                        </p>
                        <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-2 block font-medium">
                            Saldo Awal: {formatRupiah(ringkasan?.saldo_awal)}
                        </span>
                    </div>

                    {/* 2. Pemasukan Kas Kelompok */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[11px] font-extrabold uppercase tracking-wider text-teal-700 dark:text-teal-400 flex items-center gap-1">
                                <ArrowUpRight className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" /> Pemasukan Kelompok
                            </span>
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800/60">
                                Masuk (+)
                            </span>
                        </div>
                        <p className="text-2xl font-black text-teal-900 dark:text-teal-300 tracking-tight">
                            {formatRupiah(ringkasan?.pemasukan_kas_kelompok ?? ringkasan?.pos_kas?.kas_kelompok?.masuk)}
                        </p>
                        <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-2 block font-medium">
                            Iuran Kelompok & Kas Lain
                        </span>
                    </div>

                    {/* 3. Pengeluaran Kas Kelompok */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[11px] font-extrabold uppercase tracking-wider text-rose-700 dark:text-rose-400 flex items-center gap-1">
                                <ArrowDownRight className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" /> Pengeluaran Kelompok
                            </span>
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60">
                                Keluar (-)
                            </span>
                        </div>
                        <p className="text-2xl font-black text-rose-900 dark:text-rose-400 tracking-tight">
                            {formatRupiah(ringkasan?.pengeluaran_kas_kelompok ?? ringkasan?.pos_kas?.kas_kelompok?.keluar)}
                        </p>
                        <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-2 block font-medium">
                            Operasional & Kegiatan
                        </span>
                    </div>

                    {/* 4. Kas Desa */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5">
                                <span>🏡</span> Kas Desa
                            </span>
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60">
                                Titipan
                            </span>
                        </div>
                        <p className="text-2xl font-black text-indigo-950 dark:text-indigo-300 tracking-tight">
                            {formatRupiah(ringkasan?.total_kas_desa ?? ringkasan?.pos_kas?.kas_desa?.saldo)}
                        </p>
                        <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-2 block font-medium">
                            Total Iuran Desa
                        </span>
                    </div>

                    {/* 5. Total Qurban */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                                <span>🐑</span> Total Qurban
                            </span>
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
                                Tabungan
                            </span>
                        </div>
                        <p className="text-2xl font-black text-amber-950 dark:text-amber-300 tracking-tight">
                            {formatRupiah(ringkasan?.total_qurban ?? ringkasan?.pos_kas?.kas_qurban?.saldo)}
                        </p>
                        <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-2 block font-medium">
                            Tabungan Qurban Anggota
                        </span>
                    </div>
                </div>
            </div>

            {/* Pos Dana Khusus (Keputrian & Olahraga di Luar Kas Kelompok) & Total Kas Bersih */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div>
                        <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                            <span>🏛️</span>
                            Pos Kas Khusus (Di Luar Kas Kelompok) & Total Kas
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Uang Keputrian & Uang Olahraga dikelola secara mandiri dan tidak tercampur ke kas kelompok.
                        </p>
                    </div>
                    <Link
                        to="/admin/kas"
                        className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center gap-1 self-start sm:self-auto"
                    >
                        Kelola Kas Operasional →
                    </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                    {/* Uang Keputrian */}
                    <div className="p-4 rounded-2xl bg-pink-50/70 dark:bg-slate-800/90 border border-pink-200 dark:border-pink-900/60 space-y-1.5 transition-colors">
                        <div className="flex items-center justify-between">
                            <span className="font-extrabold text-xs text-pink-900 dark:text-pink-300 flex items-center gap-1">
                                <span>🌸</span> Uang Keputrian
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-200/80 dark:bg-pink-950 text-pink-800 dark:text-pink-300 border border-transparent dark:border-pink-800/50">
                                Di Luar Kas Kelompok
                            </span>
                        </div>
                        <p className="text-xl font-black text-pink-950 dark:text-pink-300">
                            {formatRupiah(ringkasan?.pos_kas?.uang_keputrian?.saldo)}
                        </p>
                        <div className="flex justify-between items-center text-[11px] text-pink-700 dark:text-pink-300/80">
                            <span>Masuk: +{formatRupiah(ringkasan?.pos_kas?.uang_keputrian?.masuk)}</span>
                            <span>Keluar: -{formatRupiah(ringkasan?.pos_kas?.uang_keputrian?.keluar)}</span>
                        </div>
                    </div>

                    {/* Uang Olahraga */}
                    <div className="p-4 rounded-2xl bg-sky-50/70 dark:bg-slate-800/90 border border-sky-200 dark:border-sky-900/60 space-y-1.5 transition-colors">
                        <div className="flex items-center justify-between">
                            <span className="font-extrabold text-xs text-sky-900 dark:text-sky-300 flex items-center gap-1">
                                <span>⚽</span> Uang Olahraga
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-200/80 dark:bg-sky-950 text-sky-800 dark:text-sky-300 border border-transparent dark:border-sky-800/50">
                                Di Luar Kas Kelompok
                            </span>
                        </div>
                        <p className="text-xl font-black text-sky-950 dark:text-sky-300">
                            {formatRupiah(ringkasan?.pos_kas?.uang_olahraga?.saldo)}
                        </p>
                        <div className="flex justify-between items-center text-[11px] text-sky-700 dark:text-sky-300/80">
                            <span>Masuk: +{formatRupiah(ringkasan?.pos_kas?.uang_olahraga?.masuk)}</span>
                            <span>Keluar: -{formatRupiah(ringkasan?.pos_kas?.uang_olahraga?.keluar)}</span>
                        </div>
                    </div>

                    {/* Total Saldo Seluruh Kas */}
                    <div className="p-4 rounded-2xl bg-slate-900 dark:bg-slate-800/90 text-white border border-slate-700/80 dark:border-slate-700 space-y-1.5 shadow-md">
                        <div className="flex items-center justify-between">
                            <span className="font-extrabold text-xs text-emerald-400 flex items-center gap-1">
                                <span>💰</span> Total Seluruh Kas
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-900/60 text-emerald-300 border border-emerald-700/50">
                                Likuiditas Fisik
                            </span>
                        </div>
                        <p className="text-xl font-black text-white dark:text-emerald-400">
                            {formatRupiah(ringkasan?.saldo_bersih)}
                        </p>
                        <span className="text-[11px] text-slate-300 dark:text-slate-400 block">
                            Total gabungan seluruh pos kas
                        </span>
                    </div>

                    {/* Anggota Aktif */}
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 space-y-1.5 transition-colors">
                        <div className="flex items-center justify-between">
                            <span className="font-extrabold text-xs text-blue-900 dark:text-blue-300 flex items-center gap-1">
                                <Users className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> Anggota Aktif
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-transparent dark:border-blue-800/50">
                                Warga
                            </span>
                        </div>
                        <p className="text-xl font-black text-blue-950 dark:text-blue-400">
                            {ringkasan?.total_anggota_aktif || 0} Warga
                        </p>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                            Terdaftar di buku induk anggota
                        </span>
                    </div>
                </div>
            </div>

            {/* Recent Payments Section */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 transition-colors">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                            Transaksi Pembayaran Iuran Terbaru
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Riwayat pencatatan iuran kas masuk terakhir oleh pengurus.
                        </p>
                    </div>
                    <Link
                        to="/admin/pembayaran"
                        className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300"
                    >
                        Lihat Semua →
                    </Link>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-800/70 font-bold">
                                <th className="py-2.5 px-3">Tanggal</th>
                                <th className="py-2.5 px-3">Nama Anggota</th>
                                <th className="py-2.5 px-3">Jenis Iuran</th>
                                <th className="py-2.5 px-3">Periode Bayar</th>
                                <th className="py-2.5 px-3">Nominal</th>
                                <th className="py-2.5 px-3">Catatan</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {recentPembayaran.map((p) => (
                                <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 font-medium whitespace-nowrap">
                                        {formatTanggal(p.tanggal_bayar)}
                                    </td>
                                    <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">{p.anggota?.nama}</td>
                                    <td className="py-2.5 px-3">
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                                            {p.jenis_iuran}
                                        </span>
                                    </td>
                                    <td className="py-2.5 px-3 font-semibold text-slate-700 dark:text-slate-300">{p.periode_bayar}</td>
                                    <td className="py-2.5 px-3 font-bold text-emerald-700 dark:text-emerald-400">{formatRupiah(p.nominal)}</td>
                                    <td className="py-2.5 px-3 text-slate-400 dark:text-slate-500 italic">{p.catatan || '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
