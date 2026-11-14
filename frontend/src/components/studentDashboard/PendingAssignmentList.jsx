import { Link } from 'react-router-dom';
import { ClipboardCheck, ClipboardList } from 'lucide-react';
import SectionCard from '../common/SectionCard';
import SectionContent from './SectionContent';
import SectionCount from './SectionCount';
import { formatDate } from '../../utils/dateFormat';

// Nhãn và màu theo status từ API (Figma: pending / in-progress / overdue)
const STATUS_BADGES = {
  PENDING: { label: "Đang chờ", tone: 'info' },
  IN_PROGRESS: { label: "Đang thực hiện", tone: 'warning' },
  OVERDUE: { label: "Quá hạn", tone: 'error' },
};

function AssignmentRow({ assignment }) {
  let badge = STATUS_BADGES.PENDING;
  if (STATUS_BADGES[assignment.status]) {
    badge = STATUS_BADGES[assignment.status];
  }

  const metaParts = [];
  if (assignment.class) {
    metaParts.push(assignment.class.name);
    if (assignment.class.tutor_name) {
      metaParts.push(assignment.class.tutor_name);
    }
  }
  if (assignment.due_date) {
    metaParts.push(`Hạn nộp ${formatDate(assignment.due_date)}`);
  } else {
    metaParts.push("Không có hạn nộp");
  }

  // Quá hạn: còn được nộp hay không tùy allow_late_submission (backend trả về can_submit)
  let overdueNote = null;
  if (assignment.status === 'OVERDUE') {
    if (assignment.can_submit) {
      overdueNote = <p className="student-row-note">Cho phép nộp muộn</p>;
    } else {
      overdueNote = <p className="student-row-note is-closed">Đã đóng nộp bài</p>;
    }
  }

  let rowClass = 'student-list-row';
  if (assignment.status === 'OVERDUE') {
    rowClass = 'student-list-row is-overdue';
  }

  return (
    <li className={rowClass}>
      <span className="student-row-icon" aria-hidden="true">
        <ClipboardList size={18} />
      </span>
      <div className="student-row-body" style={{ flex: 1 }}>
        <div className="student-row-heading">
          <Link
            to={`/student/assignments/${assignment._id}`}
            className="student-row-title"
            style={{ textDecoration: 'none', color: 'var(--color-text)', fontWeight: 600 }}
          >
            {assignment.title}
          </Link>
          <span className={`status-badge tone-${badge.tone}`}>{badge.label}</span>
        </div>
        <p className="student-row-meta">{metaParts.join(' · ')}</p>
        {overdueNote}
      </div>
      <Link
        to={`/student/assignments/${assignment._id}`}
        className="btn-outline-gray"
        style={{ fontSize: '12px', padding: '6px 12px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}
      >
        Làm bài →
      </Link>
    </li>
  );
}

// Khối "Pending Assignments" (Figma: SectionAssignments)
export default function PendingAssignmentList({ section, onRetry }) {
  return (
    <SectionCard
      title="Bài tập chưa hoàn thành"
      action={
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <SectionCount section={section} label="Cần làm" />
          <Link
            to="/student/assignments"
            style={{ fontSize: '13px', color: 'var(--color-primary-strong)', fontWeight: 600, textDecoration: 'none' }}
          >
            Xem tất cả bài tập →
          </Link>
        </div>
      }
    >
      <SectionContent
        section={section}
        onRetry={onRetry}
        emptyIcon={ClipboardCheck}
        emptyTitle="Bạn đã hoàn thành tất cả"
        emptyDescription="Bài tập đã giao mà bạn chưa nộp sẽ hiển thị ở đây."
      >
        <ul className="student-list">
          {section.items.map((assignment) => (
            <AssignmentRow key={assignment._id} assignment={assignment} />
          ))}
        </ul>
      </SectionContent>
    </SectionCard>
  );
}
