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
    RefreshCw 
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

    const handleOpenTutupBuku = (periode) => {
        setTargetPeriode(periode);
        const nextYear = new Date().getFullYear() + 1;
        setNamaPeriodeBaru(`Periode ${nextYear}`);
        setTanggalMulaiBaru(`${nextYear}-01-01`);
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
            setError(err.response?.data?.message || 'Gagal melakukan tutup buku.');
        } finally {
            setLoadingExecute(false);
        }
    };

    return (
        <div className="space-y-8 pb-12 max-w-5xl mx-auto">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <Calendar className="w-6 h-6 text-emerald-600" />
                    Manajemen Periode Keuangan & Tutup Buku
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                    Kelola siklus tahunan paguyuban. Ketika momen Qurban selesai, Admin dapat menutup buku periode lama dengan pilihan membawa saldo sisa atau mulai dari Rp 0 tanpa menghapus data historis.
                </p>
            </div>

            {message && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>{message}</span>
                </div>
            )}
            {error && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-sm font-semibold flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* List Periode Cards */}
            <div className="space-y-4">
                {periodes.map((p) => {
                    const isAktif = p.status === 'aktif';
                    return (
                        <div
                            key={p.id}
                            className={`rounded-3xl p-6 border transition shadow-sm ${
                                isAktif
                                    ? 'bg-white border-emerald-300 ring-2 ring-emerald-500/10'
                                    : 'bg-slate-50/70 border-slate-200'
                            }`}
                        >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2.5">
                                        <h2 className="text-xl font-black text-slate-900 tracking-tight">
                                            {p.nama_periode}
                                        </h2>
                                        {isAktif ? (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                                PERIODE AKTIF 🟢
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-slate-200 text-slate-700">
                                                <Lock className="w-3.5 h-3.5 text-slate-500" />
                                                DITUTUP (Read-Only)
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-500">
                                        Mulai: <strong>{p.tanggal_mulai}</strong> {p.tanggal_selesai ? `• Selesai: ${p.tanggal_selesai}` : '• Berjalan'}
                                    </p>
                                </div>

                                <div>
                                    {isAktif ? (
                                        <button
                                            onClick={() => handleOpenTutupBuku(p)}
                                            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs shadow-md shadow-amber-500/20 transition flex items-center gap-2"
                                        >
                                            <Lock className="w-4 h-4" />
                                            TUTUP BUKU PASCA-QURBAN
                                        </button>
                                    ) : (
                                        <span className="text-xs font-semibold text-slate-400 bg-white px-3 py-1.5 rounded-xl border border-slate-200">
                                            Arsip Historis Aman
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Financial breakdown */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-200/60 text-xs">
                                <div>
                                    <span className="text-slate-400 block font-medium">Saldo Awal</span>
                                    <strong className="text-slate-800 text-sm font-extrabold">
                                        {formatRupiah(p.saldo_awal)}
                                    </strong>
                                </div>
                                <div>
                                    <span className="text-emerald-600 block font-medium">Total Masuk</span>
                                    <strong className="text-emerald-700 text-sm font-extrabold">
                                        +{formatRupiah(p.total_masuk)}
                                    </strong>
                                </div>
                                <div>
                                    <span className="text-rose-600 block font-medium">Total Keluar</span>
                                    <strong className="text-rose-700 text-sm font-extrabold">
                                        -{formatRupiah(p.total_keluar)}
                                    </strong>
                                </div>
                                <div>
                                    <span className="text-slate-500 block font-bold">Saldo Akhir</span>
                                    <strong className="text-slate-900 text-sm font-black">
                                        {formatRupiah(p.saldo_akhir_kalkulasi)}
                                    </strong>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Modal Tutup Buku Pasca-Qurban */}
            {showModalTutupBuku && targetPeriode && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-black">
                                <Lock className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-slate-900">
                                    Tutup Periode Keuangan ({targetPeriode.nama_periode})
                                </h3>
                                <p className="text-xs text-slate-500">
                                    Siklus Tutup Buku Tahunan Pasca Pelaksanaan Qurban
                                </p>
                            </div>
                        </div>

                        {/* Calculated Closing Balance */}
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                            <div className="flex justify-between">
                                <span className="text-slate-500">Saldo Awal:</span>
                                <strong>{formatRupiah(targetPeriode.saldo_awal)}</strong>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Total Masuk (Iuran + Pemasukan):</span>
                                <strong className="text-emerald-700">+{formatRupiah(targetPeriode.total_masuk)}</strong>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Total Pengeluaran:</span>
                                <strong className="text-rose-700">-{formatRupiah(targetPeriode.total_keluar)}</strong>
                            </div>
                            <div className="flex justify-between pt-2 border-t border-slate-200 font-extrabold text-sm text-slate-900">
                                <span>Saldo Akhir Terkalkulasi:</span>
                                <span className="text-emerald-700">{formatRupiah(targetPeriode.saldo_akhir_kalkulasi)}</span>
                            </div>
                        </div>

                        {/* Choice of Initial Balance for Next Period */}
                        <form onSubmit={handleExecuteTutupBuku} className="space-y-4 text-xs">
                            <label className="block font-bold text-slate-700 uppercase tracking-wider">
                                Pilih Kebijakan Saldo Awal Periode Baru:
                            </label>

                            <div className="space-y-2">
                                <label
                                    className={`p-3.5 rounded-2xl border flex items-start gap-3 cursor-pointer transition ${
                                        bawaSaldo
                                            ? 'bg-emerald-50 border-emerald-300'
                                            : 'bg-slate-50 border-slate-200'
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="bawaSaldo"
                                        checked={bawaSaldo === true}
                                        onChange={() => setBawaSaldo(true)}
                                        className="mt-1 text-emerald-600"
                                    />
                                    <div>
                                        <strong className="block text-slate-900 text-sm">
                                            Opsi 1: Bawa Saldo Sisa ({formatRupiah(targetPeriode.saldo_akhir_kalkulasi)})
                                        </strong>
                                        <p className="text-slate-500 mt-0.5">
                                            Sisa saldo kas tahun ini otomatis bergulir menjadi saldo awal periode baru.
                                        </p>
                                    </div>
                                </label>

                                <label
                                    className={`p-3.5 rounded-2xl border flex items-start gap-3 cursor-pointer transition ${
                                        !bawaSaldo
                                            ? 'bg-emerald-50 border-emerald-300'
                                            : 'bg-slate-50 border-slate-200'
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="bawaSaldo"
                                        checked={bawaSaldo === false}
                                        onChange={() => setBawaSaldo(false)}
                                        className="mt-1 text-emerald-600"
                                    />
                                    <div>
                                        <strong className="block text-slate-900 text-sm">
                                            Opsi 2: Mulai Periode Baru dari Rp 0
                                        </strong>
                                        <p className="text-slate-500 mt-0.5">
                                            Gunakan opsi ini jika seluruh sisa saldo kas telah dialokasikan penuh / dihabiskan untuk qurban atau dibagikan.
                                        </p>
                                    </div>
                                </label>
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-2">
                                <div className="space-y-1">
                                    <label className="block font-bold text-slate-700">Nama Periode Baru:</label>
                                    <input
                                        type="text"
                                        required
                                        value={namaPeriodeBaru}
                                        onChange={(e) => setNamaPeriodeBaru(e.target.value)}
                                        placeholder="Contoh: Periode 2027"
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="block font-bold text-slate-700">Tanggal Mulai Baru:</label>
                                    <input
                                        type="date"
                                        required
                                        value={tanggalMulaiBaru}
                                        onChange={(e) => setTanggalMulaiBaru(e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowModalTutupBuku(false)}
                                    className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={loadingExecute}
                                    className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold shadow-md flex items-center gap-1.5"
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
        </div>
    );
}
