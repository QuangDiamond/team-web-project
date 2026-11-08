import { useState, useEffect } from 'react';
import { GraduationCap, AlertTriangle, Check, X, Plus } from 'lucide-react';
import { createClassroom, getConfirmedAgreements } from '../../services/classroomService';

export default function CreateClassroomModal({ isOpen, onClose, onClassroomCreated, showToast }) {
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    grade: '',
    capacity: 20,
    description: '',
    agreement_id: '',
  });

  const [agreements, setAgreements] = useState([]);
  const [loadingAgreements, setLoadingAgreements] = useState(false);
  const [useAgreement, setUseAgreement] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [createdResult, setCreatedResult] = useState(null);

  const resetForm = () => {
    setFormData({
      name: '',
      subject: '',
      grade: '',
      capacity: 20,
      description: '',
      agreement_id: '',
    });
    setUseAgreement(false);
    setError('');
    setCreatedResult(null);
  };

  // Load danh sách thỏa thuận đã chốt khi mở modal (UC21.A1)
  useEffect(() => {
    if (isOpen) {
      resetForm();
      setLoadingAgreements(true);
      getConfirmedAgreements()
        .then((res) => {
          if (res?.data && Array.isArray(res.data)) {
            setAgreements(res.data);
          }
        })
        .catch((err) => {
          console.warn('[UC21] Không lấy được danh sách thỏa thuận:', err.message);
        })
        .finally(() => {
          setLoadingAgreements(false);
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Chọn thỏa thuận kết nối để tự động điền form (UC21.A1)
  const handleSelectAgreement = (e) => {
    const selectedId = e.target.value;
    const agreement = agreements.find((a) => a._id === selectedId);

    if (agreement) {
      setFormData((prev) => ({
        ...prev,
        agreement_id: agreement._id,
        name: prev.name || `Lớp kèm môn ${agreement.agreed_subject || 'học'}`,
        subject: agreement.agreed_subject || prev.subject,
        description: agreement.agreed_schedule
          ? `Lịch học đã chốt: ${agreement.agreed_schedule}`
          : prev.description,
      }));
    } else {
      setFormData((prev) => ({ ...prev, agreement_id: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.name.trim()) {
      setError('Vui lòng nhập tên lớp học');
      return;
    }
    if (formData.name.trim().length < 3) {
      setError('Tên lớp học phải có ít nhất 3 ký tự');
      return;
    }
    if (!formData.subject.trim()) {
      setError('Vui lòng chọn hoặc nhập môn học');
      return;
    }

    const finalGrade = formData.grade.trim() || 'Chung';
    const cap = parseInt(formData.capacity, 10) || 20;
    if (isNaN(cap) || cap < 1 || cap > 200) {
      setError('Sĩ số tối đa phải từ 1 đến 200 học viên');
      return;
    }

    try {
      setSubmitting(true);
      const res = await createClassroom({
        name: formData.name.trim(),
        subject: formData.subject.trim(),
        grade: finalGrade,
        capacity: cap,
        description: formData.description.trim(),
        agreement_id: formData.agreement_id || null,
      });

      const newClassroom = res?.data?.classroom || res?.data;
      setCreatedResult(newClassroom);
      if (onClassroomCreated) {
        onClassroomCreated(newClassroom);
      }
      showToast('Khởi tạo lớp học thành công!');
    } catch (err) {
      setError(err.message || 'Không thể tạo lớp học. Vui lòng kiểm tra lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopy = (text, message) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
      showToast(message);
    }
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <GraduationCap size={20} style={{ color: '#e85a2c' }} />
            <span>{createdResult ? 'Lớp học đã được tạo thành công!' : 'Tạo lớp học mới'}</span>
          </h2>
          <button className="modal-close-btn" onClick={handleClose} title="Đóng">
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {error && (
            <div className="error-alert">
              <AlertTriangle size={18} style={{ flexShrink: 0 }} />
              <div>{error}</div>
            </div>
          )}

          {/* Màn hình hiển thị kết quả tạo thành công */}
          {createdResult ? (
            <div className="success-container">
              <div className="success-icon-badge">
                <Check size={28} />
              </div>
              <h3>{createdResult.name}</h3>
              <p>
                Lớp học đã sẵn sàng hoạt động. Bạn có thể chia sẻ mã tham gia hoặc liên kết mời dưới đây
                để học sinh và phụ huynh gia nhập lớp:
              </p>

              <div className="share-card">
                <div className="share-field">
                  <label>Mã tham gia lớp</label>
                  <div className="share-input-group">
                    <input type="text" readOnly value={createdResult.join_code} />
                    <button
                      type="button"
                      className="btn-primary-orange"
                      onClick={() =>
                        handleCopy(createdResult.join_code, 'Đã sao chép mã lớp học!')
                      }
                    >
                      Sao chép mã
                    </button>
                  </div>
                </div>

                <div className="share-field" style={{ marginTop: '16px' }}>
                  <label>Đường dẫn mời tham gia</label>
                  <div className="share-input-group">
                    <input type="text" readOnly value={createdResult.invite_link} />
                    <button
                      type="button"
                      className="btn-outline-gray"
                      onClick={() =>
                        handleCopy(createdResult.invite_link, 'Đã sao chép liên kết mời!')
                      }
                    >
                      Sao chép liên kết
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <a
                  href={`/classes/${createdResult._id}`}
                  className="btn-primary-orange"
                  style={{ textDecoration: 'none' }}
                >
                  Vào không gian lớp học ngay →
                </a>
                <button type="button" className="btn-outline-gray" onClick={handleClose}>
                  Đóng
                </button>
              </div>
            </div>
          ) : (
            /* Form nhập thông tin tạo lớp */
            <form onSubmit={handleSubmit}>
              {/* Tùy chọn tạo từ thỏa thuận đã chốt (UC21.A1) */}
              {agreements.length > 0 && (
                <div className="agreement-banner">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600 }}>
                    <input
                      type="checkbox"
                      checked={useAgreement}
                      onChange={(e) => {
                        setUseAgreement(e.target.checked);
                        if (!e.target.checked) {
                          setFormData((prev) => ({ ...prev, agreement_id: '' }));
                        }
                      }}
                    />
                    Tạo nhanh từ thỏa thuận kết nối đã xác nhận
                  </label>

                  {useAgreement && (
                    <select
                      className="agreement-selector"
                      value={formData.agreement_id}
                      onChange={handleSelectAgreement}
                    >
                      <option value="">-- Chọn thỏa thuận đã chốt với phụ huynh --</option>
                      {agreements.map((item) => (
                        <option key={item._id} value={item._id}>
                          {item.agreed_subject || 'Môn học'} - Học phí: {item.agreed_price ? `${item.agreed_price}đ` : 'Thỏa thuận'} ({item.agreed_schedule || 'Chưa có lịch'})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {/* Tên lớp học */}
              <div className="form-group">
                <label htmlFor="name">
                  Tên lớp học <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  placeholder="Ví dụ: Ôn thi Toán 12 Nâng cao, Tiếng Anh Giao tiếp B2"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  autoFocus
                />
                <div className="form-help-text">Đặt tên rõ ràng để học sinh và phụ huynh dễ nhận biết.</div>
              </div>

              {/* Môn học & Khối lớp */}
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="subject">
                    Môn học <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    list="subject-suggestions"
                    placeholder="VD: Toán, Tiếng Anh, Lý..."
                    value={formData.subject}
                    onChange={handleChange}
                    required
                  />
                  <datalist id="subject-suggestions">
                    <option value="Toán học" />
                    <option value="Tiếng Anh" />
                    <option value="Vật lý" />
                    <option value="Hóa học" />
                    <option value="Ngữ văn" />
                    <option value="Sinh học" />
                    <option value="Tin học / Lập trình" />
                  </datalist>
                </div>

                <div className="form-group">
                  <label htmlFor="grade">
                    Khối / Trình độ <span style={{ color: '#94a3b8', fontSize: '12px' }}>(tùy chọn)</span>
                  </label>
                  <input
                    type="text"
                    id="grade"
                    name="grade"
                    list="grade-suggestions"
                    placeholder="VD: Lớp 10, Lớp 12 (mặc định: Chung)"
                    value={formData.grade}
                    onChange={handleChange}
                  />
                  <datalist id="grade-suggestions">
                    <option value="Mầm non / Tiền tiểu học" />
                    <option value="Lớp 1" />
                    <option value="Lớp 2" />
                    <option value="Lớp 3" />
                    <option value="Lớp 4" />
                    <option value="Lớp 5" />
                    <option value="Lớp 6" />
                    <option value="Lớp 7" />
                    <option value="Lớp 8" />
                    <option value="Lớp 9" />
                    <option value="Lớp 10" />
                    <option value="Lớp 11" />
                    <option value="Lớp 12" />
                    <option value="Ôn thi Đại học" />
                    <option value="Đại học / Cao đẳng" />
                    <option value="Luyện thi chứng chỉ (IELTS, TOEIC...)" />
                    <option value="Người đi làm" />
                    <option value="Chung" />
                  </datalist>
                </div>
              </div>

              {/* Sĩ số tối đa */}
              <div className="form-group">
                <label htmlFor="capacity">
                  Sức chứa tối đa (Sĩ số học viên) <span className="required">*</span>
                </label>
                <input
                  type="number"
                  id="capacity"
                  name="capacity"
                  min="1"
                  max="200"
                  value={formData.capacity}
                  onChange={handleChange}
                  required
                />
                <div className="form-help-text">Số lượng học sinh tối đa được phép tham gia lớp học này (1 - 200).</div>
              </div>

              {/* Mô tả lớp học */}
              <div className="form-group">
                <label htmlFor="description">Mô tả lớp học / Yêu cầu khóa học</label>
                <textarea
                  id="description"
                  name="description"
                  rows="3"
                  placeholder="Giới thiệu nội dung bài giảng, tài liệu cần chuẩn bị hoặc quy định lớp học..."
                  value={formData.description}
                  onChange={handleChange}
                ></textarea>
              </div>

              {/* Modal Footer Buttons */}
              <div className="modal-footer" style={{ margin: '0 -24px -24px -24px' }}>
                <button type="button" className="btn-outline-gray" onClick={handleClose} disabled={submitting}>
                  Hủy
                </button>
                <button type="submit" className="btn-primary-orange" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }} disabled={submitting}>
                  <Plus size={15} />
                  <span>{submitting ? 'Đang khởi tạo lớp...' : 'Tạo lớp học ngay'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
