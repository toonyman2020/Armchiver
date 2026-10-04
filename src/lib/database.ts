import { db, storage } from './firebase';
import { collection, addDoc, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth } from './firebase';

export interface Item {
  id?: string;
  name: string;
  description: string;
  type: 'image' | 'document';
  createdAt: Timestamp;
  originalPath: string;
  ownerId: string;
  storagePath: string;
}

export const addItem = async (item: Omit<Item, 'id' | 'createdAt' | 'ownerId' | 'storagePath'>, file: File) => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  const storageRef = ref(storage, `items/${user.uid}/${Date.now()}_${file.name}`);
  const snapshot = await uploadBytes(storageRef, file);
  const storagePath = snapshot.ref.fullPath;

  const docRef = await addDoc(collection(db, 'items'), {
    ...item,
    createdAt: Timestamp.now(),
    ownerId: user.uid,
    storagePath
  });
  return docRef.id;
};

export const getItems = async () => {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');
    
    const q = query(collection(db, 'items'), where('ownerId', '==', user.uid));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Item));
};
