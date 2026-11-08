import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

const JOURNEY_STEPS = [
  { number: '01', title: 'Create account', description: 'Fill in your basic info' },
  { number: '02', title: 'Choose your role', description: 'Student, Tutor or Parent?' },
  { number: '03', title: 'Start learning', description: 'Connect with the right tutor' },
];

const STATS = [
  { value: 'Free', label: 'To sign up' },
  { value: '< 2 min', label: 'To complete' },
  { value: '24/7', label: 'Support' },
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
export default function AuthLayout({ activeStep = 0, children }) {
  return (
    <div className="auth-layout">
      <aside className="auth-panel">
        <span className="auth-panel-circle circle-top" aria-hidden="true" />
        <span className="auth-panel-circle circle-middle" aria-hidden="true" />
        <span className="auth-panel-circle circle-bottom" aria-hidden="true" />

        <BrandLogo />

        <div className="auth-panel-content">
          <span className="auth-panel-badge">Free for your first 7 days</span>
          <p className="auth-panel-heading">Start your learning journey today.</p>
          <p className="auth-panel-text">
            Create a free account and connect with thousands of quality tutors in just a few minutes.
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
              <span>Back</span>
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
