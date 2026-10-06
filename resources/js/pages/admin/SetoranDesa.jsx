import React, { useState, useEffect } from 'react';
import api from '../../api';
import {
    Building2,
    Send,
    Plus,
    Trash2,
    CheckCircle2,
    AlertCircle,
    X,
    Loader2,
    Receipt,
    Coins,
    Check
} from 'lucide-react';

export default function SetoranDesa() {
    const [periodes, setPeriodes] = useState([]);
    const [selectedPeriodeId, setSelectedPeriodeId] = useState('');
    const [setoranData, setSetoranData] = useState(null);
    const [loading, setLoading] = useState(true);

    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [modalNominal, setModalNominal] = useState('');
    const [modalTanggal, setModalTanggal] = useState(new Date().toISOString().split('T')[0]);
    const [modalKeterangan, setModalKeterangan] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Feedback notifications
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const formatRupiah = (num) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(num || 0);
    };

    const handleModalNominalChange = (e) => {
        let raw = e.target.value;
        raw = raw.replace(/[,.]00$/, '');
        const digits = raw.replace(/\D/g, '');
        if (!digits) {
            setModalNominal('');
            return;
        }
        const num = parseInt(digits, 10);
        setModalNominal(num ? String(num) : '');
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
                fetchSetoranData(active.id);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const fetchSetoranData = async (periodeId) => {
        setLoading(true);
        try {
            const res = await api.get(`/admin/setoran-desa?periode_id=${periodeId}`);
            setSetoranData(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handlePeriodeChange = (e) => {
        const id = e.target.value;
        setSelectedPeriodeId(id);
        fetchSetoranData(id);
    };

    const handleOpenModal = (customNominal = null, defaultKet = '') => {
        const nominalToUse = customNominal !== null
            ? customNominal
            : (setoranData?.sisa_belum_disetor || 0);

        setModalNominal(nominalToUse > 0 ? String(nominalToUse) : '');
        setModalTanggal(new Date().toISOString().split('T')[0]);
        setModalKeterangan(defaultKet || 'Setoran Kas Desa ke Bendahara Desa');
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setModalNominal('');
        setModalKeterangan('');
    };

    const handleSubmitSetoran = async (e) => {
        e.preventDefault();
        if (!modalNominal) return;

        setSubmitting(true);
        setMessage('');
        setError('');

        try {
            const res = await api.post('/admin/setoran-desa', {
                periode_id: selectedPeriodeId,
                nominal: Number(modalNominal),
                tanggal: modalTanggal,
                keterangan: modalKeterangan,
            });

            setMessage(res.data.message);
            handleCloseModal();
            fetchSetoranData(selectedPeriodeId);
        } catch (err) {
            setError(err.response?.data?.message || 'Gagal menyimpan setoran Kas Desa.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleHapusSetoran = async (pengeluaranId, ket = 'transaksi ini') => {
        if (!window.confirm(`Yakin ingin membatalkan/menghapus ${ket}? Transaksi pengeluaran ini akan dihapus dan dana kembali ke kas titipan desa.`)) {
            return;
        }

        setMessage('');
        setError('');
        try {
            const res = await api.delete(`/admin/setoran-desa/${pengeluaranId}`);
            setMessage(res.data.message);
            fetchSetoranData(selectedPeriodeId);
        } catch (err) {
            setError(err.response?.data?.message || 'Gagal menghapus setoran');
        }
    };

    const riwayatList = setoranData?.riwayat_setoran || [];
    const sisaSiapSetor = setoranData?.sisa_belum_disetor || 0;

    return (
        <div className="space-y-8 pb-12 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                        <Building2 className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                        Penyetoran Kas Desa
                    </h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Pencatatan pengeluaran penyerahan dana Kas Desa.
                    </p>
                </div>

                <div className="sm:w-56">
                    <select
                        value={selectedPeriodeId}
                        onChange={handlePeriodeChange}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-bold text-slate-900 dark:text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                        {periodes.map((p) => (
                            <option key={p.id} value={p.id}>
                                {p.nama_periode} {p.status === 'aktif' ? '(Aktif)' : '(Ditutup)'}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {message && (
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-300 text-sm font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>{message}</span>
                </div>
            )}
            {error && (
                <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/60 text-rose-900 dark:text-rose-300 text-sm font-semibold flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* Banner Ringkasan & Aksi Utama (Modern Clean Card Style) */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 transition-colors">
                <div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/60 border border-teal-200/80 dark:border-teal-800/60 text-teal-800 dark:text-teal-300 text-xs font-black uppercase tracking-wider">
                        <span>🏡</span> Kas Titipan Desa
                    </span>
                    <h2 className="text-xl sm:text-2xl font-black mt-2 tracking-tight text-slate-900 dark:text-white">
                        Penyetoran Kas Desa ({setoranData?.periode?.nama_periode || 'Periode Aktif'})
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
                        Jika ada warga yang membayar langsung 12 bulan sekaligus, Anda dapat menyetorkannya langsung dalam satu transaksi tanpa perlu setor per bulan.
                    </p>
                </div>

                {/* 3 Metric Cards (Gaya Kartu Kas yang Rapi & Harmonis) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
                    {/* 1. Total Iuran Warga Masuk */}
                    <div className="bg-teal-50/70 dark:bg-slate-800/80 rounded-2xl p-4 sm:p-5 border border-teal-200/80 dark:border-teal-900/60 shadow-xs space-y-2 transition-colors">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-extrabold uppercase tracking-wide text-teal-800 dark:text-teal-300">
                                Total Iuran Warga Masuk
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800/60">
                                Titipan Mumi
                            </span>
                        </div>
                        <div>
                            <span className="text-[11px] font-bold text-teal-700 dark:text-teal-400 block">Akumulasi Iuran:</span>
                            <p className="text-xl sm:text-2xl font-black text-teal-900 dark:text-teal-200 tracking-tight mt-0.5">
                                +{formatRupiah(setoranData?.total_iuran_terkumpul)}
                            </p>
                        </div>
                        <span className="text-[11px] text-teal-700/80 dark:text-teal-400/80 block pt-1.5 border-t border-teal-200/60 dark:border-teal-900/40">
                            Dana masuk dari pembayaran anggota
                        </span>
                    </div>

                    {/* 2. Total Telah Disetor ke Desa */}
                    <div className="bg-slate-50 dark:bg-slate-800/80 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-700 shadow-xs space-y-2 transition-colors">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-extrabold uppercase tracking-wide text-slate-700 dark:text-slate-300">
                                Telah Disetor ke Desa
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                                {riwayatList.length}x Penyerahan
                            </span>
                        </div>
                        <div>
                            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">Total Pengeluaran:</span>
                            <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-200 tracking-tight mt-0.5">
                                -{formatRupiah(setoranData?.total_disetor)}
                            </p>
                        </div>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 block pt-1.5 border-t border-slate-200 dark:border-slate-700">
                            Uang telah diserahkan ke pihak desa/RT
                        </span>
                    </div>

                    {/* 3. Sisa Kas Desa Siap Disetor */}
                    <div className="bg-amber-50/70 dark:bg-slate-800/80 rounded-2xl p-4 sm:p-5 border border-amber-200/90 dark:border-amber-900/60 shadow-xs space-y-2 transition-colors">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-extrabold uppercase tracking-wide text-amber-900 dark:text-amber-300">
                                Sisa Belum Disetor
                            </span>
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${sisaSiapSetor > 0
                                ? 'bg-amber-200 dark:bg-amber-950 text-amber-900 dark:text-amber-300 animate-pulse border border-amber-300 dark:border-amber-800'
                                : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                                }`}>
                                {sisaSiapSetor > 0 ? 'Siap Disetor' : 'Lunas Terbayar'}
                            </span>
                        </div>
                        <div>
                            <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 block">Sisa Dana Kas Desa:</span>
                            <p className="text-xl sm:text-2xl font-black text-amber-900 dark:text-amber-300 tracking-tight mt-0.5">
                                {formatRupiah(sisaSiapSetor)}
                            </p>
                        </div>
                        <span className="text-[11px] text-amber-800/80 dark:text-amber-400/80 block pt-1.5 border-t border-amber-200/60 dark:border-amber-900/40">
                            Saldo titipan yang masih dipegang bendahara
                        </span>
                    </div>
                </div>
            </div>

            {/* Riwayat Penyetoran Kas Desa (Tabel Histori Transaksi) */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Receipt className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                            Riwayat Pengeluaran Penyetoran Kas Desa ({riwayatList.length} Transaksi)
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Histori penyerahan uang kas desa yang telah dicatat kepada pihak desa/RT.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => handleOpenModal()}
                        className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-sm transition flex items-center gap-1.5"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Input Setoran Baru</span>
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-800/70 font-bold">
                                <th className="py-2.5 px-3">Tanggal Disetor</th>
                                <th className="py-2.5 px-3">Keterangan / Penerima</th>
                                <th className="py-2.5 px-3">Nominal Disetor</th>
                                <th className="py-2.5 px-3 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                            {riwayatList.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="py-8 text-center text-slate-400 italic">
                                        Belum ada transaksi penyetoran kas desa yang dicatat. Klik <strong>"+ Catat Setoran ke Desa"</strong> untuk mencatat penyerahan dana.
                                    </td>
                                </tr>
                            ) : (
                                riwayatList.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                                        <td className="py-3 px-3 text-slate-700 dark:text-slate-300 font-semibold whitespace-nowrap">
                                            {formatTanggal(item.tanggal)}
                                        </td>
                                        <td className="py-3 px-3">
                                            <span className="font-bold text-slate-900 dark:text-white block">
                                                {item.keterangan || 'Setoran Kas Desa ke Desa'}
                                            </span>
                                            {item.bulan && (
                                                <span className="text-[11px] text-teal-600 dark:text-teal-400 font-medium">
                                                    Cakupan: {item.bulan}
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-3 px-3 font-extrabold text-sm text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                                            -{formatRupiah(item.nominal)}
                                        </td>
                                        <td className="py-3 px-3 text-right">
                                            <button
                                                type="button"
                                                onClick={() => handleHapusSetoran(item.id, `setoran sebesar ${formatRupiah(item.nominal)}`)}
                                                className="px-2.5 py-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition inline-flex items-center gap-1 font-semibold text-xs"
                                                title="Batalkan / Hapus Setoran"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                                <span>Batal</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL INPUT SETORAN KAS DESA (SATU PINTU) */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-150">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                            <div className="flex items-center gap-2">
                                <span className="w-8 h-8 rounded-xl bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 flex items-center justify-center text-base">
                                    🏡
                                </span>
                                <div>
                                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                                        Catat Setoran Kas Desa ke Desa
                                    </h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        Setor dana kas desa yang terkumpul ke desa
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={handleCloseModal}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-xl"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/60 text-xs text-teal-900 dark:text-teal-200 flex justify-between items-center">
                            <span>Sisa Kas Desa Belum Disetor:</span>
                            <span className="font-extrabold text-sm text-teal-950 dark:text-teal-100">
                                {formatRupiah(sisaSiapSetor)}
                            </span>
                        </div>

                        <form onSubmit={handleSubmitSetoran} className="space-y-4 text-xs">
                            <div className="space-y-1">
                                <div className="flex justify-between items-center">
                                    <label className="block font-bold text-slate-700 dark:text-slate-300">
                                        Nominal Yang Disetor (Rp):
                                    </label>
                                    {sisaSiapSetor > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => setModalNominal(String(sisaSiapSetor))}
                                            className="text-[11px] font-bold text-teal-600 dark:text-teal-400 hover:underline"
                                        >
                                            Gunakan Semua Sisa
                                        </button>
                                    )}
                                </div>
                                <div className="relative">
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        required
                                        placeholder="Rp 0"
                                        value={formatNominalDisplay(modalNominal)}
                                        onChange={handleModalNominalChange}
                                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition shadow-inner"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="block font-bold text-slate-700 dark:text-slate-300">
                                    Tanggal Disetor:
                                </label>
                                <input
                                    type="date"
                                    required
                                    value={modalTanggal}
                                    onChange={(e) => setModalTanggal(e.target.value)}
                                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="block font-bold text-slate-700 dark:text-slate-300">
                                    Keterangan / Penerima Setoran:
                                </label>
                                <input
                                    type="text"
                                    placeholder="Contoh: Setoran Kas Desa 12 Bulan / Diserahkan ke Bendahara Desa"
                                    value={modalKeterangan}
                                    onChange={(e) => setModalKeterangan(e.target.value)}
                                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                                />
                            </div>

                            <div className="pt-2 flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold transition"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting || !modalNominal}
                                    className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold shadow-md transition flex items-center gap-1.5 disabled:opacity-50"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span>Menyimpan...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-4 h-4" />
                                            <span>Konfirmasi & Simpan Setor</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
