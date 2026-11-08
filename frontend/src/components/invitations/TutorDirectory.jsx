import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Users } from 'lucide-react';
import { usePagedList } from '../../hooks/usePagedList';
import { getInvitableTutors } from '../../services/invitationService';
import { formatBudget } from '../../constants/requestLabels';
import { getInitials } from '../../utils/getInitials';
import Alert from '../common/Alert';
import ListState from '../common/ListState';
import Pagination from '../common/Pagination';
import InviteTutorDialog from '../publicProfile/InviteTutorDialog';

const PAGE_SIZE = 10;

function RatingText({ rating }) {
  if (rating === null || rating === undefined) {
    return <span>No reviews yet</span>;
  }
  return <span>★ {Number(rating).toFixed(1)}</span>;
}

function TutorRow({ tutor, onInvite }) {
  let subjectText = 'No published posts yet';
  if (tutor.subjects.length > 0) {
    subjectText = tutor.subjects.join(', ');
  }
  let priceText = '';
  if (tutor.min_price !== null) {
    priceText = ` · From ${formatBudget(tutor.min_price)}`;
  }

  return (
    <li className="item-row">
      <span className="tutor-row-avatar" aria-hidden="true">{getInitials(tutor.full_name)}</span>
      <div className="item-row-body">
        <div className="item-row-heading">
          <Link to={`/tutors/${tutor.profile_id}`} className="item-title">{tutor.full_name}</Link>
          <span className="item-meta"><RatingText rating={tutor.average_rating} /></span>
        </div>
        {tutor.headline && <p className="item-meta">{tutor.headline}</p>}
        <p className="item-meta">{subjectText}{priceText}</p>
      </div>
      <div className="item-actions">
        <Link to={`/tutors/${tutor.profile_id}`} className="btn btn-outline btn-sm">View details</Link>
        <button type="button" className="btn btn-primary btn-sm" onClick={() => onInvite(tutor)}>Invite</button>
      </div>
    </li>
  );
}

// Tất cả gia sư đang hoạt động: xem chi tiết (hồ sơ công khai) và mời vào một request đang mở (UC14)
export default function TutorDirectory() {
  const [page, setPage] = useState(1);
  const [searchText, setSearchText] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [invitingTutor, setInvitingTutor] = useState(null);
  const [notice, setNotice] = useState('');

  const params = { page: page, limit: PAGE_SIZE };
  if (appliedSearch) {
    params.q = appliedSearch;
  }
  const list = usePagedList(getInvitableTutors, params);

  const handleSearch = (event) => {
    event.preventDefault();
    setPage(1);
    setAppliedSearch(searchText.trim());
  };

  const handleInvited = (result) => {
    setNotice(`Invitation sent to ${invitingTutor.full_name}. You have ${result.remaining_credits} credit(s) left.`);
    setInvitingTutor(null);
  };

  return (
    <div className="page-stack">
      <div className="page-toolbar">
        <p className="item-meta">Active tutors on TuConnector. Open a profile to see more, or invite a tutor to one of your requests (1 credit).</p>
        <form className="tutor-search" role="search" onSubmit={handleSearch}>
          <input
            type="search"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="Search by name"
            aria-label="Search tutors by name"
            maxLength={100}
          />
          <button type="submit" className="btn btn-outline btn-sm">
            <Search size={14} aria-hidden="true" />
            <span>Search</span>
          </button>
        </form>
      </div>

      {notice && <Alert type="success">{notice}</Alert>}

      <ListState
        list={list}
        empty={{ icon: Users, title: 'No tutors found', description: 'Try a different name.' }}
      >
        {list.data && (
          <ul className="item-list">
            {list.data.items.map((tutor) => (
              <TutorRow key={tutor.profile_id} tutor={tutor} onInvite={setInvitingTutor} />
            ))}
          </ul>
        )}
      </ListState>

      {list.data && <Pagination pagination={list.data.pagination} onPageChange={setPage} />}

      {invitingTutor && (
        <InviteTutorDialog
          profile={{ _id: invitingTutor.profile_id, full_name: invitingTutor.full_name }}
          onClose={() => setInvitingTutor(null)}
          onInvited={handleInvited}
        />
      )}
    </div>
  );
}
