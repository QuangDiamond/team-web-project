import { useCallback, useState } from 'react';
import { CalendarClock, Video } from 'lucide-react';
import { usePagedList } from '../../hooks/usePagedList';
import { getChildUpcomingSessions } from '../../services/childProgressService';
import ListState from '../common/ListState';
import Pagination from '../common/Pagination';
import SectionCard from '../common/SectionCard';
import { formatRelativeDay, formatTime } from '../../utils/dateFormat';

const PAGE_SIZE = 5;

// Buổi học sắp tới của con trong 7 ngày (bước 2 của UC35)
export default function ChildSessionList({ childId }) {
  const [page, setPage] = useState(1);
  const fetchPage = useCallback((params) => getChildUpcomingSessions(childId, params), [childId]);
  const list = usePagedList(fetchPage, { page: page, limit: PAGE_SIZE });

  return (
    <SectionCard title="Buổi học sắp tới" action={<span className="progress-count">Trong 7 ngày tới</span>}>
      <ListState
        list={list}
        empty={{ icon: CalendarClock, title: 'Không có buổi học trong 7 ngày tới', description: 'Lịch học của các lớp con tham gia sẽ hiển thị ở đây.' }}
      >
        {list.data && (
          <ul className="progress-list">
            {list.data.items.map((session) => {
              let className = '';
              if (session.class) {
                className = session.class.name;
              }
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
              return (
                <li key={session._id} className="progress-row">
                  <span className="progress-row-icon" aria-hidden="true"><Video size={18} /></span>
                  <div className="progress-row-body">
                    <p className="progress-row-title">{title}</p>
                    <p className="progress-row-meta">{metaParts.join(' · ')}</p>
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
