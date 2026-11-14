import { toast } from 'sonner';
import { useEffect, useState } from 'react';
import Modal from '../common/Modal';
import Alert from '../common/Alert';
import DialogActions from '../admin/DialogActions';
import { notificationService } from '../../services/notificationService';
const OPTIONS = [{
  key: 'enable_in_app',
  label: 'Trong ứng dụng',
  detail: 'Nhận thông báo tại trung tâm thông báo.'
}, {
  key: 'enable_email',
  label: 'Email',
  detail: 'Nhận thông báo qua địa chỉ email đã đăng ký.'
}, {
  key: 'enable_sms',
  label: 'Tin nhắn SMS',
  detail: 'Nhận tin nhắn theo quyền lợi gói dịch vụ.'
}, {
  key: 'notify_on_sessions',
  label: 'Lịch học và buổi dạy',
  detail: 'Nhận nhắc lịch và cập nhật buổi học.'
}, {
  key: 'notify_on_assignments',
  label: 'Bài tập và điểm số',
  detail: 'Nhận cập nhật bài tập và kết quả chấm điểm.'
}, {
  key: 'notify_on_messages',
  label: 'Tin nhắn và hội thoại',
  detail: 'Nhận thông báo khi có tin nhắn mới.'
}];
export default function PreferencesDialog({
  onClose,
  onSaved
}) {
  const [values, setValues] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    notificationService.getPreferences().then(response => {
      if (active) {
        setValues(response);
      }
    }).catch(failure => {
      if (active) {
        setError(failure.message || 'Không thể tải cài đặt.');
      }
    }).finally(() => {
      if (active) {
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [attempt]);
  const close = () => {
    if (!submitting) {
      onClose();
    }
  };
  const submit = async event => {
    event.preventDefault();
    if (!values) {
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const payload = Object.fromEntries(OPTIONS.map(option => [option.key, Boolean(values[option.key])]));
      await notificationService.updatePreferences(payload);
      onSaved('Đã lưu cài đặt nhận thông báo.');
    } catch (failure) {
      toast.error(failure.message || 'Không thể lưu cài đặt.');
    } finally {
      setSubmitting(false);
    }
  };
  return <Modal title="Cài đặt nhận thông báo" onClose={close}>
    {error && <Alert type="error">{error}{!values && <button type="button" className="btn btn-outline btn-sm" onClick={() => setAttempt(value => value + 1)} disabled={loading}>Thử lại</button>}</Alert>}
    {loading && <p role="status" className="noti-muted">Đang tải cài đặt...</p>}
    {!loading && values && <form onSubmit={submit}>
      <fieldset className="noti-preferences" disabled={submitting}><legend className="visually-hidden">Kênh và loại thông báo</legend>
        {OPTIONS.map(option => <label key={option.key} className="noti-preference"><span><strong>{option.label}</strong><small>{option.detail}</small></span><input type="checkbox" checked={Boolean(values[option.key])} onChange={event => setValues({
            ...values,
            [option.key]: event.target.checked
          })} /></label>)}
      </fieldset>
      <DialogActions onCancel={close} submitting={submitting} submitLabel="Lưu cài đặt" />
    </form>}
  </Modal>;
}
