import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { Settings, AlertTriangle, X } from 'lucide-react';
import { updateClassroom } from '../../services/classroomService';

export default function EditClassroomModal({ isOpen, onClose, classroom, onUpdated }) {
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    grade: '',
    capacity: 50,
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const resetForm = () => {
    if (classroom) {
      setFormData({
        name: classroom.name || '',
        subject: classroom.subject_name || classroom.subject || '',
        grade: classroom.grade || '',
        capacity: classroom.capacity || 50,
        description: classroom.description || '',
      });
    }
    setError('');
  };

  useEffect(() => {
    if (isOpen && classroom) {
      resetForm();
    }
  }, [isOpen, classroom]);

  if (!isOpen || !classroom) return null;

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.name.trim()) {
      return setError('Tên lớp học không được để trống');
    }
    if (formData.name.trim().length < 3 || formData.name.trim().length > 100) {
      return setError('Tên lớp học phải từ 3 đến 100 ký tự');
    }
    if (!formData.subject.trim()) {
      return setError('Môn học không được để trống');
    }
    if (!formData.grade.trim()) {
      return setError('Khối lớp / Trình độ không được để trống');
    }

    const cap = parseInt(formData.capacity, 10);
    if (isNaN(cap) || cap < 1 || cap > 200) {
      return setError('Sĩ số tối đa phải từ 1 đến 200 học sinh');
    }

    if (classroom.member_count && cap < classroom.member_count) {
      return setError(
        `Sĩ số tối đa không thể nhỏ hơn số học viên hiện tại trong lớp (${classroom.member_count} học viên)`
      );
    }

    try {
      setSubmitting(true);
      const res = await updateClassroom(classroom._id, formData);
      toast.success('Cập nhật thông tin lớp học thành công!');
      if (onUpdated) {
        onUpdated(res?.data || { ...classroom, ...formData });
      }
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || 'Không thể cập nhật lớp học');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Settings size={20} style={{ color: '#e85a2c' }} />
            <span>Chỉnh sửa thông tin lớp học</span>
          </h2>
          <button type="button" className="modal-close-btn" onClick={handleClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div className="error-alert">
                <AlertTriangle size={18} style={{ flexShrink: 0 }} />
                <div>{error}</div>
              </div>
            )}

            <div className="form-group">
              <label>
                Tên lớp học <span className="required">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="VD: Lớp Ôn thi Toán 12 Nâng Cao"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>
                  Môn học <span className="required">*</span>
                </label>
                <select name="subject" value={formData.subject} onChange={handleChange} required>
                  <option value="">-- Chọn môn học --</option>
                  <option value="Toán học">Toán học</option>
                  <option value="Vật lý">Vật lý</option>
                  <option value="Hóa học">Hóa học</option>
                  <option value="Tiếng Anh">Tiếng Anh</option>
                  <option value="Ngữ văn">Ngữ văn</option>
                  <option value="Sinh học">Sinh học</option>
                  <option value="Lịch sử">Lịch sử</option>
                  <option value="Địa lý">Địa lý</option>
                  <option value="Tin học">Tin học</option>
                  <option value="Khác">Môn khác</option>
                </select>
              </div>

              <div className="form-group">
                <label>
                  Khối lớp / Trình độ <span className="required">*</span>
                </label>
                <select name="grade" value={formData.grade} onChange={handleChange} required>
                  <option value="">-- Chọn khối lớp --</option>
                  <option value="Mầm non / Tiền tiểu học">Mầm non / Tiền tiểu học</option>
                  <option value="Lớp 1">Lớp 1</option>
                  <option value="Lớp 2">Lớp 2</option>
                  <option value="Lớp 3">Lớp 3</option>
                  <option value="Lớp 4">Lớp 4</option>
                  <option value="Lớp 5">Lớp 5</option>
                  <option value="Lớp 6">Lớp 6</option>
                  <option value="Lớp 7">Lớp 7</option>
                  <option value="Lớp 8">Lớp 8</option>
                  <option value="Lớp 9">Lớp 9</option>
                  <option value="Lớp 10">Lớp 10</option>
                  <option value="Lớp 11">Lớp 11</option>
                  <option value="Lớp 12">Lớp 12</option>
                  <option value="Ôn thi Đại học">Ôn thi Đại học</option>
                  <option value="Đại học">Đại học / Cao đẳng</option>
                  <option value="Luyện thi chứng chỉ">Luyện thi chứng chỉ</option>
                  <option value="Người đi làm">Người đi làm</option>
                  <option value="Chung">Chung</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>
                Sĩ số tối đa (Capacity) <span className="required">*</span>
              </label>
              <input
                type="number"
                name="capacity"
                value={formData.capacity}
                onChange={handleChange}
                min={classroom.member_count || 1}
                max={200}
                required
              />
              <div className="form-help-text">
                Hiện lớp có {classroom.member_count || 0} học viên. Sĩ số không được nhỏ hơn số học viên hiện tại.
              </div>
            </div>

            <div className="form-group">
              <label>Mô tả lớp học</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                placeholder="Mô tả mục tiêu khóa học, tài liệu, quy định làm bài..."
              ></textarea>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-outline-gray" onClick={handleClose} disabled={submitting}>
              Hủy
            </button>
            <button type="submit" className="btn-primary-orange" disabled={submitting}>
              {submitting ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
