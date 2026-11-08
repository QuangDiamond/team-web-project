import { useEffect } from 'react';
import { CircleAlert, CircleCheck, X } from 'lucide-react';

const TOAST_ICONS = {
  error: CircleAlert,
  success: CircleCheck,
};

/** Show a short-lived result message for an API action */
export default function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return undefined;

    const timeoutId = window.setTimeout(onClose, 4500);
    return () => window.clearTimeout(timeoutId);
  }, [toast, onClose]);

  if (!toast) return null;

  const Icon = TOAST_ICONS[toast.type];
  const role = toast.type === 'error' ? 'alert' : 'status';

  return (
    <div className={`class-toast class-toast-${toast.type}`} role={role}>
      <Icon size={19} aria-hidden="true" />
      <p>{toast.message}</p>
      <button type="button" aria-label="Dismiss notification" onClick={onClose}>
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  );
}
