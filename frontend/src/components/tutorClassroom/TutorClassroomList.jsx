import { BookOpen, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

function TutorClassroomRow({ classroom }) {
  const details = [];
  if (classroom.subject) {
    details.push(classroom.subject);
  }
  if (classroom.grade) {
    details.push(classroom.grade);
  }
  if (classroom.capacity) {
    details.push(`Capacity: ${classroom.capacity}`);
  }

  return (
    <li className="classroom-card">
      <div className="classroom-card-main">
        <span className="tutor-classroom-icon" aria-hidden="true">
          <BookOpen size={18} />
        </span>
        <div className="item-row-body">
          <div className="item-row-heading">
            <p className="item-title">{classroom.name || 'Untitled class'}</p>
            <span className="status-badge tone-success">{classroom.status}</span>
          </div>
          {details.length > 0 && <p className="item-meta">{details.join(' · ')}</p>}
          {classroom.description && <p className="item-note">{classroom.description}</p>}
        </div>
      </div>
      <div className="classroom-card-footer">
        <Link
          to={`/tutor/classes/${classroom._id}`}
          state={{ classroom: classroom }}
          className="btn btn-primary btn-sm"
        >
          <span>View class</span>
          <ArrowUpRight size={14} aria-hidden="true" />
        </Link>
      </div>
    </li>
  );
}

export default function TutorClassroomList({ classrooms }) {
  return (
    <ul className="classroom-card-list">
      {classrooms.map((classroom) => (
        <TutorClassroomRow key={classroom._id} classroom={classroom} />
      ))}
    </ul>
  );
}
