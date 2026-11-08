import { Link } from 'react-router-dom';
import { Mail, Send, Sparkles } from 'lucide-react';
import { usePagedList } from '../../hooks/usePagedList';
import { getMyApplications } from '../../services/applicationService';
import { getReceivedInvitations } from '../../services/invitationService';
import { getSuggestedRequests } from '../../services/tutorRequestService';
import CompactList from '../common/CompactList';
import ListState from '../common/ListState';
import SectionCard from '../common/SectionCard';
import { APPLICATION_STATUS, formatBudget, getModeLabel, getStatusBadge } from '../../constants/requestLabels';
import { formatDate } from '../../utils/dateFormat';

const SUGGESTION_PARAMS = { page: 1, limit: 3 };
const INVITATION_PARAMS = { status: 'PENDING', page: 1, limit: 3 };
const APPLICATION_PARAMS = { page: 1, limit: 3 };

const toRecommendedItem = (request) => {
  const item = {
    key: request._id,
    title: request.title,
    meta: `${request.subject_name} · ${getModeLabel(request.teaching_mode)} · ${formatBudget(request.budget)}`,
    to: `/tutor/requests/${request._id}`,
  };
  if (request.match_score !== null && request.match_score !== undefined) {
    item.badge = { label: `${request.match_score}% match`, tone: 'success' };
  }
  return item;
};

const toInvitationItem = (invitation) => {
  let title = 'Request no longer available';
  if (invitation.request) {
    title = invitation.request.title;
  }
  return {
    key: invitation._id,
    title: title,
    meta: `A parent invited you · ${formatDate(invitation.created_at)}`,
    to: '/tutor/invitations',
    badge: { label: 'Pending', tone: 'warning' },
  };
};

const toApplicationItem = (application) => {
  let title = 'Request no longer available';
  if (application.request) {
    title = application.request.title;
  }
  return {
    key: application._id,
    title: title,
    meta: `Applied ${formatDate(application.created_at)}`,
    to: '/tutor/applications',
    badge: getStatusBadge(APPLICATION_STATUS, application.status),
  };
};

// Các khối xem nhanh của Tutor Dashboard. Chỉ render khi gia sư đã có hồ sơ (các API này trả 409 nếu chưa có)
export default function TutorQuickLists() {
  const suggestions = usePagedList(getSuggestedRequests, SUGGESTION_PARAMS);
  const invitations = usePagedList(getReceivedInvitations, INVITATION_PARAMS);
  const applications = usePagedList(getMyApplications, APPLICATION_PARAMS);

  return (
    <div className="dashboard-columns">
      <div className="dashboard-column">
        <SectionCard title="Recommended for you" action={<Link to="/tutor/requests/suggested" className="link">View all</Link>}>
          <ListState
            list={suggestions}
            empty={{ icon: Sparkles, title: 'No suggestions yet', description: 'Check back when new requests are posted.' }}
          >
            {suggestions.data && <CompactList items={suggestions.data.items.map(toRecommendedItem)} />}
          </ListState>
        </SectionCard>
      </div>
      <div className="dashboard-column">
        <SectionCard title="Invitations" action={<Link to="/tutor/invitations" className="link">View all</Link>}>
          <ListState
            list={invitations}
            empty={{ icon: Mail, title: 'No pending invitations', description: 'Parents who invite you will appear here.' }}
          >
            {invitations.data && <CompactList items={invitations.data.items.map(toInvitationItem)} />}
          </ListState>
        </SectionCard>
        <SectionCard title="Recent applications" action={<Link to="/tutor/applications" className="link">View all</Link>}>
          <ListState
            list={applications}
            empty={{ icon: Send, title: 'No applications yet', description: 'Browse open requests and apply to the ones that fit you.' }}
          >
            {applications.data && <CompactList items={applications.data.items.map(toApplicationItem)} />}
          </ListState>
        </SectionCard>
      </div>
    </div>
  );
}
