import RequestBrowser from '../components/tutor/RequestBrowser';
import { useAuth } from '../hooks/useAuth';
import '../styles/tutorSearch.css';
import '../styles/tutorRequests.css';

// Trang công khai xem yêu cầu tìm gia sư. Chỉ gia sư được lưu / ứng tuyển; xem chi tiết cần đăng nhập
export default function RequestSearch() {
  const { user } = useAuth();
  let isTutor = false;
  if (user && user.role === 'TUTOR') {
    isTutor = true;
  }
  return (
    <div className="tutor-search-page">
      <header className="directory-hero">
        <h1>Yêu cầu tìm gia sư đang mở</h1>
        <p>Xem các yêu cầu phụ huynh vừa đăng theo môn học, trình độ, khu vực và ngân sách.</p>
      </header>
      <div className="directory-container"><RequestBrowser readOnly={!isTutor} /></div>
    </div>
  );
}
