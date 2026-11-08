// Banner chào mừng ở đầu dashboard (Figma: gradient cam). children: nút hành động tùy chọn
export default function WelcomeBanner({ name, summary, children }) {
  return (
    <div className="welcome-banner">
      <p className="welcome-banner-eyebrow">Chào mừng bạn trở lại 👋</p>
      <h2 className="welcome-banner-name">{name}</h2>
      <p className="welcome-banner-summary">{summary}</p>
      {children}
    </div>
  );
}
