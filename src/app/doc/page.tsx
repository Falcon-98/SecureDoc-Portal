'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { getDocument } from '@/lib/storage';
import { base64ToEncrypted, decryptUrl } from '@/lib/encryption';
import DocumentViewer from './DocumentViewer';
import NotFoundView from './NotFoundView';

function DocumentLoader() {
  const searchParams = useSearchParams();
  const docId = searchParams.get('id');
  const [state, setState] = useState<'loading' | 'found' | 'not-found'>(docId ? 'loading' : 'not-found');
  const [documentData, setDocumentData] = useState<{ url: string; title: string; owner: string } | null>(null);

  useEffect(() => {
    if (!docId) {
      return;
    }

    async function fetchDocument() {
      // docId is guaranteed to be non-null here because of the early return above
      const id = docId as string;
      
      try {
        const doc = await getDocument(id);

        if (!doc) {
          setState('not-found');
          return;
        }

        // Decrypt the URL client-side
        const encrypted = base64ToEncrypted(doc.encryptedUrl);
        const documentUrl = decryptUrl(encrypted);

        setDocumentData({
          url: documentUrl,
          title: doc.title,
          owner: doc.owner,
        });
        setState('found');
      } catch (error) {
        console.error('Error fetching document:', error);
        setState('not-found');
      }
    }

    fetchDocument();
  }, [docId]);

  if (state === 'loading') {
    return (
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center">
        <div className="spinner"></div>
        <p className="mt-4 text-sm text-[#94a3b8]">Loading secure document…</p>
      </div>
    );
  }

  if (state === 'not-found' || !documentData) {
    return <NotFoundView />;
  }

  return (
    <DocumentViewer
      documentUrl={documentData.url}
      title={documentData.title}
      owner={documentData.owner}
    />
  );
}

export default function DocumentPage() {
  return (
    <Suspense
      fallback={
        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center">
          <div className="spinner"></div>
          <p className="mt-4 text-sm text-[#94a3b8]">Loading secure document…</p>
        </div>
      }
    >
      <DocumentLoader />
    </Suspense>
  );
}
