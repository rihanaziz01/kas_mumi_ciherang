import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from '../components/ThemeToggle';
import {
    LayoutDashboard,
    BarChart3,
    CreditCard,
    Calendar,
    Users,
    Wallet,
    Coins,
    FileText,
    LogOut,
    Menu,
    X,
    ChevronRight,
    UserCog,
} from 'lucide-react';

const NAV_GROUPS = [
    {
        title: 'Menu Utama',
        items: [
            {
                name: 'Dashboard',
                path: '/admin/dashboard',
                icon: LayoutDashboard,
                desc: 'Ringkasan & overview',
            },
            {
                name: 'Statistik',
                path: '/admin/statistik',
                icon: BarChart3,
                desc: 'Analitik & grafik kepatuhan',
            },
            {
                name: 'Pembayaran Iuran',
                path: '/admin/pembayaran',
                icon: CreditCard,
                desc: 'Input pembayaran bulanan',
            },
            {
                name: 'Periode & Tutup Buku',
                path: '/admin/periode',
                icon: Calendar,
                desc: 'Kelola tahun & arsip',
            },
        ],
    },
    {
        title: 'Master Data',
        items: [
            {
                name: 'Data Anggota',
                path: '/admin/anggota',
                icon: Users,
                desc: 'Kelola anggota & kategori',
            },
            {
                name: 'Gaji Karyawan',
                path: '/admin/pendapatan-karyawan',
                icon: Wallet,
                desc: 'Penghasilan & qurban 2%',
            },
        ],
    },
    {
        title: 'Keuangan & Kas',
        items: [
            {
                name: 'Kas Operasional',
                path: '/admin/kas',
                icon: Coins,
                desc: 'Pemasukan & pengeluaran kas',
            },
            {
                name: 'Laporan & Neraca',
                path: '/admin/laporan',
                icon: FileText,
                desc: 'Neraca saldo & rekapitulasi',
            },
        ],
    },
    {
        title: 'Akun & Sistem',
        items: [
            {
                name: 'Profil Admin',
                path: '/admin/profil',
                icon: UserCog,
                desc: 'Kelola akun & kata sandi',
            },
        ],
    },
];

