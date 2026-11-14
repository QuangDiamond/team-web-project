import { toast } from 'sonner';
import { useState, useEffect, useMemo } from 'react';
import { Settings, AlertTriangle, X } from 'lucide-react';
import { updateClassroom } from '../../services/classroomService';
import { useSubjectNames } from '../../hooks/useSubjectNames';
import Combobox from '../../components/common/Combobox';

const DEFAULT_SUBJECTS = [
  'Toán',
  'Ngữ văn',
  'Tiếng Anh',
  'Vật lý',
  'Hóa học',
  'Sinh học',
  'Lịch sử',
  'Địa lý',
  'Tin học',
  'Khoa học tự nhiên',
  'Lịch sử và Địa lý',
  'Giáo dục công dân',
  'Tiếng Pháp',
  'Tiếng Nhật',
  'Tiếng Trung',
  'Tiếng Hàn',
];

const DEFAULT_GRADES = [
  'Mầm non',
  'Lớp 1',
  'Lớp 2',
  'Lớp 3',
  'Lớp 4',
  'Lớp 5',
  'Lớp 6',
  'Lớp 7',
  'Lớp 8',
  'Lớp 9',
  'Lớp 10',
  'Lớp 11',
  'Lớp 12',
  'Ôn thi vào 10',
  'Ôn thi Đại học',
  'IELTS',
  'TOEIC',
  'Tiếng Anh giao tiếp',
  'Đại học / Cao đẳng',
];

export default function EditClassroomModal({ isOpen, onClose, classroom, onUpdated }) {
  const { subjectNames, gradeNames } = useSubjectNames();

  const subjectOptions = useMemo(() => {
    const list = Array.isArray(subjectNames) && subjectNames.length > 0 ? subjectNames : DEFAULT_SUBJECTS;
    return Array.from(new Set([...list, ...DEFAULT_SUBJECTS]));
  }, [subjectNames]);

  const gradeOptions = useMemo(() => {
    const list = Array.isArray(gradeNames) && gradeNames.length > 0 ? gradeNames : DEFAULT_GRADES;
    return Array.from(new Set([...list, ...DEFAULT_GRADES]));
  }, [gradeNames]);
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
            <Settings size={20} style={{ color: 'var(--color-primary-strong)' }} />
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
                <label htmlFor="edit-subject">
                  Môn học <span className="required">*</span>
                </label>
                <Combobox
                  id="edit-subject"
                  name="subject"
                  value={formData.subject}
                  onChange={(val) => setFormData((prev) => ({ ...prev, subject: val }))}
                  options={subjectOptions}
                  placeholder="Chọn hoặc nhập môn học..."
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit-grade">
                  Khối lớp / Trình độ <span className="required">*</span>
                </label>
                <Combobox
                  id="edit-grade"
                  name="grade"
                  value={formData.grade}
                  onChange={(val) => setFormData((prev) => ({ ...prev, grade: val }))}
                  options={gradeOptions}
                  placeholder="Chọn hoặc nhập khối lớp, trình độ..."
                  required
                />
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
