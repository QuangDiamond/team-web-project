import { BookOpen, CalendarDays, Star } from 'lucide-react';

const SECTIONS = [
  { value: 'about', label: 'Giới thiệu', Icon: BookOpen },
  { value: 'reviews', label: 'Đánh giá', Icon: Star },
  { value: 'posts', label: 'Bài đăng và lịch dạy', Icon: CalendarDays },
];

export default function ProfileSections({ activeSection, onSectionChange, reviewCount, children }) {
  return (
    <div className="public-profile-content-card">
      <div className="public-profile-tabs" role="group" aria-label="Nội dung hồ sơ">
        {SECTIONS.map(({ value, label, Icon }) => (
          <button key={value} id={`profile-section-${value}`} type="button"
            aria-pressed={activeSection === value} aria-controls="public-profile-content"
            onClick={() => onSectionChange(value)}>
            <Icon size={17} aria-hidden="true" />
            <span>{label}</span>
            {value === 'reviews' && <span className="public-profile-tab-count">{reviewCount}</span>}
          </button>
        ))}
      </div>
      <div id="public-profile-content" role="region" aria-labelledby={`profile-section-${activeSection}`} className="public-profile-content-body">
        {children}
      </div>
    </div>
  );
}
