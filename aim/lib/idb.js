'use client';
// Tiny IndexedDB wrapper for local prototype persistence (Phase 1.1).
// Stores: 'agents' (locally-registered agents / passports when offline),
//         'kv' (misc key/value like last screen name).
const DB_NAME = 'aim-db';
const DB_VERSION = 1;

function openDB() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('agents')) {
        db.createObjectStore('agents', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('kv')) {
        db.createObjectStore('kv', { keyPath: 'key' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx(store, mode, fn) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const t = db.transaction(store, mode);
    const os = t.objectStore(store);
    const result = fn(os);
    t.oncomplete = () => resolve(result?.result ?? result);
    t.onerror = () => reject(t.error);
  });
}

export const idb = {
  async putAgent(agent) {
    try {
      return await tx('agents', 'readwrite', (os) => os.put(agent));
    } catch {
      return null;
    }
  },
  async getAllAgents() {
    try {
      return await tx('agents', 'readonly', (os) => os.getAll());
    } catch {
      return [];
    }
  },
  async setKV(key, value) {
    try {
      return await tx('kv', 'readwrite', (os) => os.put({ key, value }));
    } catch {
      return null;
    }
  },
  async getKV(key) {
    try {
      const rec = await tx('kv', 'readonly', (os) => os.get(key));
      return rec?.value ?? null;
    } catch {
      return null;
    }
  },
};
