import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, CircleCheck, LoaderCircle } from 'lucide-react';
import { createRequest, getMyRequest, updateRequest } from '../../services/parentRequestService';
import Alert from '../../components/common/Alert';
import SectionCard from '../../components/common/SectionCard';
import RequestForm, { EMPTY_REQUEST_VALUES } from '../../components/tutoringRequests/RequestForm';
import { REQUEST_STATUS } from '../../constants/requestLabels';
import '../../styles/tutoringRequests.css';

const toFormValues = (request) => {
  let budget = '';
  if (request.budget !== null && request.budget !== undefined) {
    budget = String(request.budget);
  }
  return {
    title: request.title || '',
    subject_name: request.subject_name || '',
    grade_level: request.grade_level || '',
    budget: budget,
    schedule: request.schedule || '',
    teaching_mode: request.teaching_mode || 'ONLINE',
    location_address: request.location_address || '',
    description: request.description || '',
    tutor_requirements: request.tutor_requirements || '',
  };
};

// UC10 – tạo mới (/parent/requests/new) hoặc chỉnh sửa (/parent/requests/:id/edit) một yêu cầu
export default function TutoringRequestForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [state, setState] = useState({ loading: isEdit, error: null, request: null });
  const [savedRequest, setSavedRequest] = useState(null);

  useEffect(() => {
    if (!isEdit) {
      return undefined;
    }
    let ignore = false;
    getMyRequest(id)
      .then((response) => {
        if (!ignore) {
          setState({ loading: false, error: null, request: response.data });
        }
      })
      .catch((error) => {
        if (!ignore) {
          setState({ loading: false, error: error, request: null });
        }
      });
    return () => {
      ignore = true;
    };
  }, [id, isEdit]);

  const handleSubmit = async (payload) => {
    let response;
    if (isEdit) {
      response = await updateRequest(id, payload);
    } else {
      response = await createRequest(payload);
    }
    setSavedRequest(response.data);
  };

  if (state.loading) {
    return (
      <div className="page-loading-inline" role="status">
        <LoaderCircle size={26} className="spin" aria-hidden="true" />
        <span className="visually-hidden">Đang tải...</span>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="page-stack">
        <Alert type="error">{state.error.message}</Alert>
        <Link to="/parent/requests" className="link">Quay lại danh sách yêu cầu</Link>
      </div>
    );
  }

  if (savedRequest) {
    let successTitle = 'Đã đăng yêu cầu';
    let successText = 'Gia sư có thể xem và ứng tuyển vào yêu cầu.';
    if (isEdit) {
      successTitle = 'Đã cập nhật yêu cầu';
      successText = 'Gia sư có thể xem các thay đổi của bạn.';
    }
    return (
      <div className="request-success">
        <span className="request-success-icon" aria-hidden="true"><CircleCheck size={32} /></span>
        <h2 className="request-success-title">{successTitle}</h2>
        <p className="item-meta">{successText}</p>
        <div className="item-actions">
          <button type="button" className="btn btn-primary btn-sm" onClick={() => navigate('/parent/requests')}>
            Xem yêu cầu của tôi
          </button>
          {!isEdit && (
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => navigate(`/parent/requests/${savedRequest._id}/ai-suggestions`)}
            >
              Xem gia sư do AI gợi ý
            </button>
          )}
        </div>
      </div>
    );
  }

  if (isEdit && !state.request.can_edit) {
    let statusLabel = state.request.status;
    if (REQUEST_STATUS[state.request.status]) {
      statusLabel = REQUEST_STATUS[state.request.status].label;
    }
    return (
      <div className="page-stack">
        <Alert type="info">
          Không thể sửa yêu cầu này (trạng thái: {statusLabel}).
        </Alert>
        <Link to={`/parent/requests/${id}`} className="link">Xem yêu cầu</Link>
      </div>
    );
  }

  let initialValues = EMPTY_REQUEST_VALUES;
  if (state.request) {
    initialValues = toFormValues(state.request);
  }

  let submitLabel = 'Đăng yêu cầu';
  let submittingLabel = 'Đang đăng...';
  let cardTitle = 'Yêu cầu mới';
  if (isEdit) {
    submitLabel = 'Lưu thay đổi';
    submittingLabel = 'Đang lưu...';
    cardTitle = 'Chỉnh sửa yêu cầu';
  }

  return (
    <div className="request-form-page">
      <Link to="/parent/requests" className="link-back">
        <ChevronLeft size={16} aria-hidden="true" />
        <span>Quay lại danh sách yêu cầu</span>
      </Link>
      <SectionCard title={cardTitle}>
        <RequestForm
          initialValues={initialValues}
          submitLabel={submitLabel}
          submittingLabel={submittingLabel}
          onSubmit={handleSubmit}
        />
      </SectionCard>
    </div>
  );
}
