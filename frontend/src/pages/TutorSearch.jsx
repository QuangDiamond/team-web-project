import TutorDirectory from '../components/invitations/TutorDirectory';
import { useLocation } from 'react-router-dom';
import '../styles/tutorSearch.css';

export default function TutorSearch() {
  const location = useLocation();
  return (
    <div className="tutor-search-page">
      <header className="directory-hero">
        <h1>Tìm gia sư phù hợp với bạn</h1>
        <p>Khám phá gia sư theo môn học, học phí, hình thức dạy và lịch nhận lớp.</p>
      </header>
      <div className="directory-container"><TutorDirectory key={location.search} /></div>
    </div>
  );
}
