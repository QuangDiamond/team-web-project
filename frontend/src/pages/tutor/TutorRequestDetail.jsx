import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Bookmark, BookmarkCheck, ChevronLeft, LoaderCircle } from 'lucide-react';
import { getTutorRequest, saveRequest, unsaveRequest } from '../../services/tutorRequestService';
import Alert from '../../components/common/Alert';
import SectionCard from '../../components/common/SectionCard';
import ApplyModal from '../../components/tutorRequests/ApplyModal';
import { formatBudget, getModeLabel } from '../../constants/requestLabels';
import { formatDate } from '../../utils/dateFormat';
import '../../styles/tutorRequests.css';

// UC11 – chi tiết một yêu cầu đang mở (Figma: tutor-post-detail), có nút lưu và ứng tuyển (UC12)
export default function TutorRequestDetail() {
  const { id } = useParams();
  const [state, setState] = useState({ loading: true, error: null, request: null });
  const [applying, setApplying] = useState(false);
  const [notice, setNotice] = useState('');
  const [actionError, setActionError] = useState('');

  const load = useCallback(async () => {
    setState({ loading: true, error: null, request: null });
    try {
      const response = await getTutorRequest(id);
      setState({ loading: false, error: null, request: response.data });
    } catch (error) {
      setState({ loading: false, error: error, request: null });
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleToggleSave = async () => {
    setActionError('');
    const request = state.request;
    try {
      if (request.is_bookmarked) {
        await unsaveRequest(request._id);
      } else {
        await saveRequest(request._id);
      }
      setState({ ...state, request: { ...request, is_bookmarked: !request.is_bookmarked } });
    } catch (error) {
      setActionError(error.message);
    }
  };

  const handleApplied = (result) => {
    const request = state.request;
    setState({ ...state, request: { ...request, has_applied: true, application_count: request.application_count + 1 } });
    setNotice(`Application sent. You have ${result.remaining_credits} credit(s) left.`);
    setApplying(false);
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
        <Alert type="error">
          <p>{state.error.message}</p>
          <button type="button" className="btn btn-outline btn-sm" onClick={load}>Try again</button>
        </Alert>
        <Link to="/tutor/requests" className="link">Back to requests</Link>
      </div>
    );
  }

  const request = state.request;
  const SaveIcon = request.is_bookmarked ? BookmarkCheck : Bookmark;
  const facts = [
    ['Subject', request.subject_name],
    ['Grade level', request.grade_level],
    ['Budget', formatBudget(request.budget)],
    ['Schedule', request.schedule],
    ['Session mode', getModeLabel(request.teaching_mode)],
    ['Area', request.location_address || '—'],
  ];

  return (
    <div className="tutor-detail">
      <Link to="/tutor/requests" className="tutor-back-link">
        <ChevronLeft size={16} aria-hidden="true" />
        <span>Back to requests</span>
      </Link>

      {notice && <Alert type="success">{notice}</Alert>}
      {actionError && <Alert type="error">{actionError}</Alert>}

      <div className="tutor-detail-grid">
        <div className="tutor-detail-main">
          <SectionCard title={request.title}>
            <p className="item-meta">Posted {formatDate(request.created_at)} by a parent · {request.application_count} tutors applied</p>
            <p className="tutor-detail-text">{request.description}</p>
            <dl className="tutor-facts">
              {facts.map((fact) => (
                <div key={fact[0]} className="tutor-fact">
                  <dt>{fact[0]}</dt>
                  <dd>{fact[1]}</dd>
                </div>
              ))}
            </dl>
          </SectionCard>
          <SectionCard title="Tutor requirements">
            <p className="tutor-detail-text">{request.tutor_requirements || 'No specific requirements.'}</p>
          </SectionCard>
        </div>

        <SectionCard title="Interested in this request?">
          <p className="item-meta">Introduce your experience with a short note. Applying costs 1 credit.</p>
          <div className="tutor-detail-actions">
            <button
              type="button"
              className="btn btn-primary btn-block"
              disabled={request.has_applied}
              onClick={() => setApplying(true)}
            >
              {request.has_applied ? 'Applied' : 'Apply'}
            </button>
            <button type="button" className="btn btn-outline btn-block" onClick={handleToggleSave}>
              <SaveIcon size={16} aria-hidden="true" />
              <span>{request.is_bookmarked ? 'Saved' : 'Save request'}</span>
            </button>
          </div>
        </SectionCard>
      </div>

      {applying && <ApplyModal request={request} onClose={() => setApplying(false)} onApplied={handleApplied} />}
    </div>
  );
}
