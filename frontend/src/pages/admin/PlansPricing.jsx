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
  { role: 'TUTOR', title: 'Tutor plans', description: 'Plans tutors can subscribe to.' },
  { role: 'PARENT', title: 'Parent plans', description: 'Plans parents can subscribe to.' },
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
      <span>Add credit pack</span>
    </button>
  );

  const renderContent = () => {
    if (loading && plans.length === 0 && creditPacks.length === 0) {
      return (
        <div className="card plans-loading" role="status">
          <LoaderCircle size={24} className="spin" aria-hidden="true" />
          <span>Loading plans and credit packs...</span>
        </div>
      );
    }

    if (loadError) {
      return (
        <div className="plans-load-error">
          <Alert type="error">Could not load plans and credit packs: {loadError}</Alert>
          <button type="button" className="btn btn-outline btn-sm" onClick={reload}>
            <RotateCw size={16} aria-hidden="true" />
            <span>Try again</span>
          </button>
        </div>
      );
    }

    return (
      <>
        <section className="pricing-section" aria-labelledby="plans-heading">
          <div className="section-header">
            <h2 id="plans-heading" className="section-title">Subscription plans</h2>
            <button type="button" className="btn btn-primary btn-sm" onClick={() => openDialog('plan', null)}>
              <Plus size={18} aria-hidden="true" />
              <span>Add plan</span>
            </button>
          </div>
          <div className="plan-groups">
            {PLAN_GROUPS.map((group) => {
              const rolePlans = getPlansForRole(plans, group.role);
              const headingId = `plan-group-${group.role}`;
              return (
                <section key={group.role} className="card plan-group" aria-labelledby={headingId}>
                  <div className="plan-group-header">
                    <h3 id={headingId} className="plan-group-title">{group.title}</h3>
                    <p className="plan-group-description">{group.description}</p>
                  </div>
                  {rolePlans.length === 0 && <p className="plan-group-empty">No plans configured for this role.</p>}
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
              <h2 id="packs-heading" className="section-title">Credit packs</h2>
              <p className="section-description">One-off credit top-ups. Disabled packs are hidden from users.</p>
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
        eyebrow="ADMIN · BILLING"
        title="Plans & Pricing"
        description="Configure subscription plans for tutors and parents, and the credit packs users can buy."
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
