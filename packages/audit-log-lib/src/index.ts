import { AuditLogStorage } from './storage';
import type { AuditLogEntry, AuditLogOptions } from './types';

export class AuditLog {
  private storage: AuditLogStorage;

  constructor(options?: AuditLogOptions) {
    this.storage = new AuditLogStorage(options);
    this.storage.init().catch(console.error);
  }

  log(action: string, payload: any) {
    this.storage.log({ action, payload }).catch(console.error);
  }

  async getLogs(): Promise<AuditLogEntry[]> {
    return this.storage.getAll();
  }
}