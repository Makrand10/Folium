// src/lib/idb.ts
// Minimal, dependency-free IndexedDB helpers (promise-based)

export type IDBValue = Blob | ArrayBuffer | string | number | boolean | object | null;

const DB_NAME = "epubCache";
const DB_VERSION = 1;
const STORE_FILES = "files";
const STORE_META = "meta";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_FILES)) db.createObjectStore(STORE_FILES);
      if (!db.objectStoreNames.contains(STORE_META)) db.createObjectStore(STORE_META);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// Force tx to always return Promise<void>
async function tx(store: string, mode: IDBTransactionMode, op: (s: IDBObjectStore) => void): Promise<void> {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const t = db.transaction(store, mode);
    const s = t.objectStore(store);
    try {
      op(s);
    } catch (e) {
      reject(e);
      return;
    }
    t.oncomplete = () => resolve();
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
  });
}

export async function idbGet<T = unknown>(store: "files" | "meta", key: string): Promise<T | undefined> {
  const storeName = store === "files" ? STORE_FILES : STORE_META;
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const t = db.transaction(storeName, "readonly");
    const s = t.objectStore(storeName);
    const req = s.get(key);
    req.onsuccess = () => resolve(req.result as T | undefined);
    req.onerror = () => reject(req.error);
  });
}

export async function idbSet(store: "files" | "meta", key: string, value: IDBValue): Promise<void> {
  const storeName = store === "files" ? STORE_FILES : STORE_META;
  return tx(storeName, "readwrite", (s) => {
    s.put(value as any, key);
  });
}

export async function idbDel(store: "files" | "meta", key: string): Promise<void> {
  const storeName = store === "files" ? STORE_FILES : STORE_META;
  return tx(storeName, "readwrite", (s) => {
    s.delete(key);
  });
}
