import { useEffect } from 'react';
import { Link, useRouteError } from 'react-router-dom';
import { RotateCw, TriangleAlert } from 'lucide-react';
import '../../styles/routeError.css';

// Trang hiện khi một trang bị lỗi lúc chạy (errorElement của router), thay cho "Unexpected Application Error"
export default function RouteErrorPage() {
  const error = useRouteError();

  useEffect(() => {
    console.error('[RouteError]', error);
  }, [error]);

  let errorMessage = String(error);
  if (error instanceof Error) {
    errorMessage = error.message;
  }

  return (
    <main className="route-error" data-route-error>
      <div className="route-error-card">
        <span className="route-error-icon" aria-hidden="true">
          <TriangleAlert size={28} />
        </span>
        <h1>Trang gặp sự cố</h1>
        <p>Đã có lỗi khi hiển thị trang này. Bạn thử tải lại trang hoặc quay về trang chủ.</p>
        {import.meta.env.DEV && (
          <details className="route-error-details">
            <summary>Chi tiết lỗi (chỉ hiện khi phát triển)</summary>
            <pre>{errorMessage}</pre>
          </details>
        )}
        <div className="route-error-actions">
          <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>
            <RotateCw size={16} aria-hidden="true" />
            <span>Tải lại trang</span>
          </button>
          <Link to="/" className="btn btn-outline">Về trang chủ</Link>
        </div>
      </div>
    </main>
  );
}
