import { Link } from 'react-router-dom';
import SectionCard from '../common/SectionCard';
import Pagination from '../common/Pagination';
import { formatVnd } from '../../utils/formatCurrency';
import { getModeLabel } from '../../constants/requestLabels';

export default function ProfilePosts({ list, role, onPageChange, onApply, appliedIds }) {
  const isTutor = role === 'TUTOR';
  return (
    <SectionCard title={isTutor ? 'Teaching posts & availability' : 'Open tutoring requests'}>
      {list.items.length === 0 && <p className="item-meta">{isTutor ? 'No published posts yet.' : 'No open requests right now.'}</p>}
      <ul className="public-profile-list">
        {list.items.map((item) => (
          <li key={item._id}>
            <h3>{item.title}</h3>
            <p className="item-meta">{item.subject_name} · {item.grade_level} · {getModeLabel(item.teaching_mode)}</p>
            <p className="public-profile-rate">{formatVnd(isTutor ? item.price : item.budget)} / session</p>
            <p className="public-profile-text">{item.description}</p>
            {item.schedule && <p className="item-meta">Schedule: {item.schedule}</p>}
            {!isTutor && (
              <div className="public-profile-request-actions">
                <Link to={`/tutor/requests/${item._id}`} className="link">View request</Link>
                {onApply && <button type="button" className="btn btn-primary btn-sm"
                  disabled={appliedIds.includes(item._id)} onClick={() => onApply(item)}>
                  {appliedIds.includes(item._id) ? 'Applied' : 'Apply'}
                </button>}
              </div>
            )}
          </li>
        ))}
      </ul>
      <Pagination pagination={list.pagination} onPageChange={onPageChange} label={isTutor ? 'Teaching posts pages' : 'Open requests pages'} />
    </SectionCard>
  );
}
