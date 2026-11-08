import SectionCard from '../common/SectionCard';

const SECTIONS = [
  { field: 'experiences', title: "Kinh nghiệm", name: 'title', subtitle: 'company' },
  { field: 'educations', title: "Học vấn", name: 'school', subtitle: 'degree' },
  { field: 'achievements', title: "Thành tích", name: 'title', subtitle: 'description' },
];

export default function ProfileBackground({ profile }) {
  return (
    <>
      <SectionCard title="Giới thiệu">
        <p className="public-profile-text">{profile.bio || "Gia sư chưa thêm phần giới thiệu."}</p>
      </SectionCard>
      {SECTIONS.map((section) => (
        <SectionCard key={section.field} title={section.title}>
          {profile[section.field].length === 0 && <p className="item-meta">Chưa có thông tin.</p>}
          <ul className="public-profile-list">
            {profile[section.field].map((item, index) => (
              <li key={index}>
                <h3>{item[section.name]}</h3>
                {item[section.subtitle] && <p className="public-profile-text">{item[section.subtitle]}</p>}
                {item.graduation_year && <p className="item-meta">Năm tốt nghiệp: {item.graduation_year}</p>}
                {item.start_date && <p className="item-meta">{String(item.start_date).slice(0, 10)} – {item.end_date ? String(item.end_date).slice(0, 10) : "Hiện tại"}</p>}
                {section.field === 'educations' && item.description && <p className="public-profile-text">{item.description}</p>}
              </li>
            ))}
          </ul>
        </SectionCard>
      ))}
    </>
  );
}
