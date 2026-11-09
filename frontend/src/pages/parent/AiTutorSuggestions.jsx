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

// Chọn yêu cầu để xem gợi ý theo danh mục giảng dạy trong hồ sơ tutor.
// Legacy component name retained; public routes are /parent/suggestions and request-specific suggestions.
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
    <div className="page-stack parent-suggestions-page">
      <ListState
        list={requests}
        empty={{ icon: FileText, title: 'Chưa có yêu cầu đang mở', description: 'Hãy tạo yêu cầu trước, sau đó quay lại để xem gia sư phù hợp.' }}
      >
        {noOpenRequests ? (
          <EmptyState
            icon={FileText}
            title="Chưa có yêu cầu đang mở"
            description="Hãy tạo yêu cầu trước, sau đó quay lại để xem gia sư phù hợp."
          />
        ) : (
          <div className="page-toolbar ai-request-toolbar">
            <div className="ai-request-select">
              <FormSelect
                id="request"
                label="Yêu cầu"
                value={selectedRequestId}
                onChange={handleRequestChange}
                options={requestOptions}
                placeholder="Chọn một yêu cầu"
              />
            </div>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => navigate('/parent/requests/new')}>
              <Plus size={14} aria-hidden="true" />
              <span>Tạo yêu cầu</span>
            </button>
          </div>
        )}
      </ListState>

      {selectedRequestId && <SuggestionsPanel key={selectedRequestId} requestId={selectedRequestId} />}
    </div>
  );
}
