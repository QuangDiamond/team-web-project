import { Link } from 'react-router-dom';
import { LoaderCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useSummary } from '../../hooks/useSummary';
import { getTutorSummary } from '../../services/dashboardService';
import Alert from '../../components/common/Alert';
import WelcomeBanner from '../../components/common/WelcomeBanner';
import TutorQuickLists from '../../components/tutor/TutorQuickLists';
import TutorStats from '../../components/tutor/TutorStats';
import '../../styles/tutorDashboard.css';

const pluralize = (count, singular, plural) => {
  if (count === 1) {
    return `${count} ${singular}`;
  }
  return `${count} ${plural}`;
};

// Tutor Dashboard (Overview): số liệu tổng hợp + gợi ý, lời mời, đơn ứng tuyển gần đây (hiển thị trong DashboardLayout với TUTOR_MENU)
export default function TutorDashboard() {
  const { user } = useAuth();
  const summary = useSummary(getTutorSummary);

  let fullName = "Gia sư";
  if (user && user.full_name) {
    fullName = user.full_name;
  }

  let bannerSummary = "Tổng quan hoạt động giảng dạy của bạn.";
  if (summary.data && summary.data.has_profile) {
    const invitationText = pluralize(summary.data.pending_invitations, "lời mời", "lời mời");
    bannerSummary = `Bạn có ${invitationText} đang chờ bạn phản hồi.`;
  }

  return (
    <div className="tutor-dashboard">
      <WelcomeBanner name={fullName} summary={bannerSummary} />

      {summary.loading && (
        <div className="page-loading-inline" role="status">
          <LoaderCircle size={26} className="spin" aria-hidden="true" />
          <span className="visually-hidden">Đang tải...</span>
        </div>
      )}
      {summary.error && (
        <Alert type="error">
          <p>{summary.error.message}</p>
          <button type="button" className="btn btn-outline btn-sm" onClick={summary.reload}>Thử lại</button>
        </Alert>
      )}

      {summary.data && !summary.data.has_profile && (
        <Alert type="info">
          <p>Hoàn thiện hồ sơ để xem yêu cầu, ứng tuyển và nhận lời mời. Bạn chưa tạo hồ sơ gia sư.</p>
          <Link to="/tutor/profile" className="btn btn-primary btn-sm">Tạo hồ sơ của tôi</Link>
        </Alert>
      )}

      {summary.data && summary.data.has_profile && (
        <>
          <TutorStats summary={summary.data} />
          <TutorQuickLists />
          <p className="tutor-dashboard-links">
            <Link to="/tutor/requests" className="link">Xem tất cả yêu cầu</Link>
            {' · '}
            <Link to="/tutor/requests/saved" className="link">{`Yêu cầu đã lưu (${summary.data.saved_requests})`}</Link>
            {' · '}
            <Link to="/tutor/posts" className="link">{`Bài đăng của tôi (${summary.data.published_posts} đã đăng)`}</Link>
            {' · '}
            <Link to="/tutor/messages" className="link">{`Tin nhắn (${summary.data.active_conversations})`}</Link>
          </p>
        </>
      )}
    </div>
  );
}
