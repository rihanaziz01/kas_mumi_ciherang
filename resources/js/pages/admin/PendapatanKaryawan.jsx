import React, { useState, useEffect } from 'react';
import api from '../../api';
import { Wallet, Plus, Trash2, CheckCircle2, AlertCircle, Sparkles, Calendar, X } from 'lucide-react';

const BULAN_LIST = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

export default function PendapatanKaryawan() {
    const [karyawanList, setKaryawanList] = useState([]);
    const [history, setHistory] = useState([]);
    const [selectedAnggotaId, setSelectedAnggotaId] = useState('');
    const [bulan, setBulan] = useState('Januari');
    const [tahun, setTahun] = useState(new Date().getFullYear());
    const [pendapatan, setPendapatan] = useState('');
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

    const handlePendapatanChange = (e) => {
        let raw = e.target.value;
        raw = raw.replace(/[,.]00$/, '');
        const digits = raw.replace(/\D/g, '');
        if (!digits) {
            setPendapatan('');
            return;
        }
        const num = parseInt(digits, 10);
        setPendapatan(num ? String(num) : '');
    };

    const formatNominalDisplay = (val) => {
        if (!val) return '';
        return 'Rp ' + new Intl.NumberFormat('id-ID').format(Number(val));
    };

    // Realtime calculated 2% Qurban
    const calculatedQurban = (Number(pendapatan) || 0) * 0.02;

    useEffect(() => {
        fetchKaryawan();
        fetchHistory();
    }, []);

    const fetchKaryawan = async () => {
        try {
            const res = await api.get('/admin/anggota');
            const onlyKaryawan = res.data.filter((a) =>
                ['Karyawan A', 'Karyawan B'].includes(a.status)
            );
            setKaryawanList(onlyKaryawan);
            if (onlyKaryawan.length > 0) {
                setSelectedAnggotaId(onlyKaryawan[0].id);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const fetchHistory = async () => {
        try {
            const res = await api.get('/admin/pendapatan-karyawan');
            setHistory(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        setLoading(true);
        try {
            const res = await api.post('/admin/pendapatan-karyawan', {
                anggota_id: selectedAnggotaId,
                bulan,
                tahun: Number(tahun),
                pendapatan: Number(pendapatan),
            });
            setMessage(res.data.message);
            setPendapatan('');
            fetchHistory();
        } catch (err) {
            setError(err.response?.data?.message || 'Gagal menyimpan pendapatan.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Hapus data pendapatan ini?')) return;
        try {
            const res = await api.delete(`/admin/pendapatan-karyawan/${id}`);
            setMessage(res.data.message);
            fetchHistory();
        } catch (err) {
            alert(err.response?.data?.message || 'Gagal menghapus');
        }
    };

    return (
        <div className="space-y-8 pb-12 max-w-5xl mx-auto">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <Wallet className="w-6 h-6 text-indigo-600" />
                    Input Pendapatan Bulanan Karyawan (Qurban Dinamis 2%)
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                    Sesuai Aturan Khusus PRD: Status Karyawan A & B menggunakan nominal qurban dinamis sebesar <strong>2% dari Pendapatan 1 Bulan</strong> yang diinput setiap bulannya.
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
                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* Form Input Container */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-5">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-xl self-start inline-flex">
                    <Sparkles className="w-4 h-4" />
                    Form Kalkulator Otomatis 2% Qurban
                </div>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end text-xs">
                    {/* Select Karyawan */}
                    <div className="sm:col-span-4 space-y-1">
                        <label className="block font-bold text-slate-700 uppercase tracking-wider">
                            Pilih Karyawan:
                        </label>
                        <select
                            value={selectedAnggotaId}
                            onChange={(e) => setSelectedAnggotaId(e.target.value)}
                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            {karyawanList.map((k) => (
                                <option key={k.id} value={k.id}>
                                    {k.nama} ({k.status})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Select Month */}
                    <div className="sm:col-span-3 space-y-1">
                        <label className="block font-bold text-slate-700 uppercase tracking-wider">
                            Bulan:
                        </label>
                        <select
                            value={bulan}
                            onChange={(e) => setBulan(e.target.value)}
                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            {BULAN_LIST.map((b) => (
                                <option key={b} value={b}>
                                    {b}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Tahun */}
                    <div className="sm:col-span-2 space-y-1">
                        <label className="block font-bold text-slate-700 uppercase tracking-wider">
                            Tahun:
                        </label>
                        <input
                            type="number"
                            required
                            value={tahun}
                            onChange={(e) => setTahun(e.target.value)}
                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                        </input>
                    </div>

                    {/* Pendapatan Input */}
                    <div className="sm:col-span-3 space-y-1">
                        <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                            Pendapatan 1 Bulan (Rp):
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                inputMode="numeric"
                                required
                                placeholder="Rp 0"
                                value={formatNominalDisplay(pendapatan)}
                                onChange={handlePendapatanChange}
                                className="w-full pl-3.5 pr-8 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition shadow-inner"
                            />
                            {pendapatan && (
                                <button
                                    type="button"
                                    onClick={() => setPendapatan('')}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded-full transition"
                                    title="Hapus / Reset"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Auto Calculation Preview Banner */}
                    <div className="sm:col-span-9 p-3.5 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-between">
                        <div>
                            <span className="text-slate-500 block text-[11px]">Kalkulasi Otomatis Qurban (2% × Pendapatan):</span>
                            <span className="text-base font-extrabold text-indigo-950">
                                {formatRupiah(calculatedQurban)}
                            </span>
                        </div>
                        <span className="text-[11px] font-semibold text-indigo-700">
                            Rumus: 2% × {formatRupiah(Number(pendapatan) || 0)}
                        </span>
                    </div>

                    {/* Submit Button */}
                    <div className="sm:col-span-3">
                        <button
                            type="submit"
                            disabled={loading || !selectedAnggotaId || !pendapatan}
                            className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md shadow-indigo-500/20 disabled:opacity-50 transition flex items-center justify-center gap-1.5"
                        >
                            {loading ? 'Menyimpan...' : 'Simpan Pendapatan'}
                        </button>
                    </div>
                </form>
            </div>

            {/* History Table */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                <h2 className="text-base font-bold text-slate-900">
                    Riwayat Pendapatan Karyawan & Kewajiban Qurban
                </h2>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="border-b border-slate-200 text-slate-500 uppercase bg-slate-50 font-bold">
                                <th className="py-2.5 px-3">Nama Karyawan</th>
                                <th className="py-2.5 px-3">Status</th>
                                <th className="py-2.5 px-3">Bulan & Tahun</th>
                                <th className="py-2.5 px-3">Pendapatan</th>
                                <th className="py-2.5 px-3">Kewajiban Qurban (2%)</th>
                                <th className="py-2.5 px-3 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {history.map((h) => (
                                <tr key={h.id} className="hover:bg-slate-50">
                                    <td className="py-2.5 px-3 font-bold text-slate-900">{h.anggota?.nama}</td>
                                    <td className="py-2.5 px-3">
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">
                                            {h.anggota?.status}
                                        </span>
                                    </td>
                                    <td className="py-2.5 px-3 font-semibold text-slate-700">{h.bulan} {h.tahun}</td>
                                    <td className="py-2.5 px-3 text-slate-800 font-semibold">{formatRupiah(h.pendapatan)}</td>
                                    <td className="py-2.5 px-3 font-extrabold text-indigo-700">
                                        {formatRupiah(h.nominal_qurban)}
                                    </td>
                                    <td className="py-2.5 px-3 text-right">
                                        <button
                                            onClick={() => handleDelete(h.id)}
                                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                                            title="Hapus"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
