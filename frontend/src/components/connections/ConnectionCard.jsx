import { useNavigate } from 'react-router-dom';
import {
  Ban,
  Banknote,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock,
  GraduationCap,
  MessageCircle,
  Star,
  XCircle,
} from 'lucide-react';
import { getInitials } from '../../utils/getInitials';

const STATUS_DISPLAY = {
  CONFIRMED: { label: 'Đã xác nhận', className: 'confirmed', Icon: CheckCircle2 },
  PENDING: { label: 'Chờ xác nhận', className: 'pending', Icon: Clock },
  CANCELLED: { label: 'Đã hủy', className: 'rejected', Icon: Ban },
  REJECTED: { label: 'Từ chối', className: 'rejected', Icon: XCircle },
};

function TermRow({ Icon, label, children }) {
  return (
    <div className="conn-term-row">
      <div className="conn-term-icon">
        <Icon size={15} aria-hidden="true" />
      </div>
      <div className="conn-term-content">
        <span className="conn-term-label">{label}</span>
        {children}
      </div>
    </div>
  );
}

/*
 * Một thỏa thuận dạy học (UC16, SC22 My Agreements).
 * onAction(connection, 'CONFIRM' | 'REJECT' | 'CANCEL'), onRate(connection) do trang cha xử lý.
 */
export default function ConnectionCard({ connection, user, isProcessing, messagesBasePath, onAction, onRate }) {
  const navigate = useNavigate();

  let statusDisplay = STATUS_DISPLAY.REJECTED;
  if (STATUS_DISPLAY[connection.status]) {
    statusDisplay = STATUS_DISPLAY[connection.status];
  }
  const StatusIcon = statusDisplay.Icon;
  const isConfirmed = connection.status === 'CONFIRMED';
  const isPending = connection.status === 'PENDING';

  let userId = '';
  let userRole = '';
  if (user) {
    userId = String(user.id);
    userRole = user.role;
  }

  let partner = connection.tutor || {};
  let partnerRoleLabel = 'Gia sư TuConnector';
  if (connection.tutor && connection.tutor.headline) {
    partnerRoleLabel = connection.tutor.headline;
  }
  if (userRole === 'TUTOR') {
    partner = connection.parent || {};
    partnerRoleLabel = 'Phụ huynh học sinh';
  }

  let proposerId = '';
  let proposerName = 'Đối tác';
  if (connection.proposer) {
    proposerId = String(connection.proposer._id);
    proposerName = connection.proposer.full_name || 'Đối tác';
  }
  const isProposer = proposerId === userId;

  let priceText = 'Chưa thống nhất';
  if (connection.agreed_price) {
    priceText = `${Number(connection.agreed_price).toLocaleString('vi-VN')} đ`;
  }

  let createdText = '';
  if (connection.created_at) {
    createdText = `· ${new Date(connection.created_at).toLocaleDateString('vi-VN')}`;
  }

  let isRequestClosed = false;
  if (connection.request && connection.request.status === 'CLOSED') {
    isRequestClosed = true;
  }

  let ratedScore = 5;
  if (connection.review && connection.review.rating) {
    ratedScore = connection.review.rating;
  }

  let chatPath = messagesBasePath;
  if (connection.conversation_id) {
    chatPath = `${messagesBasePath}/${connection.conversation_id}`;
  }

  return (
    <div className={`conn-card ${statusDisplay.className}`}>
      <div className="conn-partner-row">
        <div className="conn-partner-profile">
          {partner.avatar_url ? (
            <img src={partner.avatar_url} alt={partner.full_name} className="conn-partner-avatar" />
          ) : (
            <span className="conn-partner-avatar conn-avatar-initials" aria-hidden="true">
              {getInitials(partner.full_name)}
            </span>
          )}
          <div>
            <div className="conn-partner-name">{partner.full_name}</div>
            <div className="conn-partner-role">{partnerRoleLabel}</div>
          </div>
        </div>

        <span className={`conn-status-badge ${statusDisplay.className}`}>
          <StatusIcon size={14} aria-hidden="true" /> {statusDisplay.label}
        </span>
      </div>

      <div className="conn-terms-box">
        <TermRow Icon={BookOpen} label="Môn học đã thống nhất">
          <div className="conn-term-val">{connection.agreed_subject}</div>
        </TermRow>
        <TermRow Icon={CalendarDays} label="Khung giờ & Lịch học chốt">
          <div className="conn-term-val">{connection.agreed_schedule}</div>
        </TermRow>
        <TermRow Icon={Banknote} label="Mức học phí thống nhất">
          <div className="conn-term-val price">
            {priceText} <span className="conn-price-unit">/ buổi</span>
          </div>
        </TermRow>
      </div>

      <div className="conn-proposer-note">
        Đề xuất bởi: <strong>{proposerName}</strong> {createdText}
        {isConfirmed && isRequestClosed && <span className="conn-request-closed">(Bài yêu cầu đã đóng)</span>}
      </div>

      <div className="conn-card-actions">
        {isPending && !isProposer && (
          <>
            <button type="button" className="btn-conn decline" onClick={() => onAction(connection, 'REJECT')} disabled={isProcessing}>
              Từ chối
            </button>
            <button type="button" className="btn-conn confirm" onClick={() => onAction(connection, 'CONFIRM')} disabled={isProcessing}>
              {isProcessing ? 'Đang xác nhận...' : 'Xác nhận đồng ý'}
            </button>
          </>
        )}

        {isPending && isProposer && (
          <button type="button" className="btn-conn decline" onClick={() => onAction(connection, 'CANCEL')} disabled={isProcessing}>
            {isProcessing ? 'Đang hủy...' : 'Hủy đề xuất'}
          </button>
        )}

        {isConfirmed && userRole === 'PARENT' && !connection.hasRated && (
          <button type="button" className="btn-conn rate" onClick={() => onRate(connection)}>
            <Star size={16} aria-hidden="true" /> Đánh giá gia sư
          </button>
        )}

        {isConfirmed && userRole === 'PARENT' && connection.hasRated && (
          <span className="conn-rated-label">
            <CheckCircle2 size={14} aria-hidden="true" /> Đã đánh giá {ratedScore}
            <Star size={14} aria-hidden="true" />
          </span>
        )}

        {isConfirmed && userRole === 'TUTOR' && (
          <button
            type="button"
            className="btn-conn rate"
            onClick={() => navigate(`/tutor/classes?agreement=${encodeURIComponent(connection._id)}`)}
          >
            <GraduationCap size={16} aria-hidden="true" /> Tạo lớp học
          </button>
        )}

        <button type="button" className="btn-conn chat" onClick={() => navigate(chatPath)}>
          <MessageCircle size={16} aria-hidden="true" /> Mở phòng chat
        </button>
      </div>
    </div>
  );
}
