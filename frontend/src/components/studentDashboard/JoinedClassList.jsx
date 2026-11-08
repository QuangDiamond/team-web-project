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
    metaParts.push(`Gia sư: ${classroom.tutor_name}`);
  }
  if (classroom.joined_at) {
    metaParts.push(`Tham gia lúc ${formatDate(classroom.joined_at)}`);
  }

  return (
    <li className="student-list-row">
      <span className="student-row-icon" aria-hidden="true">
        <BookOpen size={18} />
      </span>
      <div className="student-row-body">
        <div className="student-row-heading">
          <p className="student-row-title">{classroom.name}</p>
          <span className="status-badge tone-success">Đang hoạt động</span>
        </div>
        <p className="student-row-meta">{metaParts.join(' · ')}</p>
      </div>
    </li>
  );
}

// Khối "Joined Classes" (Figma: SectionClasses)
export default function JoinedClassList({ section, onRetry }) {
  return (
    <SectionCard title="Lớp đã tham gia" action={<SectionCount section={section} label="Đang hoạt động" />}>
      <SectionContent
        section={section}
        onRetry={onRetry}
        emptyIcon={School}
        emptyTitle="Bạn chưa tham gia lớp nào"
        emptyDescription="Các lớp bạn tham gia bằng mã hoặc liên kết mời sẽ hiển thị ở đây."
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
