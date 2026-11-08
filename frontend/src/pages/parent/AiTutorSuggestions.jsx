import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FileText, Plus } from 'lucide-react';
import { usePagedList } from '../../hooks/usePagedList';
import { getMyRequests } from '../../services/parentRequestService';
import EmptyState from '../../components/common/EmptyState';
import FormSelect from '../../components/common/FormSelect';
import ListState from '../../components/common/ListState';
import SuggestionsPanel from '../../components/aiSuggestions/SuggestionsPanel';
import '../../styles/aiSuggestions.css';

// UC09 – View AI Tutor Suggestions. Chọn request bằng dropdown, gợi ý đổi theo request đang chọn.
// Dùng cho /parent/ai-suggestions và /parent/requests/:requestId/ai-suggestions (request trên URL được chọn sẵn)
export default function AiTutorSuggestions() {
  const { requestId: requestIdFromUrl } = useParams();
  const navigate = useNavigate();
  const [chosenRequestId, setChosenRequestId] = useState('');
  // Gợi ý chỉ có với request đang mở và chưa quá 30 ngày
  const requests = usePagedList(getMyRequests, { page: 1, limit: 100, status: 'OPEN' });

  let openRequests = [];
  if (requests.data) {
    openRequests = requests.data.items.filter((request) => !request.is_expired);
  }

  let selectedRequestId = chosenRequestId || requestIdFromUrl || '';
  if (!selectedRequestId && openRequests.length > 0) {
    selectedRequestId = openRequests[0]._id;
  }

  const requestOptions = openRequests.map((request) => ({
    value: request._id,
    label: `${request.title} · ${request.subject_name} · ${request.grade_level}`,
  }));

  const handleRequestChange = (event) => {
    setChosenRequestId(event.target.value);
  };

  const noOpenRequests = requests.data && openRequests.length === 0 && !requestIdFromUrl;

  return (
    <div className="page-stack">
      <ListState
        list={requests}
        empty={{ icon: FileText, title: 'No open requests', description: 'Create a request first, then come back to see matching tutors.' }}
      >
        {noOpenRequests ? (
          <EmptyState
            icon={FileText}
            title="No open requests"
            description="Create a request first, then come back to see matching tutors."
          />
        ) : (
          <div className="page-toolbar">
            <div className="ai-request-select">
              <FormSelect
                id="request"
                label="Request"
                value={selectedRequestId}
                onChange={handleRequestChange}
                options={requestOptions}
                placeholder="Select a request"
              />
            </div>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => navigate('/parent/requests/new')}>
              <Plus size={14} aria-hidden="true" />
              <span>Create request</span>
            </button>
          </div>
        )}
      </ListState>

      {selectedRequestId && <SuggestionsPanel key={selectedRequestId} requestId={selectedRequestId} />}
    </div>
  );
}
