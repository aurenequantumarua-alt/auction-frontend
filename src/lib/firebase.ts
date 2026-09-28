import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "REDACTED_FIREBASE_KEY",
  authDomain: "REDACTED_PROJECT.firebaseapp.com",
  projectId: "REDACTED_PROJECT",
  storageBucket: "REDACTED_PROJECT.firebasestorage.app",
  messagingSenderId: "REDACTED",
  appId: "1:REDACTED:web:ae26bfb190d1d2763631e4",
  measurementId: "REDACTED"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const storage = getStorage(app);
