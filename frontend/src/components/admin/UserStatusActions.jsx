import { Ban, CirclePause, CirclePlay, Info } from 'lucide-react';
import { STATUS_ACTIONS, getAvailableStatusActions } from '../../utils/userDisplay';

const ACTION_ICONS = {
  SUSPEND: CirclePause,
  BAN: Ban,
  REACTIVATE: CirclePlay,
};

// Các nút đổi trạng thái tài khoản. Tài khoản của chính mình thì không cho đổi (UC37 E1, D21)
export default function UserStatusActions({ user, isOwnAccount, onAction }) {
  return (
    <section className="card user-actions" aria-labelledby="user-actions-title">
      <h2 id="user-actions-title" className="user-side-title" tabIndex={-1}>Trạng thái tài khoản</h2>

      {isOwnAccount && (
        <p className="own-account-note">
          <Info size={16} aria-hidden="true" />
          <span>Đây là tài khoản của bạn nên bạn không thể tự đổi trạng thái. Hãy nhờ quản trị viên khác nếu cần.</span>
        </p>
      )}

      {!isOwnAccount && (
        <>
          <p className="user-side-text">Mỗi thay đổi đều cần có lý do và được ghi vào nhật ký quản trị.</p>
          <div className="user-action-buttons">
            {getAvailableStatusActions(user.account_status).map((actionKey) => {
              const action = STATUS_ACTIONS[actionKey];
              const Icon = ACTION_ICONS[actionKey];
              let buttonClass = 'btn btn-outline btn-sm';
              if (action.danger) {
                buttonClass = 'btn btn-outline btn-sm btn-outline-danger';
              }
              return (
                <button key={actionKey} type="button" className={buttonClass} onClick={() => onAction(actionKey)}>
                  <Icon size={16} aria-hidden="true" />
                  <span>{action.buttonLabel}</span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}
