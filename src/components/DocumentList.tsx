'use client';

import React, { useState, useEffect, useCallback } from 'react';

interface StoredDocument {
  docId: string;
  encryptedUrl: string;
  title: string;
  owner: string;
  createdAt: Date | string;
  accessCount: number;
}

type StorageType = 'local' | 'firebase';

interface DocumentItem extends StoredDocument {
  storageType: StorageType;
}

interface DocumentListProps {
  onCopyLink?: (docId: string, url: string) => void;
  onDelete?: (docId: string) => void;
  className?: string;
  showStorageType?: boolean;
}

function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getDocumentUrl(docId: string): string {
  if (typeof window !== 'undefined') {
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
    return `${window.location.origin}${basePath}/doc/?id=${docId}`;
  }
  return `/doc/?id=${docId}`;
}

export function DocumentList({
  onCopyLink,
  onDelete,
  className = '',
  showStorageType = true,
}: DocumentListProps) {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const loadDocuments = useCallback(() => {
    try {
      const stored = localStorage.getItem('securedoc_documents');
      if (stored) {
        const parsed: StoredDocument[] = JSON.parse(stored);
        const docs: DocumentItem[] = parsed.map((doc) => ({
          ...doc,
          storageType: 'local' as const,
        }));
        return docs.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }
      return [];
    } catch {
      return [];
    }
  }, []);

  useEffect(() => {
    // Defer state update to avoid synchronous setState in effect
    const frame = requestAnimationFrame(() => {
      const docs = loadDocuments();
      setDocuments(docs);
      setLoading(false);
    });
    return () => cancelAnimationFrame(frame);
  }, [loadDocuments]);

  const handleCopyLink = async (doc: DocumentItem) => {
    const url = getDocumentUrl(doc.docId);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(doc.docId);
      setTimeout(() => setCopiedId(null), 2000);
      onCopyLink?.(doc.docId, url);
    } catch {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = url;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedId(doc.docId);
      setTimeout(() => setCopiedId(null), 2000);
      onCopyLink?.(doc.docId, url);
    }
  };

  const handleDelete = (docId: string) => {
    try {
      const stored = localStorage.getItem('securedoc_documents');
      if (stored) {
        const parsed: StoredDocument[] = JSON.parse(stored);
        const filtered = parsed.filter((doc) => doc.docId !== docId);
        localStorage.setItem('securedoc_documents', JSON.stringify(filtered));
        setDocuments((prev) => prev.filter((doc) => doc.docId !== docId));
      }
      setDeleteConfirmId(null);
      onDelete?.(docId);
    } catch {
      // Handle error silently
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <div className="flex items-center gap-3 text-[var(--text-muted)]">
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span style={{ fontFamily: 'DM Sans, sans-serif' }}>Loading documents...</span>
        </div>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center py-16 ${className}`}>
        <div className="w-16 h-16 mb-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] flex items-center justify-center">
          <svg className="w-8 h-8 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <h3
          className="text-lg font-semibold text-[var(--text-primary)] mb-2"
          style={{ fontFamily: 'DM Serif Display, serif' }}
        >
          No documents yet
        </h3>
        <p className="text-[var(--text-muted)] text-sm text-center max-w-xs" style={{ fontFamily: 'DM Sans, sans-serif' }}>
          Documents you create will appear here. Start by sharing your first secure document.
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {documents.map((doc) => (
        <div
          key={doc.docId}
          className="
            p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border)]
            hover:border-[var(--accent)]/30 transition-all duration-200
            group
          "
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4
                  className="text-[var(--text-primary)] font-medium truncate"
                  style={{ fontFamily: 'DM Serif Display, serif' }}
                >
                  {doc.title || 'Untitled Document'}
                </h4>
                {showStorageType && (
                  <span
                    className={`
                      px-2 py-0.5 text-xs rounded-full
                      ${doc.storageType === 'firebase'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      }
                    `}
                    style={{ fontFamily: 'DM Sans, sans-serif' }}
                  >
                    {doc.storageType === 'firebase' ? 'Cloud' : 'Local'}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[var(--text-muted)]" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                <span className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  {doc.owner || 'Unknown'}
                </span>
                <span className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  {formatDate(doc.createdAt)}
                </span>
                <span className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                  {doc.accessCount} {doc.accessCount === 1 ? 'view' : 'views'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopyLink(doc)}
                className="
                  p-2 rounded-lg text-[var(--text-muted)]
                  hover:text-[var(--text-primary)] hover:bg-white/5
                  transition-all duration-200
                "
                title="Copy link"
              >
                {copiedId === doc.docId ? (
                  <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                    />
                  </svg>
                )}
              </button>

              {deleteConfirmId === doc.docId ? (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleDelete(doc.docId)}
                    className="
                      px-2 py-1 rounded-lg text-xs font-medium
                      bg-red-500/10 text-red-400 border border-red-500/20
                      hover:bg-red-500/20 transition-all duration-200
                    "
                    style={{ fontFamily: 'DM Sans, sans-serif' }}
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(null)}
                    className="
                      px-2 py-1 rounded-lg text-xs font-medium
                      bg-white/5 text-[var(--text-muted)]
                      hover:bg-white/10 transition-all duration-200
                    "
                    style={{ fontFamily: 'DM Sans, sans-serif' }}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setDeleteConfirmId(doc.docId)}
                  className="
                    p-2 rounded-lg text-[var(--text-muted)]
                    hover:text-red-400 hover:bg-red-500/10
                    transition-all duration-200
                  "
                  title="Delete document"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export type { DocumentListProps, DocumentItem, StoredDocument };
