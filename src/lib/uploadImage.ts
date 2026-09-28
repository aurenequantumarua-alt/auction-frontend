import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { api } from '@/lib/api';

/**
 * Uploads an image.
 * Prefers Firebase Cloud Storage so images are stored permanently on HTTPS CDN,
 * avoiding mixed-content (HTTP vs HTTPS) blocks on Vercel and ephemeral disk wipes on Render.
 * Falls back to the backend /uploads/image endpoint if Firebase Storage is unconfigured or blocked.
 */
export const uploadImage = async (file: File): Promise<string> => {
  try {
    const ext = file.name.split('.').pop() || 'jpg';
    const filename = `auctions/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`;
    const storageRef = ref(storage, filename);
    const snapshot = await uploadBytes(storageRef, file, { contentType: file.type });
    const downloadUrl = await getDownloadURL(snapshot.ref);
    return downloadUrl;
  } catch (firebaseErr) {
    console.warn('Firebase Storage direct upload not available, falling back to backend storage:', firebaseErr);
    const fd = new FormData();
    fd.append('file', file);
    const { data } = await api.post<{ url: string; key: string }>('/uploads/image', fd);
    return data.url;
  }
};
