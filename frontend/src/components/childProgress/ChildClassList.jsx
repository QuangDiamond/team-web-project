import { useCallback, useState } from 'react';
import { BookOpen, School } from 'lucide-react';
import { usePagedList } from '../../hooks/usePagedList';
import { getChildClasses } from '../../services/childProgressService';
import ListState from '../common/ListState';
import Pagination from '../common/Pagination';
import SectionCard from '../common/SectionCard';

const PAGE_SIZE = 5;

// Các lớp con đang tham gia (bước 2 của UC35)
export default function ChildClassList({ childId }) {
  const [page, setPage] = useState(1);
  const fetchPage = useCallback((params) => getChildClasses(childId, params), [childId]);
  const list = usePagedList(fetchPage, { page: page, limit: PAGE_SIZE });

  return (
    <SectionCard title="Lớp đang học">
      <ListState
        list={list}
        empty={{ icon: School, title: 'Chưa tham gia lớp nào', description: 'Các lớp con tham gia sẽ hiển thị ở đây.' }}
      >
        {list.data && (
          <ul className="progress-list">
            {list.data.items.map((classroom) => {
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
              return (
                <li key={classroom._id} className="progress-row">
                  <span className="progress-row-icon" aria-hidden="true"><BookOpen size={18} /></span>
                  <div className="progress-row-body">
                    <p className="progress-row-title">{classroom.name}</p>
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
