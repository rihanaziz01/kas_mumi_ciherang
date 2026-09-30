import React, { useState, useEffect } from 'react';
import api from '../../api';
import { 
    Coins, 
    ArrowUpRight, 
    ArrowDownRight, 
    Plus, 
    Trash2, 
    CheckCircle2, 
    AlertCircle, 
    Calendar,
    Sparkles,
    Trophy,
    Heart,
    Filter,
    Layers,
    Info,
    X
} from 'lucide-react';

const KATEGORI_PEMASUKAN = ['Uang Keputrian', 'Uang Olahraga', 'Kas Lain'];
const KATEGORI_PENGELUARAN = ['Uang Keputrian', 'Uang Olahraga', 'Operasional', 'Konsumsi', 'Alat/Perlengkapan', 'Kebersihan', 'Acara', 'Kas Lain'];

export default function Kas() {
    const [periodes, setPeriodes] = useState([]);
    const [selectedPeriodeId, setSelectedPeriodeId] = useState('');
    const [tab, setTab] = useState('pemasukan'); // 'pemasukan' | 'pengeluaran'
    const [filterKategori, setFilterKategori] = useState('Semua');

    const [pemasukanList, setPemasukanList] = useState([]);
    const [pengeluaranList, setPengeluaranList] = useState([]);

    // Form states
    const [kategori, setKategori] = useState(KATEGORI_PEMASUKAN[0]);
    const [nominal, setNominal] = useState('');
    const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
    const [keterangan, setKeterangan] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const formatRupiah = (num) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(num || 0);
    };

    const handleNominalChange = (e) => {
        let raw = e.target.value;
        raw = raw.replace(/[,.]00$/, '');
        const digits = raw.replace(/\D/g, '');
        if (!digits) {
            setNominal('');
            return;
        }
        const num = parseInt(digits, 10);
        setNominal(num ? String(num) : '');
    };

    const formatNominalDisplay = (val) => {
        if (!val) return '';
        return 'Rp ' + new Intl.NumberFormat('id-ID').format(Number(val));
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
        fetchPeriodes();
    }, []);

    const fetchPeriodes = async () => {
        try {
            const res = await api.get('/public/periode-list');
            setPeriodes(res.data);
            const active = res.data.find((p) => p.status === 'aktif') || res.data[0];
            if (active) {
                setSelectedPeriodeId(active.id);
                fetchKasData(active.id);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const fetchKasData = async (periodeId) => {
        try {
            const [resMasuk, resKeluar] = await Promise.all([
                api.get(`/admin/pemasukan?periode_id=${periodeId}`),
                api.get(`/admin/pengeluaran?periode_id=${periodeId}`),
            ]);
            setPemasukanList(resMasuk.data);
            setPengeluaranList(resKeluar.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handlePeriodeChange = (e) => {
        const id = e.target.value;
        setSelectedPeriodeId(id);
        fetchKasData(id);
    };

    const handleTabChange = (t) => {
        setTab(t);
        setKategori(t === 'pemasukan' ? KATEGORI_PEMASUKAN[0] : KATEGORI_PENGELUARAN[0]);
        setMessage('');
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        setLoading(true);

        try {
            const payload = {
                periode_id: selectedPeriodeId,
                kategori,
                nominal: Number(nominal),
                tanggal,
                keterangan,
            };

            if (tab === 'pemasukan') {
                const res = await api.post('/admin/pemasukan', payload);
                setMessage(res.data.message);
            } else {
                const res = await api.post('/admin/pengeluaran', payload);
                setMessage(res.data.message);
            }

            setNominal('');
            setKeterangan('');
            fetchKasData(selectedPeriodeId);
        } catch (err) {
            setError(err.response?.data?.message || 'Gagal menyimpan transaksi.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id, type) => {
        if (!window.confirm('Yakin ingin menghapus transaksi ini?')) return;
        try {
            if (type === 'pemasukan') {
                await api.delete(`/admin/pemasukan/${id}`);
            } else {
                await api.delete(`/admin/pengeluaran/${id}`);
            }
            fetchKasData(selectedPeriodeId);
        } catch (err) {
            alert(err.response?.data?.message || 'Gagal menghapus');
        }
    };

    // Kalkulasi Saldo Per Pos Kas
    // 1. Uang Keputrian
    const masukKeputrian = pemasukanList
        .filter((p) => ['Uang Keputrian', 'Keputrian'].includes(p.kategori))
        .reduce((acc, p) => acc + Number(p.nominal), 0);
    const keluarKeputrian = pengeluaranList
        .filter((p) => ['Uang Keputrian', 'Keputrian'].includes(p.kategori))
        .reduce((acc, p) => acc + Number(p.nominal), 0);
    const saldoKeputrian = masukKeputrian - keluarKeputrian;

    // 2. Uang Olahraga
    const masukOlahraga = pemasukanList
        .filter((p) => ['Uang Olahraga', 'Olahraga'].includes(p.kategori))
        .reduce((acc, p) => acc + Number(p.nominal), 0);
    const keluarOlahraga = pengeluaranList
        .filter((p) => ['Uang Olahraga', 'Olahraga'].includes(p.kategori))
        .reduce((acc, p) => acc + Number(p.nominal), 0);
    const saldoOlahraga = masukOlahraga - keluarOlahraga;

    // 3. Kas Operasional Umum (Kas Lain)
    const masukUmum = pemasukanList
        .filter((p) => !['Uang Keputrian', 'Keputrian', 'Uang Olahraga', 'Olahraga'].includes(p.kategori))
        .reduce((acc, p) => acc + Number(p.nominal), 0);
    const keluarUmum = pengeluaranList
        .filter((p) => !['Uang Keputrian', 'Keputrian', 'Uang Olahraga', 'Olahraga'].includes(p.kategori))
        .reduce((acc, p) => acc + Number(p.nominal), 0);
    const saldoUmum = masukUmum - keluarUmum;

    // Active transactions & filter
    const activeList = tab === 'pemasukan' ? pemasukanList : pengeluaranList;
    const filteredList = activeList.filter((item) => {
        if (filterKategori === 'Semua') return true;
        if (filterKategori === 'Uang Keputrian') return ['Uang Keputrian', 'Keputrian'].includes(item.kategori);
        if (filterKategori === 'Uang Olahraga') return ['Uang Olahraga', 'Olahraga'].includes(item.kategori);
        if (filterKategori === 'Kas Kelompok') return !['Uang Keputrian', 'Keputrian', 'Uang Olahraga', 'Olahraga'].includes(item.kategori);
        return true;
    });

    const isKeputrian = ['Uang Keputrian', 'Keputrian'].includes(kategori);
    const isOlahraga = ['Uang Olahraga', 'Olahraga'].includes(kategori);

    return (
        <div className="space-y-8 pb-12 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <Coins className="w-6 h-6 text-emerald-600" />
                        Pemasukan & Pengeluaran Kas Operasional
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">
                        Pencatatan kas operasional: Uang Keputrian, Uang Olahraga, dan kas operasional umum paguyuban.
                    </p>
                </div>

                <div className="sm:w-56">
                    <select
                        value={selectedPeriodeId}
                        onChange={handlePeriodeChange}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-900 shadow-sm"
                    >
                        {periodes.map((p) => (
                            <option key={p.id} value={p.id}>
                                {p.nama_periode} {p.status === 'aktif' ? '(🟢 Aktif)' : '(Ditutup)'}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Pos Alokasi Saldo Kas Terpisah Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1. Kas Uang Keputrian */}
                <div className="bg-pink-50/60 dark:bg-slate-900 rounded-3xl p-5 border border-pink-200 dark:border-pink-900/60 shadow-sm space-y-3 relative overflow-hidden transition-colors">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="w-7 h-7 rounded-lg bg-pink-100 dark:bg-pink-950 text-pink-700 dark:text-pink-300 flex items-center justify-center font-bold text-sm">
                                🌸
                            </span>
                            <span className="font-extrabold text-xs text-pink-950 dark:text-pink-300 uppercase tracking-wide">
                                Kas Uang Keputrian
                            </span>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-200/70 dark:bg-pink-950/80 text-pink-800 dark:text-pink-300 border border-transparent dark:border-pink-800/60">
                            Di Luar Kas Kelompok
                        </span>
                    </div>

                    <div>
                        <span className="text-[11px] font-bold text-pink-700 dark:text-pink-400 block">Sisa Saldo Keputrian:</span>
                        <p className="text-2xl font-black text-pink-900 dark:text-pink-300 tracking-tight">
                            {formatRupiah(saldoKeputrian)}
                        </p>
                    </div>

                    <div className="pt-2 border-t border-pink-200/60 dark:border-pink-900/40 flex items-center justify-between text-[11px] text-pink-800/80 dark:text-pink-300/80">
                        <span>Masuk: <strong className="text-pink-900 dark:text-pink-300">+{formatRupiah(masukKeputrian)}</strong></span>
                        <span>Keluar: <strong className="text-pink-900 dark:text-pink-300">-{formatRupiah(keluarKeputrian)}</strong></span>
                    </div>
                </div>

                {/* 2. Kas Uang Olahraga */}
                <div className="bg-sky-50/60 dark:bg-slate-900 rounded-3xl p-5 border border-sky-200 dark:border-sky-900/60 shadow-sm space-y-3 relative overflow-hidden transition-colors">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="w-7 h-7 rounded-lg bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 flex items-center justify-center font-bold text-sm">
                                ⚽
                            </span>
                            <span className="font-extrabold text-xs text-sky-950 dark:text-sky-300 uppercase tracking-wide">
                                Kas Uang Olahraga
                            </span>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-200/70 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 border border-transparent dark:border-sky-800/60">
                            Di Luar Kas Kelompok
                        </span>
                    </div>

                    <div>
                        <span className="text-[11px] font-bold text-sky-700 dark:text-sky-400 block">Sisa Saldo Olahraga:</span>
                        <p className="text-2xl font-black text-sky-900 dark:text-sky-300 tracking-tight">
                            {formatRupiah(saldoOlahraga)}
                        </p>
                    </div>

                    <div className="pt-2 border-t border-sky-200/60 dark:border-sky-900/40 flex items-center justify-between text-[11px] text-sky-800/80 dark:text-sky-300/80">
                        <span>Masuk: <strong className="text-sky-900 dark:text-sky-300">+{formatRupiah(masukOlahraga)}</strong></span>
                        <span>Keluar: <strong className="text-sky-900 dark:text-sky-300">-{formatRupiah(keluarOlahraga)}</strong></span>
                    </div>
                </div>

                {/* 3. Kas Operasional Kelompok */}
                <div className="bg-slate-50/80 dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 transition-colors">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-sm">
                                💼
                            </span>
                            <span className="font-extrabold text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                                Kas Operasional Umum
                            </span>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-transparent dark:border-slate-700">
                            Kas Kelompok
                        </span>
                    </div>

                    <div>
                        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">Arus Operasional Kas Lain:</span>
                        <p className={`text-2xl font-black tracking-tight ${saldoUmum >= 0 ? 'text-slate-900 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                            {formatRupiah(saldoUmum)}
                        </p>
                    </div>

                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400">
                        <span>Masuk: <strong className="text-slate-800 dark:text-slate-200">+{formatRupiah(masukUmum)}</strong></span>
                        <span>Keluar: <strong className="text-slate-800 dark:text-slate-200">-{formatRupiah(keluarUmum)}</strong></span>
                    </div>
                </div>
            </div>

            {message && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>{message}</span>
                </div>
            )}
            {error && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-sm font-semibold flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* Tab Switcher */}
            <div className="flex rounded-2xl bg-slate-200/80 dark:bg-slate-800 p-1.5 max-w-md transition-colors">
                <button
                    onClick={() => handleTabChange('pemasukan')}
                    className={`flex-1 py-2.5 rounded-xl font-extrabold text-xs transition flex items-center justify-center gap-1.5 ${
                        tab === 'pemasukan'
                            ? 'bg-emerald-600 text-white shadow-md'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                >
                    <ArrowUpRight className="w-4 h-4" />
                    Pemasukan Kas (+)
                </button>
                <button
                    onClick={() => handleTabChange('pengeluaran')}
                    className={`flex-1 py-2.5 rounded-xl font-extrabold text-xs transition flex items-center justify-center gap-1.5 ${
                        tab === 'pengeluaran'
                            ? 'bg-rose-600 text-white shadow-md'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                >
                    <ArrowDownRight className="w-4 h-4" />
                    Pengeluaran Kas (-)
                </button>
            </div>

            {/* Input Form */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 transition-colors">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Catat {tab === 'pemasukan' ? 'Pemasukan Kas Baru' : 'Pengeluaran Kas Baru'}:
                    </h3>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        Pilih kategori untuk memisahkan alokasi kas
                    </span>
                </div>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end text-xs">
                    <div className="sm:col-span-4 space-y-1">
                        <label className="block font-bold text-slate-700 dark:text-slate-300">Kategori Kas:</label>
                        <select
                            value={kategori}
                            onChange={(e) => setKategori(e.target.value)}
                            className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                            {(tab === 'pemasukan' ? KATEGORI_PEMASUKAN : KATEGORI_PENGELUARAN).map((k) => (
                                <option key={k} value={k}>
                                    {k === 'Uang Keputrian' ? '🌸 Uang Keputrian' : k === 'Uang Olahraga' ? '⚽ Uang Olahraga' : k}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="sm:col-span-4 space-y-1">
                        <label className="block font-bold text-slate-700 dark:text-slate-300">Nominal (Rp):</label>
                        <div className="relative">
                            <input
                                type="text"
                                inputMode="numeric"
                                required
                                placeholder="Rp 0"
                                value={formatNominalDisplay(nominal)}
                                onChange={handleNominalChange}
                                className="w-full pl-3.5 pr-8 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition shadow-inner"
                            />
                            {nominal && (
                                <button
                                    type="button"
                                    onClick={() => setNominal('')}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded-full transition"
                                    title="Hapus / Reset Nominal"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="sm:col-span-4 space-y-1">
                        <label className="block font-bold text-slate-700 dark:text-slate-300">Tanggal:</label>
                        <input
                            type="date"
                            required
                            value={tanggal}
                            onChange={(e) => setTanggal(e.target.value)}
                            className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                    </div>

                    {/* Dynamic Pos Kas Notice Box */}
                    <div className="sm:col-span-12">
                        {isKeputrian && (
                            <div className="p-3 rounded-xl bg-pink-50 dark:bg-slate-800/80 border border-pink-200 dark:border-pink-900/60 text-pink-900 dark:text-pink-300 text-xs flex items-center gap-2">
                                <span className="text-base">🌸</span>
                                <div>
                                    <strong className="font-bold">Alokasi Khusus Uang Keputrian:</strong> Transaksi ini otomatis masuk ke kantong kas <strong>Uang Keputrian</strong> dan <strong>di luar dari Kas Kelompok</strong>.
                                </div>
                            </div>
                        )}
                        {isOlahraga && (
                            <div className="p-3 rounded-xl bg-sky-50 dark:bg-slate-800/80 border border-sky-200 dark:border-sky-900/60 text-sky-900 dark:text-sky-300 text-xs flex items-center gap-2">
                                <span className="text-base">⚽</span>
                                <div>
                                    <strong className="font-bold">Alokasi Khusus Uang Olahraga:</strong> Transaksi ini otomatis masuk ke kantong kas <strong>Uang Olahraga</strong> dan <strong>di luar dari Kas Kelompok</strong>.
                                </div>
                            </div>
                        )}
                        {!isKeputrian && !isOlahraga && (
                            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs flex items-center gap-2">
                                <span className="text-base">💼</span>
                                <div>
                                    <strong className="font-bold">Alokasi Kas Kelompok:</strong> Transaksi ini dicatat pada kas operasional umum / kas kelompok.
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="sm:col-span-12 space-y-1">
                        <label className="block font-bold text-slate-700 dark:text-slate-300">Keterangan / Uraian:</label>
                        <input
                            type="text"
                            placeholder="Contoh: Beli bola futsal baru / Snack pertemuan keputrian"
                            value={keterangan}
                            onChange={(e) => setKeterangan(e.target.value)}
                            className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                    </div>

                    <div className="sm:col-span-12 pt-2 flex justify-end">
                        <button
                            type="submit"
                            disabled={loading || !nominal}
                            className={`px-5 py-2.5 rounded-xl text-white font-extrabold text-xs shadow-md transition flex items-center gap-1.5 ${
                                tab === 'pemasukan'
                                    ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'
                                    : 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/20'
                            }`}
                        >
                            {loading ? 'Menyimpan...' : `Simpan ${tab === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran'}`}
                        </button>
                    </div>
                </form>
            </div>

            {/* List Table with Category Filter Pills */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">
                            Daftar {tab === 'pemasukan' ? 'Pemasukan Kas' : 'Pengeluaran Kas'} ({filteredList.length} Transaksi)
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Filter berdasarkan kategori pos kas untuk melihat detail aliran dana.
                        </p>
                    </div>

                    {/* Filter Pills */}
                    <div className="flex flex-wrap gap-1.5">
                        <button
                            type="button"
                            onClick={() => setFilterKategori('Semua')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                                filterKategori === 'Semua'
                                    ? 'bg-slate-900 dark:bg-emerald-600 text-white shadow-sm'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                        >
                            Semua ({activeList.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilterKategori('Uang Keputrian')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                                filterKategori === 'Uang Keputrian'
                                    ? 'bg-pink-600 text-white shadow-sm'
                                    : 'bg-pink-50 dark:bg-slate-800 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-900/60 hover:bg-pink-100 dark:hover:bg-slate-700'
                            }`}
                        >
                            <span>🌸</span> Keputrian ({activeList.filter((i) => ['Uang Keputrian', 'Keputrian'].includes(i.kategori)).length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilterKategori('Uang Olahraga')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                                filterKategori === 'Uang Olahraga'
                                    ? 'bg-sky-600 text-white shadow-sm'
                                    : 'bg-sky-50 dark:bg-slate-800 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-900/60 hover:bg-sky-100 dark:hover:bg-slate-700'
                            }`}
                        >
                            <span>⚽</span> Olahraga ({activeList.filter((i) => ['Uang Olahraga', 'Olahraga'].includes(i.kategori)).length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilterKategori('Kas Kelompok')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                                filterKategori === 'Kas Kelompok'
                                    ? 'bg-emerald-600 text-white shadow-sm'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                        >
                            <span>💼</span> Kas Kelompok ({activeList.filter((i) => !['Uang Keputrian', 'Keputrian', 'Uang Olahraga', 'Olahraga'].includes(i.kategori)).length})
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-800/70 font-bold">
                                <th className="py-2.5 px-3">Tanggal</th>
                                <th className="py-2.5 px-3">Pos / Kategori</th>
                                <th className="py-2.5 px-3">Uraian / Keterangan</th>
                                <th className="py-2.5 px-3">Nominal</th>
                                <th className="py-2.5 px-3 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredList.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-8 text-center text-slate-400 italic">
                                        Tidak ada transaksi untuk filter ini.
                                    </td>
                                </tr>
                            ) : (
                                filteredList.map((item) => {
                                    const isItemKeputrian = ['Uang Keputrian', 'Keputrian'].includes(item.kategori);
                                    const isItemOlahraga = ['Uang Olahraga', 'Olahraga'].includes(item.kategori);

                                    return (
                                        <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                                            <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 font-medium whitespace-nowrap">
                                                {formatTanggal(item.tanggal)}
                                            </td>
                                            <td className="py-2.5 px-3 font-bold">
                                                {isItemKeputrian ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-pink-100 dark:bg-pink-950/80 text-pink-800 dark:text-pink-300 border border-pink-200 dark:border-pink-800/60">
                                                        🌸 Uang Keputrian (Khusus)
                                                    </span>
                                                ) : isItemOlahraga ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800/60">
                                                        ⚽ Uang Olahraga (Khusus)
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-transparent dark:border-slate-700">
                                                        💼 {item.kategori}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">{item.keterangan || '-'}</td>
                                            <td
                                                className={`py-2.5 px-3 font-extrabold whitespace-nowrap ${
                                                    tab === 'pemasukan' ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'
                                                }`}
                                            >
                                                {tab === 'pemasukan' ? '+' : '-'} {formatRupiah(item.nominal)}
                                            </td>
                                            <td className="py-2.5 px-3 text-right">
                                                <button
                                                    onClick={() => handleDelete(item.id, tab)}
                                                    className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded transition"
                                                    title="Hapus"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
