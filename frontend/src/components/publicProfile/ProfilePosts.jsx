import { Link } from 'react-router-dom';
import SectionCard from '../common/SectionCard';
import Pagination from '../common/Pagination';
import { formatVnd } from '../../utils/formatCurrency';
import { getModeLabel } from '../../constants/requestLabels';

export default function ProfilePosts({ list, role, onPageChange, onApply, appliedIds }) {
  const isTutor = role === 'TUTOR';
  return (
    <SectionCard title={isTutor ? "Bài đăng và lịch dạy" : "Yêu cầu tìm gia sư đang mở"}>
      {list.items.length === 0 && <p className="item-meta">{isTutor ? "Chưa có bài đăng đã xuất bản." : "Hiện chưa có yêu cầu đang mở."}</p>}
      <ul className="public-profile-list">
        {list.items.map((item) => (
          <li key={item._id}>
            <h3>{item.title}</h3>
            <p className="item-meta">{item.subject_name} · {item.grade_level} · {getModeLabel(item.teaching_mode)}</p>
            <p className="public-profile-rate">{formatVnd(isTutor ? item.price : item.budget)} / buổi</p>
            <p className="public-profile-text">{item.description}</p>
            {item.schedule && <p className="item-meta">Lịch học: {item.schedule}</p>}
            {!isTutor && (
              <div className="public-profile-request-actions">
                <Link to={`/tutor/requests/${item._id}`} className="link">Xem yêu cầu</Link>
                {onApply && <button type="button" className="btn btn-primary btn-sm"
                  disabled={appliedIds.includes(item._id)} onClick={() => onApply(item)}>
                  {appliedIds.includes(item._id) ? "Đã ứng tuyển" : "Ứng tuyển"}
                </button>}
              </div>
            )}
          </li>
        ))}
      </ul>
      <Pagination pagination={list.pagination} onPageChange={onPageChange} label={isTutor ? "Phân trang bài đăng dạy học" : "Phân trang yêu cầu đang mở"} />
    </SectionCard>
  );
}
