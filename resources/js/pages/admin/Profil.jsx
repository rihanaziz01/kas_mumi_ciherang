import React, { useState, useEffect } from 'react';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';
import {
    User,
    Mail,
    Lock,
    ShieldCheck,
    CheckCircle2,
    AlertCircle,
    Eye,
    EyeOff,
    KeyRound,
    Sparkles,
    BadgeCheck,
    Calendar,
    Save,
    Users,
    Check
} from 'lucide-react';

export default function Profil() {
    const { user, updateUser } = useAuth();

    // Profile form state
    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');

    // Password form state
    const [currentPassword, setCurrentPassword] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');

    // UI toggles & states
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [loadingProfile, setLoadingProfile] = useState(false);
    const [loadingPassword, setLoadingPassword] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    // Synchronize form values whenever authenticated user changes or loads
    useEffect(() => {
        if (user) {
            setName(user.name || '');
            setEmail(user.email || '');
        }
    }, [user]);

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setSuccessMessage('');
        setErrorMessage('');
        setLoadingProfile(true);

        try {
            const res = await api.put('/admin/profil', {
                name,
                email,
            });
            updateUser(res.data.user);
            setSuccessMessage(res.data.message || 'Profil berhasil diperbarui.');
        } catch (err) {
            const msg = err.response?.data?.errors?.email?.[0] ||
                err.response?.data?.errors?.name?.[0] ||
                err.response?.data?.message ||
                'Gagal memperbarui profil.';
            setErrorMessage(msg);
        } finally {
            setLoadingProfile(false);
        }
    };

    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        setSuccessMessage('');
        setErrorMessage('');

        if (password !== passwordConfirmation) {
            setErrorMessage('Konfirmasi kata sandi baru tidak cocok.');
            return;
        }

        if (password.length < 6) {
            setErrorMessage('Kata sandi baru minimal harus 6 karakter.');
            return;
        }

        setLoadingPassword(true);

        try {
            const res = await api.put('/admin/profil', {
                name: user?.name,
                email: user?.email,
                current_password: currentPassword,
                password,
                password_confirmation: passwordConfirmation,
            });

            setSuccessMessage('Kata sandi berhasil diganti! Gunakan kata sandi baru saat login berikutnya.');
            setCurrentPassword('');
            setPassword('');
            setPasswordConfirmation('');
        } catch (err) {
            const msg = err.response?.data?.errors?.current_password?.[0] ||
                err.response?.data?.errors?.password?.[0] ||
                err.response?.data?.message ||
                'Gagal memperbarui kata sandi.';
            setErrorMessage(msg);
        } finally {
            setLoadingPassword(false);
        }
    };

    const getInitials = (str) => {
        if (!str) return 'AD';
        const parts = str.trim().split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return str.slice(0, 2).toUpperCase();
    };

    return (
        <div className="space-y-8 pb-12 max-w-5xl mx-auto">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                    <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                    Profil
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Kelola identitas pengurus, alamat email login, dan keamanan kata sandi akun sistem.
                </p>
            </div>

            {/* Alert Messages */}
            {successMessage && (
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200 text-sm font-semibold flex items-center gap-2 transition animate-in fade-in">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>{successMessage}</span>
                </div>
            )}
            {errorMessage && (
                <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 text-rose-900 dark:text-rose-200 text-sm font-semibold flex items-center gap-2 transition animate-in fade-in">
                    <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
                    <span>{errorMessage}</span>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Column: Admin Identity Badge & Metadata */}
                <div className="lg:col-span-4 space-y-4">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm text-center space-y-4 transition-colors">
                        {/* Avatar */}
                        <div className="relative inline-block mx-auto">
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-emerald-500/25">
                                {getInitials(user?.name)}
                            </div>
                            <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 flex items-center justify-center text-[10px] text-white font-bold">
                                ✓
                            </span>
                        </div>

                        <div>
                            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                                {user?.name || 'Administrator'}
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                {user?.email || 'admin@ciherang.com'}
                            </p>
                        </div>

                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
                            <BadgeCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>Pengurus Utama Aktif</span>
                        </div>

                        {/* Metadata Details */}
                        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-left text-xs space-y-2.5 text-slate-600 dark:text-slate-300">
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400 dark:text-slate-400">Peran Sistem:</span>
                                <strong className="font-semibold text-slate-800 dark:text-slate-200">Full Administrator</strong>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400 dark:text-slate-400">Otoritas:</span>
                                <span className="text-emerald-600 dark:text-emerald-400 font-bold">Semua Pos Kas</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400 dark:text-slate-400">Status Sesi:</span>
                                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                    Aktif Terautentikasi
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Registered Admin Accounts Card */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 transition-colors">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                            <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                                    Akun Pengurus
                                </span>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                2 Akun
                            </span>
                        </div>

                        <div className="space-y-2 text-xs">
                            {/* Rihan */}
                            <div className={`p-2.5 rounded-xl border flex items-center justify-between transition ${user?.email === 'rihan@ciherang.com' || user?.name?.toLowerCase() === 'rihan'
                                    ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-300/80 dark:border-emerald-700/80'
                                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700/60'
                                }`}>
                                <div className="flex items-center gap-2 min-w-0">
                                    <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                                        R
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-bold text-slate-900 dark:text-white truncate">Rihan</p>
                                        <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">rihan@ciherang.com</p>
                                    </div>
                                </div>
                                {(user?.email === 'rihan@ciherang.com' || user?.name?.toLowerCase() === 'rihan') && (
                                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-white dark:bg-emerald-900/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-700 shrink-0">
                                        Anda
                                    </span>
                                )}
                            </div>

                            {/* Azza */}
                            <div className={`p-2.5 rounded-xl border flex items-center justify-between transition ${user?.email === 'azza@ciherang.com' || user?.name?.toLowerCase() === 'azza'
                                    ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-300/80 dark:border-emerald-700/80'
                                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700/60'
                                }`}>
                                <div className="flex items-center gap-2 min-w-0">
                                    <div className="w-7 h-7 rounded-lg bg-teal-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                                        A
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-bold text-slate-900 dark:text-white truncate">Azza</p>
                                        <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">azza@ciherang.com</p>
                                    </div>
                                </div>
                                {(user?.email === 'azza@ciherang.com' || user?.name?.toLowerCase() === 'azza') && (
                                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-white dark:bg-emerald-900/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-700 shrink-0">
                                        Anda
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Security Tip Box */}
                    <div className="bg-emerald-50/70 dark:bg-emerald-950/30 rounded-3xl p-5 border border-emerald-200/80 dark:border-emerald-800/60 text-xs text-emerald-900 dark:text-emerald-300 space-y-2 transition-colors">
                        <div className="flex items-center gap-2 font-bold">
                            <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            <span>Keamanan Terjamin</span>
                        </div>
                        <p className="text-[11px] text-emerald-800/90 dark:text-emerald-300/90 leading-relaxed">
                            Pastikan menggunakan kata sandi yang aman dan tidak membagikan kredensial login kepada pihak di luar struktur pengurus Ciherang Fams.
                        </p>
                    </div>
                </div>

                {/* Right Column: Edit Profile & Password Forms */}
                <div className="lg:col-span-8 space-y-6">
                    {/* Form 1: Edit Informasi Profil */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5 transition-colors">
                        <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-3">
                            <User className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                            <div>
                                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                    Informasi Profil Pengurus
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Ubah nama tampilan dan alamat email akun admin Anda.
                                </p>
                            </div>
                        </div>

                        <form onSubmit={handleUpdateProfile} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                    Nama Lengkap / Nama Pengurus:
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                                        <User className="w-4 h-4" />
                                    </div>
                                    <input
                                        type="text"
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Contoh: Rihan"
                                        className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                    Alamat Email (Username Login):
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                                        <Mail className="w-4 h-4" />
                                    </div>
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="rihan@ciherang.com"
                                        className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                                    />
                                </div>
                                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                                    Alamat ini dapat digunakan sebagai username saat masuk ke panel admin.
                                </p>
                            </div>

                            <div className="pt-2 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={loadingProfile}
                                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                                >
                                    {loadingProfile ? (
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            <Save className="w-3.5 h-3.5" />
                                            Simpan Perubahan Profil
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Form 2: Ganti Password */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5 transition-colors">
                        <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-3">
                            <KeyRound className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                            <div>
                                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                    Ganti Kata Sandi (Password)
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Perbarui kata sandi untuk menjaga keamanan akun administrator.
                                </p>
                            </div>
                        </div>

                        <form onSubmit={handleUpdatePassword} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                    Kata Sandi Saat Ini:
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                                        <Lock className="w-4 h-4" />
                                    </div>
                                    <input
                                        type={showCurrentPassword ? 'text' : 'password'}
                                        required
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        placeholder="Masukkan kata sandi lama Anda"
                                        className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none"
                                    >
                                        {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                        Kata Sandi Baru:
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                                            <Lock className="w-4 h-4" />
                                        </div>
                                        <input
                                            type={showNewPassword ? 'text' : 'password'}
                                            required
                                            minLength={6}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Minimal 6 karakter"
                                            className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none"
                                        >
                                            {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    <p className="text-[11px] text-slate-400 dark:text-slate-500">
                                        Minimal 6 karakter kombinasi huruf & angka.
                                    </p>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                        Konfirmasi Kata Sandi Baru:
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                                            <Lock className="w-4 h-4" />
                                        </div>
                                        <input
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            required
                                            minLength={6}
                                            value={passwordConfirmation}
                                            onChange={(e) => setPasswordConfirmation(e.target.value)}
                                            placeholder="Ulangi kata sandi baru"
                                            className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none"
                                        >
                                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    <p className="text-[11px] text-slate-400 dark:text-slate-500">
                                        Pastikan sama dengan kata sandi baru.
                                    </p>
                                </div>
                            </div>

                            <div className="pt-2 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={loadingPassword}
                                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                                >
                                    {loadingPassword ? (
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            <KeyRound className="w-3.5 h-3.5" />
                                            Perbarui Kata Sandi
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
