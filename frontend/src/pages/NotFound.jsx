import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="page not-found">
      <h1>404</h1>
      <h2>Không tìm thấy trang</h2>
      <p>Trang bạn tìm không tồn tại hoặc đã được chuyển đi.</p>
      <Link to="/" className="btn btn-primary">Về trang chủ</Link>
    </div>
  );
}