import SectionCard from '../common/SectionCard';

const SECTIONS = [
  { field: 'experiences', title: 'Experience', name: 'title', subtitle: 'company' },
  { field: 'educations', title: 'Education', name: 'school', subtitle: 'degree' },
  { field: 'achievements', title: 'Achievements', name: 'title', subtitle: 'description' },
];

export default function ProfileBackground({ profile }) {
  return (
    <>
      <SectionCard title="About">
        <p className="public-profile-text">{profile.bio || 'This tutor has not added an introduction yet.'}</p>
      </SectionCard>
      {SECTIONS.map((section) => (
        <SectionCard key={section.field} title={section.title}>
          {profile[section.field].length === 0 && <p className="item-meta">No information added yet.</p>}
          <ul className="public-profile-list">
            {profile[section.field].map((item, index) => (
              <li key={index}>
                <h3>{item[section.name]}</h3>
                {item[section.subtitle] && <p className="public-profile-text">{item[section.subtitle]}</p>}
                {item.graduation_year && <p className="item-meta">Graduation: {item.graduation_year}</p>}
                {item.start_date && <p className="item-meta">{String(item.start_date).slice(0, 10)} – {item.end_date ? String(item.end_date).slice(0, 10) : 'Present'}</p>}
                {section.field === 'educations' && item.description && <p className="public-profile-text">{item.description}</p>}
              </li>
            ))}
          </ul>
        </SectionCard>
      ))}
    </>
  );
}
