import { toast } from 'sonner';
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, AlertTriangle, Check, X, Plus, ExternalLink } from 'lucide-react';
import { createClassroom, getConfirmedAgreements, getMyClassrooms } from '../../services/classroomService';
import { useSubjectNames } from '../../hooks/useSubjectNames';

function applyAgreementToForm(form, agreement) {
  const subject = agreement.derived_subject || agreement.agreed_subject || form.subject || '';
  const grade = agreement.derived_grade || agreement.conversation_id?.request_id?.grade_level || form.grade || '';
  const studentName = agreement.student_info?.full_name ? ` (${agreement.student_info.full_name})` : '';
  const defaultName = subject ? `Lớp ${subject}${grade ? ` ${grade}` : ''}${studentName}` : `Lớp kèm thỏa thuận`;

  return {
    ...form,
    agreement_id: agreement._id,
    name: form.name && form.name.trim() ? form.name : defaultName,
    subject: subject || form.subject,
    grade: grade || form.grade,
    description: agreement.agreed_schedule
      ? `Lịch học đã chốt: ${agreement.agreed_schedule}${agreement.student_info ? ` | Học sinh: ${agreement.student_info.full_name}` : ''}`
      : (form.description || (agreement.student_info ? `Học sinh: ${agreement.student_info.full_name}` : '')),
  };
}

