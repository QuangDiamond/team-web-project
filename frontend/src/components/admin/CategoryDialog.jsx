import { toast } from 'sonner';
import { useState } from 'react';
import Modal from '../common/Modal';
import FormInput from '../common/FormInput';
import ToggleSwitch from '../common/ToggleSwitch';
import Alert from '../common/Alert';
import ReasonField from './ReasonField';
import DialogActions from './DialogActions';
import { createCategory, updateCategory, deleteCategory } from '../../services/categoryService';

export default function CategoryDialog({ type, item, removing, onClose, onSaved }) {
  const [name, setName] = useState(item?.name || '');
  const [active, setActive] = useState(item?.is_active ?? true);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  let title = 'Thêm danh mục';
  let submitLabel = 'Thêm danh mục';
  if (item) {
    title = 'Sửa danh mục';
    submitLabel = 'Lưu thay đổi';
  }
  if (removing) {
    title = 'Xóa danh mục';
    submitLabel = 'Xóa danh mục';
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    const maximum = type === 'grades' ? 50 : 100;
    if (!reason.trim() || reason.trim().length > 500) {
      setError('Vui lòng nhập lý do từ 1 đến 500 ký tự.');
      return;
    }
    if (!removing && (!name.trim() || name.trim().length > maximum)) {
      setError(`Tên phải có 1–${maximum} ký tự.`);
      return;
    }
    setSubmitting(true);
    try {
      if (removing) {
        await deleteCategory(type, item._id, reason.trim());
      } else {
        const payload = { name: name.trim(), sort_order: item?.sort_order || 0, is_active: active, reason: reason.trim() };
        if (item) await updateCategory(type, item._id, payload);
        else await createCategory(type, payload);
      }
      onSaved();
    } catch (failure) {
      toast.error(failure.message);
      setSubmitting(false);
    }
  };

  return (
    <Modal title={title} onClose={onClose} className="category-dialog">
      <form onSubmit={handleSubmit}>
        {error && <Alert type="error">{error}</Alert>}
        {removing ? (
          <p className="category-delete-note">Xóa “{item.name}”? Danh mục đang được sử dụng sẽ không thể xóa; bạn có thể tắt trong phần chỉnh sửa.</p>
        ) : (
          <>
            <FormInput id="category_name" label="Tên danh mục" value={name} onChange={(event) => setName(event.target.value)} required disabled={submitting} />
            <ToggleSwitch id="category_active" label="Đang sử dụng" description="Danh mục đã tắt không xuất hiện trong các lựa chọn mới." checked={active} onChange={setActive} disabled={submitting} />
          </>
        )}
        <ReasonField value={reason} onChange={(event) => setReason(event.target.value)} disabled={submitting} />
        <DialogActions submitLabel={submitLabel} submitting={submitting} onCancel={onClose} danger={removing} />
      </form>
    </Modal>
  );
}
