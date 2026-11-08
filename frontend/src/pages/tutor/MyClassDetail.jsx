import { useState } from 'react';
import { ArrowLeft, BookOpen, CalendarDays, Clock3, FileText } from 'lucide-react';
import { Link, useLocation, useParams } from 'react-router-dom';
import Alert from '../../components/common/Alert';
import { CLASSROOM_DETAIL_PREVIEW } from '../../constants/classroomPreviewData';
import '../../styles/classDetail.css';

const CLASS_TABS = [
  { id: 'materials', label: 'Materials & Topics', Icon: BookOpen },
  { id: 'schedule', label: 'Schedule of Class', Icon: CalendarDays },
];

function MaterialsAndTopics({ classroom }) {
  return (
    <div className="class-detail-content-grid">
      <section className="class-detail-section" aria-labelledby="class-topics-title">
        <div className="class-detail-section-heading">
          <span className="class-detail-section-icon" aria-hidden="true"><BookOpen size={18} /></span>
          <div>
            <h2 id="class-topics-title">Topics</h2>
            <p>Learning plan for this class</p>
          </div>
        </div>
        <ol className="class-topic-list">
          {classroom.topics.map((topic, index) => (
            <li key={topic}>
              <span className="class-topic-number">{String(index + 1).padStart(2, '0')}</span>
              <span>{topic}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="class-detail-section" aria-labelledby="class-materials-title">
        <div className="class-detail-section-heading">
          <span className="class-detail-section-icon" aria-hidden="true"><FileText size={18} /></span>
          <div>
            <h2 id="class-materials-title">Materials</h2>
            <p>Resources shared with students</p>
          </div>
        </div>
        <ul className="class-material-list">
          {classroom.materials.map((material) => (
            <li key={material._id} className="class-material-row">
              <span className="class-material-file-icon" aria-hidden="true"><FileText size={17} /></span>
              <span className="class-material-copy">
                <span className="class-material-title">{material.title}</span>
                <span className="class-material-detail">{material.type} · {material.detail}</span>
              </span>
              <button type="button" className="btn btn-outline btn-sm" disabled>Open</button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function ClassSchedule({ sessions }) {
  return (
    <section className="class-detail-section class-schedule-section" aria-labelledby="class-schedule-title">
      <div className="class-detail-section-heading">
        <span className="class-detail-section-icon" aria-hidden="true"><CalendarDays size={18} /></span>
        <div>
          <h2 id="class-schedule-title">Weekly schedule</h2>
          <p>Regular meeting times for this class</p>
        </div>
      </div>
      <ul className="class-schedule-list">
        {sessions.map((session) => (
          <li key={session._id} className="class-schedule-row">
            <span className="class-schedule-day">{session.day}</span>
            <span className="class-schedule-time"><Clock3 size={15} aria-hidden="true" />{session.time}</span>
            <span className="class-schedule-location">{session.location}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function MyClassDetail() {
  const { classId } = useParams();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('materials');
  const classroom = location.state && location.state.classroom;

  if (!classroom || String(classroom._id) !== classId) {
    return (
      <div className="class-detail-page">
        <Alert type="info">
          <p>Open this class from My Class to load its details.</p>
          <Link to="/tutor/classes" className="link">Back to My Class</Link>
        </Alert>
      </div>
    );
  }

  const classMeta = [];
  if (classroom.subject) {
    classMeta.push(classroom.subject);
  }
  if (classroom.grade) {
    classMeta.push(classroom.grade);
  }

  return (
    <div className="class-detail-page">
      <Link to="/tutor/classes" className="class-detail-back-link">
        <ArrowLeft size={16} aria-hidden="true" />
        <span>Back to My Class</span>
      </Link>

      <Alert type="info">
        <p className="class-detail-preview-note">Class materials, topics, and schedule shown here are preview content.</p>
      </Alert>

      <section className="class-detail-hero">
        <div className="class-detail-hero-top">
          <div className="class-detail-icon" aria-hidden="true"><BookOpen size={22} /></div>
          <span className="status-badge tone-success">{classroom.status}</span>
        </div>
        <h1>{classroom.name || 'Untitled class'}</h1>
        {classMeta.length > 0 && <p className="class-detail-subtitle">{classMeta.join(' · ')}</p>}
        {classroom.description && <p className="class-detail-description">{classroom.description}</p>}
        {classroom.capacity !== null && classroom.capacity !== undefined && (
          <div className="class-detail-facts"><span>Capacity {classroom.capacity}</span></div>
        )}
      </section>

      <div className="class-detail-tabs" role="tablist" aria-label="Class details">
        {CLASS_TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            id={`tab-${id}`}
            className={activeTab === id ? 'class-detail-tab is-active' : 'class-detail-tab'}
            role="tab"
            aria-selected={activeTab === id}
            aria-controls={`panel-${id}`}
            onClick={() => setActiveTab(id)}
          >
            <Icon size={16} aria-hidden="true" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      <div
        id={`panel-${activeTab}`}
        className="class-detail-tab-panel"
        role="tabpanel"
        aria-labelledby={`tab-${activeTab}`}
        tabIndex={0}
      >
        {activeTab === 'materials' && <MaterialsAndTopics classroom={CLASSROOM_DETAIL_PREVIEW} />}
        {activeTab === 'schedule' && <ClassSchedule sessions={CLASSROOM_DETAIL_PREVIEW.schedule} />}
      </div>
    </div>
  );
}
