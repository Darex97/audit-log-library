import './App.css';
import { useState, useEffect } from 'react';
import { AuditLog, setupGlobalLogging } from 'audit-log-lib';

const audit = new AuditLog({ maxDays: 7, maxEntries: 55000, onStorageFull: async () => {
    // Auto-download before clearing
    await audit.downloadLogs('json');
  } });
setupGlobalLogging(audit);

function App() {
  const [logs, setLogs] = useState<any[]>([]);

  // učitaj logove pri startu
  const refreshLogs = async () => {
    const allLogs = await audit.getLogs();
    setLogs(allLogs);
  };

  useEffect(() => {
    refreshLogs();
  }, []);

  // funkcija za log dugme
  const handleClick = async (buttonName: string) => {
    await audit.log("CLICK", { button: buttonName });
    await refreshLogs();
  };

  // dugme za download logova
  const handleDownload = async () => {
    await audit.downloadLogs('both');
  };

  // dugme za clear logova
  const handleClear = async () => {
    await audit.clearLogs();
    await refreshLogs();
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>AuditLog Demo</h1>

      <div style={{ marginBottom: '1rem' }}>
        <button onClick={() => handleClick('submit')} style={{ marginRight: '1rem' }}>
          Submit
        </button>
        <button onClick={() => handleClick('cancel')} style={{ marginRight: '1rem' }}>
          Cancel
        </button>
        <button onClick={handleDownload} style={{ marginRight: '1rem' }}>
          Download Logs (ZIP)
        </button>
        <button onClick={handleClear}>
          Clear Logs
        </button>
      </div>

      <h2>Logs (latest first):</h2>
      {logs.length === 0  ? (
        <p>No logs yet</p>
      ) : (
        <ul>
          {logs
            .slice()
            .reverse()
            .map((log) => (
              <li key={log.timestamp}>
                [{new Date(log.timestamp).toLocaleTimeString()}] {log.action} - {JSON.stringify(log.payload)}
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}

export default App;