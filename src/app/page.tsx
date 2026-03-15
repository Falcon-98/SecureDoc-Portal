'use client';

import { useState } from 'react';

export default function Home() {
  const [documentUrl, setDocumentUrl] = useState('');
  const [title, setTitle] = useState('');
  const [owner, setOwner] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ url: string; docId: string } | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/create-doc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentUrl,
          title: title || 'Confidential Document',
          owner: owner || 'Anonymous',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create secure document');
      }

      setResult({ url: data.url, docId: data.docId });
      setDocumentUrl('');
      setTitle('');
      setOwner('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (result?.url) {
      await navigator.clipboard.writeText(result.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="relative z-10 min-h-screen flex flex-col">
      {/* Header */}
      <header className="fade-in backdrop-blur-xl bg-[rgba(17,24,39,0.7)] border-b border-[rgba(59,130,246,0.12)] px-8 h-16 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="logo-icon">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="white" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
            </svg>
          </div>
          <span className="font-['DM_Serif_Display',serif] text-xl tracking-tight text-[#e2e8f0]">
            SecureDoc Portal
          </span>
        </div>
        <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest bg-[rgba(59,130,246,0.1)] border border-[rgba(59,130,246,0.25)] text-[#93c5fd]">
          <div className="w-1.5 h-1.5 rounded-full bg-[#3b82f6] badge-dot"></div>
          Secure
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-xl fade-in-delay">
          <div className="text-center mb-8">
            <h1 className="font-['DM_Serif_Display',serif] text-4xl mb-4 text-[#e2e8f0]">
              Secure Document Sharing
            </h1>
            <p className="text-[#94a3b8] text-lg">
              Create encrypted, view-only links for your confidential documents
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-[#1a2236] rounded-xl border border-[rgba(59,130,246,0.12)] p-8 shadow-[0_20px_60px_rgba(0,0,0,0.3)]">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Document URL Input */}
              <div>
                <label htmlFor="documentUrl" className="block text-sm font-medium text-[#94a3b8] mb-2">
                  Document URL *
                </label>
                <input
                  type="url"
                  id="documentUrl"
                  value={documentUrl}
                  onChange={(e) => setDocumentUrl(e.target.value)}
                  placeholder="https://docs.google.com/document/..."
                  required
                  className="w-full px-4 py-3 bg-[#0a0e17] border border-[rgba(59,130,246,0.2)] rounded-lg text-[#e2e8f0] placeholder-[#4b5563] focus:outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6] transition-all"
                />
              </div>

              {/* Title Input */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-[#94a3b8] mb-2">
                  Document Title
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Research Paper — Confidential"
                  className="w-full px-4 py-3 bg-[#0a0e17] border border-[rgba(59,130,246,0.2)] rounded-lg text-[#e2e8f0] placeholder-[#4b5563] focus:outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6] transition-all"
                />
              </div>

              {/* Owner Input */}
              <div>
                <label htmlFor="owner" className="block text-sm font-medium text-[#94a3b8] mb-2">
                  Owner Name
                </label>
                <input
                  type="text"
                  id="owner"
                  value={owner}
                  onChange={(e) => setOwner(e.target.value)}
                  placeholder="Your Name"
                  className="w-full px-4 py-3 bg-[#0a0e17] border border-[rgba(59,130,246,0.2)] rounded-lg text-[#e2e8f0] placeholder-[#4b5563] focus:outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6] transition-all"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-gradient-to-r from-[#3b82f6] to-[#6366f1] text-white font-semibold rounded-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="spinner w-5 h-5 border-2 border-white/30 border-t-white"></div>
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

            {/* Error Message */}
            {error && (
              <div className="mt-6 p-4 bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)] rounded-lg text-[#fca5a5] text-sm">
                {error}
              </div>
            )}

            {/* Success Result */}
            {result && (
              <div className="mt-6 p-4 bg-[rgba(34,197,94,0.1)] border border-[rgba(34,197,94,0.3)] rounded-lg">
                <div className="flex items-center gap-2 text-[#86efac] text-sm font-medium mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                  Secure Link Generated!
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={result.url}
                    className="flex-1 px-3 py-2 bg-[#0a0e17] border border-[rgba(59,130,246,0.2)] rounded text-[#e2e8f0] text-sm"
                  />
                  <button
                    onClick={copyToClipboard}
                    className="px-4 py-2 bg-[#3b82f6] text-white text-sm font-medium rounded hover:bg-[#2563eb] transition-colors"
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <a
                  href={result.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-3 text-[#93c5fd] text-sm hover:underline"
                >
                  Open in new tab
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                  </svg>
                </a>
              </div>
            )}
          </div>

          {/* Features */}
          <div className="mt-8 grid grid-cols-3 gap-4">
            <div className="text-center p-4">
              <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-[rgba(59,130,246,0.1)] flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#3b82f6" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                </svg>
              </div>
              <p className="text-xs text-[#94a3b8]">Copy Disabled</p>
            </div>
            <div className="text-center p-4">
              <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-[rgba(59,130,246,0.1)] flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#3b82f6" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
              </div>
              <p className="text-xs text-[#94a3b8]">Screenshot Protected</p>
            </div>
            <div className="text-center p-4">
              <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-[rgba(59,130,246,0.1)] flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#3b82f6" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18.75 12H5.25" />
                </svg>
              </div>
              <p className="text-xs text-[#94a3b8]">Print Blocked</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-8 py-4 border-t border-[rgba(59,130,246,0.12)] bg-[rgba(17,24,39,0.5)] flex items-center justify-between text-xs text-[#94a3b8]">
        <div className="flex items-center gap-1.5">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="#22c55e" className="w-3 h-3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
          </svg>
          End-to-end protected · AES-256 encrypted link
        </div>
        <span>© 2026 SecureDoc Portal. All rights reserved.</span>
      </footer>
    </div>
  );
}
