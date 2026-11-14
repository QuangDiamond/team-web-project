import { useCallback } from 'react';
import { LoaderCircle } from 'lucide-react';
import { useSummary } from '../../hooks/useSummary';
import { getChildResultDetail } from '../../services/childProgressService';
import Alert from '../common/Alert';
import Modal from '../common/Modal';
import { formatDate } from '../../utils/dateFormat';
import { getAttachmentUrl } from '../../utils/fileUrl';
import { QUESTION_TYPE, TIMELINESS, formatPercent, formatScore, getScoreTone } from './progressLabels';

function QuestionBlock({ question }) {
  const answer = question.answer;
  const isMultipleChoice = question.question_type === 'MULTIPLE_CHOICE';
  const typeLabel = QUESTION_TYPE[question.question_type] || question.question_type;

  let answerText = 'Không trả lời';
  if (answer && answer.text_response) {
    answerText = answer.text_response;
  }

  let isCorrect = false;
  if (isMultipleChoice && answer && question.correct_answer) {
    isCorrect = answer.text_response === question.correct_answer;
  }

  return (
    <li className="result-question">
      <div className="progress-row-heading">
        <p className="progress-row-title">Câu {question.question_number} · {typeLabel}</p>
        <span className="status-badge tone-info">{formatScore(answer ? answer.score : null, question.points)} điểm</span>
        {answer && answer.is_auto_graded && <span className="status-badge tone-success">Máy tự chấm</span>}
        {answer && answer.is_overridden && <span className="status-badge tone-warning">Gia sư đã sửa điểm</span>}
      </div>
      <p className="result-question-content">{question.content}</p>

      <p className="progress-row-meta">Bài làm của con</p>
      <p className="result-answer">{answerText}</p>
      {answer && answer.file_url && (
        <a className="link" href={getAttachmentUrl(answer.file_url)} target="_blank" rel="noopener noreferrer">Xem file bài làm</a>
      )}

      {isMultipleChoice && question.correct_answer && (
        <p className={isCorrect ? 'result-verdict is-correct' : 'result-verdict is-wrong'}>
          {isCorrect ? 'Đúng' : `Chưa đúng. Đáp án đúng: ${question.correct_answer}`}
        </p>
      )}
      {answer && answer.comment && <p className="progress-row-note">Nhận xét của gia sư: “{answer.comment}”</p>}
    </li>
  );
}

// Chi tiết một kết quả bài tập của con: điểm từng câu, phần trắc nghiệm tự chấm và nhận xét của gia sư (bước 4 của UC35)
export default function ResultDetailModal({ childId, result, onClose }) {
  const fetchDetail = useCallback(() => getChildResultDetail(childId, result._id), [childId, result._id]);
  const detail = useSummary(fetchDetail);

  let content;
  if (detail.loading) {
    content = (
      <div className="page-loading-inline" role="status">
        <LoaderCircle size={26} className="spin" aria-hidden="true" />
        <span className="visually-hidden">Đang tải...</span>
      </div>
    );
  } else if (detail.error) {
    content = (
      <Alert type="error">
        <p>{detail.error.message}</p>
        <button type="button" className="btn btn-outline btn-sm" onClick={detail.reload}>Thử lại</button>
      </Alert>
    );
  } else {
    const data = detail.data;
    const metaParts = [];
    if (data.class) {
      metaParts.push(data.class.name);
    }
    if (data.graded_at) {
      metaParts.push(`Chấm ngày ${formatDate(data.graded_at)}`);
    }
    if (data.timeliness && TIMELINESS[data.timeliness]) {
      metaParts.push(TIMELINESS[data.timeliness]);
    }

    content = (
      <div className="result-detail">
        <div className="progress-row-heading">
          <span className={`status-badge tone-${getScoreTone(data.score_percent)}`}>
            {formatScore(data.final_score, data.total_points)} · {formatPercent(data.score_percent)}
          </span>
          <p className="progress-row-meta">{metaParts.join(' · ')}</p>
        </div>

        {data.has_auto_graded && (
          <p className="progress-row-meta">
            Trắc nghiệm tự chấm: {data.auto_graded_points} điểm · Gia sư chấm: {data.manual_points} điểm
          </p>
        )}
        {data.instructions && <p className="result-instructions">{data.instructions}</p>}

        <h3 className="result-heading">Nhận xét chung của gia sư</h3>
        {data.overall_feedback ? (
          <p className="result-feedback">{data.overall_feedback}</p>
        ) : (
          <p className="progress-row-meta">Gia sư chưa để lại nhận xét chung.</p>
        )}

        <h3 className="result-heading">Chi tiết từng câu</h3>
        {data.questions.length === 0 ? (
          <p className="progress-row-meta">Bài tập này không có câu hỏi chi tiết.</p>
        ) : (
          <ol className="result-questions">
            {data.questions.map((question) => (
              <QuestionBlock key={question.question_id} question={question} />
            ))}
          </ol>
        )}
      </div>
    );
  }

  return (
    <Modal title={result.assignment_title} onClose={onClose} className="child-result-modal">
      {content}
    </Modal>
  );
}
