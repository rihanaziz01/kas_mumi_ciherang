import React from 'react';
import { Heart } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6 text-center text-xs text-slate-500 dark:text-slate-400 transition-colors">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                    <img
                        src="/images/logo-cropped.png"
                        alt="Ciherang Fams"
                        className="h-7 w-auto object-contain rounded"
                    />
                    <p className="flex items-center gap-1 font-medium text-slate-600 dark:text-slate-300">
                        © {new Date().getFullYear()} <strong className="font-bold text-slate-900 dark:text-white">Ciherang Fams</strong> • Muda-Mudi Ciherang
                    </p>
                </div>
                <p className="flex items-center justify-center gap-1 text-slate-400 dark:text-slate-500">
                    Sistem Manajemen & Transparansi Keuangan Terbuka
                </p>
            </div>
        </footer>
    );
}
