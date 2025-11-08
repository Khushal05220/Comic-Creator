import { ImageData } from '../types';

const DB_NAME = 'ComicCreatorDB';
const DB_VERSION = 1;
const STORE_NAME = 'images';

let db: IDBDatabase;

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (db) {
      return resolve(db);
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('IndexedDB error:', request.error);
      reject('IndexedDB error');
    };

    request.onsuccess = (event) => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
};

export const saveImage = async (imageData: ImageData): Promise<string> => {
  const db = await initDB();
  const transaction = db.transaction(STORE_NAME, 'readwrite');
  const store = transaction.objectStore(STORE_NAME);
  const id = `img_${Date.now()}_${Math.random()}`;
  
  return new Promise((resolve, reject) => {
    const request = store.put({ id, ...imageData });
    request.onerror = () => {
      console.error('Error saving image to IndexedDB:', request.error);
      reject(request.error);
    };
    request.onsuccess = () => {
      resolve(id);
    };
  });
};

export const getImage = async (id: string): Promise<ImageData | null> => {
  const db = await initDB();
  const transaction = db.transaction(STORE_NAME, 'readonly');
  const store = transaction.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    const request = store.get(id);
    request.onerror = () => {
      console.error('Error fetching image from IndexedDB:', request.error);
      reject(request.error);
    };
    request.onsuccess = () => {
      if (request.result) {
        resolve({ base64: request.result.base64, mimeType: request.result.mimeType });
      } else {
        resolve(null);
      }
    };
  });
};
