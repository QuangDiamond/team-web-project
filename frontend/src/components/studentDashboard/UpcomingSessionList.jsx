import { CalendarClock, Video } from 'lucide-react';
import SectionCard from '../common/SectionCard';
import SectionContent from './SectionContent';
import SectionCount from './SectionCount';
import { formatRelativeDay, formatTime } from '../../utils/dateFormat';

// meeting_link có thể là link online hoặc địa điểm học (chuỗi thường)
const isWebLink = (value) => {
  if (!value) {
    return false;
  }
  return value.startsWith('http://') || value.startsWith('https://');
};

function SessionRow({ session }) {
  const hasJoinLink = isWebLink(session.meeting_link);

  let className = '';
  let tutorName = '';
  if (session.class) {
    className = session.class.name;
    tutorName = session.class.tutor_name;
  }

  // Tiêu đề: tên buổi học; nếu buổi học không có tên thì dùng tên lớp
  let title = className;
  if (session.title) {
    title = session.title;
  }

  let timeText = `${formatRelativeDay(session.start_time)} · ${formatTime(session.start_time)}`;
  if (session.end_time) {
    timeText = `${timeText}–${formatTime(session.end_time)}`;
  }

  const metaParts = [];
  if (session.title && className) {
    metaParts.push(className);
  }
  metaParts.push(timeText);
  if (tutorName) {
    metaParts.push(tutorName);
  }
  // Không phải link online thì là địa điểm học
  if (session.meeting_link && !hasJoinLink) {
    metaParts.push(session.meeting_link);
  }

  return (
    <li className="student-list-row">
      <span className="student-row-icon" aria-hidden="true">
        <Video size={18} />
      </span>
      <div className="student-row-body">
        <p className="student-row-title">{title}</p>
        <p className="student-row-meta">{metaParts.join(' · ')}</p>
      </div>
      {hasJoinLink && (
        <a className="btn btn-primary btn-sm" href={session.meeting_link} target="_blank" rel="noopener noreferrer">
          Join
        </a>
      )}
    </li>
  );
}

// Khối "Upcoming Sessions" (Figma: Upcoming Classes)
export default function UpcomingSessionList({ section, onRetry }) {
  return (
    <SectionCard title="Upcoming Sessions" action={<SectionCount section={section} label="Next 7 days" />}>
      <SectionContent
        section={section}
        onRetry={onRetry}
        emptyIcon={CalendarClock}
        emptyTitle="No sessions in the next 7 days"
        emptyDescription="Scheduled sessions of your classes will appear here."
      >
        <ul className="student-list">
          {section.items.map((session) => (
            <SessionRow key={session._id} session={session} />
          ))}
        </ul>
      </SectionContent>
    </SectionCard>
  );
}
