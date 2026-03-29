# audit-log-lib

A lightweight browser-based audit logging library with IndexedDB storage, Excel/JSON export, and global error capturing.

## Features

- Stores logs in IndexedDB (no server required)
- Automatic pruning of old logs by age
- Export logs as JSON, Excel (.xlsx), or both in a ZIP
- Excel rows color-coded by log level
- Captures `console.log`, `console.warn`, `console.error`, and unhandled errors automatically
- `onLog` hook — stream every log entry to a backend in real time
- `onStorageFull` callback — flush logs to a backend, database, or any external service when storage limit is reached

## Installation

```bash
npm install audit-log-lib
```

## Quick Start

```typescript
import { AuditLog, setupGlobalLogging } from 'audit-log-lib';

const audit = new AuditLog();

// Capture all console.log / console.warn / console.error automatically
setupGlobalLogging(audit);

// Log manually
await audit.log('user.login', { userId: 123 }, 'info');
await audit.log('payment.failed', { orderId: 456 }, 'error');
```

## API

### `new AuditLog(options?)`

All options are optional.

| Option | Type | Default | Description |
|---|---|---|---|
| `dbName` | `string` | `'audit-log-db'` | IndexedDB database name |
| `storeName` | `string` | `'logs'` | IndexedDB object store name |
| `maxDays` | `number` | `30` | Prune logs older than this many days (runs every 24 hours) |
| `maxEntries` | `number` | `undefined` | If set, triggers `onStorageFull` and clears storage when limit is reached. If not set, logs are never capped by count |
| `onStorageFull` | `(logs: AuditLogEntry[]) => Promise<void>` | `undefined` | Called before clearing storage when `maxEntries` is reached. Use this to flush logs to your backend before local storage is cleared |
| `onLog` | `(entry: AuditLogEntry) => Promise<void>` | `undefined` | Called after every log entry is written to IndexedDB. Use this to stream logs to a backend one by one in real time |

### `audit.log(action, payload, level?, context?)`

Writes a log entry to IndexedDB.

```typescript
await audit.log('user.login', { userId: 123 })                       // level defaults to 'info'
await audit.log('api.error', { status: 500 }, 'error')
await audit.log('form.submit', { form: 'checkout' }, 'info', { url: window.location.href })
```

| Parameter | Type | Default | Description |
|---|---|---|---|
| `action` | `string` | required | Short identifier for what happened |
| `payload` | `any` | required | Any data related to the action |
| `level` | `LogLevel` | `'info'` | One of `'info'`, `'warn'`, `'error'`, `'debug'` |
| `context` | `any` | `undefined` | Optional extra context (e.g. current URL, user session) |

### `audit.getLogs()`

Returns all logs from IndexedDB, filtered to exclude entries older than `maxDays`.

```typescript
const logs = await audit.getLogs();
```

### `audit.downloadLogs(format?)`

Downloads logs as a file.

```typescript
await audit.downloadLogs('json')    // audit-logs-<timestamp>.json
await audit.downloadLogs('excel')   // audit-logs-<timestamp>.xlsx
await audit.downloadLogs('both')    // audit-logs-<timestamp>.zip (contains both)
```

| Format | Default |
|---|---|
| `'json'` | ✅ |
| `'excel'` | |
| `'both'` | |

### `audit.clearLogs()`

Deletes all logs from IndexedDB.

```typescript
await audit.clearLogs();
```

### `audit.destroy()`

Clears the internal pruning interval. Call this when your app or component unmounts.

```typescript
audit.destroy();
```

### `setupGlobalLogging(audit)`

Patches `console.log`, `console.warn`, and `console.error` to automatically write to the audit log. Also captures `window.onerror` and `window.onunhandledrejection`.

```typescript
import { AuditLog, setupGlobalLogging } from 'audit-log-lib';

const audit = new AuditLog();
setupGlobalLogging(audit);

// From this point on, all console output and uncaught errors are logged automatically
console.log('hello');            // → level: info
console.warn('watch out');       // → level: warn
console.error('something broke') // → level: error
```

## Log Levels

| Level | Excel row color |
|---|---|
| `info` | Light blue |
| `warn` | Light amber |
| `error` | Light red |
| `debug` | Light green |

## Types

```typescript
type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface AuditLogEntry {
  action: string;
  payload: any;
  timestamp?: number;
  hash?: string;
  level?: LogLevel;
  context?: any;
}

interface AuditLogOptions {
  dbName?: string;
  storeName?: string;
  maxDays?: number;
  maxEntries?: number;
  onStorageFull?: (logs: AuditLogEntry[]) => Promise<void>;
  onLog?: (entry: AuditLogEntry) => Promise<void>;
}

type DownloadFormat = 'json' | 'excel' | 'both';
```

## Backend Integration

### Stream every log to a backend in real time (`onLog`)

Use `onLog` to send each log entry to your backend as soon as it is written. If the request fails, the error is silently caught so it never disrupts your app.

```typescript
const audit = new AuditLog({
  onLog: async (entry) => {
    await fetch('https://your-api.com/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry)
    });
  }
});
```

### Flush all logs when storage is full (`onStorageFull`)

Use `onStorageFull` to send all accumulated logs to your backend before local storage is cleared.

```typescript
const audit = new AuditLog({
  maxEntries: 10000,
  onStorageFull: async (logs) => {
    await fetch('https://your-api.com/api/logs/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(logs)
    });
  }
});
```

### Without a backend — download instead

```typescript
const audit = new AuditLog({
  maxEntries: 10000,
  onStorageFull: async () => {
    await audit.downloadLogs('json');
  }
});
```

### Using both hooks together

```typescript
const audit = new AuditLog({
  maxEntries: 10000,
  onLog: async (entry) => {
    // Real-time streaming to backend
    await fetch('https://your-api.com/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry)
    });
  },
  onStorageFull: async (logs) => {
    // Fallback bulk flush if real-time streaming fell behind
    await fetch('https://your-api.com/api/logs/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(logs)
    });
  }
});
```

## Browser Support

Requires IndexedDB support. Works in all modern browsers (Chrome, Firefox, Edge, Safari).

## License

Apache 2.0 — see [LICENSE](./LICENSE) for details.