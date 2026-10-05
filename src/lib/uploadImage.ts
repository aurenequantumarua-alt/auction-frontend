import { api } from '@/lib/api';

const USE_FIREBASE_STORAGE = import.meta.env.VITE_USE_FIREBASE_STORAGE === 'true';

/**
 * Uploads an image.
 *
 * Strategy:
 * - If VITE_USE_FIREBASE_STORAGE=true AND a Firebase Storage bucket has been
 *   created, uploads directly to Firebase Cloud Storage (permanent HTTPS CDN).
 * - Otherwise uploads via the backend /uploads/image endpoint. The backend
 *   already rewrites the URL to HTTPS when deployed on Render, avoiding
 *   mixed-content blocks on the Vercel frontend.
 */
export const uploadImage = async (file: File): Promise<string> => {
  if (USE_FIREBASE_STORAGE) {
    try {
      const { storage } = await import('@/lib/firebase');
      const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
      const ext = file.name.split('.').pop() || 'jpg';
      const filename = `auctions/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`;
      const storageRef = ref(storage, filename);
      const snapshot = await uploadBytes(storageRef, file, { contentType: file.type });
      return await getDownloadURL(snapshot.ref);
    } catch (firebaseErr) {
      console.warn(
        'Firebase Storage direct upload failed, falling back to backend:',
        firebaseErr,
      );
      // fall through to backend upload
    }
  }

  const fd = new FormData();
  fd.append('file', file);
  const { data } = await api.post<{ url: string; key: string }>('/uploads/image', fd);
  return data.url;
};
