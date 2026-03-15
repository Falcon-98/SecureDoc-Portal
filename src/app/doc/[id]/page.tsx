import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, updateDoc, increment } from 'firebase/firestore';
import { base64ToEncrypted, decryptUrl } from '@/lib/encryption';
import DocumentViewer from './DocumentViewer';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{ id: string }>;
}

interface DocumentData {
  docId: string;
  encryptedUrl: string;
  title: string;
  owner: string;
  createdAt: { seconds: number; nanoseconds: number } | null;
  accessCount: number;
}

async function getDocument(docId: string): Promise<DocumentData | null> {
  try {
    const documentsRef = collection(db, 'documents');
    const q = query(documentsRef, where('docId', '==', docId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    const docSnap = querySnapshot.docs[0];
    const data = docSnap.data() as DocumentData;

    // Update access count
    await updateDoc(docSnap.ref, {
      accessCount: increment(1)
    });

    return data;
  } catch (error) {
    console.error('Error fetching document:', error);
    return null;
  }
}

export default async function DocumentPage({ params }: PageProps) {
  const { id } = await params;
  const documentData = await getDocument(id);

  if (!documentData) {
    notFound();
  }

  // Decrypt the URL server-side and pass to client
  const encrypted = base64ToEncrypted(documentData.encryptedUrl);
  const documentUrl = decryptUrl(encrypted);

  return (
    <DocumentViewer
      documentUrl={documentUrl}
      title={documentData.title}
      owner={documentData.owner}
      docId={id}
    />
  );
}
