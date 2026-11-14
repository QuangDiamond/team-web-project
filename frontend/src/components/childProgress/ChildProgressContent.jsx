import { useCallback, useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import { useSummary } from '../../hooks/useSummary';
import { getChildScoreTrend, getChildSummary } from '../../services/childProgressService';
import Alert from '../common/Alert';
import AttendanceList from './AttendanceList';
import ChildClassList from './ChildClassList';
import ChildSessionList from './ChildSessionList';
import ProgressStats from './ProgressStats';
import ResultDetailModal from './ResultDetailModal';
import ResultList from './ResultList';
import ScoreTrendChart from './ScoreTrendChart';

const TREND_POINT_COUNT = 10;

// Toàn bộ nội dung tiến độ của một người con. Trang cha dùng key={childId} để đổi con thì tải lại từ đầu
export default function ChildProgressContent({ childId }) {
  const [openedResult, setOpenedResult] = useState(null);

  const fetchSummary = useCallback(() => getChildSummary(childId), [childId]);
  const summary = useSummary(fetchSummary);
  const fetchTrend = useCallback(() => getChildScoreTrend(childId, { page: 1, limit: TREND_POINT_COUNT }), [childId]);
  const trend = useSummary(fetchTrend);

  if (summary.loading) {
    return (
      <div className="page-loading-inline" role="status">
        <LoaderCircle size={26} className="spin" aria-hidden="true" />
        <span className="visually-hidden">Đang tải...</span>
      </div>
    );
  }

  if (summary.error) {
    return (
      <Alert type="error">
        <p>{summary.error.message}</p>
        <button type="button" className="btn btn-outline btn-sm" onClick={summary.reload}>Thử lại</button>
      </Alert>
    );
  }

  let trendItems = [];
  if (trend.data) {
    trendItems = trend.data.items;
  }

  return (
    <div className="child-progress-content">
      <ProgressStats summary={summary.data} />

      <div className="child-progress-grid">
        <div className="child-progress-column">
          {trend.error ? (
            <Alert type="error">
              <p>{trend.error.message}</p>
              <button type="button" className="btn btn-outline btn-sm" onClick={trend.reload}>Thử lại</button>
            </Alert>
          ) : (
            <ScoreTrendChart items={trendItems} />
          )}
          <ResultList childId={childId} onOpenDetail={setOpenedResult} />
        </div>
        <div className="child-progress-column">
          <ChildSessionList childId={childId} />
          <ChildClassList childId={childId} />
          <AttendanceList childId={childId} />
        </div>
      </div>

      {openedResult && <ResultDetailModal childId={childId} result={openedResult} onClose={() => setOpenedResult(null)} />}
    </div>
  );
}
