import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

const JOURNEY_STEPS = [
  { number: '01', title: 'Tạo tài khoản', description: 'Điền thông tin cơ bản' },
  { number: '02', title: 'Chọn vai trò', description: 'Học sinh, Gia sư hay Phụ huynh?' },
  { number: '03', title: 'Bắt đầu học tập', description: 'Kết nối với gia sư phù hợp' },
];

const STATS = [
  { value: 'Miễn phí', label: 'Đăng ký' },
  { value: '< 2 phút', label: 'Hoàn tất' },
  { value: '24/7', label: 'Hỗ trợ' },
];

function BrandLogo() {
  return (
    <span className="brand-logo">
      <span className="brand-logo-mark" aria-hidden="true">Tu</span>
      <span className="brand-logo-text">TuConnector</span>
    </span>
  );
}

// Bố cục chung của các màn auth: panel giới thiệu bên trái + form bên phải.
// activeStep: số bước được tô màu ở panel trái (0 = không tô bước nào)
export default function AuthLayout({ activeStep = 0, panelClassName = '', children }) {
  return (
    <div className="auth-layout">
      <aside className={`auth-panel ${panelClassName}`.trim()}>
        <span className="auth-panel-circle circle-top" aria-hidden="true" />
        <span className="auth-panel-circle circle-middle" aria-hidden="true" />
        <span className="auth-panel-circle circle-bottom" aria-hidden="true" />

        <BrandLogo />

        <div className="auth-panel-content">
          <span className="auth-panel-badge">Miễn phí 7 ngày đầu tiên</span>
          <p className="auth-panel-heading">Bắt đầu hành trình học tập ngay hôm nay.</p>
          <p className="auth-panel-text">
            Tạo tài khoản miễn phí và kết nối với hàng nghìn gia sư chất lượng chỉ trong vài phút.
          </p>

          <ol className="journey-steps">
            {JOURNEY_STEPS.map((step, index) => {
              const isActive = index + 1 <= activeStep;
              return (
                <li key={step.number} className={isActive ? 'journey-step is-active' : 'journey-step'}>
                  <span className="journey-step-number">{step.number}</span>
                  <span>
                    <span className="journey-step-title">{step.title}</span>
                    <span className="journey-step-description">{step.description}</span>
                  </span>
                </li>
              );
            })}
          </ol>
        </div>

        <dl className="auth-panel-stats">
          {STATS.map((stat) => (
            <div key={stat.label}>
              <dt>{stat.value}</dt>
              <dd>{stat.label}</dd>
            </div>
          ))}
        </dl>
      </aside>

      <main className="auth-main">
        <div className="auth-form-wrapper">
          <div className="auth-topbar">
            <Link to="/" className="link-back">
              <ChevronLeft size={16} aria-hidden="true" />
              <span>Quay lại</span>
            </Link>
            <BrandLogo />
            <span className="auth-topbar-spacer" aria-hidden="true" />
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
