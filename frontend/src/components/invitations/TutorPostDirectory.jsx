import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FileText, Search } from 'lucide-react';
import { usePagedList } from '../../hooks/usePagedList';
import { searchPosts } from '../../services/discoveryService';
import { formatBudget, getModeLabel } from '../../constants/requestLabels';
import { formatDate } from '../../utils/dateFormat';
import { getInitials } from '../../utils/getInitials';
import ListState from '../common/ListState';
import Pagination from '../common/Pagination';
import TutorSearchFilters from './TutorSearchFilters';

const PAGE_SIZE = 9;

function PostCard({ post }) {
  const tags = [post.subject_name, post.grade_level, getModeLabel(post.teaching_mode)].filter(Boolean);
  let priceText = 'Liên hệ học phí';
  if (post.price !== null && post.price !== undefined) {
    priceText = formatBudget(post.price);
  }

  return (
    <li className="directory-card">
      <div className="directory-card-header">
        {post.tutor.avatar_url
          ? <img className="tutor-row-avatar" src={post.tutor.avatar_url} alt="" loading="lazy" />
          : <span className="tutor-row-avatar" aria-hidden="true">{getInitials(post.tutor.full_name)}</span>}
        <div className="directory-card-name">
          <p className="directory-card-subject">{post.tutor.full_name}</p>
          <h2 className="directory-card-title">{post.title}</h2>
        </div>
      </div>
      {tags.length > 0 && (
        <ul className="directory-category-tags" aria-label="Môn học, trình độ và hình thức">
          {tags.map((tag) => <li key={tag}>{tag}</li>)}
        </ul>
      )}
      <p className="directory-card-description">{post.description}</p>
      {post.schedule && <p className="directory-card-subject">Lịch dạy: {post.schedule}</p>}
      <p className="directory-card-price">
        <span className="directory-price-tag">{priceText}</span>
      </p>
      <p className="item-meta">Đăng ngày {formatDate(post.created_at)}</p>
      <div className="directory-card-actions">
        <Link to={`/tutors/${post.tutor.profile_id}`} className="btn btn-outline btn-sm">Xem hồ sơ gia sư</Link>
      </div>
    </li>
  );
}

// Tab "Bài đăng" của trang /tutors: bài đăng công khai (PUBLISHED) của gia sư, mới nhất trước
export default function TutorPostDirectory() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState(() => Object.fromEntries(searchParams));

  const params = { ...Object.fromEntries(searchParams), limit: PAGE_SIZE };
  delete params.tab;
  const list = usePagedList(searchPosts, params);

  const handleSearch = (event) => {
    event.preventDefault();
    const query = { tab: 'posts' };
    for (const [key, value] of Object.entries(filters)) {
      if (key !== 'page' && key !== 'tab' && value.trim()) {
        query[key] = value.trim();
      }
    }
    setSearchParams(query);
  };

  const handlePageChange = (page) => {
    const query = new URLSearchParams(searchParams);
    query.set('page', String(page));
    setSearchParams(query);
  };

  const handleClearFilters = () => {
    setFilters({});
    setSearchParams({ tab: 'posts' });
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
              placeholder="Tiêu đề, môn học hoặc nội dung bài đăng..."
              aria-label="Tìm bài đăng theo tiêu đề, môn học hoặc nội dung"
              maxLength={100}
            />
          </div>
          <button type="submit" className="btn btn-primary">
            <span>Tìm kiếm</span>
          </button>
        </div>
        <TutorSearchFilters filters={filters} onChange={setFilters} forPosts />
        <div className="directory-results-toolbar">
          <button type="button" className="btn btn-outline btn-sm" onClick={handleClearFilters}>Xóa bộ lọc</button>
          {list.pagination && <p className="item-meta" role="status">Tìm thấy {list.pagination.total} bài đăng</p>}
        </div>
      </form>

      <ListState
        list={list}
        empty={{ icon: FileText, title: 'Không tìm thấy bài đăng', description: 'Hãy thử từ khóa khác hoặc giảm bớt bộ lọc.' }}
      >
        {list.data && (
          <ul className="directory-grid directory-grid-3">
            {list.data.items.map((post) => <PostCard key={post._id} post={post} />)}
          </ul>
        )}
      </ListState>

      {list.data && <Pagination pagination={list.data.pagination} onPageChange={handlePageChange} disabled={list.loading} numbered />}
    </div>
  );
}
