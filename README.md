This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Features

- 🔐 **Encrypted document links** - URLs are encrypted using XOR cipher before storage
- 📄 **View-only access** - Documents are displayed in protected iframes
- 🚫 **Copy/screenshot protection** - Prevents easy copying of document content
- 💾 **Firebase + localStorage fallback** - Works with Firebase Firestore, falls back to localStorage if unavailable

## Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Firebase Setup

This app uses Firebase Firestore for document storage. To enable cross-device sharing:

### 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use an existing one
3. Navigate to **Firestore Database** and create a database

### 2. Configure Firestore Security Rules

In the Firebase Console, go to **Firestore Database → Rules** and set:

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /documents/{docId} {
      // Allow anyone to read and create documents
      allow read, create: if true;
      // Allow updates only for incrementing access count
      allow update: if request.resource.data.diff(resource.data).affectedKeys()
        .hasOnly(['accessCount']);
    }
  }
}
```

### 3. Update Firebase Configuration

Replace the Firebase config in `src/lib/firebase.ts` with your project's configuration:

```typescript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### LocalStorage Fallback

If Firebase is unavailable (network issues, permission errors, etc.), the app automatically falls back to localStorage. Documents stored in localStorage:
- ✅ Work immediately without Firebase setup
- ⚠️ Only accessible on the same device/browser
- ⚠️ Can be cleared if browser data is cleared

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deployment

This project is deployed to **GitHub Pages** using GitHub Actions (`.github/workflows/nextjs.yml`).

The workflow automatically builds and deploys the static export on every push to `main`.

### Setup

1. Go to your repository **Settings → Pages**
2. Under **Build and deployment**, select **GitHub Actions** as the source
3. Push to `main` to trigger the deployment

The app will be available at `https://<username>.github.io/SecureDoc-Portal/`.

### Local Production Build

To test the static export locally:

```bash
NEXT_PUBLIC_BASE_PATH=/SecureDoc-Portal npm run build
npx serve out
```
