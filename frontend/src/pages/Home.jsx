import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/Home.css';

const trustedLogos = [
  { name: 'FPT University', text: 'FPT University' },
  { name: 'ĐHQG Hà Nội', text: 'VNU Hanoi' },
  { name: 'Bách Khoa Hà Nội', text: 'HUST' },
  { name: 'ĐH Ngoại Thương', text: 'FTU' },
  { name: 'Coursera', text: 'Coursera' },
  { name: 'Khan Academy', text: 'Khan Academy' },
];

const features = [
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: 'Ghép đôi AI thông minh',
    desc: 'Thuật toán Gemini AI phân tích phong cách học, năng lực và mục tiêu để đề xuất gia sư lý tưởng nhất cho học sinh.',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      </svg>
    ),
    title: 'Gia sư được xác thực 100%',
    desc: 'Mọi gia sư đều được xác minh danh tính, bằng cấp học thuật và kiểm duyệt chất lượng nghiêm ngặt bởi ban quản trị.',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    title: 'Lịch học linh hoạt & Sync Calendar',
    desc: 'Dễ dàng sắp xếp và dời lịch học khi có việc bận. Tự động đồng bộ lịch 2 chiều với Google Calendar và nhận thông báo nhắc nhở.',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    title: 'Không gian học tập & Theo dõi tiến độ',
    desc: 'Gia sư tạo lớp, giao bài tập trực tuyến có AI hỗ trợ; học sinh làm bài trên web và phụ huynh nắm bắt điểm số minh bạch.',
  },
];

const featuredTutors = [
  {
    name: 'Thầy Quang Anh',
    subject: 'Toán & Lập trình thuật toán',
    rating: 4.95,
    sessions: 342,
    price: '250.000đ/buổi',
    color: '#F4673A',
    initials: 'QA',
    degree: 'ĐH Bách Khoa Hà Nội',
  },
  {
    name: 'Cô Thu Hà',
    subject: 'IELTS & Tiếng Anh giao tiếp',
    rating: 4.98,
    sessions: 512,
    price: '300.000đ/buổi',
    color: '#6366F1',
    initials: 'TH',
    degree: 'IELTS 8.5 — ĐH Ngoại Thương',
  },
  {
    name: 'Thầy Khắc Nghĩa',
    subject: 'Vật Lý & Khoa học tự nhiên',
    rating: 4.92,
    sessions: 280,
    price: '220.000đ/buổi',
    color: '#10B981',
    initials: 'KN',
    degree: 'Thủ khoa Sư Phạm Lý',
  },
  {
    name: 'Cô Minh Anh',
    subject: 'Hóa học THPT & Luyện thi ĐH',
    rating: 4.88,
    sessions: 195,
    price: '230.000đ/buổi',
    color: '#F59E0B',
    initials: 'MA',
    degree: 'Giải Nhì HSG Quốc Gia Hóa',
  },
];

const testimonials = [
  {
    name: 'Chị Mai Lan',
    role: 'Phụ huynh học sinh lớp 12 (Hà Nội)',
    avatar: 'ML',
    color: '#F4673A',
    rating: 5,
    text: 'Nhờ TuConnector, tôi tìm được gia sư dạy Toán xuất sắc cho con trai chỉ sau 1 ngày đăng yêu cầu. Kết quả thi học kỳ của cháu tăng từ 6.5 lên 8.8!',
  },
  {
    name: 'Học sinh Tuấn Kiệt',
    role: 'Thành viên lớp IELTS Cấp tốc',
    avatar: 'TK',
    color: '#6366F1',
    rating: 5,
    text: 'Không gian lớp học của TuConnector rất tiện, bài tập được chấm trực tuyến và có nhận xét chi tiết của thầy cô. Lịch học đồng bộ thẳng vào điện thoại.',
  },
  {
    name: 'Gia sư Hoàng Nam',
    role: 'Gia sư tiếng Anh & Lập trình',
    avatar: 'HN',
    color: '#10B981',
    rating: 5,
    text: 'Hệ thống credit và matching rất công bằng. Tôi nhận được nhiều yêu cầu phù hợp với lịch rảnh và có thể quản lý 4 lớp học chỉ trên một bảng điều khiển.',
  },
];

