import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import type { AuditLogEntry, DownloadFormat } from './types';
import ExcelJS from 'exceljs';

// prune logs older than maxDays
export function pruneOldLogs(logs: AuditLogEntry[], maxDays: number): AuditLogEntry[] {
  const cutoff = Date.now() - maxDays * 24 * 60 * 60 * 1000;
  return logs.filter(log => log.timestamp! >= cutoff);
}

function formatTimestamp(ts?: number | string) {
  const date = ts ? new Date(ts) : new Date(); // fallback na sada
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
         `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}


// download logs as ZIP
export async function downloadLogs(
  logs: AuditLogEntry[],
  format: DownloadFormat = 'json'
) {
  const timestamp = new Date().toISOString();

  // Mapiranje logova da timestamp bude čitljiv
  const readableLogs = logs.map(log => ({
    ...log,
    timestamp: formatTimestamp(log.timestamp)
  }));

  if (format === 'json') {
    const blob = new Blob([JSON.stringify(readableLogs, null, 2)], { type: 'application/json' });
    saveAs(blob, `audit-logs-${timestamp}.json`);

  } else if (format === 'excel') {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Logs');
    sheet.columns = Object.keys(readableLogs[0] || {}).map(key => ({ header: key, key }));
    readableLogs.forEach(log => sheet.addRow(log));

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `audit-logs-${timestamp}.xlsx`);

  } else if (format === 'both') {
    const zip = new JSZip();
    zip.file('audit-logs.json', JSON.stringify(readableLogs, null, 2));

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Logs');
    sheet.columns = Object.keys(readableLogs[0] || {}).map(key => ({ header: key, key }));
    readableLogs.forEach(log => sheet.addRow(log));

    const excelBuffer = await workbook.xlsx.writeBuffer();
    zip.file(`audit-logs.xlsx`, excelBuffer);

    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, `audit-logs-${timestamp}.zip`);
  }
}

// check if storage limit exceeded
export async function checkStorageLimit(logs: AuditLogEntry[], maxEntries: number) {
  if (logs.length >= maxEntries) {
    if (confirm("Audit logs are full. Do you want to download and clear them?")) {
      await downloadLogs(logs);
      return true; // treba obrisati logove
    }
  }
  return false;
}