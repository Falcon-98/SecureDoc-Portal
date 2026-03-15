import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAQpphpubDRfDPj1A_X9dDZikeACry1yTs",
  authDomain: "doc-portal-5ed30.firebaseapp.com",
  projectId: "doc-portal-5ed30",
  storageBucket: "doc-portal-5ed30.firebasestorage.app",
  messagingSenderId: "256604042102",
  appId: "1:256604042102:web:3932a9e083b3e1a2c50057",
  measurementId: "G-23PR42T1X2"
};

// Initialize Firebase (prevent multiple initializations)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

export { app, db };
