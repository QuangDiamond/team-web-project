import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, CircleCheck, LoaderCircle } from 'lucide-react';
import { createRequest, getMyChildren, getMyRequest, updateRequest } from '../../services/parentRequestService';
import Alert from '../../components/common/Alert';
import SectionCard from '../../components/common/SectionCard';
import RequestForm, { EMPTY_REQUEST_VALUES } from '../../components/tutoringRequests/RequestForm';
import '../../styles/tutoringRequests.css';

const toFormValues = (request) => {
  let budget = '';
  if (request.budget !== null && request.budget !== undefined) {
    budget = String(request.budget);
  }
  return {
    title: request.title || '',
    student_id: request.student_id || '',
    subject_name: request.subject_name || '',
    grade_level: request.grade_level || '',
    description: request.description || '',
    schedule: request.schedule || '',
    budget: budget,
    teaching_mode: request.teaching_mode || 'ONLINE',
    location_address: request.location_address || '',
    tutor_requirements: request.tutor_requirements || '',
  };
};

// UC10 – tạo mới (/parent/requests/new) hoặc chỉnh sửa (/parent/requests/:id/edit) một yêu cầu
export default function TutoringRequestForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [state, setState] = useState({ loading: true, error: null, students: [], request: null });
  const [savedRequest, setSavedRequest] = useState(null);

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      try {
        const childrenResponse = await getMyChildren();
        let request = null;
        if (isEdit) {
          const requestResponse = await getMyRequest(id);
          request = requestResponse.data;
        }
        if (!ignore) {
          setState({ loading: false, error: null, students: childrenResponse.data, request: request });
        }
      } catch (error) {
        if (!ignore) {
          setState({ loading: false, error: error, students: [], request: null });
        }
      }
    };
    load();
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
    return (
      <div className="request-success">
        <span className="request-success-icon" aria-hidden="true"><CircleCheck size={32} /></span>
        <h2 className="request-success-title">{isEdit ? "Đã cập nhật yêu cầu" : "Đã đăng yêu cầu"}</h2>
        <p className="item-meta">
          {isEdit ? "Gia sư có thể xem các thay đổi của bạn." : "Gia sư có thể xem và ứng tuyển vào yêu cầu."}
        </p>
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
    return (
      <div className="page-stack">
        <Alert type="info">
          Không thể sửa yêu cầu này (trạng thái: {state.request.status}).
        </Alert>
        <Link to={`/parent/requests/${id}`} className="link">Xem yêu cầu</Link>
      </div>
    );
  }

  let initialValues = EMPTY_REQUEST_VALUES;
  if (state.request) {
    initialValues = toFormValues(state.request);
  }

  // Học sinh đang gán cho request nhưng không còn liên kết thì vẫn hiện trong danh sách chọn
  const students = [...state.students];
  if (state.request && state.request.student && !students.some((student) => student._id === state.request.student._id)) {
    students.push(state.request.student);
  }

  return (
    <div className="request-form-page">
      <Link to="/parent/requests" className="link-back">
        <ChevronLeft size={16} aria-hidden="true" />
        <span>Quay lại danh sách yêu cầu</span>
      </Link>
      <SectionCard title={isEdit ? "Sửa yêu cầu" : "Yêu cầu mới"}>
        <RequestForm
          initialValues={initialValues}
          students={students}
          submitLabel={isEdit ? "Lưu thay đổi" : "Đăng yêu cầu"}
          submittingLabel={isEdit ? "Đang lưu..." : "Đang đăng..."}
          onSubmit={handleSubmit}
        />
      </SectionCard>
    </div>
  );
}
