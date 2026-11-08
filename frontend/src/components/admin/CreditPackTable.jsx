import { Pencil, Power, PowerOff, PackageOpen } from 'lucide-react';
import { formatVnd } from '../../utils/formatCurrency';
import { getTargetRoleLabel } from '../../utils/planDisplay';

function PackStatusBadge({ isActive }) {
  if (isActive) {
    return <span className="badge badge-green">Active</span>;
  }
  return <span className="badge badge-gray">Disabled</span>;
}

function PackStatusButton({ pack, onToggleStatus }) {
  if (pack.is_active) {
    return (
      <button
        type="button"
        className="btn btn-outline btn-sm"
        onClick={() => onToggleStatus(pack)}
        aria-label={`Disable ${pack.name}`}
      >
        <PowerOff size={16} aria-hidden="true" />
        <span>Disable</span>
      </button>
    );
  }
  return (
    <button
      type="button"
      className="btn btn-outline btn-sm"
      onClick={() => onToggleStatus(pack)}
      aria-label={`Enable ${pack.name}`}
    >
      <Power size={16} aria-hidden="true" />
      <span>Enable</span>
    </button>
  );
}

// Bảng credit pack. Màn hình hẹp: mỗi dòng thành 1 thẻ (CSS dùng data-label làm nhãn)
export default function CreditPackTable({ creditPacks, onEdit, onToggleStatus }) {
  if (creditPacks.length === 0) {
    return (
      <div className="card empty-state">
        <PackageOpen size={32} className="empty-state-icon" aria-hidden="true" />
        <p className="empty-state-title">No credit packs yet</p>
        <p className="empty-state-text">Add a pack so tutors and parents can buy extra credits.</p>
      </div>
    );
  }

  return (
    <div className="card table-card">
      <table className="data-table">
        <caption className="visually-hidden">Credit packs</caption>
        <thead>
          <tr>
            <th scope="col">Pack</th>
            <th scope="col">For</th>
            <th scope="col" className="cell-number">Credits</th>
            <th scope="col" className="cell-number">Price</th>
            <th scope="col">Status</th>
            <th scope="col" className="cell-actions">Actions</th>
          </tr>
        </thead>
        <tbody>
          {creditPacks.map((pack) => {
            let rowClass = '';
            if (!pack.is_active) {
              rowClass = 'is-disabled';
            }
            return (
              <tr key={pack._id} className={rowClass}>
                <th scope="row" data-label="Pack" className="cell-name">{pack.name}</th>
                <td data-label="For">{getTargetRoleLabel(pack.target_role)}</td>
                <td data-label="Credits" className="cell-number">{pack.credit_amount}</td>
                <td data-label="Price" className="cell-number">{formatVnd(pack.price)}</td>
                <td data-label="Status"><PackStatusBadge isActive={pack.is_active} /></td>
                <td data-label="Actions" className="cell-actions">
                  <div className="row-actions">
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => onEdit(pack)}
                      aria-label={`Edit ${pack.name}`}
                    >
                      <Pencil size={16} aria-hidden="true" />
                      <span>Edit</span>
                    </button>
                    <PackStatusButton pack={pack} onToggleStatus={onToggleStatus} />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
