import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, LoaderCircle, Sparkles, Trash2 } from 'lucide-react';
import { getMyRequest } from '../../services/parentRequestService';
import Alert from '../../components/common/Alert';
import SectionCard from '../../components/common/SectionCard';
import ApplicationsSection from '../../components/applicationReview/ApplicationsSection';
import DeleteRequestModal from '../../components/tutoringRequests/DeleteRequestModal';
import { REQUEST_STATUS, formatBudget, getModeLabel, getStatusBadge } from '../../constants/requestLabels';
import { formatDate } from '../../utils/dateFormat';
import '../../styles/tutoringRequests.css';

// UC10 – chi tiết một yêu cầu của phụ huynh
export default function TutoringRequestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [state, setState] = useState({ loading: true, error: null, request: null });
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setState({ loading: true, error: null, request: null });
    try {
      const response = await getMyRequest(id);
      setState({ loading: false, error: null, request: response.data });
    } catch (error) {
      setState({ loading: false, error: error, request: null });
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

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
        <Link to="/parent/requests" className="link">Back to requests</Link>
      </div>
    );
  }

  const request = state.request;
  const badge = getStatusBadge(REQUEST_STATUS, request.status);
  const canSuggest = request.status === 'OPEN' && !request.is_expired;

  let learner = 'No specific learner';
  if (request.student) {
    learner = request.student.full_name;
  }

  const facts = [
    ['Subject', request.subject_name],
    ['Grade level', request.grade_level],
    ['Budget', formatBudget(request.budget)],
    ['Schedule', request.schedule],
    ['Session mode', getModeLabel(request.teaching_mode)],
    ['Location', request.location_address || '—'],
  ];

  return (
    <div className="request-detail">
      <Link to="/parent/requests" className="link-back">
        <ChevronLeft size={16} aria-hidden="true" />
        <span>Back to requests</span>
      </Link>

      <div className="request-detail-grid">
        <div className="request-detail-main">
          <SectionCard title={request.title} action={<span className={`status-badge tone-${badge.tone}`}>{badge.label}</span>}>
            <p className="item-meta">For {learner} · Posted {formatDate(request.created_at)}</p>
            {request.is_expired && <Alert type="info">This request is older than 30 days and is no longer shown to tutors.</Alert>}
            <p className="request-detail-text">{request.description}</p>
            <dl className="request-facts">
              {facts.map((fact) => (
                <div key={fact[0]} className="request-fact">
                  <dt>{fact[0]}</dt>
                  <dd>{fact[1]}</dd>
                </div>
              ))}
            </dl>
          </SectionCard>
          <SectionCard title="Tutor requirements">
            <p className="request-detail-text">{request.tutor_requirements || 'No specific requirements.'}</p>
          </SectionCard>
        </div>

        <SectionCard title="Tutor interest">
          <p className="request-detail-count">{request.application_count}</p>
          <p className="item-meta">{request.application_count === 1 ? 'application' : 'applications'} received</p>
          <div className="request-detail-actions">
            {request.can_edit && (
              <button type="button" className="btn btn-primary btn-block" onClick={() => navigate(`/parent/requests/${request._id}/edit`)}>
                Edit request
              </button>
            )}
            {canSuggest && (
              <button
                type="button"
                className="btn btn-outline btn-block"
                onClick={() => navigate(`/parent/requests/${request._id}/ai-suggestions`)}
              >
                <Sparkles size={16} aria-hidden="true" />
                <span>AI tutor suggestions</span>
              </button>
            )}
            <button type="button" className="btn btn-outline btn-block" onClick={() => setDeleting(true)}>
              <Trash2 size={16} aria-hidden="true" />
              <span>Delete request</span>
            </button>
            {!request.can_edit && (
              <p className="item-meta">This request is {badge.label.toLowerCase()} and can no longer be edited.</p>
            )}
          </div>
        </SectionCard>
      </div>

      <ApplicationsSection requestId={request._id} />

      {deleting && (
        <DeleteRequestModal request={request} onClose={() => setDeleting(false)} onDeleted={() => navigate('/parent/requests')} />
      )}
    </div>
  );
}
