import { Pencil, Power, PowerOff, PackageOpen } from 'lucide-react';
import { formatVnd } from '../../utils/formatCurrency';
import { getTargetRoleLabel } from '../../utils/planDisplay';

function PackStatusBadge({ isActive }) {
  if (isActive) {
    return <span className="badge badge-green">Đang hoạt động</span>;
  }
  return <span className="badge badge-gray">Đã tắt</span>;
}

function PackStatusButton({ pack, onToggleStatus }) {
  if (pack.is_active) {
    return (
      <button
        type="button"
        className="btn btn-outline btn-sm"
        onClick={() => onToggleStatus(pack)}
        aria-label={`Tắt ${pack.name}`}
      >
        <PowerOff size={16} aria-hidden="true" />
        <span>Tắt</span>
      </button>
    );
  }
  return (
    <button
      type="button"
      className="btn btn-outline btn-sm"
      onClick={() => onToggleStatus(pack)}
      aria-label={`Bật ${pack.name}`}
    >
      <Power size={16} aria-hidden="true" />
      <span>Bật</span>
    </button>
  );
}

// Bảng credit pack. Màn hình hẹp: mỗi dòng thành 1 thẻ (CSS dùng data-label làm nhãn)
export default function CreditPackTable({ creditPacks, onEdit, onToggleStatus }) {
  if (creditPacks.length === 0) {
    return (
      <div className="card empty-state">
        <PackageOpen size={32} className="empty-state-icon" aria-hidden="true" />
        <p className="empty-state-title">Chưa có gói credits</p>
        <p className="empty-state-text">Thêm gói để gia sư và phụ huynh có thể mua thêm credits.</p>
      </div>
    );
  }

  return (
    <div className="card table-card">
      <table className="data-table">
        <caption className="visually-hidden">Gói credits</caption>
        <thead>
          <tr>
            <th scope="col">Gói credits</th>
            <th scope="col">Dành cho</th>
            <th scope="col" className="cell-number">Credits</th>
            <th scope="col" className="cell-number">Giá</th>
            <th scope="col">Trạng thái</th>
            <th scope="col" className="cell-actions">Thao tác</th>
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
                <th scope="row" data-label="Gói credits" className="cell-name">{pack.name}</th>
                <td data-label="Dành cho">{getTargetRoleLabel(pack.target_role)}</td>
                <td data-label="Credits" className="cell-number">{pack.credit_amount.toLocaleString('vi-VN')}</td>
                <td data-label="Giá" className="cell-number">{formatVnd(pack.price)}</td>
                <td data-label="Trạng thái"><PackStatusBadge isActive={pack.is_active} /></td>
                <td data-label="Thao tác" className="cell-actions">
                  <div className="row-actions">
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => onEdit(pack)}
                      aria-label={`Sửa ${pack.name}`}
                    >
                      <Pencil size={16} aria-hidden="true" />
                      <span>Sửa</span>
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
