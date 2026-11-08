import { useState } from 'react';
import { saveRequest, unsaveRequest } from '../services/tutorRequestService.js';

/*
 * Thao tác của gia sư trên danh sách request (UC11 lưu / bỏ lưu, UC12 mở hộp thoại ứng tuyển).
 * patchItem: cập nhật một item tại chỗ (từ usePagedList). onSaveChanged: gọi sau khi lưu / bỏ lưu (tùy chọn).
 */
export function useRequestActions({ patchItem, onSaveChanged }) {
  const [applyingRequest, setApplyingRequest] = useState(null);
  const [notice, setNotice] = useState('');
  const [actionError, setActionError] = useState('');

  const toggleSave = async (request) => {
    setActionError('');
    setNotice('');
    try {
      if (request.is_bookmarked) {
        await unsaveRequest(request._id);
      } else {
        await saveRequest(request._id);
      }
      patchItem(request._id, { is_bookmarked: !request.is_bookmarked });
      if (onSaveChanged) {
        onSaveChanged();
      }
    } catch (error) {
      setActionError(error.message);
    }
  };

  const openApply = (request) => {
    setNotice('');
    setApplyingRequest(request);
  };

  const closeApply = () => {
    setApplyingRequest(null);
  };

  const handleApplied = (result) => {
    patchItem(applyingRequest._id, {
      has_applied: true,
      application_count: applyingRequest.application_count + 1,
    });
    setNotice(`Đã gửi đơn ứng tuyển. Bạn còn ${result.remaining_credits} tín dụng.`);
    setApplyingRequest(null);
  };

  return { applyingRequest, notice, actionError, toggleSave, openApply, closeApply, handleApplied };
}
