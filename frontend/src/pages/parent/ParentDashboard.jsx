import { Link } from 'react-router-dom';
import { FileText, LoaderCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { usePagedList } from '../../hooks/usePagedList';
import { useSummary } from '../../hooks/useSummary';
import { getParentSummary } from '../../services/dashboardService';
import { getMyRequests } from '../../services/parentRequestService';
import Alert from '../../components/common/Alert';
import ListState from '../../components/common/ListState';
import SectionCard from '../../components/common/SectionCard';
import WelcomeBanner from '../../components/common/WelcomeBanner';
import ParentQuickActions from '../../components/parentDashboard/ParentQuickActions';
import ParentStats from '../../components/parentDashboard/ParentStats';
import RequestListItem from '../../components/tutoringRequests/RequestListItem';
import '../../styles/parentDashboard.css';

const RECENT_REQUEST_LIMIT = 5;
const RECENT_REQUEST_PARAMS = { page: 1, limit: RECENT_REQUEST_LIMIT };

const pluralize = (count, singular, plural) => {
  if (count === 1) {
    return `${count} ${singular}`;
  }
  return `${count} ${plural}`;
};

// Parent Dashboard (Overview): số liệu tổng hợp + các request gần đây, hiển thị trong DashboardLayout với PARENT_MENU
export default function ParentDashboard() {
  const { user } = useAuth();
  const summary = useSummary(getParentSummary);
  const recentRequests = usePagedList(getMyRequests, RECENT_REQUEST_PARAMS);

  let fullName = 'Parent';
  if (user && user.full_name) {
    fullName = user.full_name;
  }

  let bannerSummary = 'Here is an overview of your tutoring requests.';
  if (summary.data) {
    const requestText = pluralize(summary.data.open_requests, 'open request', 'open requests');
    const applicationText = pluralize(summary.data.pending_applications, 'application', 'applications');
    bannerSummary = `You have ${requestText} and ${applicationText} waiting for your review.`;
  }

  return (
    <div className="parent-dashboard">
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
      {summary.data && <ParentStats summary={summary.data} />}

      <div className="dashboard-columns">
        <div className="dashboard-column">
          <SectionCard title="Your requests" action={<Link to="/parent/requests" className="link">View all</Link>}>
            <ListState
              list={recentRequests}
              empty={{
                icon: FileText,
                title: 'No tutoring requests yet',
                description: 'Create your first request and qualified tutors will start applying.',
              }}
            >
              {recentRequests.data && (
                <ul className="item-list">
                  {recentRequests.data.items.map((request) => (
                    <RequestListItem key={request._id} request={request} />
                  ))}
                </ul>
              )}
            </ListState>
          </SectionCard>
        </div>
        <div className="dashboard-column">
          <ParentQuickActions />
        </div>
      </div>
    </div>
  );
}
