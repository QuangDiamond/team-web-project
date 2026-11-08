import { Link, useSearchParams } from 'react-router-dom';
import { LoaderCircle, Sparkles } from 'lucide-react';
import { useMyBilling } from '../../hooks/useMyBilling';
import PageHeader from '../../components/common/PageHeader';
import Alert from '../../components/common/Alert';
import CreditStats from '../../components/credits/CreditStats';
import CreditActivityPanel from '../../components/credits/CreditActivityPanel';
import PaymentHistoryPanel from '../../components/credits/PaymentHistoryPanel';
import '../../styles/credits.css';

const TABS = [
  { key: 'credits', label: 'Biến động credits' },
  { key: 'payments', label: 'Thanh toán' },
];

// Tab đang mở lưu trong query ?tab= để F5 / chia sẻ link vẫn giữ đúng tab
const getActiveTab = (searchParams) => {
  if (searchParams.get('tab') === 'payments') {
    return 'payments';
  }
  return 'credits';
};

// SC12 – Credits & Transactions (UC18): gói hiện tại, số dư, biến động credit và lịch sử thanh toán
export default function CreditsTransactions() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { billing, loadError } = useMyBilling();
  const activeTab = getActiveTab(searchParams);

  const selectTab = (tabKey) => {
    setSearchParams({ tab: tabKey }, { replace: true });
  };

  // Mũi tên trái / phải chuyển tab (mẫu tablist của WAI-ARIA)
  const handleTabKeyDown = (event) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') {
      return;
    }
    let nextTab = 'credits';
    if (activeTab === 'credits') {
      nextTab = 'payments';
    }
    selectTab(nextTab);
    const nextButton = document.getElementById(`tab-${nextTab}`);
    if (nextButton) {
      nextButton.focus();
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="THANH TOÁN"
        title="Credits và giao dịch"
        description="Theo dõi gói dịch vụ, số dư, biến động credits và lịch sử thanh toán của bạn."
        actions={(
          <Link to="/checkout" className="btn btn-primary btn-sm">
            <Sparkles size={16} aria-hidden="true" />
            <span>Nâng cấp / Mua credits</span>
          </Link>
        )}
      />

      {loadError && <Alert type="error">Không thể tải gói dịch vụ của bạn: {loadError}</Alert>}
      {!billing && !loadError && (
        <div className="card credits-loading" role="status">
          <LoaderCircle size={22} className="spin" aria-hidden="true" />
          <span>Đang tải gói dịch vụ của bạn...</span>
        </div>
      )}
      {billing && <CreditStats billing={billing} />}

      <section className="card history-card">
        <div className="tab-list" role="tablist" aria-label="Lịch sử">
          {TABS.map((tab) => {
            const isActive = tab.key === activeTab;
            let tabIndex = -1;
            if (isActive) {
              tabIndex = 0;
            }
            return (
              <button
                key={tab.key}
                id={`tab-${tab.key}`}
                type="button"
                role="tab"
                className={isActive ? 'tab is-active' : 'tab'}
                aria-selected={isActive ? 'true' : 'false'}
                aria-controls={`panel-${tab.key}`}
                tabIndex={tabIndex}
                onClick={() => selectTab(tab.key)}
                onKeyDown={handleTabKeyDown}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Cả 2 panel luôn được render (ẩn panel không chọn) để giữ bộ lọc / trang khi đổi tab và aria-controls luôn trỏ đúng */}
        <div id="panel-credits" role="tabpanel" aria-labelledby="tab-credits" className="tab-panel" hidden={activeTab !== 'credits'}>
          <CreditActivityPanel />
        </div>
        <div id="panel-payments" role="tabpanel" aria-labelledby="tab-payments" className="tab-panel" hidden={activeTab !== 'payments'}>
          <PaymentHistoryPanel />
        </div>
      </section>
    </>
  );
}
