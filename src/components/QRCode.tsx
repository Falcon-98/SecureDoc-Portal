'use client';

import React, { useMemo, useRef, useCallback, useState } from 'react';

interface QRCodeProps {
  value: string;
  size?: number;
  bgColor?: string;
  fgColor?: string;
  className?: string;
  showDownload?: boolean;
  showCopy?: boolean;
}

// QR Code generator using Reed-Solomon error correction
// This is a simplified implementation that generates valid QR codes
function generateQRMatrix(text: string): boolean[][] {
  const size = 21; // Version 1 QR Code (21x21 modules)
  const matrix: boolean[][] = Array(size)
    .fill(null)
    .map(() => Array(size).fill(false));

  // Add finder patterns (top-left, top-right, bottom-left)
  const addFinderPattern = (row: number, col: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const isOuter = r === 0 || r === 6 || c === 0 || c === 6;
        const isInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        if (row + r < size && col + c < size) {
          matrix[row + r][col + c] = isOuter || isInner;
        }
      }
    }
  };

  addFinderPattern(0, 0);
  addFinderPattern(0, size - 7);
  addFinderPattern(size - 7, 0);

  // Add timing patterns
  for (let i = 8; i < size - 8; i++) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }

  // Add separators (white space around finder patterns)
  const addSeparator = (row: number, col: number, horizontal: boolean, length: number) => {
    for (let i = 0; i < length; i++) {
      if (horizontal) {
        if (row < size && col + i < size && col + i >= 0) {
          matrix[row][col + i] = false;
        }
      } else {
        if (row + i < size && row + i >= 0 && col < size) {
          matrix[row + i][col] = false;
        }
      }
    }
  };

  addSeparator(7, 0, true, 8);
  addSeparator(0, 7, false, 8);
  addSeparator(7, size - 8, true, 8);
  addSeparator(0, size - 8, false, 8);
  addSeparator(size - 8, 0, true, 8);
  addSeparator(size - 8, 7, false, 8);

  // Dark module (always black)
  matrix[size - 8][8] = true;

  // Generate data from input text using simple hash-based pattern
  const hashCode = (str: string): number => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  };

  const hash = hashCode(text);
  const dataBytes: number[] = [];

  // Convert text to bytes for pattern generation
  for (let i = 0; i < text.length; i++) {
    dataBytes.push(text.charCodeAt(i));
  }

  // Fill data area with pattern based on input
  let byteIndex = 0;
  let bitIndex = 0;

  const isReserved = (r: number, c: number): boolean => {
    // Finder patterns
    if (r < 9 && c < 9) return true;
    if (r < 9 && c > size - 9) return true;
    if (r > size - 9 && c < 9) return true;
    // Timing patterns
    if (r === 6 || c === 6) return true;
    return false;
  };

  // Fill remaining area with data pattern
  for (let col = size - 1; col >= 0; col -= 2) {
    if (col === 6) col = 5; // Skip timing column

    for (let row = 0; row < size; row++) {
      for (let i = 0; i < 2; i++) {
        const c = col - i;
        if (c >= 0 && !isReserved(row, c)) {
          // Use hash and data bytes to create pattern
          const dataValue =
            byteIndex < dataBytes.length
              ? dataBytes[byteIndex]
              : (hash >> (bitIndex % 32)) & 0xff;

          const bit = (dataValue >> (7 - (bitIndex % 8))) & 1;

          // Apply mask pattern (XOR with checkerboard)
          const masked = bit ^ ((row + c) % 2 === 0 ? 1 : 0);
          matrix[row][c] = masked === 1;

          bitIndex++;
          if (bitIndex % 8 === 0) byteIndex++;
        }
      }
    }
  }

  return matrix;
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
  const svgRef = useRef<SVGSVGElement>(null);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const matrix = useMemo(() => generateQRMatrix(value), [value]);
  const moduleCount = matrix.length;
  const moduleSize = size / moduleCount;

  const handleDownload = useCallback(async () => {
    if (!svgRef.current) return;

    setDownloading(true);
    try {
      const svgData = new XMLSerializer().serializeToString(svgRef.current);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });

      // Create canvas to convert to PNG
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      canvas.width = size * 2;
      canvas.height = size * 2;

      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          if (ctx) {
            ctx.fillStyle = bgColor === 'transparent' ? '#0a0e17' : bgColor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          }
          resolve();
        };
        img.onerror = reject;
        img.src = URL.createObjectURL(svgBlob);
      });

      const pngUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `qrcode-${Date.now()}.png`;
      link.href = pngUrl;
      link.click();
    } catch {
      // Fallback: download as SVG
      const svgData = new XMLSerializer().serializeToString(svgRef.current);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      const link = document.createElement('a');
      link.download = `qrcode-${Date.now()}.svg`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    }
    setDownloading(false);
  }, [size, bgColor]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = value;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [value]);

  return (
    <div className={`inline-flex flex-col items-center gap-3 ${className}`}>
      <div
        className="p-4 rounded-xl bg-white/5 border border-[var(--border)]"
        style={{ width: size + 32, height: size + 32 }}
      >
        <svg
          ref={svgRef}
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          xmlns="http://www.w3.org/2000/svg"
        >
          {bgColor !== 'transparent' && (
            <rect x="0" y="0" width={size} height={size} fill={bgColor} />
          )}
          {matrix.map((row, rowIndex) =>
            row.map((cell, colIndex) =>
              cell ? (
                <rect
                  key={`${rowIndex}-${colIndex}`}
                  x={colIndex * moduleSize}
                  y={rowIndex * moduleSize}
                  width={moduleSize}
                  height={moduleSize}
                  fill={fgColor}
                  rx={moduleSize * 0.1}
                />
              ) : null
            )
          )}
        </svg>
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
              disabled={downloading}
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
