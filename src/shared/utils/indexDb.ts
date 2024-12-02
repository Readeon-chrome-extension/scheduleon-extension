export interface FileData {
  id?: string; // ID received from API, undefined initially
  name: string;
  type: string;
  idMediaType: string;
  timestamp: number;
  data: ArrayBuffer; // Base64-encoded data
  media_type: 'image_data' | 'attachment_data'; // 'attachment_data' or 'image_data'
}

const DB_NAME = 'ScheduleonFileDataStore';
const DB_VERSION = 2;
const STORE_NAME = 'files';

let db: IDBDatabase | null = null;

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onerror = () => {
      reject(`Error opening DB: ${request.error}`);
    };

    request.onupgradeneeded = event => {
      const db = (event.target as IDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'idMediaType' }); // Use `idMediaType` as the unique key
      }
    };
  });
};

const getDB = async (): Promise<IDBDatabase> => {
  if (!db) await openDB();
  return db!;
};

// Add or update a file in IndexedDB
export const addOrUpdateFile = async (file: FileData): Promise<void> => {
  const db = await getDB();
  const transaction = db.transaction(STORE_NAME, 'readwrite');
  const store = transaction.objectStore(STORE_NAME);
  store.put(file); // Automatically overwrites if `idMediaType` matches
};

// Get all files from IndexedDB
export const getAllFiles = async (): Promise<FileData[]> => {
  const db = await getDB();
  const transaction = db.transaction(STORE_NAME, 'readonly');
  const store = transaction.objectStore(STORE_NAME);

  const request = store.getAll();
  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      const files = request.result as FileData[];
      // Sort files by timestamp to maintain insertion order
      files.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
      resolve(files);
    };
    request.onerror = () => reject(`Error fetching files: ${request.error}`);
  });
};

// Remove a file from IndexedDB by name
export const removeFileByName = async (idMediaType: string): Promise<void> => {
  const db = await getDB();
  const transaction = db.transaction(STORE_NAME, 'readwrite');
  const store = transaction.objectStore(STORE_NAME);

  store.delete(idMediaType);
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(`Error deleting file: ${transaction.error}`);
  });
};

// Update file `id` field using the name
export const updateFileId = async (name: string, id: string): Promise<void> => {
  const files = await getAllFiles();
  const file = files.find(file => file.name === name);

  if (file) {
    file.id = id; // Update the `id` field
    file.timestamp = Date.now();
    await addOrUpdateFile(file); // Save updated file back to the database
  }
};
// Clear all files from IndexedDB
export const clearFileData = async (): Promise<void> => {
  const db = await getDB();
  const transaction = db.transaction(STORE_NAME, 'readwrite');
  const store = transaction.objectStore(STORE_NAME);

  store.clear();

  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = event => reject((event.target as IDBTransaction).error);
  });
};

export const handleFileRemoval = async (id: string): Promise<void> => {
  const files = await getAllFiles();
  const fileToRemove = files.find(file => file.id === id);

  if (fileToRemove) {
    await removeFileByName(fileToRemove.idMediaType);
  }
};
