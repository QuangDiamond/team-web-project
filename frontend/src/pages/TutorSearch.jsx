import TutorDirectory from '../components/invitations/TutorDirectory';
import TutorPostDirectory from '../components/invitations/TutorPostDirectory';
import { useLocation, useSearchParams } from 'react-router-dom';
import '../styles/tutorSearch.css';

const TABS = [
  { value: 'tutors', label: 'Gia sư' },
  { value: 'posts', label: 'Bài đăng' },
];

export default function TutorSearch() {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  let activeTab = 'tutors';
  if (searchParams.get('tab') === 'posts') {
    activeTab = 'posts';
  }

  // Đổi tab thì bỏ bộ lọc của tab cũ vì hai tab lọc theo dữ liệu khác nhau
  const handleTabChange = (tab) => {
    if (tab === 'posts') {
      setSearchParams({ tab: 'posts' });
    } else {
      setSearchParams({});
    }
  };

  let directory = <TutorDirectory key={location.search} />;
  if (activeTab === 'posts') {
    directory = <TutorPostDirectory key={location.search} />;
  }

  return (
    <div className="tutor-search-page">
      <header className="directory-hero">
        <h1>Tìm gia sư phù hợp với bạn</h1>
        <p>Khám phá gia sư theo môn học, học phí, hình thức dạy và lịch nhận lớp.</p>
        <div className="directory-tabs" role="tablist" aria-label="Xem gia sư hoặc bài đăng">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.value}
              className={activeTab === tab.value ? 'is-active' : ''}
              onClick={() => handleTabChange(tab.value)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>
      <div className="directory-container">{directory}</div>
    </div>
  );
}
