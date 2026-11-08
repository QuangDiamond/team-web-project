import { useState } from 'react';
import { LoaderCircle, Plus, RotateCw } from 'lucide-react';
import { usePlansPricing } from '../../hooks/usePlansPricing';
import PageHeader from '../../components/common/PageHeader';
import Alert from '../../components/common/Alert';
import PlanCard from '../../components/admin/PlanCard';
import CreditPackTable from '../../components/admin/CreditPackTable';
import PlanEditDialog from '../../components/admin/PlanEditDialog';
import CreditPackDialog from '../../components/admin/CreditPackDialog';
import PackStatusDialog from '../../components/admin/PackStatusDialog';
import { toNumber } from '../../utils/formatCurrency';
import '../../styles/plansPricing.css';

const PLAN_GROUPS = [
  { role: 'TUTOR', title: 'Gói dịch vụ cho gia sư', description: 'Các gói dịch vụ dành cho gia sư đăng ký.' },
  { role: 'PARENT', title: 'Gói dịch vụ cho phụ huynh', description: 'Các gói dịch vụ dành cho phụ huynh đăng ký.' },
];

// Plan của 1 role, gói rẻ nhất (Free) đứng trước
const getPlansForRole = (plans, role) => {
  const rolePlans = plans.filter((plan) => plan.target_role === role);
  rolePlans.sort((first, second) => toNumber(first.monthly_price) - toNumber(second.monthly_price));
  return rolePlans;
};

// SC41 – Plans & Pricing (UC39): Admin xem / sửa plan, thêm / sửa / tắt credit pack
export default function PlansPricing() {
  const { plans, creditPacks, loading, loadError, reload } = usePlansPricing();
  const [successMessage, setSuccessMessage] = useState('');
  // dialog = { type: 'plan' | 'pack' | 'pack-status', item } hoặc null khi không mở hộp thoại nào
  const [dialog, setDialog] = useState(null);

  const openDialog = (type, item) => {
    setSuccessMessage('');
    setDialog({ type: type, item: item });
  };

  const closeDialog = () => {
    setDialog(null);
  };

  const handleSaved = (message) => {
    setDialog(null);
    setSuccessMessage(message);
    reload();
  };

  const addPackButton = (
    <button type="button" className="btn btn-primary btn-sm" onClick={() => openDialog('pack', null)}>
      <Plus size={18} aria-hidden="true" />
      <span>Thêm gói credits</span>
    </button>
  );

  const renderContent = () => {
    if (loading && plans.length === 0 && creditPacks.length === 0) {
      return (
        <div className="card plans-loading" role="status">
          <LoaderCircle size={24} className="spin" aria-hidden="true" />
          <span>Đang tải gói dịch vụ và gói credits...</span>
        </div>
      );
    }

    if (loadError) {
      return (
        <div className="plans-load-error">
          <Alert type="error">Không thể tải gói dịch vụ và gói credits: {loadError}</Alert>
          <button type="button" className="btn btn-outline btn-sm" onClick={reload}>
            <RotateCw size={16} aria-hidden="true" />
            <span>Thử lại</span>
          </button>
        </div>
      );
    }

    return (
      <>
        <section className="pricing-section" aria-labelledby="plans-heading">
          <div className="section-header">
            <h2 id="plans-heading" className="section-title">Gói dịch vụ</h2>
            <button type="button" className="btn btn-primary btn-sm" onClick={() => openDialog('plan', null)}>
              <Plus size={18} aria-hidden="true" />
              <span>Thêm gói dịch vụ</span>
            </button>
          </div>
          <div className="plan-groups">
            {PLAN_GROUPS.map((group) => {
              const rolePlans = getPlansForRole(plans, group.role);
              const headingId = `plan-group-${group.role}`;
              return (
                <section key={group.role} className="card plan-group" aria-labelledby={headingId}>
                  <div className="plan-group-header">
                    <div>
                      <h3 id={headingId} className="plan-group-title">{group.title}</h3>
                      <p className="plan-group-description">{group.description}</p>
                    </div>
                    <span className="plan-group-count">{rolePlans.length} gói</span>
                  </div>
                  {rolePlans.length === 0 && <p className="plan-group-empty">Chưa có gói dịch vụ cho vai trò này.</p>}
                  <div className="plan-grid">
                    {rolePlans.map((plan) => (
                      <PlanCard key={plan._id} plan={plan} onEdit={(item) => openDialog('plan', item)} />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </section>

        <section className="pricing-section" aria-labelledby="packs-heading">
          <div className="section-header">
            <div>
              <h2 id="packs-heading" className="section-title">Gói credits</h2>
              <p className="section-description">Nạp thêm credits theo từng lần mua. Người dùng không thấy các gói đã tắt.</p>
            </div>
            {addPackButton}
          </div>
          <CreditPackTable
            creditPacks={creditPacks}
            onEdit={(item) => openDialog('pack', item)}
            onToggleStatus={(item) => openDialog('pack-status', item)}
          />
        </section>
      </>
    );
  };

  return (
    <div className="plans-pricing">
      <PageHeader
        eyebrow="QUẢN TRỊ VIÊN · THANH TOÁN"
        title="Gói dịch vụ và bảng giá"
        description="Mỗi gói dịch vụ có chu kỳ tháng hoặc năm. Với gói năm, bạn có thể thiết lập chiết khấu theo phần trăm."
      />

      {successMessage && <Alert type="success">{successMessage}</Alert>}

      {renderContent()}

      {dialog && dialog.type === 'plan' && (
        <PlanEditDialog plan={dialog.item} onClose={closeDialog} onSaved={handleSaved} />
      )}
      {dialog && dialog.type === 'pack' && (
        <CreditPackDialog pack={dialog.item} onClose={closeDialog} onSaved={handleSaved} />
      )}
      {dialog && dialog.type === 'pack-status' && (
        <PackStatusDialog pack={dialog.item} onClose={closeDialog} onSaved={handleSaved} />
      )}
    </div>
  );
}
