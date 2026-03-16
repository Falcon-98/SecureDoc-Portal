'use client';

import React, { useEffect, useRef, useCallback, useState } from 'react';
import QRCodeLib from 'qrcode';

interface QRCodeProps {
  value: string;
  size?: number;
  bgColor?: string;
  fgColor?: string;
  className?: string;
  showDownload?: boolean;
  showCopy?: boolean;
}

export function QRCode({
  value,
  size = 200,
  bgColor = 'transparent',
  fgColor = '#e2e8f0',
  className = '',
  showDownload = true,
  showCopy = true,
}: QRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate QR code when value changes
  useEffect(() => {
    const generateQR = async () => {
      if (!canvasRef.current || !value) return;
      
      try {
        setError(null);
        await QRCodeLib.toCanvas(canvasRef.current, value, {
          width: size,
          margin: 2,
          color: {
            dark: fgColor,
            light: bgColor === 'transparent' ? '#00000000' : bgColor,
          },
          errorCorrectionLevel: 'M',
        });
      } catch (err) {
        console.error('Failed to generate QR code:', err);
        setError('Failed to generate QR code');
      }
    };

    generateQR();
  }, [value, size, bgColor, fgColor]);

  const handleDownload = useCallback(async () => {
    if (!canvasRef.current) return;

    setDownloading(true);
    try {
      // Generate a data URL with proper background for download
      const downloadCanvas = document.createElement('canvas');
      const ctx = downloadCanvas.getContext('2d');
      const padding = 32;
      
      downloadCanvas.width = size + padding * 2;
      downloadCanvas.height = size + padding * 2;
      
      if (ctx) {
        // Fill with background color
        ctx.fillStyle = bgColor === 'transparent' ? '#0a0e17' : bgColor;
        ctx.fillRect(0, 0, downloadCanvas.width, downloadCanvas.height);
        
        // Draw the QR code centered
        ctx.drawImage(canvasRef.current, padding, padding, size, size);
      }
      
      const pngUrl = downloadCanvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `qrcode-${Date.now()}.png`;
      link.href = pngUrl;
      link.click();
    } catch (err) {
      console.error('Download failed:', err);
    }
    setDownloading(false);
  }, [size, bgColor]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Modern clipboard API not available - show message to user
      console.warn('Clipboard API not available');
      // Try fallback
      try {
        const textarea = document.createElement('textarea');
        textarea.value = value;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        const success = document.execCommand('copy');
        document.body.removeChild(textarea);
        if (success) {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }
      } catch {
        // Both methods failed
        console.error('Failed to copy to clipboard');
      }
    }
  }, [value]);

  return (
    <div className={`inline-flex flex-col items-center gap-3 ${className}`}>
      <div
        className="p-4 rounded-xl bg-white/5 border border-[var(--border)] flex items-center justify-center"
        style={{ width: size + 32, height: size + 32 }}
      >
        {error ? (
          <div className="text-red-400 text-sm text-center p-4">
            {error}
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            width={size}
            height={size}
            style={{ width: size, height: size }}
          />
        )}
      </div>

      {(showDownload || showCopy) && (
        <div className="flex items-center gap-2">
          {showCopy && (
            <button
              onClick={handleCopy}
              className="
                flex items-center gap-2 px-3 py-2 rounded-lg
                bg-[var(--bg-card)] border border-[var(--border)]
                hover:border-[var(--accent)] hover:bg-[var(--accent-glow)]
                text-[var(--text-muted)] hover:text-[var(--text-primary)]
                transition-all duration-200 text-sm
              "
              style={{ fontFamily: 'DM Sans, sans-serif' }}
            >
              {copied ? (
                <>
                  <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                    />
                  </svg>
                  Copy URL
                </>
              )}
            </button>
          )}

          {showDownload && (
            <button
              onClick={handleDownload}
              disabled={downloading || !!error}
              className="
                flex items-center gap-2 px-3 py-2 rounded-lg
                bg-[var(--accent)] text-white
                hover:bg-[var(--accent)]/80
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-all duration-200 text-sm font-medium
              "
              style={{ fontFamily: 'DM Sans, sans-serif' }}
            >
              {downloading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Downloading...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  Download
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export type { QRCodeProps };