export default function Home() {
  const navigate = useNavigate();
  const [searchSubject, setSearchSubject] = useState('');
  const [gradeLevel, setGradeLevel] = useState('ALL');
  const [teachingMode, setTeachingMode] = useState('ONLINE');

  const handleSearch = (e) => {
    e.preventDefault();
    // Chuyển hướng tới trang tìm kiếm gia sư với query params
    navigate(`/tutors?subject=${encodeURIComponent(searchSubject)}&grade=${gradeLevel}&mode=${teachingMode}`);
  };

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="home-container">
          <div className="hero-grid">
            {/* Left Content */}
            <div className="hero-content">
              <div className="hero-badge">
                <span className="badge-dot"></span>
                <span>✨ Nền tảng kết nối gia sư thông minh hàng đầu</span>
              </div>

              <h1 className="hero-title">
                Kết nối với gia sư phù hợp,<br />
                <span className="hero-title-highlight">Đúng người, Đúng thời điểm.</span>
              </h1>

              <p className="hero-subtitle">
                TuConnector cầu nối đáng tin cậy giữa phụ huynh và hàng ngàn gia sư giỏi được xác thực. Quản lý lớp học, làm bài tập và theo dõi tiến độ — tất cả trong một nền tảng.
              </p>

              {/* Search Box */}
              <form onSubmit={handleSearch} className="hero-search-box">
                <div className="search-input-group">
                  <svg className="search-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Nhập môn học (Toán, Tiếng Anh, Lập trình...)"
                    value={searchSubject}
                    onChange={(e) => setSearchSubject(e.target.value)}
                  />
                </div>

                <div className="search-divider"></div>

                <select
                  className="search-select"
                  value={gradeLevel}
                  onChange={(e) => setGradeLevel(e.target.value)}
                  aria-label="Chọn khối lớp"
                >
                  <option value="ALL">Mọi khối lớp</option>
                  <option value="TIEL_HOC">Tiểu học (Lớp 1-5)</option>
                  <option value="THCS">THCS (Lớp 6-9)</option>
                  <option value="THPT">THPT (Lớp 10-12)</option>
                  <option value="DAI_HOC">Đại học & Người đi làm</option>
                </select>

                <div className="search-divider"></div>

                <select
                  className="search-select"
                  value={teachingMode}
                  onChange={(e) => setTeachingMode(e.target.value)}
                  aria-label="Chọn hình thức học"
                >
                  <option value="ONLINE">Học Online</option>
                  <option value="OFFLINE">Gia sư tại nhà</option>
                  <option value="HYBRID">Linh hoạt</option>
                </select>

                <button type="submit" className="btn btn-primary btn-search">
                  Tìm gia sư
                </button>
              </form>

              {/* Social Proof */}
              <div className="hero-social-proof">
                <div className="avatar-stack">
                  {['#F4673A', '#6366F1', '#10B981', '#F59E0B'].map((color, i) => (
                    <div key={i} className="avatar-pill" style={{ backgroundColor: color }}>
                      {['L', 'Q', 'N', 'M'][i]}
                    </div>
                  ))}
                </div>
                <div className="proof-info">
                  <div className="stars">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="star-icon" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                    <span className="proof-rating">4.95 / 5.0</span>
                  </div>
                  <p className="proof-label">Từ hơn 12.000+ phụ huynh và học viên tin tưởng</p>
                </div>
              </div>
            </div>

            {/* Right Preview UI Mockup */}
            <div className="hero-preview">
              <div className="preview-window">
                <div className="window-header">
                  <div className="window-dots">
                    <span className="dot red"></span>
                    <span className="dot yellow"></span>
                    <span className="dot green"></span>
                  </div>
                  <div className="window-url">tuconnector.vn/student/dashboard</div>
                </div>

                <div className="window-body">
                  <div className="window-sidebar">
                    <div className="sidebar-title">MENU CHÍNH</div>
                    <div className="sidebar-item active">Tổng quan</div>
                    <div className="sidebar-item">Lớp học của tôi</div>
                    <div className="sidebar-item">Lịch học</div>
                    <div className="sidebar-item">Bài tập & Điểm</div>
                    <div className="sidebar-item">Tin nhắn</div>
                  </div>

                  <div className="window-content">
                    <div className="content-greeting">Chào em, Minh Đức 👋</div>

                    <div className="stat-cards-grid">
                      <div className="mini-stat-card orange">
                        <div className="mini-stat-label">Điểm trung bình</div>
                        <div className="mini-stat-value orange">9.2</div>
                        <div className="mini-stat-trend">↑ +0.4 tuần này</div>
                      </div>
                      <div className="mini-stat-card gray">
                        <div className="mini-stat-label">Buổi đã học</div>
                        <div className="mini-stat-value">18</div>
                        <div className="mini-stat-trend">✓ Chuyên cần 100%</div>
                      </div>
                    </div>

                    <div className="upcoming-box">
                      <div className="upcoming-title">Buổi học sắp tới hôm nay</div>
                      <div className="session-item">
                        <span className="session-dot"></span>
                        <span>19:30 — Toán 12 Nâng cao (Thầy Quang Anh)</span>
                      </div>
                      <div className="session-item">
                        <span className="session-dot"></span>
                        <span>21:00 — Luyện Speaking IELTS (Cô Thu Hà)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Cards */}
              <div className="floating-card card-bottom">
                <div className="floating-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div>
                  <div className="floating-title">Tiến bộ vượt bậc +38%</div>
                  <div className="floating-subtitle">Thống kê tháng vừa qua</div>
                </div>
              </div>

              <div className="floating-card card-top">
                <div className="avatar-pill" style={{ backgroundColor: '#F4673A', margin: 0 }}>
                  QA
                </div>
                <div>
                  <div className="floating-title">Thầy Quang Anh</div>
                  <div className="online-indicator">● Đang trực tuyến</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trusted By Section */}
      <section className="trusted-section">
        <div className="home-container">
          <p className="trusted-label">Được tin dùng bởi học viên & gia sư từ các trường hàng đầu</p>
          <div className="trusted-logos-grid">
            {trustedLogos.map((l) => (
              <span key={l.name} className="logo-item">
                {l.text}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section" id="features">
        <div className="home-container">
          <div className="section-header">
            <div className="section-tag">Tính năng vượt trội</div>
            <h2 className="section-title">Vì sao phụ huynh & gia sư chọn TuConnector?</h2>
            <p className="section-desc">
              Một giải pháp toàn diện giải quyết triệt để vấn đề tìm kiếm gia sư uy tín và theo dõi kết quả học tập liên tục.
            </p>
          </div>

          <div className="features-grid">
            {features.map((f, i) => (
              <div key={i} className="feature-card">
                <div className="feature-icon-wrapper">
                  {f.icon}
                </div>
                <h3 className="feature-title">{f.title}</h3>
                <p className="feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Tutors Section */}
      <section className="tutors-section">
        <div className="home-container">
          <div className="tutors-header-wrapper">
            <div>
              <div className="section-tag">Gia sư chất lượng cao</div>
              <h2 className="section-title" style={{ marginBottom: 4 }}>Gia sư tiêu biểu hàng đầu</h2>
              <p className="section-desc">Được phụ huynh đánh giá cao về chuyên môn và sự tận tâm</p>
            </div>
            <Link to="/tutors" className="btn btn-outline" style={{ display: 'inline-flex' }}>
              Xem tất cả gia sư →
            </Link>
          </div>

          <div className="tutors-grid">
            {featuredTutors.map((t, i) => (
              <div key={i} className="tutor-card">
                <div className="tutor-card-top">
                  <div className="tutor-avatar" style={{ backgroundColor: t.color }}>
                    {t.initials}
                  </div>
                  <div>
                    <h3 className="tutor-name">{t.name}</h3>
                    <p className="tutor-subject">{t.subject}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 500 }}>{t.degree}</p>
                  </div>
                </div>

                <div className="tutor-stats-row">
                  <div className="tutor-rating">
                    <svg width="15" height="15" fill="#FBBF24" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span>{t.rating}</span>
                  </div>
                  <span className="tutor-sessions">{t.sessions} buổi đã dạy</span>
                </div>

                <div className="tutor-card-footer">
                  <div className="tutor-price">{t.price}</div>
                  <Link to="/tutors" className="btn-view-profile">
                    Xem hồ sơ
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials-section" id="testimonials">
        <div className="home-container">
          <div className="section-header">
            <div className="section-tag">Đánh giá thực tế</div>
            <h2 className="section-title">Học viên và Phụ huynh nói gì?</h2>
            <p className="section-desc">
              Những chia sẻ chân thực từ cộng đồng người dùng đã cùng TuConnector đạt được các mục tiêu học tập.
            </p>
          </div>

          <div className="testimonials-grid">
            {testimonials.map((t, i) => (
              <div key={i} className="testimonial-card">
                <div>
                  <div className="testimonial-stars">
                    {[...Array(t.rating)].map((_, j) => (
                      <svg key={j} width="18" height="18" fill="#FBBF24" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="testimonial-quote">"{t.text}"</p>
                </div>

                <div className="testimonial-author">
                  <div className="author-avatar" style={{ backgroundColor: t.color }}>
                    {t.avatar}
                  </div>
                  <div>
                    <h4 className="author-name">{t.name}</h4>
                    <p className="author-role">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner Section */}
      <section className="cta-section">
        <div className="home-container">
          <div className="cta-banner">
            <h2 className="cta-title">Bắt đầu nâng tầm việc học ngay hôm nay</h2>
            <p className="cta-desc">
              Tham gia cộng đồng hơn 50.000 học viên đã tìm được gia sư lý tưởng. Đăng ký tài khoản hoàn toàn miễn phí và bắt đầu ngay!
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <Link to="/register" className="btn btn-cta">
                Đăng ký miễn phí ngay
              </Link>
              <Link to="/tutors" className="btn btn-outline" style={{ background: 'transparent', color: 'white', borderColor: 'rgba(255,255,255,0.4)', padding: '16px 28px', fontSize: '1.05rem', borderRadius: 'var(--radius-lg)' }}>
                Khám phá gia sư
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}