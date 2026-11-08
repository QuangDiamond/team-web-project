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
        <span className="visually-hidden">Loading...</span>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="page-stack">
        <Alert type="error">{state.error.message}</Alert>
        <Link to="/parent/requests" className="link">Back to requests</Link>
      </div>
    );
  }

  if (savedRequest) {
    return (
      <div className="request-success">
        <span className="request-success-icon" aria-hidden="true"><CircleCheck size={32} /></span>
        <h2 className="request-success-title">{isEdit ? 'Request updated' : 'Request published'}</h2>
        <p className="item-meta">
          {isEdit ? 'Your changes are now visible to tutors.' : 'Tutors can now see and apply to your request.'}
        </p>
        <div className="item-actions">
          <button type="button" className="btn btn-primary btn-sm" onClick={() => navigate('/parent/requests')}>
            View my requests
          </button>
          {!isEdit && (
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => navigate(`/parent/requests/${savedRequest._id}/ai-suggestions`)}
            >
              See AI tutor suggestions
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
          This request can no longer be edited (status: {state.request.status}).
        </Alert>
        <Link to={`/parent/requests/${id}`} className="link">View request</Link>
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
        <span>Back to requests</span>
      </Link>
      <SectionCard title={isEdit ? 'Edit request' : 'New request'}>
        <RequestForm
          initialValues={initialValues}
          students={students}
          submitLabel={isEdit ? 'Save changes' : 'Publish request'}
          submittingLabel={isEdit ? 'Saving...' : 'Publishing...'}
          onSubmit={handleSubmit}
        />
      </SectionCard>
    </div>
  );
}
