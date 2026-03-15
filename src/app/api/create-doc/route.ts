import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { encryptUrl, encryptedToBase64 } from '@/lib/encryption';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const { documentUrl, title, owner } = await request.json();

    if (!documentUrl) {
      return NextResponse.json({ error: 'Document URL is required' }, { status: 400 });
    }

    // Validate URL format
    try {
      new URL(documentUrl);
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    // Generate a unique ID for the document
    const docId = uuidv4().slice(0, 8);

    // Encrypt the document URL
    const encryptedUrl = encryptUrl(documentUrl);
    const encryptedBase64 = encryptedToBase64(encryptedUrl);

    // Store in Firebase
    await addDoc(collection(db, 'documents'), {
      docId,
      encryptedUrl: encryptedBase64,
      title: title || 'Confidential Document',
      owner: owner || 'Anonymous',
      createdAt: serverTimestamp(),
      accessCount: 0
    });

    // Return the generated URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.headers.get('origin') || 'http://localhost:3000';
    const newPageUrl = `${baseUrl}/doc/${docId}`;

    return NextResponse.json({
      success: true,
      docId,
      url: newPageUrl
    });
  } catch (error) {
    console.error('Error creating document:', error);
    return NextResponse.json({ error: 'Failed to create document' }, { status: 500 });
  }
}
