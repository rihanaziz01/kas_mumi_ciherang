import React, { useState, useEffect } from 'react';
import api from '../../api';
import {
    Calendar,
    Lock,
    Unlock,
    AlertTriangle,
    CheckCircle2,
    Plus,
    ArrowRight,
    Coins,
    ShieldAlert,
    RefreshCw,
    Sparkles,
    X,
    Trash2
} from 'lucide-react';

export default function Periode() {
    const [periodes, setPeriodes] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal state for Tutup Buku Pasca-Qurban
    const [showModalTutupBuku, setShowModalTutupBuku] = useState(false);
    const [targetPeriode, setTargetPeriode] = useState(null);
    const [bawaSaldo, setBawaSaldo] = useState(true);
    const [namaPeriodeBaru, setNamaPeriodeBaru] = useState('');
    const [tanggalMulaiBaru, setTanggalMulaiBaru] = useState(new Date().toISOString().split('T')[0]);
    const [loadingExecute, setLoadingExecute] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    // Modal state for Re-activating Period
    const [showModalSetAktif, setShowModalSetAktif] = useState(false);
    const [targetSetAktif, setTargetSetAktif] = useState(null);
    const [loadingSetAktif, setLoadingSetAktif] = useState(false);

    // Modal state for Delete Period
    const [showModalDelete, setShowModalDelete] = useState(false);
    const [targetDelete, setTargetDelete] = useState(null);
    const [loadingDelete, setLoadingDelete] = useState(false);

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
        setLoading(true);
        try {
            const res = await api.get('/admin/periode');
            setPeriodes(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const getCyclePreview = (dateStr) => {
        if (!dateStr) return '';
        try {
            const parts = dateStr.split('-');
            if (parts.length === 3) {
                const startYear = Number(parts[0]);
                const startMonth = Number(parts[1]);
                const monthNames = [
                    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
                    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
                ];
                const endMonthIndex = (startMonth + 10) % 12;
                const endYear = startYear + Math.floor((startMonth - 1 + 11) / 12);
                return `${monthNames[startMonth - 1]} ${startYear} s/d ${monthNames[endMonthIndex]} ${endYear}`;
            }
        } catch { }
        return '';
    };

    const generateSmartPeriodeName = (dateStr, existingPeriodes = periodes) => {
        try {
            const parts = (dateStr || '').split('-');
            const year = parts[0] ? Number(parts[0]) : new Date().getFullYear();
            const month = parts[1] ? Number(parts[1]) : 1;

            const existingNames = (existingPeriodes || []).map((p) => p.nama_periode.toLowerCase().trim());
            const candidate1 = month > 1 ? `Periode ${year}/${year + 1}` : `Periode ${year + 1}`;
            const candidate2 = `Periode ${year + 1}`;
            const candidate3 = `Periode Pasca-Qurban ${year}`;

            if (!existingNames.includes(candidate1.toLowerCase())) return candidate1;
            if (!existingNames.includes(candidate2.toLowerCase())) return candidate2;
            if (!existingNames.includes(candidate3.toLowerCase())) return candidate3;
            return `Periode ${year + 2}`;
        } catch {
            return `Periode ${new Date().getFullYear() + 1}`;
        }
    };

    const handleOpenTutupBuku = (periode) => {
        setTargetPeriode(periode);
        const today = new Date();
        const nextMonthFirst = new Date(today.getFullYear(), today.getMonth() + 1, 1);
        const yyyy = nextMonthFirst.getFullYear();
        const mm = String(nextMonthFirst.getMonth() + 1).padStart(2, '0');
        const dd = String(nextMonthFirst.getDate()).padStart(2, '0');
        const initialDate = `${yyyy}-${mm}-${dd}`;
        setTanggalMulaiBaru(initialDate);
        setNamaPeriodeBaru(generateSmartPeriodeName(initialDate, periodes));
        setBawaSaldo(true);
        setError('');
        setMessage('');
        setShowModalTutupBuku(true);
    };

    const handleExecuteTutupBuku = async (e) => {
        e.preventDefault();
        setError('');
        setLoadingExecute(true);
        try {
            const res = await api.post(`/admin/periode/${targetPeriode.id}/tutup-buku`, {
                bawa_saldo: bawaSaldo,
                nama_periode_baru: namaPeriodeBaru,
                tanggal_mulai_baru: tanggalMulaiBaru,
            });
            setMessage(res.data.message);
            setShowModalTutupBuku(false);
            fetchPeriodes();
        } catch (err) {
            const serverMsg =
                err.response?.data?.errors?.nama_periode_baru?.[0] ||
                err.response?.data?.errors?.tanggal_mulai_baru?.[0] ||
                err.response?.data?.message ||
                'Gagal melakukan tutup buku.';
            setError(serverMsg);
        } finally {
            setLoadingExecute(false);
        }
    };

    const handleOpenSetAktif = (periode) => {
        setTargetSetAktif(periode);
        setError('');
        setMessage('');
        setShowModalSetAktif(true);
    };

    const handleExecuteSetAktif = async () => {
        if (!targetSetAktif) return;
        setLoadingSetAktif(true);
        setError('');
        try {
            const res = await api.post(`/admin/periode/${targetSetAktif.id}/set-aktif`);
            setMessage(res.data.message);
            setShowModalSetAktif(false);
            fetchPeriodes();
        } catch (err) {
            setError(err.response?.data?.message || 'Gagal mengaktifkan periode.');
        } finally {
            setLoadingSetAktif(false);
        }
    };

    const handleOpenDelete = (periode) => {
        setTargetDelete(periode);
        setError('');
        setMessage('');
        setShowModalDelete(true);
    };

    const handleExecuteDelete = async () => {
        if (!targetDelete) return;
        setLoadingDelete(true);
        setError('');
        try {
            const res = await api.delete(`/admin/periode/${targetDelete.id}`);
            setMessage(res.data.message);
            setShowModalDelete(false);
            fetchPeriodes();
        } catch (err) {
            setError(err.response?.data?.message || 'Gagal menghapus periode.');
        } finally {
            setLoadingDelete(false);
        }
    };

    return (
        <div className="space-y-6 pb-12 max-w-5xl mx-auto">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
                    <Calendar className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                    Manajemen Periode Keuangan & Tutup Buku
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
                    Kelola siklus 12 bulan kas. Ketika siklus Qurban selesai, Admin dapat menutup buku periode lama dengan membawa saldo sisa kas (Kas Kelompok + Olahraga & Keputrian) atau mulai bersih dari Rp 0 tanpa menghapus data historis.
                </p>
            </div>

            {message && (
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-sm font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>{message}</span>
                </div>
            )}
            {error && (
                <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200 text-sm font-semibold flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* List Periode Cards */}
            <div className="space-y-4">
                {loading ? (
                    <div className="p-8 text-center text-xs text-slate-400 font-semibold bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                        Memuat data periode keuangan...
                    </div>
                ) : periodes.map((p) => {
                    const isAktif = p.status === 'aktif';
                    return (
                        <div
                            key={p.id}
                            className={`rounded-3xl p-6 border transition shadow-sm ${isAktif
                                ? 'bg-white dark:bg-slate-900 border-emerald-400/80 dark:border-emerald-600/80 ring-2 ring-emerald-500/15'
                                : 'bg-white/80 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800'
                                }`}
                        >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2.5 flex-wrap">
                                        <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                                            {p.nama_periode}
                                        </h2>
                                        {isAktif ? (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                                PERIODE AKTIF
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                                <Lock className="w-3.5 h-3.5 text-slate-400" />
                                                DITUTUP (Read-Only)
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        Mulai: <strong>{p.tanggal_mulai}</strong> {p.tanggal_selesai ? `• Selesai: ${p.tanggal_selesai}` : '• Sedang Berjalan'}
                                    </p>
                                </div>

                                <div>
                                    {isAktif ? (
                                        <button
                                            onClick={() => handleOpenTutupBuku(p)}
                                            className="px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 transition flex items-center gap-2"
                                        >
                                            <Lock className="w-4 h-4" />
                                            TUTUP BUKU PASCA-QURBAN
                                        </button>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleOpenSetAktif(p)}
                                                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5 cursor-pointer"
                                            >
                                                <Unlock className="w-3.5 h-3.5" />
                                                Aktifkan Kembali
                                            </button>
                                            <button
                                                onClick={() => handleOpenDelete(p)}
                                                className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 font-bold text-xs border border-rose-200 dark:border-rose-800/60 transition flex items-center gap-1.5 cursor-pointer"
                                                title={`Hapus ${p.nama_periode}`}
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                                Hapus
                                            </button>
                                            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/60 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700">
                                                Arsip Historis
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Financial breakdown: 4 Stat Tiles */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
                                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50">
                                    <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-400 block mb-1">Saldo Awal</span>
                                    <div className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
                                        {formatRupiah(p.saldo_awal)}
                                    </div>
                                </div>
                                <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40">
                                    <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 block mb-1">Total Masuk</span>
                                    <div className="text-sm font-black text-emerald-700 dark:text-emerald-300">
                                        +{formatRupiah(p.total_masuk)}
                                    </div>
                                </div>
                                <div className="p-3.5 rounded-2xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/40">
                                    <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 block mb-1">Total Keluar</span>
                                    <div className="text-sm font-black text-rose-700 dark:text-rose-300">
                                        -{formatRupiah(p.total_keluar)}
                                    </div>
                                </div>
                                <div className="p-3.5 rounded-2xl bg-slate-100/70 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">Saldo Akhir Buku</span>
                                    <div className="text-sm font-black text-slate-900 dark:text-white">
                                        {formatRupiah(p.saldo_akhir_kalkulasi)}
                                    </div>
                                </div>
                            </div>

                            {/* Sub breakdown: Pos Kas Paguyuban */}
                            <div className="mt-3.5 px-4 py-2.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-900 dark:text-emerald-200 font-extrabold text-[11px]">
                                        <Coins className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                        Kas: {formatRupiah(p.saldo_bisa_dibawa)}
                                    </span>
                                    <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                                        (Kelompok: <strong className="text-slate-700 dark:text-slate-300">{formatRupiah(p.saldo_kas_kelompok)}</strong> • Olahraga & Keputrian: <strong className="text-slate-700 dark:text-slate-300">{formatRupiah((p.saldo_olahraga || 0) + (p.saldo_keputrian || 0))}</strong>)
                                    </span>
                                </div>
                                <div className="text-slate-400 dark:text-slate-500 text-[11px]">
                                    Desa: {formatRupiah(p.saldo_desa)} • Qurban: {formatRupiah(p.saldo_qurban)}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Modal Tutup Buku Pasca-Qurban */}
            {showModalTutupBuku && targetPeriode && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
                    <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 border border-slate-200 dark:border-slate-800 max-h-[92vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-3">
                                <div className="w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black">
                                    <Lock className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                                        Tutup Periode Keuangan
                                    </h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                        {targetPeriode.nama_periode} • Siklus Pasca-Qurban Selesai
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowModalTutupBuku(false)}
                                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Unified Financial Breakdown */}
                        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-4 space-y-3.5">
                            {/* Top accounting mini-table */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                                <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                                    <span className="text-[10px] text-slate-400 font-semibold block">Saldo Awal</span>
                                    <strong className="text-xs text-slate-800 dark:text-slate-200">{formatRupiah(targetPeriode.saldo_awal)}</strong>
                                </div>
                                <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block">Total Masuk</span>
                                    <strong className="text-xs text-emerald-700 dark:text-emerald-300">+{formatRupiah(targetPeriode.total_masuk)}</strong>
                                </div>
                                <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                                    <span className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold block">Total Keluar</span>
                                    <strong className="text-xs text-rose-700 dark:text-rose-300">-{formatRupiah(targetPeriode.total_keluar)}</strong>
                                </div>
                                <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block">Saldo Akhir Buku</span>
                                    <strong className="text-xs text-slate-900 dark:text-white">{formatRupiah(targetPeriode.saldo_akhir_kalkulasi)}</strong>
                                </div>
                            </div>

                            {/* Rincian Pos Kas: Kas Paguyuban (Bisa Dibawa) vs Pos Lain */}
                            <div className="pt-2 border-t border-slate-200/80 dark:border-slate-700/80 space-y-2">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-extrabold text-emerald-950 dark:text-emerald-300 flex items-center gap-1.5">
                                        <Coins className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                        Saldo Kas (Bisa Dibawa)
                                    </span>
                                    <span className="px-2.5 py-0.5 rounded-lg bg-emerald-600 text-white font-black text-xs shadow-sm">
                                        {formatRupiah(targetPeriode.saldo_bisa_dibawa)}
                                    </span>
                                </div>

                                <div className="grid grid-cols-3 gap-2 text-[11px]">
                                    <div className="p-2 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/40">
                                        <span className="text-slate-500 dark:text-slate-400 block text-[10px]">1. Kas Kelompok</span>
                                        <strong className="text-slate-800 dark:text-slate-200">{formatRupiah(targetPeriode.saldo_kas_kelompok)}</strong>
                                    </div>
                                    <div className="p-2 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/40">
                                        <span className="text-slate-500 dark:text-slate-400 block text-[10px]">2. Uang Olahraga</span>
                                        <strong className="text-slate-800 dark:text-slate-200">{formatRupiah(targetPeriode.saldo_olahraga)}</strong>
                                    </div>
                                    <div className="p-2 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/40">
                                        <span className="text-slate-500 dark:text-slate-400 block text-[10px]">3. Uang Keputrian</span>
                                        <strong className="text-slate-800 dark:text-slate-200">{formatRupiah(targetPeriode.saldo_keputrian)}</strong>
                                    </div>
                                </div>

                                {/* Pos Non-Paguyuban */}
                                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-slate-500 dark:text-slate-400">
                                    <span>• Titipan Kas Desa: <strong className="text-slate-700 dark:text-slate-300">{formatRupiah(targetPeriode.saldo_desa)}</strong> (ke desa)</span>
                                    <span>• Tabungan Qurban: <strong className="text-slate-700 dark:text-slate-300">{formatRupiah(targetPeriode.saldo_qurban)}</strong> (dialokasikan)</span>
                                </div>
                            </div>
                        </div>

                        {/* Choice of Initial Balance for Next Period */}
                        <form onSubmit={handleExecuteTutupBuku} className="space-y-4 text-xs">
                            <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px]">
                                Pilih Kebijakan Saldo Awal Periode Baru:
                            </label>

                            <div className="space-y-2.5">
                                <label
                                    className={`p-3.5 rounded-2xl border flex items-start gap-3 cursor-pointer transition ${bawaSaldo
                                        ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-400 dark:border-emerald-600 ring-2 ring-emerald-500/20'
                                        : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                                        }`}
                                >
                                    <input
                                        type="radio"
                                        name="bawaSaldo"
                                        checked={bawaSaldo === true}
                                        onChange={() => setBawaSaldo(true)}
                                        className="mt-1 text-emerald-600 accent-emerald-600 shrink-0"
                                    />
                                    <div className="space-y-0.5">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <strong className="text-slate-900 dark:text-white text-xs sm:text-sm">
                                                Opsi 1: Bawa Saldo Kas({formatRupiah(targetPeriode.saldo_bisa_dibawa)})
                                            </strong>
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200">
                                                Direkomendasikan
                                            </span>
                                        </div>
                                        <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                                            Sisa <strong>Kas Kelompok ({formatRupiah(targetPeriode.saldo_kas_kelompok)})</strong> serta <strong>Olahraga & Keputrian ({formatRupiah((targetPeriode.saldo_olahraga || 0) + (targetPeriode.saldo_keputrian || 0))})</strong> bergulir menjadi modal awal periode baru. Kas Desa & Qurban tidak dibawa.
                                        </p>
                                    </div>
                                </label>

                                <label
                                    className={`p-3.5 rounded-2xl border flex items-start gap-3 cursor-pointer transition ${!bawaSaldo
                                        ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-400 dark:border-emerald-600 ring-2 ring-emerald-500/20'
                                        : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                                        }`}
                                >
                                    <input
                                        type="radio"
                                        name="bawaSaldo"
                                        checked={bawaSaldo === false}
                                        onChange={() => setBawaSaldo(false)}
                                        className="mt-1 text-emerald-600 accent-emerald-600 shrink-0"
                                    />
                                    <div className="space-y-0.5">
                                        <strong className="text-slate-900 dark:text-white text-xs sm:text-sm">
                                            Opsi 2: Mulai Periode Baru dari Rp 0
                                        </strong>
                                        <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                                            Gunakan opsi ini jika seluruh sisa dana kas juga telah dibagikan habis atau dipakai penuh untuk penutupan tahun.
                                        </p>
                                    </div>
                                </label>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                                <div className="space-y-1">
                                    <label className="block font-bold text-slate-700 dark:text-slate-300 text-xs">
                                        Nama Periode Baru:
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={namaPeriodeBaru}
                                        onChange={(e) => setNamaPeriodeBaru(e.target.value)}
                                        placeholder="Contoh: Periode 2027"
                                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="block font-bold text-slate-700 dark:text-slate-300 text-xs">
                                        Tanggal Mulai Baru:
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        value={tanggalMulaiBaru}
                                        onChange={(e) => {
                                            const newDate = e.target.value;
                                            setTanggalMulaiBaru(newDate);
                                            setNamaPeriodeBaru(generateSmartPeriodeName(newDate, periodes));
                                        }}
                                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                                    />
                                </div>
                            </div>

                            {/* Quick Name Suggestions */}
                            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                                <span className="text-[10px] font-semibold text-slate-400">Pilihan Cepat:</span>
                                {[
                                    `Periode ${new Date(tanggalMulaiBaru || new Date()).getFullYear()}/${new Date(tanggalMulaiBaru || new Date()).getFullYear() + 1}`,
                                    `Periode ${new Date(tanggalMulaiBaru || new Date()).getFullYear() + 1}`,
                                    `Periode Pasca-Qurban ${new Date(tanggalMulaiBaru || new Date()).getFullYear()}`,
                                ].map((suggestion) => (
                                    <button
                                        key={suggestion}
                                        type="button"
                                        onClick={() => setNamaPeriodeBaru(suggestion)}
                                        className={`text-[10px] px-2.5 py-1 rounded-lg border font-medium transition cursor-pointer ${namaPeriodeBaru === suggestion
                                            ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700 font-bold'
                                            : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                                            }`}
                                    >
                                        {suggestion}
                                    </button>
                                ))}
                            </div>

                            {tanggalMulaiBaru && (
                                <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                    <span>
                                        Siklus 12 bulan iuran: <strong>{getCyclePreview(tanggalMulaiBaru)}</strong>
                                    </span>
                                </div>
                            )}

                            <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setShowModalTutupBuku(false)}
                                    className="px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold transition text-xs"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={loadingExecute}
                                    className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-extrabold shadow-md transition flex items-center gap-2 text-xs"
                                >
                                    {loadingExecute ? (
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            <Lock className="w-3.5 h-3.5 text-amber-400" />
                                            Eksekusi Tutup Buku
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Konfirmasi Aktifkan Kembali Periode */}
            {showModalSetAktif && targetSetAktif && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
                    <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black">
                                <Unlock className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                                    Aktifkan Periode?
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                    Jadikan <strong>{targetSetAktif.nama_periode}</strong> sebagai periode aktif
                                </p>
                            </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs text-slate-700 dark:text-slate-300 space-y-2 leading-relaxed">
                            <p>
                                Anda akan mengaktifkan kembali <strong>{targetSetAktif.nama_periode}</strong> sebagai periode kerja utama.
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                • Pencatatan iuran, transaksi kas, dan laporan akan kembali mengacu pada periode ini.<br />
                                • Periode yang sedang aktif saat ini akan otomatis dialihkan menjadi arsip ditutup.
                            </p>
                        </div>

                        <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                            <button
                                type="button"
                                onClick={() => setShowModalSetAktif(false)}
                                className="px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold transition text-xs"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                disabled={loadingSetAktif}
                                onClick={handleExecuteSetAktif}
                                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold shadow-md transition flex items-center gap-2 text-xs"
                            >
                                {loadingSetAktif ? (
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <Unlock className="w-3.5 h-3.5" />
                                        Ya, Aktifkan Periode Ini
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Konfirmasi Hapus Periode */}
            {showModalDelete && targetDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
                    <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center font-black">
                                <Trash2 className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                                    Hapus Periode Keuangan?
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                    {targetDelete.nama_periode}
                                </p>
                            </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-xs text-rose-950 dark:text-rose-200 space-y-2 leading-relaxed">
                            <p className="font-semibold">
                                Apakah Anda yakin ingin menghapus <strong>{targetDelete.nama_periode}</strong> secara permanen?
                            </p>
                            <p className="text-[11px] text-rose-700 dark:text-rose-300">
                                ⚠️ Seluruh data transaksi pembayaran ({formatRupiah(targetDelete.total_masuk)}), pemasukan, dan pengeluaran yang tercatat pada periode ini akan ikut terhapus dari sistem.
                            </p>
                        </div>

                        <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                            <button
                                type="button"
                                onClick={() => setShowModalDelete(false)}
                                className="px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold transition text-xs"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                disabled={loadingDelete}
                                onClick={handleExecuteDelete}
                                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold shadow-md transition flex items-center gap-2 text-xs"
                            >
                                {loadingDelete ? (
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <Trash2 className="w-3.5 h-3.5" />
                                        Ya, Hapus Periode
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
