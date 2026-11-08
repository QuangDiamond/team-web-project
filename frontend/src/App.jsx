
import { useEffect, useState } from 'react';
import api from './services/api';

function App() {
  const [status, setStatus] = useState("Đang kiểm tra máy chủ và cơ sở dữ liệu...");

  useEffect(() => {
    api.get('/health')
      .then((response) => {
        setStatus(
          response.data?.databaseConnection === 'connected'
            ? "Đã kết nối máy chủ và MongoDB"
            : "Đã kết nối máy chủ, chưa kết nối MongoDB"
        );
      })
      .catch(() => setStatus("Không thể kết nối máy chủ"));
  }, []);

  return (
    <main className="container">
      <h1>TuConnector</h1>
      <p>Hệ thống đã sẵn sàng.</p>
      <p className="status">{status}</p>
    </main>
  );
}

export default App;
