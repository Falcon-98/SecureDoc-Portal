'use client';

import React from 'react';
import { useTheme } from '@/hooks/useTheme';

interface ThemeToggleProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
};

const iconSizes = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
};

export function ThemeToggle({ className = '', size = 'md' }: ThemeToggleProps) {
  const { theme, toggleTheme, isDark, mounted } = useTheme();

  if (!mounted) {
    return (
      <button
        className={`
          ${sizeClasses[size]} rounded-xl
          bg-[var(--bg-card)] border border-[var(--border)]
          flex items-center justify-center
          ${className}
        `}
        aria-label="Toggle theme"
        disabled
      >
        <div className={`${iconSizes[size]} bg-[var(--text-muted)] rounded animate-pulse`} />
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className={`
        ${sizeClasses[size]} rounded-xl
        bg-[var(--bg-card)] border border-[var(--border)]
        hover:border-[var(--accent)] hover:bg-[var(--accent-glow)]
        flex items-center justify-center
        transition-all duration-300 ease-out
        group relative overflow-hidden
        ${className}
      `}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Current: ${theme} mode`}
    >
      {/* Sun Icon */}
      <svg
        className={`
          ${iconSizes[size]} absolute
          transition-all duration-500 ease-out
          ${isDark ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'}
          text-amber-400 group-hover:text-amber-300
        `}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <circle cx="12" cy="12" r="4" strokeWidth={2} />
        <path
          strokeLinecap="round"
          strokeWidth={2}
          d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"
        />
      </svg>

      {/* Moon Icon */}
      <svg
        className={`
          ${iconSizes[size]} absolute
          transition-all duration-500 ease-out
          ${isDark ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'}
          text-blue-400 group-hover:text-blue-300
        `}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
        />
      </svg>

      {/* Glow effect on hover */}
      <div
        className={`
          absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100
          transition-opacity duration-300
          ${isDark ? 'bg-blue-500/10' : 'bg-amber-500/10'}
        `}
      />
    </button>
  );
}

export type { ThemeToggleProps };
