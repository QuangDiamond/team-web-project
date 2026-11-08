import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, LoaderCircle, Sparkles } from 'lucide-react';
import { getMyRequest } from '../../services/parentRequestService';
import Alert from '../../components/common/Alert';
import SectionCard from '../../components/common/SectionCard';
import { REQUEST_STATUS, formatBudget, getModeLabel, getStatusBadge } from '../../constants/requestLabels';
import { formatDate } from '../../utils/dateFormat';
import '../../styles/tutoringRequests.css';

// UC10 – chi tiết một yêu cầu của phụ huynh
export default function TutoringRequestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [state, setState] = useState({ loading: true, error: null, request: null });

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
        <span className="visually-hidden">Đang tải...</span>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="page-stack">
        <Alert type="error">
          <p>{state.error.message}</p>
          <button type="button" className="btn btn-outline btn-sm" onClick={load}>Thử lại</button>
        </Alert>
        <Link to="/parent/requests" className="link">Quay lại danh sách yêu cầu</Link>
      </div>
    );
  }

  const request = state.request;
  const badge = getStatusBadge(REQUEST_STATUS, request.status);
  const canSuggest = request.status === 'OPEN' && !request.is_expired;

  let learner = "Không chỉ định học sinh";
  if (request.student) {
    learner = request.student.full_name;
  }

  const facts = [
    ["Môn học", request.subject_name],
    ["Khối lớp", request.grade_level],
    ["Ngân sách", formatBudget(request.budget)],
    ["Lịch học", request.schedule],
    ["Hình thức học", getModeLabel(request.teaching_mode)],
    ["Địa điểm", request.location_address || '—'],
  ];

  return (
    <div className="request-detail">
      <Link to="/parent/requests" className="link-back">
        <ChevronLeft size={16} aria-hidden="true" />
        <span>Quay lại danh sách yêu cầu</span>
      </Link>

      <div className="request-detail-grid">
        <div className="request-detail-main">
          <SectionCard title={request.title} action={<span className={`status-badge tone-${badge.tone}`}>{badge.label}</span>}>
            <p className="item-meta">Cho yêu cầu {learner} · Đã đăng {formatDate(request.created_at)}</p>
            {request.is_expired && <Alert type="info">Yêu cầu này đã quá 30 ngày và không còn hiển thị với gia sư.</Alert>}
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
          <SectionCard title="Yêu cầu đối với gia sư">
            <p className="request-detail-text">{request.tutor_requirements || "Không có yêu cầu cụ thể."}</p>
          </SectionCard>
        </div>

        <SectionCard title="Gia sư quan tâm">
          <p className="request-detail-count">{request.application_count}</p>
          <p className="item-meta">Đơn ứng tuyển đã nhận</p>
          <div className="request-detail-actions">
            <button
              type="button"
              className="btn btn-primary btn-block"
              onClick={() => navigate(`/parent/requests/${request._id}/applications`)}
            >
              Xem đơn ứng tuyển
            </button>
            {request.can_edit && (
              <button type="button" className="btn btn-outline btn-block" onClick={() => navigate(`/parent/requests/${request._id}/edit`)}>
                Sửa yêu cầu
              </button>
            )}
            {canSuggest && (
              <button
                type="button"
                className="btn btn-outline btn-block"
                onClick={() => navigate(`/parent/requests/${request._id}/ai-suggestions`)}
              >
                <Sparkles size={16} aria-hidden="true" />
                <span>Gợi ý gia sư bằng AI</span>
              </button>
            )}
            {!request.can_edit && (
              <p className="item-meta">Yêu cầu này đang ở trạng thái {badge.label.toLowerCase()} và không thể chỉnh sửa.</p>
            )}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
