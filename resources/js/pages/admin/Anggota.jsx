import React, { useState, useEffect } from 'react';
import api from '../../api';
import { Users, Plus, Search, Edit2, Trash2, CheckCircle2, XCircle } from 'lucide-react';

const STATUS_OPTIONS = [
    'Pelajar',
    'Mahasiswa',
    'Pencaker',
    'Pedagang',
    'Karyawan A',
    'Karyawan B',
];

export default function Anggota() {
    const [anggotas, setAnggotas] = useState([]);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [loading, setLoading] = useState(true);

    // Modal Form State
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [nama, setNama] = useState('');
    const [status, setStatus] = useState('Pelajar');
    const [statusAktif, setStatusAktif] = useState(true);
    const [formLoading, setFormLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        fetchAnggotas();
    }, []);

    const fetchAnggotas = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/anggota');
            setAnggotas(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenAdd = () => {
        setEditingId(null);
        setNama('');
        setStatus('Pelajar');
        setStatusAktif(true);
        setError('');
        setShowModal(true);
    };

    const handleOpenEdit = (a) => {
        setEditingId(a.id);
        setNama(a.nama);
        setStatus(a.status);
        setStatusAktif(a.status_aktif);
        setError('');
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setFormLoading(true);
        try {
            const payload = {
                nama: nama.trim(),
                status,
                status_aktif: statusAktif,
            };

            if (editingId) {
                await api.put(`/admin/anggota/${editingId}`, payload);
                setMessage('Data anggota berhasil diperbarui.');
            } else {
                await api.post('/admin/anggota', payload);
                setMessage('Anggota baru berhasil ditambahkan.');
            }
            setShowModal(false);
            fetchAnggotas();
        } catch (err) {
            setError(err.response?.data?.message || 'Gagal menyimpan data anggota.');
        } finally {
            setFormLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Hapus atau nonaktifkan anggota ini?')) return;
        try {
            const res = await api.delete(`/admin/anggota/${id}`);
            setMessage(res.data.message);
            fetchAnggotas();
        } catch (err) {
            alert(err.response?.data?.message || 'Gagal menghapus');
        }
    };

    const filtered = anggotas.filter((a) => {
        const matchName = a.nama.toLowerCase().includes(search.trim().toLowerCase());
        const matchStatus = !filterStatus || a.status === filterStatus;
        return matchName && matchStatus;
    });

    return (
        <div className="space-y-6 pb-12 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                        <Users className="w-6 h-6 text-emerald-600" />
                        Master Data Anggota Muda-Mudi Ciherang
                    </h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Kelola data warga dan status pekerjaan/sosial untuk penentuan matriks tarif iuran.
                    </p>
                </div>
                <button
                    onClick={handleOpenAdd}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-500/20 transition flex items-center gap-1.5 self-start sm:self-auto"
                >
                    <Plus className="w-4 h-4" />
                    Tambah Anggota
                </button>
            </div>

            {message && (
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-sm font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>{message}</span>
                </div>
            )}

            {/* Filter & Search Bar */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Cari nama warga..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                </div>
                <div className="sm:w-56">
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                        <option value="">Semua Status</option>
                        {STATUS_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>
                                {opt}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Members Table */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-800/60 font-bold">
                                <th className="py-3 px-4 w-12 text-center">No</th>
                                <th className="py-3 px-4">Nama Lengkap</th>
                                <th className="py-3 px-4">Status Pekerjaan / Sosial</th>
                                <th className="py-3 px-4">Status Keaktifan</th>
                                <th className="py-3 px-4 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="py-8 text-center text-slate-400 dark:text-slate-500">
                                        Tidak ada data anggota yang sesuai pencarian.
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((a, idx) => (
                                    <tr key={a.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                                        <td className="py-3.5 px-4 text-center font-bold text-slate-400 text-xs">
                                            {idx + 1}
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <div className="font-bold text-slate-900 dark:text-white text-sm">
                                                {a.nama}
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                                {a.status}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-4">
                                            {a.status_aktif ? (
                                                <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-bold">
                                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                                    Aktif
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-slate-400 font-medium">
                                                    <XCircle className="w-3.5 h-3.5 text-slate-400" />
                                                    Nonaktif
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-3.5 px-4 text-right space-x-2">
                                            <button
                                                onClick={() => handleOpenEdit(a)}
                                                className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-slate-800 rounded-lg transition"
                                                title="Ubah data"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(a.id)}
                                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition"
                                                title="Hapus"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Add / Edit */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-4 border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-150">
                        <h3 className="text-lg font-black text-slate-900 dark:text-white">
                            {editingId ? 'Ubah Data Anggota' : 'Tambah Anggota Baru'}
                        </h3>

                        {error && (
                            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                            <div className="space-y-1">
                                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                    Nama Lengkap:
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={nama}
                                    onChange={(e) => setNama(e.target.value)}
                                    placeholder="Contoh: Ajeng"
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                    Status Pekerjaan / Sosial:
                                </label>
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                >
                                    {STATUS_OPTIONS.map((opt) => (
                                        <option key={opt} value={opt}>
                                            {opt}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex items-center gap-2 pt-2">
                                <input
                                    type="checkbox"
                                    id="statusAktif"
                                    checked={statusAktif}
                                    onChange={(e) => setStatusAktif(e.target.checked)}
                                    className="w-4 h-4 text-emerald-600 rounded"
                                />
                                <label htmlFor="statusAktif" className="font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                                    Status Keanggotaan Aktif
                                </label>
                            </div>

                            <div className="pt-4 flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={formLoading}
                                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold shadow-md shadow-emerald-500/20"
                                >
                                    {formLoading ? 'Menyimpan...' : 'Simpan Data'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
