import './App.css';
import { useState, useEffect } from 'react';
import { AuditLog } from 'audit-log-lib';

const audit = new AuditLog();

function App() {
  const [logs, setLogs] = useState<any[]>([]);

  // učitaj logove pri startu
  useEffect(() => {
    audit.getLogs().then(setLogs);
  }, []);

  // funkcija za log dugme
  const handleClick = (buttonName: string) => {
    audit.log("CLICK", { button: buttonName });
    // osveži lokalno stanje da vidimo odmah
    audit.getLogs().then(setLogs);
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>AuditLog Demo</h1>

      <div style={{ marginBottom: '1rem' }}>
        <button onClick={() => handleClick('submit')} style={{ marginRight: '1rem' }}>
          Submit
        </button>
        <button onClick={() => handleClick('cancel')}>
          Cancel
        </button>
      </div>

      <h2>Logs:</h2>
      {logs.length === 0 ? (
        <p>No logs yet</p>
      ) : (
        <ul>
          {logs.map((log) => (
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