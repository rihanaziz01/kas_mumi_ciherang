import React, { useState, useEffect, useRef } from 'react';
import api from '../../api';
import { 
    CreditCard, 
    Calendar, 
    CheckSquare, 
    Square, 
    Sparkles, 
    AlertCircle, 
    CheckCircle2, 
    Trash2, 
    Coins, 
    ArrowRight,
    Search,
    RefreshCw,
    X
} from 'lucide-react';

const BULAN_LIST = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

export default function Pembayaran() {
    const [anggotas, setAnggotas] = useState([]);
    const [periodes, setPeriodes] = useState([]);
    const [tarifs, setTarifs] = useState([]);
    const [history, setHistory] = useState([]);

    // Form states
    const [selectedAnggotaId, setSelectedAnggotaId] = useState('');
    const [selectedPeriodeId, setSelectedPeriodeId] = useState('');
    const [memberSearch, setMemberSearch] = useState('');
    const [showMemberSuggestions, setShowMemberSuggestions] = useState(false);
    const memberSearchRef = useRef(null);
    const [tanggalBayar, setTanggalBayar] = useState(new Date().toISOString().split('T')[0]);
    const [catatan, setCatatan] = useState('');

    // Modular selection
    const [pilihKelompok, setPilihKelompok] = useState(true);
    const [pilihDesa, setPilihDesa] = useState(false);
    const [pilihQurban, setPilihQurban] = useState(false);

    // Selected months
    const [selectedMonths, setSelectedMonths] = useState([]);

    // Existing payment months for chosen member & period (to prevent double-pay)
    const [existingPaid, setExistingPaid] = useState({ Kelompok: [], Desa: [], Qurban: [] });
    const [karyawanQurbanMap, setKaryawanQurbanMap] = useState({});

    // UI statuses
    const [loadingSubmit, setLoadingSubmit] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [loadingData, setLoadingData] = useState(true);

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
        fetchMasterData();
        fetchHistory();
    }, []);

    const fetchMasterData = async () => {
        try {
            const [resAnggota, resPeriode, resTarif] = await Promise.all([
                api.get('/public/anggota-list'),
                api.get('/public/periode-list'),
                api.get('/admin/tarif'),
            ]);
            setAnggotas(resAnggota.data);
            setPeriodes(resPeriode.data);
            setTarifs(resTarif.data);

            const activePeriode = resPeriode.data.find((p) => p.status === 'aktif') || resPeriode.data[0];
            if (activePeriode) {
                setSelectedPeriodeId(activePeriode.id);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingData(false);
        }
    };

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (memberSearchRef.current && !memberSearchRef.current.contains(e.target)) {
                setShowMemberSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchHistory = async () => {
        try {
            const res = await api.get('/admin/pembayaran?per_page=20');
            setHistory(res.data.data || []);
        } catch (err) {
            console.error(err);
        }
    };

    const checkExisting = async (anggotaId = selectedAnggotaId, periodeId = selectedPeriodeId) => {
        if (!anggotaId || !periodeId) return;
        try {
            const res = await api.get(`/public/cek-iuran/${anggotaId}?periode_id=${periodeId}`);
            const data = res.data;
            const paidKelompok = (data.kas_kelompok?.grid || [])
                .filter((g) => g.lunas)
                .map((g) => g.bulan);
            const paidDesa = (data.kas_desa?.grid || [])
                .filter((g) => g.lunas)
                .map((g) => g.bulan);
            const paidQurban = data.qurban?.tipe === 'statis'
                ? (data.qurban?.grid || []).filter((g) => g.lunas).map((g) => g.bulan)
                : (data.qurban?.bulan_breakdown || []).filter((b) => b.lunas).map((b) => b.bulan);
            setExistingPaid({
                Kelompok: paidKelompok,
                Desa: paidDesa,
                Qurban: paidQurban,
            });

            // Map breakdown kewajiban qurban per bulan untuk Karyawan
            const qMap = {};
            if (data.qurban?.bulan_breakdown) {
                data.qurban.bulan_breakdown.forEach((b) => {
                    qMap[b.bulan] = {
                        pendapatan: b.pendapatan,
                        kewajiban: b.kewajiban_2persen,
                        ada_data: b.ada_data,
                        lunas: b.lunas,
                    };
                });
            }
            setKaryawanQurbanMap(qMap);
        } catch (err) {
            console.error(err);
        }
    };

    // When member or period changes, fetch their paid months and reset selection
    useEffect(() => {
        if (selectedAnggotaId && selectedPeriodeId) {
            checkExisting(selectedAnggotaId, selectedPeriodeId);
            setSelectedMonths([]);
        } else {
            setExistingPaid({ Kelompok: [], Desa: [], Qurban: [] });
            setKaryawanQurbanMap({});
            setSelectedMonths([]);
        }
    }, [selectedAnggotaId, selectedPeriodeId]);

    const currentAnggota = anggotas.find((a) => a.id === Number(selectedAnggotaId));

    const handleSelectMember = (a) => {
        setSelectedAnggotaId(a.id);
        setMemberSearch(a.nama);
        setShowMemberSuggestions(false);
        setSelectedMonths([]);
    };

    const handleClearMember = () => {
        setSelectedAnggotaId('');
        setMemberSearch('');
        setKaryawanQurbanMap({});
        setSelectedMonths([]);
        setShowMemberSuggestions(true);
    };

    const filteredMembers = anggotas.filter((a) => {
        if (!memberSearch.trim()) return true;
        const q = memberSearch.toLowerCase();
        return a.nama.toLowerCase().includes(q) || (a.kode_anggota && a.kode_anggota.toLowerCase().includes(q)) || a.status.toLowerCase().includes(q);
    });

    // Get tariff rates for selected member
    const getTarif = (jenis) => {
        if (!currentAnggota) return 0;
        const t = tarifs.find(
            (item) => item.status_anggota === currentAnggota.status && item.jenis_iuran === jenis
        );
        return t ? Number(t.nominal) : 0;
    };

    const tarifKelompok = getTarif('Kelompok');
    const tarifDesa = getTarif('Desa');
    const tarifQurban = getTarif('Qurban');

    // Active selected categories
    const activeCategories = [];
    if (pilihKelompok) activeCategories.push('Kelompok');
    if (pilihDesa) activeCategories.push('Desa');
    if (pilihQurban && currentAnggota?.status !== 'Pedagang') activeCategories.push('Qurban');

    const isMonthPaid = (m, jenis) => {
        return (existingPaid[jenis] || []).includes(m);
    };

    // A month is fully paid if ALL currently checked categories are already paid for that month
    const isMonthFullyPaid = (m) => {
        if (!selectedAnggotaId || activeCategories.length === 0) return false;
        return activeCategories.every((jenis) => isMonthPaid(m, jenis));
    };

    // Automatically prune months that become fully paid
    useEffect(() => {
        if (selectedMonths.length > 0 && selectedAnggotaId) {
            const valid = selectedMonths.filter((m) => !isMonthFullyPaid(m));
            if (valid.length !== selectedMonths.length) {
                setSelectedMonths(valid);
            }
        }
    }, [existingPaid, pilihKelompok, pilihDesa, pilihQurban, selectedAnggotaId]);

    // Unpaid months for each category from the currently selected months
    const unpaidMonthsKelompok = selectedMonths.filter((m) => !isMonthPaid(m, 'Kelompok'));
    const unpaidMonthsDesa = selectedMonths.filter((m) => !isMonthPaid(m, 'Desa'));
    const unpaidMonthsQurban = selectedMonths.filter((m) => !isMonthPaid(m, 'Qurban'));

    // Quick Action: Select 12 Months All (only available unpaid months!)
    const handleSelectAll12Months = () => {
        if (!selectedAnggotaId) {
            setErrorMessage('Pilih anggota terlebih dahulu.');
            return;
        }
        const availableMonths = BULAN_LIST.filter((m) => !isMonthFullyPaid(m));
        if (availableMonths.length === 0) {
            setErrorMessage('Semua bulan pada periode ini sudah lunas untuk jenis iuran terpilih!');
            return;
        }
        setErrorMessage('');
        setSelectedMonths(availableMonths);
    };

    // Quick Action: Clear Months
    const handleClearMonths = () => {
        setSelectedMonths([]);
    };

    const toggleMonth = (m) => {
        if (isMonthFullyPaid(m)) return; // Tidak bisa memilih bulan yang sudah lunas
        if (selectedMonths.includes(m)) {
            setSelectedMonths(selectedMonths.filter((x) => x !== m));
        } else {
            setSelectedMonths([...selectedMonths, m]);
        }
    };

    // Realtime Calculation based only on unpaid months
    const subtotalKelompok = pilihKelompok ? tarifKelompok * unpaidMonthsKelompok.length : 0;
    const subtotalDesa = pilihDesa ? tarifDesa * unpaidMonthsDesa.length : 0;

    let subtotalQurban = 0;
    if (pilihQurban && currentAnggota) {
        if (currentAnggota.status === 'Pedagang') {
            subtotalQurban = 0; // Bebas
        } else if (['Karyawan A', 'Karyawan B'].includes(currentAnggota.status)) {
            // Hitung dinamis dari kewajiban 2% per bulan sesuai data Pendapatan Karyawan
            subtotalQurban = unpaidMonthsQurban.reduce((acc, m) => {
                const bInfo = karyawanQurbanMap[m];
                if (bInfo && bInfo.kewajiban !== null && bInfo.kewajiban !== undefined) {
                    return acc + Number(bInfo.kewajiban);
                }
                const anyRecorded = Object.values(karyawanQurbanMap).find((k) => k.kewajiban !== null && k.kewajiban !== undefined)?.kewajiban;
                return acc + (anyRecorded !== undefined ? Number(anyRecorded) : (tarifQurban || 0));
            }, 0);
        } else {
            // Pelajar, Mahasiswa, Pencaker (Per Bulan!)
            subtotalQurban = tarifQurban * unpaidMonthsQurban.length;
        }
    }

    const grandTotal = subtotalKelompok + subtotalDesa + subtotalQurban;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSuccessMessage('');
        setErrorMessage('');

        if (!selectedAnggotaId || !selectedPeriodeId) {
            setErrorMessage('Pilih anggota dan periode terlebih dahulu.');
            return;
        }

        if (!pilihKelompok && !pilihDesa && !pilihQurban) {
            setErrorMessage('Centang minimal 1 jenis iuran yang akan dibayar.');
            return;
        }

        if (selectedMonths.length === 0) {
            setErrorMessage('Pilih minimal 1 bulan pembayaran yang belum lunas.');
            return;
        }

        const items = [];
        if (pilihKelompok && unpaidMonthsKelompok.length > 0) {
            items.push({
                jenis_iuran: 'Kelompok',
                bulan_list: unpaidMonthsKelompok,
            });
        }
        if (pilihDesa && unpaidMonthsDesa.length > 0) {
            items.push({
                jenis_iuran: 'Desa',
                bulan_list: unpaidMonthsDesa,
            });
        }
        if (pilihQurban && currentAnggota?.status !== 'Pedagang' && unpaidMonthsQurban.length > 0) {
            items.push({
                jenis_iuran: 'Qurban',
                bulan_list: unpaidMonthsQurban,
            });
        }

        if (items.length === 0 || grandTotal === 0) {
            setErrorMessage('Bulan yang dipilih sudah lunas untuk jenis iuran yang dipilih. Tidak ada transaksi baru yang perlu disimpan.');
            return;
        }

        setLoadingSubmit(true);
        try {
            const res = await api.post('/admin/pembayaran/bulk', {
                anggota_id: selectedAnggotaId,
                periode_id: selectedPeriodeId,
                tanggal_bayar: tanggalBayar,
                catatan: catatan,
                items: items,
            });

            // RESET PILIHAN SETELAH SIMPAN AGAR TIDAK BISA DISIMPAN LAGI
            setSelectedMonths([]);
            setCatatan('');

            setSuccessMessage(res.data.message || 'Transaksi pembayaran kas masuk berhasil disimpan!');

            // Refresh data riwayat dan status lunas anggota
            await Promise.all([
                fetchHistory(),
                checkExisting(selectedAnggotaId, selectedPeriodeId),
            ]);
        } catch (err) {
            const msg = err.response?.data?.message || 'Gagal menyimpan transaksi pembayaran.';
            setErrorMessage(msg);
        } finally {
            setLoadingSubmit(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Yakin ingin menghapus catatan pembayaran ini?')) return;
        try {
            await api.delete(`/admin/pembayaran/${id}`);
            fetchHistory();
        } catch (err) {
            alert(err.response?.data?.message || 'Gagal menghapus');
        }
    };

    return (
        <div className="space-y-8 pb-12 max-w-6xl mx-auto">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                    <CreditCard className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                    Pencatatan Pembayaran Iuran Fleksibel
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Input pembayaran iuran modular (Kelompok, Desa, Qurban) dengan dukungan pembayaran <strong>12 Bulan Sekaligus</strong> dalam 1 klik.
                </p>
            </div>

            {/* Notification Alerts */}
            {successMessage && (
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-300 text-sm font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>{successMessage}</span>
                </div>
            )}
            {errorMessage && (
                <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 text-rose-900 dark:text-rose-300 text-sm font-semibold flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
                    <span>{errorMessage}</span>
                </div>
            )}

            {/* Main Form Container */}
            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column: Form Inputs */}
                <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 transition-colors">
                    {/* 1. Pilih Anggota & Periode */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* 1. Pilih Anggota via Search Autocomplete */}
                        <div className="space-y-1.5 relative" ref={memberSearchRef}>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
                                <span className="flex items-center gap-1.5">
                                    <Search className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                    1. Cari Nama Anggota:
                                </span>
                                {currentAnggota && (
                                    <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 normal-case flex items-center gap-1">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                        Terpilih: <strong>{currentAnggota.kode_anggota ? `${currentAnggota.kode_anggota} ` : ''}{currentAnggota.nama}</strong>
                                    </span>
                                )}
                            </label>

                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                                    <Search className="w-4 h-4" />
                                </div>
                                <input
                                    type="text"
                                    value={memberSearch}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setMemberSearch(val);
                                        setShowMemberSuggestions(true);
                                        if (!val || (currentAnggota && val !== currentAnggota.nama)) {
                                            setSelectedAnggotaId('');
                                        }
                                    }}
                                    onFocus={() => setShowMemberSuggestions(true)}
                                    placeholder="Ketik kode (MM-001) atau nama anggota..."
                                    className="w-full pl-10 pr-9 py-2.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100/70 dark:hover:bg-slate-750 focus:bg-white dark:focus:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-emerald-500 rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition shadow-inner"
                                />
                                {memberSearch && (
                                    <button
                                        type="button"
                                        onClick={handleClearMember}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                                        title="Hapus / Cari Lain"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>

                            {/* Floating Suggestions List */}
                            {showMemberSuggestions && (
                                <div className="absolute z-40 left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                                    {filteredMembers.length > 0 ? (
                                        filteredMembers.map((a) => {
                                            const isSelected = selectedAnggotaId === a.id;
                                            return (
                                                <button
                                                    key={a.id}
                                                    type="button"
                                                    onClick={() => handleSelectMember(a)}
                                                    className={`w-full px-4 py-2.5 text-left flex items-center justify-between transition group ${
                                                        isSelected ? 'bg-emerald-50 dark:bg-emerald-950/60 font-bold' : 'hover:bg-slate-50 dark:hover:bg-slate-800/70'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2.5">
                                                        {a.kode_anggota ? (
                                                            <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 font-mono font-bold text-xs border border-emerald-200/80 dark:border-emerald-800/80">
                                                                {a.kode_anggota}
                                                            </span>
                                                        ) : (
                                                            <div className={`w-7 h-7 rounded-lg font-bold text-xs flex items-center justify-center ${
                                                                isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                                                            }`}>
                                                                {a.nama.charAt(0)}
                                                            </div>
                                                        )}
                                                        <span className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-emerald-900 dark:group-hover:text-emerald-300">
                                                            {a.nama}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-950 text-[11px] font-medium text-slate-600 dark:text-slate-300 group-hover:text-emerald-800 dark:group-hover:text-emerald-300">
                                                            {a.status}
                                                        </span>
                                                        {isSelected && (
                                                            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                                        )}
                                                    </div>
                                                </button>
                                            );
                                        })
                                    ) : (
                                        <div className="px-4 py-3 text-xs text-slate-400 dark:text-slate-500 text-center">
                                            Nama "{memberSearch}" tidak ditemukan
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Selected Member Details Badge */}
                            {currentAnggota ? (
                                <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-800/50 text-xs">
                                    <span className="text-slate-600 dark:text-slate-300">
                                        Kategori: <strong className="text-emerald-800 dark:text-emerald-300 font-bold">{currentAnggota.status}</strong>
                                    </span>
                                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                        Tarif: Kelompok ({formatRupiah(tarifKelompok)}) • Desa ({formatRupiah(tarifDesa)})
                                    </span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400">
                                    <span className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">🔍</span>
                                    <span>Ketik atau cari nama anggota pada kolom di atas untuk memilih warga</span>
                                </div>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                Periode Keuangan:
                            </label>
                            <select
                                value={selectedPeriodeId}
                                onChange={(e) => setSelectedPeriodeId(e.target.value)}
                                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            >
                                {periodes.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.nama_periode} {p.status === 'aktif' ? '(🟢 Aktif)' : '(Ditutup)'}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* 2. Jenis Iuran Modular Checklist */}
                    <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                            2. Pilih Jenis Iuran yang Dibayar:
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {/* Kas Kelompok */}
                            <label
                                className={`p-3.5 rounded-2xl border cursor-pointer flex items-center justify-between transition ${
                                    pilihKelompok
                                        ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800/80 text-emerald-900 dark:text-emerald-300 font-bold'
                                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                                }`}
                            >
                                <div>
                                    <span className="text-xs block">Kas Kelompok</span>
                                    <span className="text-xs text-emerald-700 dark:text-emerald-400 font-extrabold">{formatRupiah(tarifKelompok)} / bln</span>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={pilihKelompok}
                                    onChange={(e) => setPilihKelompok(e.target.checked)}
                                    className="w-4 h-4 text-emerald-600 rounded"
                                />
                            </label>

                            {/* Kas Desa */}
                            <label
                                className={`p-3.5 rounded-2xl border cursor-pointer flex items-center justify-between transition ${
                                    pilihDesa
                                        ? 'bg-teal-50 dark:bg-teal-950/50 border-teal-300 dark:border-teal-800/80 text-teal-900 dark:text-teal-300 font-bold'
                                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                                }`}
                            >
                                <div>
                                    <span className="text-xs block">Kas Desa</span>
                                    <span className="text-xs text-teal-700 dark:text-teal-400 font-extrabold">{formatRupiah(tarifDesa)} / bln</span>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={pilihDesa}
                                    onChange={(e) => setPilihDesa(e.target.checked)}
                                    className="w-4 h-4 text-teal-600 rounded"
                                />
                            </label>

                            {/* Qurban */}
                            <label
                                className={`p-3.5 rounded-2xl border cursor-pointer flex items-center justify-between transition ${
                                    pilihQurban
                                        ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-300 dark:border-indigo-800/80 text-indigo-900 dark:text-indigo-300 font-bold'
                                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                                }`}
                            >
                                <div>
                                    <span className="text-xs block">Qurban</span>
                                    <span className="text-xs text-indigo-700 dark:text-indigo-300 font-extrabold">
                                        {currentAnggota?.status === 'Pedagang'
                                            ? 'Bebas Qurban'
                                            : ['Karyawan A', 'Karyawan B'].includes(currentAnggota?.status)
                                            ? (() => {
                                                const sampleKewajiban = selectedMonths.length > 0 && karyawanQurbanMap[selectedMonths[0]]?.kewajiban
                                                    ? karyawanQurbanMap[selectedMonths[0]].kewajiban
                                                    : Object.values(karyawanQurbanMap).find(k => k.kewajiban)?.kewajiban;
                                                return sampleKewajiban 
                                                    ? `2% Gaji (${formatRupiah(sampleKewajiban)} / bln)`
                                                    : '2% Gaji Bulanan';
                                            })()
                                            : `${formatRupiah(tarifQurban)} / bln`}
                                    </span>
                                </div>
                                <input
                                    type="checkbox"
                                    disabled={currentAnggota?.status === 'Pedagang'}
                                    checked={pilihQurban}
                                    onChange={(e) => setPilihQurban(e.target.checked)}
                                    className="w-4 h-4 text-indigo-600 rounded"
                                />
                            </label>
                        </div>
                    </div>

                    {/* 3. Pilihan Bulan Pembayaran & Tombol Sakti 12 Bulan */}
                    <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                3. Pilihan Bulan ({selectedMonths.length} Bulan Dipilih):
                            </label>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={handleSelectAll12Months}
                                    className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-extrabold shadow-sm hover:opacity-95 transition flex items-center gap-1.5"
                                >
                                    <Sparkles className="w-3.5 h-3.5" />
                                    PILIH SEMUA (12 BULAN SEKALIGUS)
                                </button>
                                <button
                                    type="button"
                                    onClick={handleClearMonths}
                                    className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-semibold transition"
                                >
                                    Reset
                                </button>
                            </div>
                        </div>

                        {/* Month Grid Checkboxes */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                            {BULAN_LIST.map((m) => {
                                const isChecked = selectedMonths.includes(m);
                                const isPaidKelompok = (existingPaid.Kelompok || []).includes(m);
                                const isPaidDesa = (existingPaid.Desa || []).includes(m);
                                const isPaidQurban = (existingPaid.Qurban || []).includes(m);
                                const isFullyPaid = isMonthFullyPaid(m);

                                return (
                                    <button
                                        type="button"
                                        key={m}
                                        disabled={isFullyPaid}
                                        onClick={() => toggleMonth(m)}
                                        title={isFullyPaid ? `${m} sudah lunas untuk jenis iuran terpilih` : ''}
                                        className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition text-xs select-none ${
                                            isFullyPaid
                                                ? 'bg-slate-100/70 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-75'
                                                : isChecked
                                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-500/20'
                                                : 'bg-slate-50 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between font-bold">
                                            <span className={isFullyPaid ? 'line-through text-slate-400 dark:text-slate-500' : ''}>{m}</span>
                                            {isFullyPaid ? (
                                                <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-1">
                                                    <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                                    Lunas
                                                </span>
                                            ) : isChecked ? (
                                                <CheckSquare className="w-4 h-4 text-white" />
                                            ) : (
                                                <Square className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                                            )}
                                        </div>

                                        {currentAnggota && ['Karyawan A', 'Karyawan B'].includes(currentAnggota.status) && karyawanQurbanMap[m]?.kewajiban && (
                                            <span className={`block text-[10px] font-semibold mt-0.5 ${isChecked && !isFullyPaid ? 'text-indigo-100' : 'text-indigo-600 dark:text-indigo-400'}`}>
                                                Qurban: {formatRupiah(karyawanQurbanMap[m].kewajiban)}
                                            </span>
                                        )}

                                        {(isPaidKelompok || isPaidDesa || isPaidQurban) && (
                                            <div className="mt-1.5 text-[10px] space-y-0.5">
                                                {isPaidKelompok && (
                                                    <span className={`block font-semibold ${isChecked && !isFullyPaid ? 'text-emerald-100' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                                        ✓ Kelompok Lunas
                                                    </span>
                                                )}
                                                {isPaidDesa && (
                                                    <span className={`block font-semibold ${isChecked && !isFullyPaid ? 'text-teal-100' : 'text-teal-600 dark:text-teal-400'}`}>
                                                        ✓ Desa Lunas
                                                    </span>
                                                )}
                                                {isPaidQurban && (
                                                    <span className={`block font-semibold ${isChecked && !isFullyPaid ? 'text-indigo-100' : 'text-indigo-600 dark:text-indigo-400'}`}>
                                                        ✓ Qurban Lunas
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* 4. Tanggal & Catatan */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <div className="space-y-1">
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                Tanggal Bayar:
                            </label>
                            <input
                                type="date"
                                required
                                value={tanggalBayar}
                                onChange={(e) => setTanggalBayar(e.target.value)}
                                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                Keterangan / Catatan:
                            </label>
                            <input
                                type="text"
                                placeholder="Contoh: Lunas 12 bulan tunai di bendahara"
                                value={catatan}
                                onChange={(e) => setCatatan(e.target.value)}
                                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Right Column: Instant Calculation & Submit Card */}
                <div className="lg:col-span-4 space-y-4">
                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-6 shadow-xl space-y-5 sticky top-20 border border-slate-700/60">
                        <h2 className="text-base font-extrabold tracking-tight flex items-center gap-2 border-b border-white/10 pb-3">
                            <Coins className="w-5 h-5 text-emerald-400" />
                            Kalkulasi Instan Pembayaran
                        </h2>

                        <div className="space-y-3 text-xs text-slate-300">
                            <div className="flex justify-between items-center">
                                <span>Anggota:</span>
                                <strong className="text-white text-sm">
                                    {currentAnggota ? (
                                        currentAnggota.nama
                                    ) : (
                                        <span className="text-slate-400 font-normal italic text-xs">Belum dipilih</span>
                                    )}
                                </strong>
                            </div>
                            <div className="flex justify-between items-center">
                                <span>Jumlah Bulan:</span>
                                <span className="font-bold text-emerald-400">{selectedMonths.length} Bulan Dipilih</span>
                            </div>

                            <div className="pt-2 border-t border-white/10 space-y-2">
                                {pilihKelompok && (
                                    <div className="flex justify-between items-center">
                                        <span>Subtotal Kelompok ({unpaidMonthsKelompok.length} × {formatRupiah(tarifKelompok)}):</span>
                                        <strong className="text-white">{formatRupiah(subtotalKelompok)}</strong>
                                    </div>
                                )}
                                {pilihDesa && (
                                    <div className="flex justify-between items-center">
                                        <span>Subtotal Desa ({unpaidMonthsDesa.length} × {formatRupiah(tarifDesa)}):</span>
                                        <strong className="text-white">{formatRupiah(subtotalDesa)}</strong>
                                    </div>
                                )}
                                {pilihQurban && (
                                    <div className="flex justify-between items-center">
                                        <span>
                                            Subtotal Qurban {['Karyawan A', 'Karyawan B'].includes(currentAnggota?.status)
                                                ? `(2% Gaji × ${unpaidMonthsQurban.length} Bln)`
                                                : `(${unpaidMonthsQurban.length} × ${formatRupiah(tarifQurban)})`}:
                                        </span>
                                        <strong className="text-white">{formatRupiah(subtotalQurban)}</strong>
                                    </div>
                                )}
                            </div>

                            <div className="pt-3 border-t border-white/10 flex justify-between items-baseline">
                                <span className="text-sm font-bold uppercase tracking-wider text-emerald-400">Grand Total:</span>
                                <span className="text-2xl font-black text-white">{formatRupiah(grandTotal)}</span>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={
                                loadingSubmit ||
                                !selectedAnggotaId ||
                                selectedMonths.length === 0 ||
                                grandTotal === 0 ||
                                (!unpaidMonthsKelompok.length && !unpaidMonthsDesa.length && !unpaidMonthsQurban.length)
                            }
                            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-black text-sm tracking-wide shadow-lg shadow-emerald-500/25 disabled:opacity-40 disabled:cursor-not-allowed disabled:from-slate-700 disabled:to-slate-800 disabled:shadow-none transition flex items-center justify-center gap-2 cursor-pointer"
                        >
                            {loadingSubmit ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span>Menyimpan Transaksi...</span>
                                </>
                            ) : !selectedAnggotaId ? (
                                <span>Pilih Anggota Terlebih Dahulu</span>
                            ) : selectedMonths.length === 0 ? (
                                <span>Pilih Bulan Pembayaran</span>
                            ) : grandTotal === 0 ? (
                                <span>Bulan Terpilih Sudah Lunas (Rp 0)</span>
                            ) : (
                                <>
                                    <CheckCircle2 className="w-5 h-5" />
                                    <span>Simpan Transaksi Kas Masuk</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </form>

            {/* Payment History Table */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 transition-colors">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-base font-bold text-slate-900 dark:text-white">
                            Riwayat Pembayaran Iuran Warga
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Catatan entri kas iuran yang telah tervalidasi di database.
                        </p>
                    </div>
                    <button
                        onClick={fetchHistory}
                        className="p-2 text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                        title="Segarkan Riwayat"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-800/70 font-bold">
                                <th className="py-2.5 px-3">Tanggal</th>
                                <th className="py-2.5 px-3">Anggota</th>
                                <th className="py-2.5 px-3">Jenis Iuran</th>
                                <th className="py-2.5 px-3">Periode Bayar</th>
                                <th className="py-2.5 px-3">Nominal</th>
                                <th className="py-2.5 px-3">Catatan</th>
                                <th className="py-2.5 px-3 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {history.map((p) => (
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
                                    <td className="py-2.5 px-3 text-right">
                                        <button
                                            onClick={() => handleDelete(p.id)}
                                            className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded transition"
                                            title="Hapus entri"
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
