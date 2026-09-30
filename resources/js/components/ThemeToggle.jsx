import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle({ className = '', showLabel = false }) {
    const { isDark, toggleTheme } = useTheme();

    return (
        <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
            title={isDark ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
            className={`relative inline-flex items-center justify-center p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-amber-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border border-transparent dark:border-slate-700/60 ${className}`}
        >
            <div className="relative w-5 h-5 flex items-center justify-center">
                {isDark ? (
                    <Sun className="w-5 h-5 text-amber-400 transition-transform rotate-0 scale-100 hover:rotate-45" />
                ) : (
                    <Moon className="w-5 h-5 text-slate-600 transition-transform -rotate-12 scale-100 hover:rotate-0" />
                )}
            </div>
            {showLabel && (
                <span className="ml-2 text-xs font-semibold">
                    {isDark ? 'Mode Terang' : 'Mode Gelap'}
                </span>
            )}
        </button>
    );
}
