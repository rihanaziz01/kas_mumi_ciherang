import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, CheckCircle, Share, PlusSquare } from 'lucide-react';

export default function PwaInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isInstallable, setIsInstallable] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [showIOSGuide, setShowIOSGuide] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        // Cek apakah sudah berjalan di mode standalone (sudah terpasang)
        const isStandalone =
            window.matchMedia('(display-mode: standalone)').matches ||
            window.navigator.standalone === true;

        if (isStandalone) {
            setIsInstalled(true);
            return;
        }

        // Cek apakah user pernah menutup prompt di sesi ini
        const isDismissed = sessionStorage.getItem('pwa_prompt_dismissed');
        if (isDismissed) {
            setDismissed(true);
        }

        // Deteksi iOS Safari
        const userAgent = window.navigator.userAgent.toLowerCase();
        const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
        const isSafari = /safari/.test(userAgent) && !/chrome|crios|fxios/.test(userAgent);
        if (isIosDevice && isSafari && !isStandalone) {
            setIsIOS(true);
        }

        // Handler untuk browser Chromium (Chrome, Edge, Samsung Internet, Android)
        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setIsInstallable(true);
        };

        const handleAppInstalled = () => {
            setIsInstalled(true);
            setIsInstallable(false);
            setDeferredPrompt(null);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    const handleInstallClick = async () => {
        if (isIOS) {
            setShowIOSGuide(true);
            return;
        }

        if (!deferredPrompt) {
            return;
        }

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setIsInstalled(true);
            setIsInstallable(false);
        }
        setDeferredPrompt(null);
    };

    const handleDismiss = () => {
        setDismissed(true);
        sessionStorage.setItem('pwa_prompt_dismissed', 'true');
    };

    // Jangan tampilkan jika sudah terpasang, atau ditutup, atau bukan iOS dan belum ada prompt
    if (isInstalled || dismissed || (!isInstallable && !isIOS)) {
        return null;
    }

    return (
        <>
            {/* Floating Install Prompt Banner */}
            <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-bounce-in">
                <div className="bg-white dark:bg-slate-900 border border-emerald-500/30 dark:border-emerald-500/40 rounded-3xl p-4 sm:p-5 shadow-2xl shadow-emerald-950/20 backdrop-blur-md relative">
                    <button
                        onClick={handleDismiss}
                        className="absolute top-3.5 right-3.5 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Tutup"
                    >
                        <X className="w-4 h-4" />
                    </button>

                    <div className="flex items-start gap-3.5 pr-6">
                        <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-1.5 flex items-center justify-center shrink-0 shadow-xs">
                            <img
                                src="/icons/icon-192x192.png"
                                alt="Ciherang Fams"
                                className="w-full h-full object-contain"
                            />
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                                <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                                    Pasang Aplikasi
                                </span>
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300">
                                    PWA
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                                Pasang <strong>Ciherang Fams</strong> di layar utama HP/Laptop Anda. Akses lebih cepat, ringan, dan tetap aktif offline!
                            </p>
                        </div>
                    </div>

                    <div className="mt-4 flex items-center gap-2.5">
                        <button
                            onClick={handleInstallClick}
                            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/25 transition-all cursor-pointer"
                        >
                            <Download className="w-4 h-4" />
                            {isIOS ? 'Cara Pasang di iPhone' : 'Pasang Sekarang'}
                        </button>
                        <button
                            onClick={handleDismiss}
                            className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold transition-colors"
                        >
                            Nanti Saja
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal Panduan Pasang untuk Pengguna iOS Safari */}
            {showIOSGuide && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-fadeIn">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                                    <Smartphone className="w-5 h-5" />
                                </div>
                                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                                    Pasang di iPhone / iPad
                                </h3>
                            </div>
                            <button
                                onClick={() => setShowIOSGuide(false)}
                                className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <p className="text-xs text-slate-600 dark:text-slate-400">
                            Ikuti 2 langkah mudah berikut untuk menambahkan aplikasi ke Layar Utama iPhone:
                        </p>

                        <div className="space-y-3 text-xs">
                            <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
                                <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shrink-0">
                                    1
                                </div>
                                <div>
                                    <span className="font-bold text-slate-900 dark:text-white block">
                                        Tekan tombol Bagikan (Share)
                                    </span>
                                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                                        Ikon kotak dengan panah atas <Share className="w-3.5 h-3.5 inline text-blue-500" /> di bilah bawah browser Safari.
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
                                <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shrink-0">
                                    2
                                </div>
                                <div>
                                    <span className="font-bold text-slate-900 dark:text-white block">
                                        Pilih "Tambah ke Layar Utama"
                                    </span>
                                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                                        Gulir ke bawah dan ketuk opsi <PlusSquare className="w-3.5 h-3.5 inline text-emerald-600" /> "Add to Home Screen".
                                    </span>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => setShowIOSGuide(false)}
                            className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 text-white font-bold text-xs hover:bg-slate-800 transition"
                        >
                            Saya Mengerti
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
