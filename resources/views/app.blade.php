<!DOCTYPE html>
<html lang="id" translate="no" class="notranslate h-full bg-slate-50 dark:bg-slate-950 subpixel-antialiased">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>Ciherang Fams - Sistem Keuangan Muda-Mudi Ciherang</title>
    <meta name="description" content="Sistem Manajemen & Transparansi Keuangan Terbuka Paguyuban Muda-Mudi Ciherang (Ciherang Fams)">
    <link rel="icon" type="image/png" href="/favicon.png">
    <link rel="shortcut icon" href="/favicon.png">
    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
    <link rel="icon" type="image/png" sizes="192x192" href="/icons/icon-192x192.png">
    <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-72x72.png">

    <!-- Progressive Web App (PWA) Manifest & Meta Tags -->
    <link rel="manifest" href="/manifest.json">
    <meta name="theme-color" content="#059669">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="apple-mobile-web-app-title" content="Ciherang Fams">

    <!-- Anti-FOUC Dark Theme Init Script -->
    <script>
        (function() {
            try {
                var theme = localStorage.getItem('theme');
                var supportDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (theme === 'dark' || (!theme && supportDarkMode)) {
                    document.documentElement.classList.add('dark');
                } else {
                    document.documentElement.classList.remove('dark');
                }
            } catch (e) {}
        })();
    </script>

    <!-- Google Fonts: Plus Jakarta Sans (400, 500, 600, 700, 800, 900) -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">

    <style>
        :root {
            font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            text-rendering: optimizeLegibility;
            -webkit-text-size-adjust: 100%;
        }
        body {
            font-family: inherit;
            font-weight: 500;
            color: #0f172a;
        }
        .dark body {
            color: #f8fafc;
        }
    </style>

    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/app.jsx'])
</head>
<body class="h-full text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-950 selection:bg-emerald-500 selection:text-white transition-colors duration-150">
    <div id="root" class="min-h-full flex flex-col"></div>

    <!-- PWA Service Worker Registration -->
    <script>
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js')
                    .then(function(reg) {
                        console.log('PWA Service Worker registered with scope:', reg.scope);
                    })
                    .catch(function(err) {
                        console.warn('PWA Service Worker registration failed:', err);
                    });
            });
        }
    </script>
</body>
</html>
