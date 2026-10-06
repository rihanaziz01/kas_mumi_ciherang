import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';
import { 
    Coins, 
    CheckCircle2, 
    BookOpen, 
    ShieldCheck, 
    LogOut, 
    Menu, 
    X, 
    LayoutDashboard,
} from 'lucide-react';

export default function Navbar() {
    const { isAuthenticated, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [mobileOpen, setMobileOpen] = useState(false);

    const handleLogout = async () => {
        navigate('/', { replace: true });
        await logout();
    };

    const publicNav = [
        { name: 'Transparansi', path: '/', icon: Coins },
        { name: 'Cek Iuran Anggota', path: '/cek-iuran', icon: CheckCircle2 },
        { name: 'Buku Kas Terbuka', path: '/buku-kas', icon: BookOpen },
    ];

    return (
        <header className="sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Brand Logo */}
                    <Link to="/" className="flex items-center gap-3 group">
                        <img
                            src="/images/logo-cropped.png"
                            alt="Logo Ciherang Fams"
                            className="h-10 w-auto object-contain rounded-lg group-hover:scale-105 transition-transform"
                        />
                        <div>
                            <span className="font-extrabold text-slate-900 dark:text-white tracking-tight text-base sm:text-lg block leading-none">
                                Ciherang Fams
                            </span>
                            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 tracking-wider uppercase block mt-1">
                                Muda-Mudi Ciherang
                            </span>
                        </div>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-1">
                        {publicNav.map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.path;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-colors ${
                                        isActive
                                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-200/70 dark:border-emerald-800/60 shadow-xs'
                                            : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                                    }`}
                                >
                                    <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`} />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Right Action buttons */}
                    <div className="hidden md:flex items-center gap-2.5">
                        <ThemeToggle />

                        {isAuthenticated ? (
                            <div className="flex items-center gap-2">
                                <Link
                                    to="/admin/dashboard"
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition shadow-sm shadow-emerald-600/25"
                                >
                                    <LayoutDashboard className="w-4 h-4" />
                                    Ke Panel Admin
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    title="Keluar"
                                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl transition"
                                >
                                    <LogOut className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <Link
                                to="/admin/login"
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-md shadow-emerald-600/20 border border-emerald-500/30"
                            >
                                <ShieldCheck className="w-4 h-4 text-emerald-100" />
                                Login Pengurus
                            </Link>
                        )}
                    </div>

                    {/* Mobile Controls */}
                    <div className="md:hidden flex items-center gap-1.5">
                        <ThemeToggle />
                        <button
                            onClick={() => setMobileOpen(!mobileOpen)}
                            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none"
                            aria-label="Toggle Menu"
                        >
                            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Drawer */}
            {mobileOpen && (
                <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 pt-3 pb-6 space-y-2 shadow-xl">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 pt-1">
                        Menu Publik
                    </p>
                    {publicNav.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => setMobileOpen(false)}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium ${
                                    isActive
                                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-200/80 dark:border-emerald-800/60'
                                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                                }`}
                            >
                                <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`} />
                                {item.name}
                            </Link>
                        );
                    })}

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
                        {isAuthenticated ? (
                            <>
                                <Link
                                    to="/admin/dashboard"
                                    onClick={() => setMobileOpen(false)}
                                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-sm shadow-emerald-600/25"
                                >
                                    <LayoutDashboard className="w-4 h-4" />
                                    Buka Panel Pengurus
                                </Link>
                                <button
                                    onClick={() => {
                                        setMobileOpen(false);
                                        handleLogout();
                                    }}
                                    className="flex items-center justify-center gap-2 w-full py-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-sm font-medium"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Keluar (Logout)
                                </button>
                            </>
                        ) : (
                            <Link
                                to="/admin/login"
                                onClick={() => setMobileOpen(false)}
                                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-md shadow-emerald-600/20"
                            >
                                <ShieldCheck className="w-4 h-4 text-emerald-100" />
                                Login Pengurus
                            </Link>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
}
