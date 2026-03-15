'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, updateDoc, increment } from 'firebase/firestore';
import { base64ToEncrypted, decryptUrl } from '@/lib/encryption';
import DocumentViewer from './DocumentViewer';
import NotFoundView from './NotFoundView';

interface DocumentData {
  encryptedUrl: string;
  title: string;
  owner: string;
}

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
      try {
        const documentsRef = collection(db, 'documents');
        const q = query(documentsRef, where('docId', '==', docId));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          setState('not-found');
          return;
        }

        const docSnap = querySnapshot.docs[0];
        const data = docSnap.data() as DocumentData;

        // Update access count
        await updateDoc(docSnap.ref, {
          accessCount: increment(1)
        });

        // Decrypt the URL client-side
        const encrypted = base64ToEncrypted(data.encryptedUrl);
        const documentUrl = decryptUrl(encrypted);

        setDocumentData({
          url: documentUrl,
          title: data.title,
          owner: data.owner,
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
