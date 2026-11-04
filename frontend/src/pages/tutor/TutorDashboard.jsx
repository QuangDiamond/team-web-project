import { Link } from 'react-router-dom';
import { LoaderCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useSummary } from '../../hooks/useSummary';
import { getTutorSummary } from '../../services/dashboardService';
import Alert from '../../components/common/Alert';
import WelcomeBanner from '../../components/common/WelcomeBanner';
import TutorQuickLists from '../../components/tutorDashboard/TutorQuickLists';
import TutorStats from '../../components/tutorDashboard/TutorStats';
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

  let fullName = 'Tutor';
  if (user && user.full_name) {
    fullName = user.full_name;
  }

  let bannerSummary = 'Here is an overview of your tutoring work.';
  if (summary.data && summary.data.has_profile) {
    const requestText = pluralize(summary.data.available_requests, 'open request', 'open requests');
    const invitationText = pluralize(summary.data.pending_invitations, 'invitation', 'invitations');
    bannerSummary = `There are ${requestText} to explore and ${invitationText} waiting for your answer.`;
  }

  return (
    <div className="tutor-dashboard">
      <WelcomeBanner name={fullName} summary={bannerSummary} />

      {summary.loading && (
        <div className="page-loading-inline" role="status">
          <LoaderCircle size={26} className="spin" aria-hidden="true" />
          <span className="visually-hidden">Loading...</span>
        </div>
      )}
      {summary.error && (
        <Alert type="error">
          <p>{summary.error.message}</p>
          <button type="button" className="btn btn-outline btn-sm" onClick={summary.reload}>Try again</button>
        </Alert>
      )}

      {summary.data && !summary.data.has_profile && (
        <Alert type="info">
          Complete your tutor profile to browse requests, apply and receive invitations. Your profile is not set up yet.
        </Alert>
      )}

      {summary.data && summary.data.has_profile && (
        <>
          <TutorStats summary={summary.data} />
          <TutorQuickLists />
          <p className="tutor-dashboard-links">
            <Link to="/tutor/requests" className="link">Browse all requests</Link>
            {' · '}
            <Link to="/tutor/requests/saved" className="link">{`Saved requests (${summary.data.saved_requests})`}</Link>
          </p>
        </>
      )}
    </div>
  );
}