export default function CreateClassroomModal({
  isOpen,
  initialAgreementId = '',
  existingClassrooms = [],
  onClose,
  onClassroomCreated,
}) {
  const navigate = useNavigate();
  const { subjectNames, gradeNames, loading: loadingCategories, error: categoryError } = useSubjectNames();
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    grade: '',
    capacity: 50,
    description: '',
    agreement_id: '',
  });

  const [allClassroomsList, setAllClassroomsList] = useState([]);
  const [agreements, setAgreements] = useState([]);
  const [useAgreement, setUseAgreement] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [createdResult, setCreatedResult] = useState(null);

  const resetForm = () => {
    setFormData({
      name: '',
      subject: '',
      grade: '',
      capacity: 50,
      description: '',
      agreement_id: '',
    });
    setUseAgreement(false);
    setError('');
    setCreatedResult(null);
  };

  // Load danh sách tất cả lớp học của gia sư (cả Active lẫn Archived) và danh sách thỏa thuận đã chốt khi mở modal (UC21, Case 1.2)
  useEffect(() => {
    if (isOpen) {
      resetForm();
      getMyClassrooms()
        .then((res) => {
          if (res?.data && Array.isArray(res.data)) {
            setAllClassroomsList(res.data);
          }
        })
        .catch(() => {});

      getConfirmedAgreements()
        .then((res) => {
          if (res?.data && Array.isArray(res.data)) {
            setAgreements(res.data);
            if (initialAgreementId) {
              const agreement = res.data.find((item) => item._id === initialAgreementId);
              if (agreement) {
                setUseAgreement(true);
                setFormData((form) => applyAgreementToForm(form, agreement));
              } else {
                setError('Thỏa thuận không còn khả dụng. Vui lòng chọn thỏa thuận khác.');
              }
            }
          }
        })
        .catch((err) => {
          console.warn('[UC21] Không lấy được danh sách thỏa thuận:', err.message);
        });
    }
  }, [isOpen, initialAgreementId]);

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
      setFormData((form) => applyAgreementToForm(form, agreement));
    } else {
      setFormData((prev) => ({ ...prev, agreement_id: '' }));
    }
  };

  // Danh sách đầy đủ các lớp của gia sư (kết hợp cả danh sách active và archived)
  const allKnownClassrooms = useMemo(() => {
    if (allClassroomsList && allClassroomsList.length > 0) {
      return allClassroomsList;
    }
    return existingClassrooms || [];
  }, [allClassroomsList, existingClassrooms]);

  // Case 1.2: Kiểm tra trùng tên theo thời gian thực (chuẩn hóa khoảng trắng & không phân biệt hoa thường)
  const normalizedInputName = (formData.name || '').trim().toLowerCase().replace(/\s+/g, ' ');
  const isDuplicateName = Boolean(
    normalizedInputName &&
    allKnownClassrooms.some((c) => {
      const existingName = (c.name || '').trim().toLowerCase().replace(/\s+/g, ' ');
      return existingName === normalizedInputName;
    })
  );

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

    // Case 1.2: Chặn tạo lớp nếu trùng tên với lớp đã có (kể cả lớp đã lưu trữ)
    if (isDuplicateName) {
      setError('Bạn đã có một lớp học mang tên này. Vui lòng đặt tên khác.');
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
      if (onClassroomCreated) {
        onClassroomCreated(newClassroom);
      }
      toast.success('Khởi tạo lớp học thành công!');
      handleClose();
      navigate(`/tutor/classes/${newClassroom._id}`);
    } catch (err) {
      const errMsg =
        err?.response?.data?.message ||
        err?.rawMessage ||
        err.message ||
        'Không thể tạo lớp học. Vui lòng kiểm tra lại.';
      toast.error(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopy = (text, message) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
      toast.success(message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <GraduationCap size={20} style={{ color: 'var(--color-primary-strong)' }} />
            <span>{createdResult ? 'Lớp học đã được tạo thành công!' : 'Tạo lớp học mới'}</span>
          </h2>
          <button className="modal-close-btn" onClick={handleClose} title="Đóng">
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {error && (
            <div
              className="error-alert"
              style={
                error.toLowerCase().includes('hạn mức') || error.toLowerCase().includes('nâng cấp gói')
                  ? { background: 'var(--color-warning-soft)', borderColor: '#fde68a', color: 'var(--color-warning)' }
                  : {}
              }
            >
              <AlertTriangle
                size={18}
                style={{
                  flexShrink: 0,
                  color:
                    error.toLowerCase().includes('hạn mức') || error.toLowerCase().includes('nâng cấp gói')
                      ? '#d97706'
                      : '#ef4444',
                }}
              />
              <div style={{ flex: 1 }}>
                <div>{error}</div>
                {(error.toLowerCase().includes('hạn mức') || error.toLowerCase().includes('nâng cấp gói')) && (
                  <div style={{ marginTop: '8px' }}>
                    <a
                      href="/tutor/checkout"
                      className="btn-primary-orange"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '13px',
                        padding: '6px 14px',
                        textDecoration: 'none',
                      }}
                    >
                      <span>Nâng cấp gói PRO ngay</span>
                      <ExternalLink size={14} />
                    </a>
                  </div>
                )}
              </div>
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
                <button
                  type="button"
                  className="btn-primary-orange"
                  onClick={() => {
                    handleClose();
                    navigate(`/tutor/classes/${createdResult._id}`);
                  }}
                >
                  Vào không gian lớp học ngay →
                </button>
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
                          {item.derived_subject || item.agreed_subject || 'Môn học'}{item.derived_grade ? ` (${item.derived_grade})` : ''} - Phụ huynh: {item.parent_info?.full_name || 'Phụ huynh'} {item.student_info?.full_name ? `- Con: ${item.student_info.full_name}` : ''} ({item.agreed_schedule || 'Lịch thỏa thuận'})
                        </option>
                      ))}
                    </select>
                  )}

                  {useAgreement && formData.agreement_id && (() => {
                    const sel = agreements.find((a) => a._id === formData.agreement_id);
                    if (!sel) return null;
                    return (
                      <div
                        style={{
                          marginTop: '10px',
                          padding: '10px 14px',
                          background: 'var(--color-surface-subtle)',
                          border: '1px solid var(--color-border)',
                          borderRadius: '8px',
                          fontSize: '13px',
                          color: 'var(--color-text)',
                          lineHeight: 1.6,
                        }}
                      >
                        <div><strong>Môn học:</strong> {sel.derived_subject || sel.agreed_subject || 'Theo thỏa thuận'}</div>
                        <div><strong>Khối / Trình độ:</strong> {sel.derived_grade || sel.conversation_id?.request_id?.grade_level || 'Chung'}</div>
                        <div><strong>Phụ huynh:</strong> {sel.parent_info?.full_name || 'Phụ huynh'} {sel.parent_info?.email ? `(${sel.parent_info.email})` : ''}</div>
                        <div>
                          <strong>Con (Học sinh):</strong>{' '}
                          {sel.student_info?.full_name ? (
                            <span style={{ color: '#0f766e', fontWeight: 600 }}>
                              {sel.student_info.full_name} {sel.student_info.email ? `(${sel.student_info.email})` : ''}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--color-text-muted)' }}>Được gán theo tài khoản liên kết của phụ huynh</span>
                          )}
                        </div>
                        <div style={{ marginTop: '6px', fontSize: '12px', color: 'var(--color-info)' }}>
                          * Hệ thống sẽ tự động thêm học sinh & phụ huynh vào lớp, đồng thời gửi tin nhắn kèm link mời tham gia ngay khi tạo lớp.
                        </div>
                      </div>
                    );
                  })()}
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
                  style={
                    isDuplicateName
                      ? { borderColor: 'var(--color-error)', backgroundColor: 'var(--color-error-soft)' }
                      : {}
                  }
                />
                {isDuplicateName && (
                  <div style={{ color: 'var(--color-error)', fontSize: '13px', marginTop: '4px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <AlertTriangle size={14} />
                    <span>Bạn đã có một lớp học mang tên này. Vui lòng đặt tên khác.</span>
                  </div>
                )}
                <div className="form-help-text">Đặt tên rõ ràng để học sinh và phụ huynh dễ nhận biết.</div>
              </div>

              {loadingCategories && <p role="status">Đang tải danh mục môn học và trình độ...</p>}
              {categoryError && <p role="alert">Không thể tải danh mục: {categoryError}</p>}

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
                    {subjectNames.map((name) => <option key={name} value={name} />)}
                  </datalist>
                </div>

                <div className="form-group">
                  <label htmlFor="grade">
                    Khối / Trình độ <span style={{ color: 'var(--color-text-muted)', fontSize: '12px' }}>(tùy chọn)</span>
                  </label>
                  <input
                    type="text"
                    id="grade"
                    name="grade"
                    list="grade-suggestions"
                    placeholder="Tìm lớp, IELTS, TOEIC... (mặc định: Chung)"
                    value={formData.grade}
                    onChange={handleChange}
                  />
                  <datalist id="grade-suggestions">
                    {gradeNames.map((name) => <option key={name} value={name} />)}
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
                <button
                  type="submit"
                  className="btn-primary-orange"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    opacity: isDuplicateName ? 0.6 : 1,
                    cursor: isDuplicateName ? 'not-allowed' : 'pointer',
                  }}
                  disabled={submitting || isDuplicateName}
                >
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
