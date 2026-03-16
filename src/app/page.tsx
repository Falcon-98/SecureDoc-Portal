'use client';

import { useState, useCallback } from 'react';
import { saveDocument } from '@/lib/storage';
import { encryptUrl, encryptedToBase64 } from '@/lib/encryption';
import { v4 as uuidv4 } from 'uuid';
import { ToastContainer } from '@/components/Toast';
import { Modal, ModalFooter } from '@/components/Modal';
import { QRCode } from '@/components/QRCode';
import { DocumentList } from '@/components/DocumentList';
import { useToast } from '@/hooks/useToast';

type TabType = 'create' | 'documents';

export default function Home() {
  const [documentUrl, setDocumentUrl] = useState('');
  const [title, setTitle] = useState('');
  const [owner, setOwner] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ url: string; docId: string; isLocal?: boolean } | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('create');
  const [showQRModal, setShowQRModal] = useState(false);
  const [documentListKey, setDocumentListKey] = useState(0);
  
  const { toasts, removeToast, success, error: showError, info } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setResult(null);

    try {
      // Validate URL format
      try {
        new URL(documentUrl);
      } catch {
        throw new Error('Please enter a valid URL (e.g., https://example.com/document)');
      }

      // Generate a unique ID for the document
      const docId = uuidv4().slice(0, 8);

      // Encrypt the document URL
      const encryptedUrlData = encryptUrl(documentUrl);
      const encryptedBase64 = encryptedToBase64(encryptedUrlData);

      // Store document using storage abstraction (Firebase with localStorage fallback)
      const saveResult = await saveDocument({
        docId,
        encryptedUrl: encryptedBase64,
        title: title || 'Confidential Document',
        owner: owner || 'Anonymous'
      });

      // Generate the secure link
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
      const newPageUrl = `${window.location.origin}${basePath}/doc/?id=${docId}`;

      setResult({ url: newPageUrl, docId, isLocal: saveResult.useLocalStorage });
      setDocumentUrl('');
      setTitle('');
      setOwner('');
      
      // Refresh document list
      setDocumentListKey(prev => prev + 1);
      
      // Show success toast
      if (saveResult.useLocalStorage) {
        info('Link created! Note: Using local storage - link works only on this device.');
      } else {
        success('Secure link created successfully! You can share it with anyone.');
      }
    } catch (err) {
      showError(err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = useCallback(async () => {
    if (result?.url) {
      try {
        await navigator.clipboard.writeText(result.url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        success('Link copied to clipboard!');
      } catch {
        showError('Failed to copy link. Please try again.');
      }
    }
  }, [result?.url, success, showError]);

  const handleDocumentCopy = useCallback((docId: string) => {
    success(`Link for document ${docId} copied!`);
  }, [success]);

  const handleDocumentDelete = useCallback((docId: string) => {
    info(`Document ${docId} deleted`);
  }, [info]);

  return (
    <div className="relative z-10 min-h-screen flex flex-col">
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} position="top-right" />

      {/* QR Code Modal */}
      {result && (
        <Modal
          isOpen={showQRModal}
          onClose={() => setShowQRModal(false)}
          title="Share via QR Code"
          size="sm"
        >
          <div className="flex flex-col items-center">
            <p className="text-[#94a3b8] text-sm mb-6 text-center">
              Scan this code with any device to access the secure document
            </p>
            <QRCode
              value={result.url}
              size={180}
              fgColor="#e2e8f0"
              bgColor="transparent"
              showDownload={true}
              showCopy={true}
            />
          </div>
          <ModalFooter>
            <button
              onClick={() => setShowQRModal(false)}
              className="px-4 py-2 bg-[#3b82f6] text-white text-sm font-medium rounded-lg hover:bg-[#2563eb] transition-colors"
            >
              Done
            </button>
          </ModalFooter>
        </Modal>
      )}

      {/* Header */}
      <header className="fade-in backdrop-blur-xl bg-[rgba(17,24,39,0.7)] border-b border-[rgba(59,130,246,0.12)] px-4 sm:px-8 h-16 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="logo-icon">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="white" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
            </svg>
          </div>
          <span className="font-['DM_Serif_Display',serif] text-lg sm:text-xl tracking-tight text-[#e2e8f0]">
            SecureDoc Portal
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest bg-[rgba(59,130,246,0.1)] border border-[rgba(59,130,246,0.25)] text-[#93c5fd]">
            <div className="w-1.5 h-1.5 rounded-full bg-[#3b82f6] badge-dot"></div>
            Secure
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 p-4 sm:p-8">
        <div className="max-w-4xl mx-auto fade-in-delay">
          {/* Hero Section */}
          <div className="text-center mb-8">
            <h1 className="font-['DM_Serif_Display',serif] text-3xl sm:text-4xl mb-4 text-[#e2e8f0]">
              Secure Document Sharing
            </h1>
            <p className="text-[#94a3b8] text-base sm:text-lg max-w-xl mx-auto">
              Create encrypted, view-only links for your confidential documents. 
              Protected from copying, screenshots, and printing.
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex p-1 bg-[#1a2236] rounded-xl border border-[rgba(59,130,246,0.12)]">
              <button
                onClick={() => setActiveTab('create')}
                className={`px-4 sm:px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'create'
                    ? 'bg-gradient-to-r from-[#3b82f6] to-[#6366f1] text-white shadow-lg'
                    : 'text-[#94a3b8] hover:text-[#e2e8f0] hover:bg-[rgba(59,130,246,0.1)]'
                }`}
              >
                <span className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Create Link
                </span>
              </button>
              <button
                onClick={() => setActiveTab('documents')}
                className={`px-4 sm:px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'documents'
                    ? 'bg-gradient-to-r from-[#3b82f6] to-[#6366f1] text-white shadow-lg'
                    : 'text-[#94a3b8] hover:text-[#e2e8f0] hover:bg-[rgba(59,130,246,0.1)]'
                }`}
              >
                <span className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                  </svg>
                  My Documents
                </span>
              </button>
            </div>
          </div>

          {/* Create Tab */}
          {activeTab === 'create' && (
            <div className="max-w-xl mx-auto">
              {/* Form Card */}
              <div className="bg-[#1a2236] rounded-xl border border-[rgba(59,130,246,0.12)] p-6 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.3)]">
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Document URL Input */}
                  <div>
                    <label htmlFor="documentUrl" className="flex items-center gap-2 text-sm font-medium text-[#94a3b8] mb-2">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
                      </svg>
                      Document URL <span className="text-[#ef4444]">*</span>
                    </label>
                    <input
                      type="url"
                      id="documentUrl"
                      value={documentUrl}
                      onChange={(e) => setDocumentUrl(e.target.value)}
                      placeholder="https://docs.google.com/document/..."
                      required
                      className="w-full px-4 py-3 bg-[#0a0e17] border border-[rgba(59,130,246,0.2)] rounded-lg text-[#e2e8f0] placeholder-[#4b5563] focus:outline-none focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/20 transition-all"
                    />
                    <p className="mt-1.5 text-xs text-[#64748b]">
                      Paste the URL of your Google Doc, PDF, or any embeddable document
                    </p>
                  </div>

                  {/* Title Input */}
                  <div>
                    <label htmlFor="title" className="flex items-center gap-2 text-sm font-medium text-[#94a3b8] mb-2">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                      </svg>
                      Document Title
                    </label>
                    <input
                      type="text"
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Research Paper — Confidential"
                      className="w-full px-4 py-3 bg-[#0a0e17] border border-[rgba(59,130,246,0.2)] rounded-lg text-[#e2e8f0] placeholder-[#4b5563] focus:outline-none focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/20 transition-all"
                    />
                  </div>

                  {/* Owner Input */}
                  <div>
                    <label htmlFor="owner" className="flex items-center gap-2 text-sm font-medium text-[#94a3b8] mb-2">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                      </svg>
                      Owner Name
                    </label>
                    <input
                      type="text"
                      id="owner"
                      value={owner}
                      onChange={(e) => setOwner(e.target.value)}
                      placeholder="Your Name"
                      className="w-full px-4 py-3 bg-[#0a0e17] border border-[rgba(59,130,246,0.2)] rounded-lg text-[#e2e8f0] placeholder-[#4b5563] focus:outline-none focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/20 transition-all"
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 bg-gradient-to-r from-[#3b82f6] to-[#6366f1] text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-blue-500/25 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <div className="spinner w-5 h-5 border-2 border-white/30 border-t-white rounded-full"></div>
                        Generating Secure Link...
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                        </svg>
                        Generate Secure Link
                      </>
                    )}
                  </button>
                </form>

                {/* Success Result */}
                {result && (
                  <div className="mt-6 p-5 bg-[rgba(34,197,94,0.08)] border border-[rgba(34,197,94,0.2)] rounded-xl animate-fadeIn">
                    <div className="flex items-center gap-2 text-[#86efac] text-sm font-medium mb-3">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                      </svg>
                      Secure Link Generated!
                    </div>
                    {result.isLocal && (
                      <div className="mb-4 p-3 bg-[rgba(250,204,21,0.08)] border border-[rgba(250,204,21,0.2)] rounded-lg flex items-start gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="#fef08a" className="w-4 h-4 mt-0.5 flex-shrink-0">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                        </svg>
                        <div className="text-[#fef08a] text-xs">
                          <strong>Local Storage Mode:</strong> This link works only on this device. 
                          Configure Firebase for cross-device access.
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-2 mb-3">
                      <input
                        type="text"
                        readOnly
                        value={result.url}
                        className="flex-1 px-3 py-2.5 bg-[#0a0e17] border border-[rgba(59,130,246,0.2)] rounded-lg text-[#e2e8f0] text-sm font-mono"
                      />
                      <button
                        onClick={copyToClipboard}
                        className="px-4 py-2.5 bg-[#3b82f6] text-white text-sm font-medium rounded-lg hover:bg-[#2563eb] transition-colors flex items-center gap-1.5"
                      >
                        {copied ? (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                            </svg>
                            Copied!
                          </>
                        ) : (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
                            </svg>
                            Copy
                          </>
                        )}
                      </button>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <a
                        href={result.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-[#93c5fd] text-sm hover:text-[#bfdbfe] transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                        </svg>
                        Open in new tab
                      </a>
                      <button
                        onClick={() => setShowQRModal(true)}
                        className="inline-flex items-center gap-1.5 text-[#93c5fd] text-sm hover:text-[#bfdbfe] transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5ZM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 13.5 9.375v-4.5Z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75ZM6.75 16.5h.75v.75h-.75v-.75ZM16.5 6.75h.75v.75h-.75v-.75ZM13.5 13.5h.75v.75h-.75v-.75ZM13.5 19.5h.75v.75h-.75v-.75ZM19.5 13.5h.75v.75h-.75v-.75ZM19.5 19.5h.75v.75h-.75v-.75ZM16.5 16.5h.75v.75h-.75v-.75Z" />
                        </svg>
                        Show QR Code
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Features Grid */}
              <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-[#1a2236]/50 rounded-xl border border-[rgba(59,130,246,0.08)] p-4 text-center hover:border-[rgba(59,130,246,0.2)] transition-colors">
                  <div className="w-10 h-10 mx-auto mb-3 rounded-xl bg-gradient-to-br from-[#3b82f6]/20 to-[#6366f1]/20 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#3b82f6" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                    </svg>
                  </div>
                  <p className="text-xs text-[#94a3b8] font-medium">Copy Disabled</p>
                </div>
                <div className="bg-[#1a2236]/50 rounded-xl border border-[rgba(59,130,246,0.08)] p-4 text-center hover:border-[rgba(59,130,246,0.2)] transition-colors">
                  <div className="w-10 h-10 mx-auto mb-3 rounded-xl bg-gradient-to-br from-[#3b82f6]/20 to-[#6366f1]/20 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#3b82f6" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  </div>
                  <p className="text-xs text-[#94a3b8] font-medium">Screenshot Protected</p>
                </div>
                <div className="bg-[#1a2236]/50 rounded-xl border border-[rgba(59,130,246,0.08)] p-4 text-center hover:border-[rgba(59,130,246,0.2)] transition-colors">
                  <div className="w-10 h-10 mx-auto mb-3 rounded-xl bg-gradient-to-br from-[#3b82f6]/20 to-[#6366f1]/20 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#3b82f6" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18.75 12H5.25" />
                    </svg>
                  </div>
                  <p className="text-xs text-[#94a3b8] font-medium">Print Blocked</p>
                </div>
                <div className="bg-[#1a2236]/50 rounded-xl border border-[rgba(59,130,246,0.08)] p-4 text-center hover:border-[rgba(59,130,246,0.2)] transition-colors">
                  <div className="w-10 h-10 mx-auto mb-3 rounded-xl bg-gradient-to-br from-[#3b82f6]/20 to-[#6366f1]/20 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#3b82f6" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                    </svg>
                  </div>
                  <p className="text-xs text-[#94a3b8] font-medium">Encrypted Links</p>
                </div>
              </div>
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <div className="max-w-2xl mx-auto">
              <div className="bg-[#1a2236] rounded-xl border border-[rgba(59,130,246,0.12)] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.3)]">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-['DM_Serif_Display',serif] text-xl text-[#e2e8f0]">
                    My Documents
                  </h2>
                  <button
                    onClick={() => setActiveTab('create')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[#93c5fd] hover:text-[#bfdbfe] bg-[rgba(59,130,246,0.1)] hover:bg-[rgba(59,130,246,0.15)] border border-[rgba(59,130,246,0.2)] rounded-lg transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    New
                  </button>
                </div>
                <DocumentList
                  key={documentListKey}
                  onCopyLink={handleDocumentCopy}
                  onDelete={handleDocumentDelete}
                  showStorageType={true}
                />
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="px-4 sm:px-8 py-4 border-t border-[rgba(59,130,246,0.12)] bg-[rgba(17,24,39,0.5)]">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#94a3b8]">
          <div className="flex items-center gap-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="#22c55e" className="w-3 h-3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
            </svg>
            <span>End-to-end protected · Encrypted links</span>
          </div>
          <span>© 2026 SecureDoc Portal. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
