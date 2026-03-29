import { AuditLogStorage } from "./storage";
import type { AuditLogEntry, AuditLogOptions, LogLevel } from "./types";
import { pruneOldLogs, downloadLogs } from "./utils";
export { setupGlobalLogging } from "./logging";

export class AuditLog {
  private storage: AuditLogStorage;
  private maxDays: number;
  private maxEntries?: number;
  private onStorageFull?: (logs: AuditLogEntry[]) => Promise<void>;
  private pruneInterval: ReturnType<typeof setInterval>;

  constructor(options?: AuditLogOptions) {
    this.storage = new AuditLogStorage(options);
    this.maxDays = options?.maxDays ?? 30;
    this.maxEntries = options?.maxEntries;
    this.onStorageFull = options?.onStorageFull;
    this.storage.init().catch(console.error);
    this.pruneInterval = setInterval(() => this.pruneIfNeeded(), 24 * 60 * 60 * 1000);
  }

  private async pruneIfNeeded(): Promise<void> {
    const logs = await this.storage.getAll();
    const pruned = pruneOldLogs(logs, this.maxDays);
    if (pruned.length < logs.length) {
      await this.storage.clearAll();
      await Promise.all(pruned.map((entry) => this.storage.logRaw(entry)));
    }
  }

  async log(
    action: string,
    payload: any,
    level: LogLevel = "info",
    context?: any,
  ) {
    if (this.maxEntries !== undefined) {
      const logs = await this.storage.getAll();

      if (logs.length >= this.maxEntries) {
        if (this.onStorageFull) {
          await this.onStorageFull(logs);
        }
        await this.storage.clearAll();
      }
    }
    await this.storage.log({ action, payload, level, context });
  }

  destroy() {
    clearInterval(this.pruneInterval);
  }

  async getLogs(): Promise<AuditLogEntry[]> {
    let logs = await this.storage.getAll();
    return pruneOldLogs(logs, this.maxDays);
  }

  async downloadLogs(format: "json" | "excel" | "both" = "json") {
    const logs = await this.getLogs();
    await downloadLogs(logs, format);
  }

  async clearLogs() {
    await this.storage.clearAll();
  }
}
