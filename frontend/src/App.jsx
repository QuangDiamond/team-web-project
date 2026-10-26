import { useEffect, useState } from 'react';
import api from './services/api';

function App() {
  const [status, setStatus] = useState('Checking backend and database...');

  useEffect(() => {
    api.get('/health')
      .then((response) => {
        const isDbConnected =
          response?.data?.databaseConnection === 'connected' ||
          response?.data?.database === 'connected' ||
          response?.databaseConnection === 'connected';
        setStatus(isDbConnected
          ? 'Backend + MongoDB connected'
          : 'Backend connected, MongoDB not connected');
      })
      .catch(() => setStatus('Backend unavailable'));
  }, []);

  return (
    <main className="container">
      <h1>Team Web Project</h1>
      <p>React + Express + MongoDB environment is ready.</p>
      <p className="status">{status}</p>
    </main>
  );
}

export default App;
