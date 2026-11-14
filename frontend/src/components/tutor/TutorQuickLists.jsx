import { Link } from 'react-router-dom';
import { Mail, Send, Search } from 'lucide-react';
import { usePagedList } from '../../hooks/usePagedList';
import { getMyApplications } from '../../services/applicationService';
import { getReceivedInvitations } from '../../services/invitationService';
import { getRandomSuggestedRequests } from '../../services/tutorRequestService';
import CompactList from '../common/CompactList';
import ListState from '../common/ListState';
import SectionCard from '../common/SectionCard';
import { APPLICATION_STATUS, formatBudget, getModeLabel, getStatusBadge } from '../../constants/requestLabels';
import { formatDate } from '../../utils/dateFormat';

const INVITATION_PARAMS = { status: 'PENDING', page: 1, limit: 3 };
const APPLICATION_PARAMS = { page: 1, limit: 3 };

const toRecommendedItem = (request) => {
  const item = {
    key: request._id,
    title: request.title,
    meta: `${request.subject_name} · ${getModeLabel(request.teaching_mode)} · ${formatBudget(request.budget)}`,
    to: `/tutor/requests/${request._id}`,
  };
  return item;
};

const toInvitationItem = (invitation) => {
  let title = "Yêu cầu không còn khả dụng";
  if (invitation.request) {
    title = invitation.request.title;
  }
  return {
    key: invitation._id,
    title: title,
    meta: `Phụ huynh đã mời bạn · ${formatDate(invitation.created_at)}`,
    to: '/tutor/invitations',
    badge: { label: "Đang chờ", tone: 'warning' },
  };
};

const toApplicationItem = (application) => {
  let title = "Yêu cầu không còn khả dụng";
  if (application.request) {
    title = application.request.title;
  }
  return {
    key: application._id,
    title: title,
    meta: `Ứng tuyển lúc ${formatDate(application.created_at)}`,
    to: '/tutor/applications',
    badge: getStatusBadge(APPLICATION_STATUS, application.status),
  };
};

// Các khối xem nhanh của Tutor Dashboard. Chỉ render khi gia sư đã có hồ sơ (các API này trả 409 nếu chưa có)
export default function TutorQuickLists() {
  const suggestions = usePagedList(getRandomSuggestedRequests, {});
  const invitations = usePagedList(getReceivedInvitations, INVITATION_PARAMS);
  const applications = usePagedList(getMyApplications, APPLICATION_PARAMS);

  return (
    <div className="dashboard-columns">
      <div className="dashboard-column">
        <SectionCard title="Gợi ý" action={<Link to="/tutor/requests/suggested" className="link">Xem tất cả</Link>}>
          <ListState
            list={suggestions}
            empty={{ icon: Search, title: 'Chưa có gợi ý', description: 'Chọn môn học và trình độ trong hồ sơ để nhận gợi ý.' }}
          >
            {suggestions.data && <CompactList items={suggestions.data.items.map(toRecommendedItem)} />}
          </ListState>
        </SectionCard>
      </div>
      <div className="dashboard-column">
        <SectionCard title="Lời mời" action={<Link to="/tutor/invitations" className="link">Xem tất cả</Link>}>
          <ListState
            list={invitations}
            empty={{ icon: Mail, title: "Không có lời mời đang chờ", description: "Các phụ huynh mời bạn sẽ hiển thị ở đây." }}
          >
            {invitations.data && <CompactList items={invitations.data.items.map(toInvitationItem)} />}
          </ListState>
        </SectionCard>
        <SectionCard title="Đơn ứng tuyển gần đây" action={<Link to="/tutor/applications" className="link">Xem tất cả</Link>}>
          <ListState
            list={applications}
            empty={{ icon: Send, title: "Chưa có đơn ứng tuyển", description: "Xem các yêu cầu đang mở và ứng tuyển vào yêu cầu phù hợp." }}
          >
            {applications.data && <CompactList items={applications.data.items.map(toApplicationItem)} />}
          </ListState>
        </SectionCard>
      </div>
    </div>
  );
}
