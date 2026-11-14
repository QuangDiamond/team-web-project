import { useCallback, useState } from 'react';
import { Award } from 'lucide-react';
import { usePagedList } from '../../hooks/usePagedList';
import { getChildResults } from '../../services/childProgressService';
import ListState from '../common/ListState';
import Pagination from '../common/Pagination';
import SectionCard from '../common/SectionCard';
import { formatDate } from '../../utils/dateFormat';
import { formatPercent, formatScore, getScoreTone } from './progressLabels';

const PAGE_SIZE = 5;

// Cắt nhận xét dài để danh sách gọn; xem đủ trong chi tiết
const shortenFeedback = (text) => {
  if (!text) {
    return '';
  }
  if (text.length <= 120) {
    return text;
  }
  return `${text.slice(0, 120)}…`;
};

function ResultRow({ result, onOpenDetail }) {
  const metaParts = [];
  if (result.class) {
    metaParts.push(result.class.name);
  }
  if (result.graded_at) {
    metaParts.push(`Chấm ngày ${formatDate(result.graded_at)}`);
  }

  return (
    <li className="progress-row is-top-aligned">
      <div className="progress-row-body">
        <div className="progress-row-heading">
          <p className="progress-row-title">{result.assignment_title}</p>
          <span className={`status-badge tone-${getScoreTone(result.score_percent)}`}>
            {formatScore(result.final_score, result.total_points)} · {formatPercent(result.score_percent)}
          </span>
        </div>
        <p className="progress-row-meta">{metaParts.join(' · ')}</p>
        {result.has_auto_graded && (
          <p className="progress-row-meta">
            Trắc nghiệm tự chấm: {result.auto_graded_points} điểm · Gia sư chấm: {result.manual_points} điểm
          </p>
        )}
        {result.overall_feedback && <p className="progress-row-note">“{shortenFeedback(result.overall_feedback)}”</p>}
      </div>
      <button type="button" className="btn btn-outline btn-sm" onClick={() => onOpenDetail(result)}>
        Xem chi tiết
      </button>
    </li>
  );
}

// Kết quả các bài tập đã được gia sư công bố (bước 3 của UC35); mở một kết quả để xem chi tiết (bước 4)
export default function ResultList({ childId, onOpenDetail }) {
  const [page, setPage] = useState(1);
  const fetchPage = useCallback((params) => getChildResults(childId, params), [childId]);
  const list = usePagedList(fetchPage, { page: page, limit: PAGE_SIZE });

  return (
    <SectionCard title="Kết quả bài tập">
      <ListState
        list={list}
        empty={{ icon: Award, title: 'Chưa có kết quả nào', description: 'Điểm và nhận xét hiện ở đây sau khi gia sư công bố kết quả bài tập.' }}
      >
        {list.data && (
          <ul className="progress-list">
            {list.data.items.map((result) => (
              <ResultRow key={result._id} result={result} onOpenDetail={onOpenDetail} />
            ))}
          </ul>
        )}
      </ListState>
      {list.data && <Pagination pagination={list.data.pagination} onPageChange={setPage} />}
    </SectionCard>
  );
}
