import React, { useState, useEffect, useRef } from 'react';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';
import {
    Search,
    CheckCircle2,
    XCircle,
    Calendar,
    User,
    Sparkles,
    AlertCircle,
    Coins,
    HeartHandshake,
    ChevronDown,
    X
} from 'lucide-react';

export default function CekIuran() {
    const { isAuthenticated } = useAuth();
    const [anggotas, setAnggotas] = useState([]);
    const [periodes, setPeriodes] = useState([]);
    const [selectedAnggota, setSelectedAnggota] = useState(null);
    const [selectedPeriodeId, setSelectedPeriodeId] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [detailData, setDetailData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [searchError, setSearchError] = useState('');
    const searchContainerRef = useRef(null);

    const formatRupiah = (num) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(num || 0);
    };

    // Click outside to close suggestion dropdown
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const fetchInitial = async () => {
            try {
                const [resAnggota, resPeriode] = await Promise.all([
                    api.get('/public/anggota-list'),
                    api.get('/public/periode-list'),
                ]);
                setAnggotas(resAnggota.data);
                setPeriodes(resPeriode.data);

                const activePeriode = resPeriode.data.find((p) => p.status === 'aktif') || resPeriode.data[0];
                if (activePeriode) {
                    setSelectedPeriodeId(activePeriode.id);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setInitialLoading(false);
            }
        };
        fetchInitial();
    }, []);

    const loadDetail = async (anggotaId, periodeId) => {
        if (!anggotaId) return;
        setLoading(true);
        try {
            const url = `/public/cek-iuran/${anggotaId}${periodeId ? `?periode_id=${periodeId}` : ''}`;
            const res = await api.get(url);
            setDetailData(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectAnggota = (a) => {
        setSelectedAnggota(a);
        setSearchQuery(a.nama);
        setShowSuggestions(false);
        setSearchError('');
        loadDetail(a.id, selectedPeriodeId);
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setSearchError('');

        if (!searchQuery.trim()) {
            setSearchError('Ketik nama anggota terlebih dahulu.');
            return;
        }

        const q = searchQuery.trim().toLowerCase();
        // Exact match by name or code
        const exactMatch = anggotas.find(
            (a) => a.nama.toLowerCase() === q || (a.kode_anggota && a.kode_anggota.toLowerCase() === q)
        );
        if (exactMatch) {
            handleSelectAnggota(exactMatch);
            return;
        }

        // Partial match by name or code
        const matches = anggotas.filter((a) =>
            a.nama.toLowerCase().includes(q) || (a.kode_anggota && a.kode_anggota.toLowerCase().includes(q))
        );

        if (matches.length === 1) {
            handleSelectAnggota(matches[0]);
        } else if (matches.length > 1) {
            setShowSuggestions(true);
            setSearchError(`Ditemukan ${matches.length} nama serupa. Silakan pilih salah satu dari daftar.`);
        } else {
            setSearchError(`Data "${searchQuery}" tidak ditemukan. Pastikan ejaan nama atau kode sesuai.`);
        }
    };

    const filteredSuggestions = anggotas.filter((a) => {
        const query = searchQuery.trim().toLowerCase();
        return !query || a.nama.toLowerCase().includes(query) || (a.kode_anggota && a.kode_anggota.toLowerCase().includes(query));
    });

    return (
        <div className="space-y-6 pb-12 max-w-5xl mx-auto">
            {/* Header */}
            <div className="text-center space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 dark:bg-emerald-950/60 text-brand-800 dark:text-emerald-300 border border-brand-200/80 dark:border-emerald-800/60 text-xs font-bold uppercase tracking-wider">
                    <CheckCircle2 className="w-3.5 h-3.5 text-brand-600 dark:text-emerald-400" />
                    Pencarian Transparansi Mandiri
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    Cek Status Iuran Anggota
                </h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xl mx-auto">
                    Ketik nama Anda untuk mengecek riwayat kelunasan Kas Kelompok, Kas Desa, dan Qurban secara terbuka dan akuntabel.
                </p>
            </div>

            {/* Interactive Search Card */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 lg:p-7 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 transition-colors">
                <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                    {/* Live Search Input with Autocomplete */}
                    <div className="sm:col-span-7 space-y-1.5 relative" ref={searchContainerRef}>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                                <Search className="w-3.5 h-3.5 text-brand-600 dark:text-emerald-400" />
                                Cari Nama Anggota:
                            </span>
                            {selectedAnggota && (
                                <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 normal-case flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                    Terpilih: <strong>{selectedAnggota.kode_anggota ? `${selectedAnggota.kode_anggota} ` : ''}{selectedAnggota.nama}</strong> ({selectedAnggota.status})
                                </span>
                            )}
                        </label>

                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                                <Search className="w-4 h-4" />
                            </div>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setShowSuggestions(true);
                                    setSearchError('');
                                }}
                                onFocus={() => setShowSuggestions(true)}
                                placeholder="Cari kode (MM-001) atau nama anda..."
                                className="w-full pl-10 pr-9 py-2.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100/70 dark:hover:bg-slate-700/60 focus:bg-white dark:focus:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-emerald-500 dark:focus:border-emerald-400 rounded-xl text-sm font-semibold text-slate-900 dark:text-white dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition shadow-inner"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearchQuery('');
                                        setSelectedAnggota(null);
                                        setDetailData(null);
                                        setShowSuggestions(false);
                                        setSearchError('');
                                    }}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                                    title="Bersihkan pencarian"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        {/* Suggestions Dropdown Popup */}
                        {showSuggestions && (
                            <div className="absolute z-30 left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/70">
                                {filteredSuggestions.length > 0 ? (
                                    filteredSuggestions.map((a) => (
                                        <button
                                            key={a.id}
                                            type="button"
                                            onClick={() => handleSelectAnggota(a)}
                                            className={`w-full px-4 py-2.5 text-left flex items-center justify-between transition group ${selectedAnggota?.id === a.id
                                                ? 'bg-emerald-50 dark:bg-emerald-950/70 font-bold'
                                                : 'hover:bg-slate-50 dark:hover:bg-slate-700/60'
                                                }`}
                                        >
                                            <div className="flex items-center gap-2.5">
                                                {a.kode_anggota ? (
                                                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 font-mono font-bold text-xs border border-emerald-200/80 dark:border-emerald-800/80">
                                                        {a.kode_anggota}
                                                    </span>
                                                ) : (
                                                    <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-bold text-xs flex items-center justify-center">
                                                        {a.nama.charAt(0)}
                                                    </div>
                                                )}
                                                <span className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-emerald-900 dark:group-hover:text-emerald-300">
                                                    {a.nama}
                                                </span>
                                            </div>
                                            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/60 group-hover:text-emerald-800 dark:group-hover:text-emerald-200">
                                                {a.status}
                                            </span>
                                        </button>
                                    ))
                                ) : (
                                    <div className="p-4 text-center text-xs text-slate-400 dark:text-slate-500">
                                        Tidak ditemukan nama "<strong className="text-slate-600 dark:text-slate-300">{searchQuery}</strong>"
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Select Period */}
                    <div className="sm:col-span-3 space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                            Periode:
                        </label>
                        <select
                            value={selectedPeriodeId}
                            onChange={(e) => {
                                setSelectedPeriodeId(e.target.value);
                                if (selectedAnggota) {
                                    loadDetail(selectedAnggota.id, e.target.value);
                                }
                            }}
                            className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                            {periodes.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.nama_periode} {p.status === 'aktif' ? '(🟢 Aktif)' : '(Ditutup)'}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Submit Button */}
                    <div className="sm:col-span-2">
                        <button
                            type="submit"
                            disabled={loading || !searchQuery.trim()}
                            className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                            {loading ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <Search className="w-4 h-4" />
                                    Cek Iuran
                                </>
                            )}
                        </button>
                    </div>
                </form>

                {searchError && (
                    <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-800 dark:text-amber-200 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                        <span>{searchError}</span>
                    </div>
                )}

            </div>

            {/* Empty State when no member selected */}
            {!detailData && !loading && (
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 border border-slate-200 dark:border-slate-800 text-center space-y-3 shadow-sm transition-colors">
                    <div className="w-16 h-16 rounded-2xl bg-brand-50 dark:bg-emerald-950/50 text-brand-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                        <Search className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                        Cari Nama Anggota untuk Melihat Iuran
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm max-w-md mx-auto">
                        Ketik nama anggota pada kolom pencarian di atas untuk mengecek riwayat kelunasan Kas Kelompok, Kas Desa, dan Qurban secara transparan.
                    </p>
                </div>
            )}

            {/* Result Display Card */}
            {detailData && (
                <div className="space-y-6">
                    {/* Member Profile Header */}
                    <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 dark:from-slate-850 dark:via-slate-900 dark:to-slate-950 border border-slate-700/60 text-white p-6 sm:p-7 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-200 font-extrabold text-2xl">
                                {detailData.anggota?.nama.charAt(0)}
                            </div>
                            <div>
                                <div className="flex flex-wrap items-center gap-2">
                                    {detailData.anggota?.kode_anggota && (
                                        <span className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-black bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 tracking-wider">
                                            {detailData.anggota.kode_anggota}
                                        </span>
                                    )}
                                    <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                                        {detailData.anggota?.nama}
                                    </h2>
                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-200 border border-emerald-500/30">
                                        {detailData.anggota?.status}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-300 mt-1 flex items-center gap-1">
                                    <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                                    {detailData.periode?.nama_periode}
                                    {detailData.periode?.status === 'aktif' ? ' (Aktif)' : ' (Ditutup)'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 self-start sm:self-auto bg-white/10 dark:bg-slate-800/80 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/15 dark:border-slate-700">
                            <div className="text-right">
                                <span className="text-[10px] uppercase font-bold text-slate-300 dark:text-slate-400 block">Total Iuran Lunas</span>
                                <span className="text-sm font-extrabold text-emerald-300">
                                    {(detailData.kas_kelompok?.total_lunas || 0) +
                                        (detailData.kas_desa?.total_lunas || 0) +
                                        (detailData.qurban?.tipe === 'statis'
                                            ? (detailData.qurban?.total_lunas || 0)
                                            : (detailData.qurban?.bulan_breakdown?.filter((b) => b.lunas).length || 0))} Bulan Lunas
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Section 1: Kas Kelompok 12 Bulan Grid */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 transition-colors">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <Coins className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                    Kas Kelompok ({detailData.periode?.nama_periode})
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Tarif: {formatRupiah(detailData.kas_kelompok?.tarif_bulanan)} / bulan • Status: {detailData.kas_kelompok?.total_lunas} dari 12 Bulan Lunas
                                </p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold self-start sm:self-auto border ${detailData.kas_kelompok?.total_lunas === 12
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-200 dark:border-amber-800/60'
                                }`}>
                                {detailData.kas_kelompok?.total_lunas === 12 ? 'Lunas 1 Tahun ✅' : `${detailData.kas_kelompok?.total_lunas}/12 Lunas`}
                            </span>
                        </div>

                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 sm:gap-2.5">
                            {detailData.kas_kelompok?.grid.map((item, idx) => (
                                <div
                                    key={idx}
                                    className={`p-3 rounded-2xl border flex flex-col justify-between min-h-[82px] transition ${item.lunas
                                        ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-800/60 dark:text-emerald-200'
                                        : 'bg-slate-50/70 border-slate-200 text-slate-400 dark:bg-slate-800/60 dark:border-slate-800 dark:text-slate-400'
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className={`text-xs font-bold ${item.lunas ? 'text-emerald-950 dark:text-emerald-200' : 'text-slate-700 dark:text-slate-300'}`}>
                                            {item.bulan}
                                        </span>
                                        {item.lunas ? (
                                            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                        ) : (
                                            <XCircle className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0" />
                                        )}
                                    </div>
                                    <div className="mt-2 text-[11px]">
                                        {item.lunas ? (
                                            <span className="font-semibold text-emerald-700 dark:text-emerald-300 block">
                                                Lunas ✅
                                            </span>
                                        ) : (
                                            <span className="text-slate-400 dark:text-slate-500 block font-medium">Belum</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Section 2: Kas Desa 12 Bulan Grid */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 transition-colors">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <Coins className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                                    Kas Desa ({detailData.periode?.nama_periode})
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Tarif: {formatRupiah(detailData.kas_desa?.tarif_bulanan)} / bulan • Status: {detailData.kas_desa?.total_lunas} dari 12 Bulan Lunas
                                </p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold self-start sm:self-auto border ${detailData.kas_desa?.total_lunas === 12
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-200 dark:border-amber-800/60'
                                }`}>
                                {detailData.kas_desa?.total_lunas === 12 ? 'Lunas 1 Tahun ✅' : `${detailData.kas_desa?.total_lunas}/12 Lunas`}
                            </span>
                        </div>

                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 sm:gap-2.5">
                            {detailData.kas_desa?.grid.map((item, idx) => (
                                <div
                                    key={idx}
                                    className={`p-3 rounded-2xl border flex flex-col justify-between min-h-[82px] transition ${item.lunas
                                        ? 'bg-teal-50/70 border-teal-200 text-teal-900 dark:bg-teal-950/40 dark:border-teal-800/60 dark:text-teal-200'
                                        : 'bg-slate-50/70 border-slate-200 text-slate-400 dark:bg-slate-800/60 dark:border-slate-800 dark:text-slate-400'
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className={`text-xs font-bold ${item.lunas ? 'text-teal-950 dark:text-teal-200' : 'text-slate-700 dark:text-slate-300'}`}>
                                            {item.bulan}
                                        </span>
                                        {item.lunas ? (
                                            <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                                        ) : (
                                            <XCircle className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0" />
                                        )}
                                    </div>
                                    <div className="mt-2 text-[11px]">
                                        {item.lunas ? (
                                            <span className="font-semibold text-teal-700 dark:text-teal-300 block">
                                                Lunas ✅
                                            </span>
                                        ) : (
                                            <span className="text-slate-400 dark:text-slate-500 block font-medium">Belum</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Section 3: Status Qurban (Pedagang Bebas / Karyawan Dinamis 2% / Statis Tahunan) */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 transition-colors">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <HeartHandshake className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                    Iuran Qurban Paguyuban ({detailData.periode?.nama_periode})
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    {detailData.qurban?.keterangan}
                                </p>
                            </div>
                        </div>

                        {detailData.qurban?.tipe === 'bebas' && (
                            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold">
                                    ✨
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-amber-900 dark:text-amber-200">Bebas Kewajiban Iuran Qurban</h4>
                                    <p className="text-xs text-amber-700 dark:text-amber-300/90">
                                        Sesuai kebijakan anggaran Muda-Mudi Ciherang, status Pedagang dibebaskan dari kewajiban iuran qurban.
                                    </p>
                                </div>
                            </div>
                        )}

                        {detailData.qurban?.tipe !== 'bebas' && (
                            <div className="space-y-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        {detailData.qurban?.tarif_bulanan > 0 ? (
                                            <>Tarif: {formatRupiah(detailData.qurban.tarif_bulanan)} / bulan • </>
                                        ) : null}
                                        Status: {detailData.qurban?.total_lunas || (detailData.qurban?.lunas ? 12 : 0)} dari 12 Bulan Lunas
                                    </p>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold self-start sm:self-auto border ${
                                        detailData.qurban?.lunas || detailData.qurban?.total_lunas === 12
                                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
                                            : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/60'
                                    }`}>
                                        {detailData.qurban?.lunas || detailData.qurban?.total_lunas === 12
                                            ? 'Lunas 1 Tahun ✅'
                                            : `${detailData.qurban?.total_lunas || 0}/12 Lunas`}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 sm:gap-2.5">
                                    {(detailData.qurban?.grid || []).map((item, idx) => (
                                        <div
                                            key={idx}
                                            className={`p-3 rounded-2xl border flex flex-col justify-between min-h-[82px] transition ${
                                                item.lunas
                                                    ? 'bg-indigo-50/70 border-indigo-200 text-indigo-900 dark:bg-indigo-950/40 dark:border-indigo-800/60 dark:text-indigo-200'
                                                    : 'bg-slate-50/70 border-slate-200 text-slate-400 dark:bg-slate-800/60 dark:border-slate-800 dark:text-slate-400'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className={`text-xs font-bold ${item.lunas ? 'text-indigo-950 dark:text-indigo-200' : 'text-slate-700 dark:text-slate-300'}`}>
                                                    {item.bulan}
                                                </span>
                                                {item.lunas ? (
                                                    <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                                                ) : (
                                                    <XCircle className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0" />
                                                )}
                                            </div>
                                            <div className="mt-2 text-[11px]">
                                                {item.lunas ? (
                                                    <span className="font-semibold text-indigo-700 dark:text-indigo-300 block">
                                                        Lunas ✅
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400 dark:text-slate-500 block font-medium">Belum</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
