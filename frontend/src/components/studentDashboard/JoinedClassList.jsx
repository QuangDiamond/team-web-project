import { BookOpen, School } from 'lucide-react';
import SectionCard from '../common/SectionCard';
import SectionContent from './SectionContent';
import SectionCount from './SectionCount';
import { formatDate } from '../../utils/dateFormat';

function ClassRow({ classroom }) {
  const metaParts = [];
  if (classroom.subject) {
    metaParts.push(classroom.subject);
  }
  if (classroom.grade) {
    metaParts.push(classroom.grade);
  }
  if (classroom.tutor_name) {
    metaParts.push(`Tutor: ${classroom.tutor_name}`);
  }
  if (classroom.joined_at) {
    metaParts.push(`Joined ${formatDate(classroom.joined_at)}`);
  }

  return (
    <li className="student-list-row">
      <span className="student-row-icon" aria-hidden="true">
        <BookOpen size={18} />
      </span>
      <div className="student-row-body">
        <div className="student-row-heading">
          <p className="student-row-title">{classroom.name}</p>
          <span className="status-badge tone-success">Active</span>
        </div>
        <p className="student-row-meta">{metaParts.join(' · ')}</p>
      </div>
    </li>
  );
}

// Khối "Joined Classes" (Figma: SectionClasses)
export default function JoinedClassList({ section, onRetry }) {
  return (
    <SectionCard title="Joined Classes" action={<SectionCount section={section} label="Active" />}>
      <SectionContent
        section={section}
        onRetry={onRetry}
        emptyIcon={School}
        emptyTitle="You have not joined any class yet"
        emptyDescription="Classes you join with a code or invite link will appear here."
      >
        <ul className="student-list">
          {section.items.map((classroom) => (
            <ClassRow key={classroom._id} classroom={classroom} />
          ))}
        </ul>
      </SectionContent>
    </SectionCard>
  );
}
