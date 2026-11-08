import { Award } from 'lucide-react';
import SectionCard from '../common/SectionCard';
import SectionContent from './SectionContent';
import SectionCount from './SectionCount';
import { formatDate } from '../../utils/dateFormat';

// Phần trăm điểm, null nếu không tính được (thiếu điểm hoặc total_points)
const getScorePercent = (grade) => {
  if (grade.final_score === null || grade.final_score === undefined) {
    return null;
  }
  if (!grade.total_points) {
    return null;
  }
  const percent = Math.round((grade.final_score / grade.total_points) * 100);
  return Math.max(0, Math.min(100, percent));
};

// Màu thanh điểm theo Figma (Quiz History): >= 85 xanh, >= 70 vàng, còn lại đỏ
const getScoreTone = (percent) => {
  if (percent >= 85) {
    return 'success';
  }
  if (percent >= 70) {
    return 'warning';
  }
  return 'error';
};

function GradeRow({ grade }) {
  const percent = getScorePercent(grade);

  let scoreText = '—';
  if (grade.final_score !== null && grade.final_score !== undefined) {
    scoreText = String(grade.final_score);
    if (grade.total_points) {
      scoreText = `${grade.final_score}/${grade.total_points}`;
    }
  }

  const metaParts = [];
  if (grade.class) {
    metaParts.push(grade.class.name);
  }
  if (grade.graded_at) {
    metaParts.push(`Graded ${formatDate(grade.graded_at)}`);
  }

  return (
    <li className="student-list-row is-top-aligned">
      <span className="student-score-box">{scoreText}</span>
      <div className="student-row-body">
        <p className="student-row-title">{grade.assignment_title}</p>
        <p className="student-row-meta">{metaParts.join(' · ')}</p>

        {percent !== null && (
          <div className="student-score-bar-row">
            <div
              className="student-score-bar"
              role="progressbar"
              aria-valuenow={percent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Score ${percent}%`}
            >
              {/* width là giá trị động nên dùng inline style */}
              <span className={`student-score-bar-fill tone-${getScoreTone(percent)}`} style={{ width: `${percent}%` }} />
            </div>
            <span className="student-score-percent">{percent}%</span>
          </div>
        )}

        {grade.overall_feedback ? (
          <p className="student-feedback">
            <span className="student-feedback-label">Tutor feedback: </span>
            {grade.overall_feedback}
          </p>
        ) : (
          <p className="student-feedback is-empty">No feedback from tutor.</p>
        )}
      </div>
    </li>
  );
}

// Khối "Scores & Feedback": chỉ điểm tutor đã công bố (Figma: Quiz History)
export default function GradeFeedbackList({ section, onRetry }) {
  return (
    <SectionCard title="Scores & Feedback" action={<SectionCount section={section} label="Latest results" />}>
      <SectionContent
        section={section}
        onRetry={onRetry}
        emptyIcon={Award}
        emptyTitle="No published grades yet"
        emptyDescription="Scores and feedback appear here after your tutor publishes the results."
      >
        <ul className="student-list">
          {section.items.map((grade) => (
            <GradeRow key={grade._id} grade={grade} />
          ))}
        </ul>
      </SectionContent>
    </SectionCard>
  );
}
