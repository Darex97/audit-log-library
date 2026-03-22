import type { AuditLogEntry, AuditLogOptions } from './types';

export class AuditLogStorage {
  private db: IDBDatabase | null = null;
  private dbName: string;
  private storeName: string;

  constructor(options?: AuditLogOptions) {
    this.dbName = options?.dbName || 'audit-log-db';
    this.storeName = options?.storeName || 'logs';
  }

  init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { autoIncrement: true });
        }
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve();
      };

      request.onerror = () => reject(request.error);
    });
  }

  log(entry: AuditLogEntry): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject('DB not initialized');
      const tx = this.db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      const logEntry = { ...entry, timestamp: Date.now() };
      store.add(logEntry);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  getAll(): Promise<AuditLogEntry[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject('DB not initialized');
      const tx = this.db.transaction(this.storeName, 'readonly');
      const store = tx.objectStore(this.storeName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  clearAll(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject('DB not initialized');
      const tx = this.db.transaction(this.storeName, 'readwrite');
      tx.objectStore(this.storeName).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  logRaw(entry: AuditLogEntry): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!this.db) return reject('DB not initialized');
    const tx = this.db.transaction(this.storeName, 'readwrite');
    tx.objectStore(this.storeName).add(entry);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
}