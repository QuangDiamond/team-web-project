import { ClipboardCheck, ClipboardList } from 'lucide-react';
import SectionCard from '../common/SectionCard';
import SectionContent from './SectionContent';
import SectionCount from './SectionCount';
import { formatDate } from '../../utils/dateFormat';

// Nhãn và màu theo status từ API (Figma: pending / in-progress / overdue)
const STATUS_BADGES = {
  PENDING: { label: 'Pending', tone: 'info' },
  IN_PROGRESS: { label: 'In progress', tone: 'warning' },
  OVERDUE: { label: 'Overdue', tone: 'error' },
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
    metaParts.push(`Due ${formatDate(assignment.due_date)}`);
  } else {
    metaParts.push('No due date');
  }

  // Quá hạn: còn được nộp hay không tùy allow_late_submission (backend trả về can_submit)
  let overdueNote = null;
  if (assignment.status === 'OVERDUE') {
    if (assignment.can_submit) {
      overdueNote = <p className="student-row-note">Late submission allowed</p>;
    } else {
      overdueNote = <p className="student-row-note is-closed">Submission closed</p>;
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
      <div className="student-row-body">
        <div className="student-row-heading">
          <p className="student-row-title">{assignment.title}</p>
          <span className={`status-badge tone-${badge.tone}`}>{badge.label}</span>
        </div>
        <p className="student-row-meta">{metaParts.join(' · ')}</p>
        {overdueNote}
      </div>
    </li>
  );
}

// Khối "Pending Assignments" (Figma: SectionAssignments)
export default function PendingAssignmentList({ section, onRetry }) {
  return (
    <SectionCard title="Pending Assignments" action={<SectionCount section={section} label="To do" />}>
      <SectionContent
        section={section}
        onRetry={onRetry}
        emptyIcon={ClipboardCheck}
        emptyTitle="You're all caught up"
        emptyDescription="Published assignments you have not submitted will appear here."
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
