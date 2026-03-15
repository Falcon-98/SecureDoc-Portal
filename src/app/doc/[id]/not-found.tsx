import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-8">
      <div className="text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-[rgba(239,68,68,0.1)] flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#ef4444" className="w-10 h-10">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
        </div>
        <h1 className="font-[family-name:var(--font-dm-serif)] text-3xl text-[#e2e8f0] mb-4">
          Document Not Found
        </h1>
        <p className="text-[#94a3b8] mb-8 max-w-md">
          The document you&apos;re looking for doesn&apos;t exist or the link may have expired.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#3b82f6] to-[#6366f1] text-white font-semibold rounded-lg hover:opacity-90 transition-all"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Back to Home
        </Link>
      </div>
    </div>
  );
}
