import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import type { AuditLogEntry, DownloadFormat, ReadableLogEntry } from './types';
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

async function buildExcelBuffer(logs: ReadableLogEntry[]): Promise<ExcelJS.Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Logs');

  sheet.columns = Object.keys(logs[0]).map(key => ({ header: key, key }));

  // Auto-fit column width to content
sheet.columns.forEach(column => {
  let maxLength = column.header ? column.header.length * 6 : 10;
  sheet.getColumn(column.key!).eachCell({ includeEmpty: false }, cell => {
    const cellLength = cell.value ? cell.value.toString().length : 0;
    if (cellLength > maxLength) maxLength = cellLength;
  });
  column.width = maxLength + 4; // +4 for padding
});


  // Style the header row
  sheet.getRow(1).eachCell(cell => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2C2C2A' } };
  });

  const levelColors: Record<string, { bg: string; font: string }> = {
    info:  { bg: 'FFE6F1FB', font: 'FF0C447C' },
    warn:  { bg: 'FFFAEEDA', font: 'FF633806' },
    error: { bg: 'FFFCEBEB', font: 'FF791F1F' },
    debug: { bg: 'FFE1F5EE', font: 'FF085041' },
  };

  logs.forEach(log => {
    const row = sheet.addRow(log);
    const colors = levelColors[log.level ?? 'info'];

    row.eachCell(cell => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.bg } };
      cell.font = { color: { argb: colors.font } };
    });
  });

  return workbook.xlsx.writeBuffer();
}

function toReadable(log: AuditLogEntry): ReadableLogEntry {
  return { ...log, timestamp: formatTimestamp(log.timestamp) };
}

// download logs as ZIP
export async function downloadLogs(
  logs: AuditLogEntry[],
  format: DownloadFormat = 'json'
) {
  const timestamp = new Date().toISOString();

  const readableLogs: ReadableLogEntry[] = logs.map(toReadable);

  if (readableLogs.length === 0) return;

  if (format === 'json') {
    const blob = new Blob([JSON.stringify(readableLogs, null, 2)], { type: 'application/json' });
    saveAs(blob, `audit-logs-${timestamp}.json`);

  } else if (format === 'excel') {
    const buffer = await buildExcelBuffer(readableLogs);
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `audit-logs-${timestamp}.xlsx`);

  } else if (format === 'both') {
    const zip = new JSZip();
    zip.file('audit-logs.json', JSON.stringify(readableLogs, null, 2));
    zip.file('audit-logs.xlsx', await buildExcelBuffer(readableLogs));
    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, `audit-logs-${timestamp}.zip`);
  }
}
