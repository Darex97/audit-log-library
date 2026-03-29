import './App.css';
import { useState, useEffect } from 'react';
import { AuditLog, setupGlobalLogging } from 'audit-log-lib';

const audit = new AuditLog({
  maxDays: 7,
  maxEntries: 55000,
  onStorageFull: async () => {
    await audit.downloadLogs('json');
  },
  onLog: async (entry) => {
    // Send each log to your backend as it's written
    await fetch('https://your-api.com/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry)
    });
  }
});
setupGlobalLogging(audit);

function App() {
  const [logs, setLogs] = useState<any[]>([]);

  const refreshLogs = async () => {
    const allLogs = await audit.getLogs();
    setLogs(allLogs);
  };

  useEffect(() => {
    refreshLogs();
    return () => audit.destroy();
  }, []);

  const handleClick = async (buttonName: string) => {
    await audit.log("CLICK", { button: buttonName });
    await refreshLogs();
  };

  const handleDownload = async () => {
    await audit.downloadLogs('both');
  };

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
      {logs.length === 0 ? (
        <p>No logs yet</p>
      ) : (
        <ul>
          {logs
            .slice()
            .reverse()
            .map((log, index) => (
              <li key={index}>
                [{new Date(log.timestamp).toLocaleTimeString()}] {log.action} - {JSON.stringify(log.payload)}
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}

export default App;