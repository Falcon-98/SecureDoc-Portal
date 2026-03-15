'use client';

import { db } from './firebase';
import { collection, addDoc, query, where, getDocs, updateDoc, increment, serverTimestamp, Timestamp } from 'firebase/firestore';

const LOCAL_STORAGE_KEY = 'securedoc_documents';

interface StoredDocument {
  docId: string;
  encryptedUrl: string;
  title: string;
  owner: string;
  createdAt: Date;
  accessCount: number;
}

interface LocalDocument extends Omit<StoredDocument, 'createdAt'> {
  createdAt: string;
}

/**
 * Get all documents from localStorage
 */
function getLocalDocuments(): LocalDocument[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Save documents to localStorage
 */
function saveLocalDocuments(documents: LocalDocument[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(documents));
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
}

/**
 * Save a document - tries Firebase first, falls back to localStorage
 */
export async function saveDocument(data: {
  docId: string;
  encryptedUrl: string;
  title: string;
  owner: string;
}): Promise<{ success: boolean; useLocalStorage: boolean }> {
  // Try Firebase first with a timeout
  try {
    const firebasePromise = addDoc(collection(db, 'documents'), {
      docId: data.docId,
      encryptedUrl: data.encryptedUrl,
      title: data.title,
      owner: data.owner,
      createdAt: serverTimestamp(),
      accessCount: 0
    });

    // Set a 10-second timeout for Firebase
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Firebase timeout')), 10000);
    });

    await Promise.race([firebasePromise, timeoutPromise]);
    return { success: true, useLocalStorage: false };
  } catch (error) {
    console.warn('Firebase save failed, using localStorage:', error);
    
    // Fallback to localStorage
    try {
      const documents = getLocalDocuments();
      documents.push({
        docId: data.docId,
        encryptedUrl: data.encryptedUrl,
        title: data.title,
        owner: data.owner,
        createdAt: new Date().toISOString(),
        accessCount: 0
      });
      saveLocalDocuments(documents);
      return { success: true, useLocalStorage: true };
    } catch (localError) {
      console.error('localStorage save also failed:', localError);
      throw new Error('Failed to save document. Please try again.');
    }
  }
}

/**
 * Get a document by ID - tries Firebase first, falls back to localStorage
 */
export async function getDocument(docId: string): Promise<StoredDocument | null> {
  // Try Firebase first with a timeout
  try {
    const documentsRef = collection(db, 'documents');
    const q = query(documentsRef, where('docId', '==', docId));
    
    const firebasePromise = getDocs(q);
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Firebase timeout')), 10000);
    });

    const querySnapshot = await Promise.race([firebasePromise, timeoutPromise]);

    if (!querySnapshot.empty) {
      const docSnap = querySnapshot.docs[0];
      const data = docSnap.data();

      // Update access count (don't await - fire and forget)
      updateDoc(docSnap.ref, {
        accessCount: increment(1)
      }).catch(console.warn);

      return {
        docId: data.docId,
        encryptedUrl: data.encryptedUrl,
        title: data.title,
        owner: data.owner,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
        accessCount: data.accessCount || 0
      };
    }
  } catch (error) {
    console.warn('Firebase read failed, trying localStorage:', error);
  }

  // Fallback to localStorage
  try {
    const documents = getLocalDocuments();
    const localDoc = documents.find(doc => doc.docId === docId);
    
    if (localDoc) {
      // Update access count in localStorage
      localDoc.accessCount = (localDoc.accessCount || 0) + 1;
      saveLocalDocuments(documents);
      
      return {
        docId: localDoc.docId,
        encryptedUrl: localDoc.encryptedUrl,
        title: localDoc.title,
        owner: localDoc.owner,
        createdAt: new Date(localDoc.createdAt),
        accessCount: localDoc.accessCount
      };
    }
  } catch (localError) {
    console.error('localStorage read also failed:', localError);
  }

  return null;
}
