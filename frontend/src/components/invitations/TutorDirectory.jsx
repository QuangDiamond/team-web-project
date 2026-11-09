import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Star, Users } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { usePagedList } from '../../hooks/usePagedList';
import { searchTutors } from '../../services/discoveryService';
import { formatBudget } from '../../constants/requestLabels';
import { getInitials } from '../../utils/getInitials';
import Alert from '../common/Alert';
import ListState from '../common/ListState';
import Pagination from '../common/Pagination';
import InviteTutorDialog from '../publicProfile/InviteTutorDialog';
import TutorSearchFilters from './TutorSearchFilters';

const PAGE_SIZE = 12;

function RatingText({ rating }) {
  if (rating === null || rating === undefined) {
    return <span>Chưa có đánh giá</span>;
  }
  return <span className="directory-rating"><Star size={15} aria-hidden="true" /> {Number(rating).toFixed(1)}</span>;
}

function TutorRow({ tutor, onInvite }) {
  let categories = tutor.teaching_categories || [];
  if (categories.length === 0) {
    categories = tutor.subjects.map((name) => ({ type: 'subjects', category_id: name, name }));
  }
  let priceText = '';
  if (tutor.min_price !== null && tutor.min_price !== undefined) {
    priceText = `Từ ${formatBudget(tutor.min_price)}`;
  }

  return (
    <li className="directory-card">
      <div className="directory-card-header">
        {tutor.avatar_url
          ? <img className="tutor-row-avatar" src={tutor.avatar_url} alt="" loading="lazy" />
          : <span className="tutor-row-avatar" aria-hidden="true">{getInitials(tutor.full_name)}</span>}
        <div className="directory-card-name">
          <h2 className="directory-card-title">{tutor.full_name}</h2>
        </div>
      </div>
      {categories.length > 0 ? (
        <ul className="directory-category-tags" aria-label="Môn học và trình độ giảng dạy">
          {categories.slice(0, 4).map((item) => (
            <li key={`${item.type}:${item.category_id}`}>{item.name}</li>
          ))}
        </ul>
      ) : <p className="directory-card-subject">Chưa cập nhật danh mục giảng dạy</p>}
      <div className="directory-card-meta">
        <RatingText rating={tutor.average_rating} />
        {tutor.availability_status === 'AVAILABLE' && <span>Đang nhận lớp</span>}
      </div>
      <p className="directory-card-description">{tutor.headline || 'Xem hồ sơ để tìm hiểu kinh nghiệm và phương pháp giảng dạy.'}</p>
      <p className="directory-card-price">{priceText || 'Liên hệ học phí'}</p>
      <div className="directory-card-actions">
        <Link to={`/tutors/${tutor.profile_id}`} className="btn btn-outline btn-sm">Xem hồ sơ</Link>
        <button type="button" className="btn btn-primary btn-sm" onClick={() => onInvite(tutor)}>Mời</button>
      </div>
    </li>
  );
}

// SC05: public discovery with Parent-only invitations through the existing UC14 dialog.
export default function TutorDirectory() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState(() => Object.fromEntries(searchParams));
  const [invitingTutor, setInvitingTutor] = useState(null);
  const [notice, setNotice] = useState('');
  const [noticeType, setNoticeType] = useState('success');

  const params = { ...Object.fromEntries(searchParams), limit: PAGE_SIZE };
  delete params.area;
  const list = usePagedList(searchTutors, params);

  const handleSearch = (event) => {
    event.preventDefault();
    const query = {};
    for (const [key, value] of Object.entries(filters)) {
      if (key !== 'page' && key !== 'area' && value.trim()) query[key] = value.trim();
    }
    setSearchParams(query);
  };

  const handleInvite = (tutor) => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (user.role !== 'PARENT') {
      setNoticeType('info');
      setNotice('Chỉ tài khoản phụ huynh mới có thể gửi lời mời gia sư.');
      return;
    }
    setInvitingTutor(tutor);
  };

  const handlePageChange = (page) => {
    const query = new URLSearchParams(searchParams);
    query.set('page', String(page));
    setSearchParams(query);
  };

  const handleInvited = (result) => {
    setNoticeType('success');
    setNotice(`Đã gửi lời mời tới ${invitingTutor.full_name}. Bạn còn ${result.remaining_credits} credits.`);
    setInvitingTutor(null);
  };

  const handleClearFilters = () => {
    setFilters({});
    setSearchParams({});
  };

  return (
    <div className="tutor-directory page-stack">
        <form className="directory-search" role="search" onSubmit={handleSearch}>
          <div className="directory-search-bar">
          <div className="directory-keyword">
          <Search size={20} aria-hidden="true" />
          <input
            name="q"
            type="search"
            value={filters.q || ''}
            onChange={(event) => setFilters({ ...filters, q: event.target.value })}
            placeholder="Tên gia sư, môn học hoặc kỹ năng..."
            aria-label="Tìm gia sư theo tên, môn học hoặc kỹ năng"
            maxLength={100}
          />
          </div>
          <button type="submit" className="btn btn-primary">
            <span>Tìm kiếm</span>
          </button>
          </div>
          <TutorSearchFilters filters={filters} onChange={setFilters} />
          <div className="directory-results-toolbar">
            <button type="button" className="btn btn-outline btn-sm" onClick={handleClearFilters}>Xóa bộ lọc</button>
            {list.pagination && <p className="item-meta" role="status">Tìm thấy {list.pagination.total} gia sư</p>}
          </div>
        </form>

      {notice && <Alert type={noticeType}>{notice}</Alert>}

      <ListState
        list={list}
        empty={{ icon: Users, title: 'Không tìm thấy gia sư', description: 'Hãy thử từ khóa khác hoặc giảm bớt bộ lọc.' }}
      >
        {list.data && (
          <ul className="directory-grid">
            {list.data.items.map((tutor) => (
              <TutorRow key={tutor.profile_id} tutor={tutor} onInvite={handleInvite} />
            ))}
          </ul>
        )}
      </ListState>

      {list.data && <Pagination pagination={list.data.pagination} onPageChange={handlePageChange} disabled={list.loading} />}

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
