import { useCallback, useState } from 'react';
import { ClipboardCheck } from 'lucide-react';
import { usePagedList } from '../../hooks/usePagedList';
import { getChildAttendance } from '../../services/childProgressService';
import ListState from '../common/ListState';
import Pagination from '../common/Pagination';
import SectionCard from '../common/SectionCard';
import { formatDate, formatTime } from '../../utils/dateFormat';
import { ATTENDANCE_STATUS, formatPercent } from './progressLabels';

const PAGE_SIZE = 6;

// Lịch sử điểm danh của con, buổi gần nhất trước, kèm tỉ lệ chuyên cần (bước 2 của UC35)
export default function AttendanceList({ childId }) {
  const [page, setPage] = useState(1);
  const fetchPage = useCallback((params) => getChildAttendance(childId, params), [childId]);
  const list = usePagedList(fetchPage, { page: page, limit: PAGE_SIZE });

  let headerText = '';
  if (list.data) {
    const summary = list.data.summary;
    if (summary.total > 0) {
      headerText = `${formatPercent(summary.rate)} · ${summary.present} có mặt, ${summary.late} muộn, ${summary.absent} vắng`;
    }
  }

  return (
    <SectionCard title="Điểm danh" action={<span className="progress-count">{headerText}</span>}>
      <ListState
        list={list}
        empty={{ icon: ClipboardCheck, title: 'Chưa có buổi nào được điểm danh', description: 'Gia sư điểm danh sau mỗi buổi học, kết quả sẽ hiện ở đây.' }}
      >
        {list.data && (
          <ul className="progress-list">
            {list.data.items.map((record) => {
              const status = ATTENDANCE_STATUS[record.status];
              const metaParts = [];
              if (record.class) {
                metaParts.push(record.class.name);
              }
              metaParts.push(`${formatDate(record.start_time)} ${formatTime(record.start_time)}`);
              return (
                <li key={`${record.session_id}-${record.start_time}`} className="progress-row">
                  <div className="progress-row-body">
                    <div className="progress-row-heading">
                      <p className="progress-row-title">{record.title || 'Buổi học'}</p>
                      <span className={`status-badge tone-${status.tone}`}>{status.label}</span>
                    </div>
                    <p className="progress-row-meta">{metaParts.join(' · ')}</p>
                    {record.comment && <p className="progress-row-note">“{record.comment}”</p>}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </ListState>
      {list.data && <Pagination pagination={list.data.pagination} onPageChange={setPage} />}
    </SectionCard>
  );
}
