import { Link } from 'react-router-dom';
import { BookOpen, CalendarDays, GraduationCap, Monitor } from 'lucide-react';
import SectionCard from '../common/SectionCard';
import Pagination from '../common/Pagination';
import ReportContentButton from '../common/ReportContentButton';
import { formatVnd } from '../../utils/formatCurrency';
import { getModeLabel } from '../../constants/requestLabels';

// canReport: người xem được báo cáo nội dung (phụ huynh xem bài đăng gia sư, gia sư xem yêu cầu của phụ huynh)
export default function ProfilePosts({ list, role, onPageChange, onApply, appliedIds, canReport = false, onReported }) {
  const isTutor = role === 'TUTOR';
  let reportTargetType = 'REQUEST';
  if (isTutor) {
    reportTargetType = 'POST';
  }
  return (
    <SectionCard title={isTutor ? "Bài đăng và lịch dạy" : "Yêu cầu tìm gia sư đang mở"}>
      {list.items.length === 0 && <p className="item-meta">{isTutor ? "Chưa có bài đăng đã xuất bản." : "Hiện chưa có yêu cầu đang mở."}</p>}
      <ul className="public-profile-list">
        {list.items.map((item) => (
          <li key={item._id}>
            <div className="public-profile-post-heading">
              <h3>{item.title}</h3>
              <p className="public-profile-rate">{formatVnd(isTutor ? item.price : item.budget)}<span> / buổi</span></p>
            </div>
            <ul className="public-profile-post-tags" aria-label="Thông tin học tập">
              <li><BookOpen size={14} aria-hidden="true" />{item.subject_name}</li>
              <li><GraduationCap size={14} aria-hidden="true" />{item.grade_level}</li>
              <li><Monitor size={14} aria-hidden="true" />{getModeLabel(item.teaching_mode)}</li>
            </ul>
            <p className="public-profile-text">{item.description}</p>
            {item.schedule && <p className="public-profile-post-schedule"><CalendarDays size={16} aria-hidden="true" /><span>Lịch học: {item.schedule}</span></p>}
            {isTutor && canReport && (
              <div className="public-profile-report-row">
                <ReportContentButton targetType={reportTargetType} targetId={item._id} targetTitle={item.title} onReported={onReported} />
              </div>
            )}
            {!isTutor && (
              <div className="public-profile-request-actions">
                <Link to={`/tutor/requests/${item._id}`} className="btn btn-outline btn-sm">Xem yêu cầu</Link>
                {onApply && <button type="button" className="btn btn-primary btn-sm"
                  disabled={appliedIds.includes(item._id)} onClick={() => onApply(item)}>
                  {appliedIds.includes(item._id) ? "Đã ứng tuyển" : "Ứng tuyển"}
                </button>}
                {canReport && <ReportContentButton targetType={reportTargetType} targetId={item._id} targetTitle={item.title} onReported={onReported} />}
              </div>
            )}
          </li>
        ))}
      </ul>
      <Pagination pagination={list.pagination} onPageChange={onPageChange} label={isTutor ? "Phân trang bài đăng dạy học" : "Phân trang yêu cầu đang mở"} />
    </SectionCard>
  );
}
