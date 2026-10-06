import './bootstrap';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

// Layouts
import PublicLayout from './layouts/PublicLayout';
import AdminLayout from './layouts/AdminLayout';

// Components
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import PwaInstallPrompt from './components/PwaInstallPrompt';

// Public Pages
import Home from './pages/public/Home';
import CekIuran from './pages/public/CekIuran';
import BukuKas from './pages/public/BukuKas';

// Admin Pages
import Login from './pages/admin/Login';
import Dashboard from './pages/admin/Dashboard';
import Pembayaran from './pages/admin/Pembayaran';
import Periode from './pages/admin/Periode';
import Anggota from './pages/admin/Anggota';
import PendapatanKaryawan from './pages/admin/PendapatanKaryawan';
import Kas from './pages/admin/Kas';
import SetoranDesa from './pages/admin/SetoranDesa';
import Laporan from './pages/admin/Laporan';
import Profil from './pages/admin/Profil';
import Statistik from './pages/admin/Statistik';

function App() {
    return (
        <ThemeProvider>
            <AuthProvider>
                <BrowserRouter>
                    <Routes>
                        {/* Public Routes Wrapped in PublicLayout (Navbar + Main + Footer) */}
                        <Route element={<PublicLayout />}>
                            <Route path="/" element={<Home />} />
                            <Route path="/cek-iuran" element={<CekIuran />} />
                            <Route path="/buku-kas" element={<BukuKas />} />
                            <Route path="/admin/login" element={<Login />} />
                        </Route>

                        {/* Admin Protected Routes with Sidebar Layout */}
                        <Route
                            path="/admin"
                            element={
                                <ProtectedRoute>
                                    <AdminLayout />
                                </ProtectedRoute>
                            }
                        >
                            <Route index element={<Navigate to="/admin/dashboard" replace />} />
                            <Route path="dashboard" element={<Dashboard />} />
                            <Route path="statistik" element={<Statistik />} />
                            <Route path="pembayaran" element={<Pembayaran />} />
                            <Route path="periode" element={<Periode />} />
                            <Route path="anggota" element={<Anggota />} />
                            <Route path="pendapatan-karyawan" element={<PendapatanKaryawan />} />
                            <Route path="kas" element={<Kas />} />
                            <Route path="setoran-desa" element={<SetoranDesa />} />
                            <Route path="laporan" element={<Laporan />} />
                            <Route path="profil" element={<Profil />} />
                        </Route>

                        {/* Fallback */}
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                    <PwaInstallPrompt />
                </BrowserRouter>
            </AuthProvider>
        </ThemeProvider>
    );
}

const rootElement = document.getElementById('root');
if (rootElement) {
    createRoot(rootElement).render(
        <ErrorBoundary>
            <App />
        </ErrorBoundary>
    );
}