export default function AdminLayout() {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const handleLogout = async () => {
        if (window.confirm('Apakah Anda yakin ingin keluar dari panel admin?')) {
            navigate('/', { replace: true });
            await logout();
        }
    };

    // Find current active item title
    let currentTitle = 'Panel Admin';
    for (const group of NAV_GROUPS) {
        const found = group.items.find((i) => i.path === location.pathname);
        if (found) {
            currentTitle = found.name;
            break;
        }
    }

    const renderNavContent = () => (
        <div className="flex flex-col h-full bg-white dark:bg-slate-900 transition-colors">
            {/* Header Brand */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800">
                <Link
                    to="/admin/dashboard"
                    onClick={() => setSidebarOpen(false)}
                    className="flex items-center gap-3 group"
                >
                    <div className="w-10 h-10 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800 p-1 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                        <img
                            src="/images/logo-cropped.png"
                            alt="Ciherang Fams"
                            className="h-full w-auto object-contain"
                        />
                    </div>
                    <div className="min-w-0">
                        <span className="font-extrabold text-slate-900 dark:text-white text-base tracking-tight block truncate">
                            Ciherang Fams
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 tracking-wider uppercase">
                                Panel Pengurus
                            </span>
                        </div>
                    </div>
                </Link>
            </div>

            {/* Navigation Groups */}
            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
                {NAV_GROUPS.map((group) => (
                    <div key={group.title}>
                        <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                            {group.title}
                        </p>
                        <div className="space-y-1">
                            {group.items.map((item) => {
                                const Icon = item.icon;
                                const isActive = location.pathname === item.path;
                                return (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        onClick={() => setSidebarOpen(false)}
                                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                                            isActive
                                                ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-900 dark:text-emerald-300 font-bold border border-emerald-300/80 dark:border-emerald-500/30 shadow-xs'
                                                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/70'
                                        }`}
                                    >
                                        <div
                                            className={`p-1.5 rounded-lg transition-colors ${
                                                isActive
                                                    ? 'bg-emerald-600 text-white dark:bg-emerald-500/25 dark:text-emerald-300'
                                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 group-hover:bg-slate-200/70 dark:group-hover:bg-slate-700'
                                            }`}
                                        >
                                            <Icon className="w-4 h-4 shrink-0" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="truncate text-xs sm:text-sm">{item.name}</p>
                                        </div>
                                        {isActive && (
                                            <ChevronRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>


            {/* Admin User Card & Logout */}
            <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
                <div className="flex items-center justify-between gap-2.5 p-2 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs hover:border-emerald-500/50 dark:hover:border-emerald-500/50 transition">
                    <Link
                        to="/admin/profil"
                        onClick={() => setSidebarOpen(false)}
                        className="flex items-center gap-2.5 min-w-0 flex-1 group"
                        title="Buka Profil & Pengaturan Akun Admin"
                    >
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                            {user?.name ? user.name.slice(0, 2).toUpperCase() : 'AD'}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                {user?.name || 'Administrator'}
                            </p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-400 truncate">
                                {user?.email || 'rihan@ciherang.com'}
                            </p>
                        </div>
                    </Link>
                    <button
                        onClick={handleLogout}
                        title="Keluar / Logout"
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition shrink-0"
                    >
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-100 transition-colors print:bg-white print:text-black print:min-h-0 print:block print:p-0 print:m-0">
            {/* Desktop Sidebar (Fixed Left) */}
            <aside className="hidden lg:flex lg:flex-col lg:w-64 xl:w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shrink-0 sticky top-0 h-screen z-30 transition-colors print:hidden">
                {renderNavContent()}
            </aside>

            {/* Mobile Drawer (Collapsible) */}
            {sidebarOpen && (
                <div className="lg:hidden fixed inset-0 z-50 flex print:hidden">
                    {/* Backdrop Overlay */}
                    <div
                        onClick={() => setSidebarOpen(false)}
                        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
                    />

                    {/* Drawer Content */}
                    <div className="relative flex flex-col w-72 max-w-[85vw] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 h-full z-10 shadow-2xl transition-colors">
                        <div className="absolute top-4 right-3 z-20">
                            <button
                                onClick={() => setSidebarOpen(false)}
                                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                                aria-label="Tutup Menu"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        {renderNavContent()}
                    </div>
                </div>
            )}

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 print:block print:w-full">
                {/* Topbar Header */}
                <header className="sticky top-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between transition-colors print:hidden">
                    <div className="flex items-center gap-3">
                        {/* Mobile Hamburger Toggle */}
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none"
                            aria-label="Buka Menu"
                        >
                            <Menu className="w-6 h-6" />
                        </button>

                        <div>
                            <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
                                <span>Admin</span>
                                <span>/</span>
                                <span className="font-semibold text-slate-600 dark:text-slate-300">{currentTitle}</span>
                            </div>
                            <h1 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
                                {currentTitle}
                            </h1>
                        </div>
                    </div>

                    {/* Right Header Badges & Actions */}
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 text-brand-800 dark:text-brand-300 text-xs font-semibold">
                            <span className="w-2 h-2 rounded-full bg-brand-500 animate-ping"></span>
                            <span>Buku Kas Aktif</span>
                        </div>

                        {/* Theme Toggle Button */}
                        <ThemeToggle />

                        <Link
                            to="/admin/profil"
                            className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-300 text-xs font-semibold transition border border-slate-200/80 dark:border-slate-700 shadow-2xs"
                            title="Kelola Profil & Akun Admin"
                        >
                            <div className="w-5 h-5 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-black text-[10px] flex items-center justify-center shrink-0">
                                {user?.name ? user.name.slice(0, 2).toUpperCase() : 'AD'}
                            </div>
                            <span className="hidden sm:inline font-bold">{user?.name || 'Profil Admin'}</span>
                        </Link>


                        <button
                            onClick={handleLogout}
                            title="Keluar"
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </header>

                {/* Page View Body */}
                <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto print:p-0 print:m-0 print:max-w-none print:w-full">
                    <Outlet />
                </main>

                {/* Minimal Admin Footer */}
                <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-4 px-4 sm:px-6 lg:px-8 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 dark:text-slate-500 gap-2 transition-colors print:hidden">
                    <p>
                        © {new Date().getFullYear()} <strong className="font-semibold text-slate-700 dark:text-slate-300">Ciherang Fams</strong> • Panel Administrasi Keuangan
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500">
                        Transparansi & Akuntabilitas Kas Terbuka
                    </p>
                </footer>
            </div>
        </div>
    );
}
