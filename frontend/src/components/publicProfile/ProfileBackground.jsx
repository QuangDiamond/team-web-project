import { Award, BriefcaseBusiness, GraduationCap, UserRound } from 'lucide-react';
import SectionCard from '../common/SectionCard';

const SECTIONS = [
  { field: 'experiences', title: 'Kinh nghiệm', name: 'title', subtitle: 'company', Icon: BriefcaseBusiness },
  { field: 'educations', title: 'Học vấn và bằng cấp', name: 'school', subtitle: 'degree', Icon: GraduationCap },
  { field: 'achievements', title: 'Thành tích', name: 'title', subtitle: 'description', Icon: Award },
];

export default function ProfileBackground({ profile }) {
  return (
    <div className="public-profile-background">
      <SectionCard title={<><UserRound size={19} aria-hidden="true" />Giới thiệu</>}>
        <p className="public-profile-text">{profile.bio || 'Gia sư chưa thêm phần giới thiệu.'}</p>
      </SectionCard>
      {SECTIONS.map(({ field, title, name, subtitle, Icon }) => (
        <SectionCard key={field} title={<><Icon size={19} aria-hidden="true" />{title}</>}>
          {profile[field].length === 0 && <p className="item-meta">Chưa có thông tin.</p>}
          <ul className="public-profile-background-list">
            {profile[field].map((item, index) => (
              <li key={index}>
                <span className="public-profile-item-icon"><Icon size={19} aria-hidden="true" /></span>
                <div>
                  <h3>{item[name]}</h3>
                  {item[subtitle] && <p className="public-profile-text">{item[subtitle]}</p>}
                  {item.graduation_year && <p className="item-meta">Năm tốt nghiệp: {item.graduation_year}</p>}
                  {item.start_date && <p className="item-meta">{String(item.start_date).slice(0, 10)} – {item.end_date ? String(item.end_date).slice(0, 10) : 'Hiện tại'}</p>}
                  {field === 'educations' && item.description && <p className="public-profile-text">{item.description}</p>}
                </div>
              </li>
            ))}
          </ul>
        </SectionCard>
      ))}
    </div>
  );
}
