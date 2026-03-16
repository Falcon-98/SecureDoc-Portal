'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';

interface DocumentViewerProps {
  documentUrl: string;
  title: string;
  owner: string;
}

export default function DocumentViewer({ documentUrl, title, owner }: DocumentViewerProps) {
  const shieldRef = useRef<HTMLDivElement>(null);
  const screenshotBlockRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      viewerRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    // Generate watermarks
    const watermarkLayer = document.getElementById('watermarkLayer');
    if (watermarkLayer) {
      const text = 'CONFIDENTIAL • VIEW ONLY';
      for (let y = 0; y < 20; y++) {
        for (let x = 0; x < 6; x++) {
          const span = document.createElement('span');
          span.textContent = text;
          span.style.left = (x * 18 + (y % 2) * 9) + '%';
          span.style.top = (y * 6) + '%';
          watermarkLayer.appendChild(span);
        }
      }
    }

    // Shield scroll handling
    const shield = shieldRef.current;
    let scrollTimeout: NodeJS.Timeout;

    const handleWheel = () => {
      shield?.classList.add('scrolling');
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        shield?.classList.remove('scrolling');
      }, 600);
    };

    const handleTouchStart = () => {
      shield?.classList.add('scrolling');
    };

    const handleTouchEnd = () => {
      setTimeout(() => shield?.classList.remove('scrolling'), 600);
    };

    shield?.addEventListener('wheel', handleWheel, { passive: true });
    shield?.addEventListener('touchstart', handleTouchStart, { passive: true });
    shield?.addEventListener('touchend', handleTouchEnd, { passive: true });

    // Anti-copy protections
    const preventCopy = (e: Event) => {
      e.preventDefault();
      return false;
    };

    const preventKeyboard = (e: KeyboardEvent) => {
      // Allow fullscreen toggle with F11
      if (e.key === 'F11') {
        e.preventDefault();
        toggleFullscreen();
        return false;
      }
      // Escape to exit fullscreen
      if (e.key === 'Escape' && isFullscreen) {
        return; // Let the browser handle fullscreen exit
      }
      // Ctrl/Cmd + C, X, V, A, S, P, U
      if ((e.ctrlKey || e.metaKey) && ['c', 'x', 'v', 'a', 's', 'p', 'u'].includes(e.key.toLowerCase())) {
        e.preventDefault();
        return false;
      }
      // Print Screen
      if (e.key === 'PrintScreen' || e.key === 'F12') {
        e.preventDefault();
        return false;
      }
      // DevTools shortcuts
      if (e.ctrlKey && e.shiftKey && ['i', 'j', 'c'].includes(e.key.toLowerCase())) {
        e.preventDefault();
        return false;
      }
    };

    document.addEventListener('copy', preventCopy);
    document.addEventListener('cut', preventCopy);
    document.addEventListener('paste', preventCopy);
    document.addEventListener('contextmenu', preventCopy);
    document.addEventListener('selectstart', preventCopy);
    document.addEventListener('dragstart', preventCopy);
    document.addEventListener('keydown', preventKeyboard);

    // Screenshot protection
    const screenshotBlock = screenshotBlockRef.current;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        screenshotBlock?.classList.add('active');
      } else {
        setTimeout(() => {
          screenshotBlock?.classList.remove('active');
        }, 300);
      }
    };

    const handleBlur = () => {
      screenshotBlock?.classList.add('active');
    };

    const handleFocus = () => {
      setTimeout(() => {
        screenshotBlock?.classList.remove('active');
      }, 300);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);

    // Cleanup
    return () => {
      shield?.removeEventListener('wheel', handleWheel);
      shield?.removeEventListener('touchstart', handleTouchStart);
      shield?.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('copy', preventCopy);
      document.removeEventListener('cut', preventCopy);
      document.removeEventListener('paste', preventCopy);
      document.removeEventListener('contextmenu', preventCopy);
      document.removeEventListener('selectstart', preventCopy);
      document.removeEventListener('dragstart', preventCopy);
      document.removeEventListener('keydown', preventKeyboard);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      clearTimeout(scrollTimeout);
    };
  }, [toggleFullscreen, isFullscreen]);

  const handleIframeLoad = () => {
    setTimeout(() => {
      setIsLoading(false);
    }, 800);
  };

  return (
    <div ref={viewerRef} className="relative z-10 min-h-screen flex flex-col no-select bg-[#0a0e17]">
      {/* Screenshot Block Overlay */}
      <div ref={screenshotBlockRef} className="screenshot-block" id="screenshotBlock">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-[#ef4444] mb-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
        </svg>
        <h2 className="font-['DM_Serif_Display',serif] text-xl text-[#fca5a5] mb-2">Content Protected</h2>
        <p className="text-sm text-[#94a3b8]">Screenshot capture is restricted for this confidential document.</p>
      </div>

      {/* Header */}
      <header className="fade-in backdrop-blur-xl bg-[rgba(17,24,39,0.7)] border-b border-[rgba(59,130,246,0.12)] px-4 sm:px-8 h-14 sm:h-16 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="logo-icon">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="white" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
              </svg>
            </div>
            <span className="font-['DM_Serif_Display',serif] text-lg sm:text-xl tracking-tight text-[#e2e8f0] hidden sm:inline">
              SecureDoc Portal
            </span>
          </Link>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg text-[#94a3b8] hover:text-[#e2e8f0] hover:bg-[rgba(59,130,246,0.1)] transition-all"
            title={isFullscreen ? 'Exit fullscreen (F11)' : 'Enter fullscreen (F11)'}
          >
            {isFullscreen ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9 3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5 5.25 5.25" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
              </svg>
            )}
          </button>
          
          <div className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-full text-[10px] sm:text-xs font-semibold uppercase tracking-widest bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.25)] text-[#fca5a5]">
            <div className="w-1.5 h-1.5 rounded-full bg-[#ef4444] badge-dot"></div>
            <span className="hidden sm:inline">Confidential</span>
          </div>
        </div>
      </header>

      {/* Info Bar */}
      <div className="fade-in-delay bg-[rgba(26,34,54,0.6)] border-b border-[rgba(59,130,246,0.12)] px-4 sm:px-8 py-3 sm:py-3.5 flex items-center justify-between flex-wrap gap-2 sm:gap-3">
        <div className="flex items-center gap-3 sm:gap-5 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-[#94a3b8]">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5 opacity-60">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
            <strong className="text-[#e2e8f0] font-medium truncate max-w-[150px] sm:max-w-none">{title}</strong>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-[#94a3b8]">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5 opacity-60">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
            </svg>
            Owner: <strong className="text-[#e2e8f0] font-medium">{owner}</strong>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-[#94a3b8]">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5 opacity-60">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
            Access: <strong className="text-[#e2e8f0] font-medium">View Only</strong>
          </div>
        </div>
        <div className="hidden md:flex gap-2 flex-wrap">
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-medium bg-[rgba(59,130,246,0.08)] border border-[rgba(59,130,246,0.15)] text-[#93c5fd]">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
            Copy Disabled
          </div>
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-medium bg-[rgba(59,130,246,0.08)] border border-[rgba(59,130,246,0.15)] text-[#93c5fd]">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
            </svg>
            Screenshot Protected
          </div>
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-medium bg-[rgba(59,130,246,0.08)] border border-[rgba(59,130,246,0.15)] text-[#93c5fd]">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18.75 12H5.25" />
            </svg>
            Print Blocked
          </div>
        </div>
      </div>

      {/* Document Viewer */}
      <div className={`flex-1 ${isFullscreen ? 'p-0' : 'p-4 sm:p-6'} fade-in-delay`}>
        <div className={`relative bg-[#1a2236] ${isFullscreen ? 'rounded-none' : 'rounded-xl'} border ${isFullscreen ? 'border-transparent' : 'border-[rgba(59,130,246,0.12)]'} overflow-hidden ${isFullscreen ? 'h-full' : 'min-h-[75vh]'} shadow-[0_0_0_1px_rgba(59,130,246,0.05),0_20px_60px_rgba(0,0,0,0.3)]`}>
          {/* Watermark Layer */}
          <div id="watermarkLayer" className="watermark-layer"></div>

          {/* Transparent Shield */}
          <div ref={shieldRef} className="iframe-shield"></div>

          {/* Loading */}
          {isLoading && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#1a2236] transition-all duration-500">
              <div className="spinner"></div>
              <p className="mt-4 text-sm text-[#94a3b8]">Decrypting and loading secure document…</p>
            </div>
          )}

          {/* Document iframe */}
          <iframe
            src={documentUrl}
            sandbox="allow-scripts allow-same-origin"
            loading="lazy"
            onLoad={handleIframeLoad}
            className={`w-full h-full border-none absolute inset-0 ${isFullscreen ? '' : 'min-h-[75vh]'}`}
            title={title}
          />
        </div>
      </div>

      {/* Footer - hidden in fullscreen */}
      {!isFullscreen && (
        <footer className="px-4 sm:px-8 py-3 sm:py-4 border-t border-[rgba(59,130,246,0.12)] bg-[rgba(17,24,39,0.5)] flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#94a3b8]">
          <div className="flex items-center gap-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="#22c55e" className="w-3 h-3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
            </svg>
            <span>End-to-end protected · Encrypted link</span>
          </div>
          <span>© 2026 SecureDoc Portal. All rights reserved.</span>
        </footer>
      )}
    </div>
  );
}
