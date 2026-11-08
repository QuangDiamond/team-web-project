import { useState } from 'react';
import { Search } from 'lucide-react';
import FormInput from '../common/FormInput';
import FormSelect from '../common/FormSelect';
import { GRADE_LEVELS } from '../../constants/gradeLevels';
import { TEACHING_MODES } from '../../constants/requestLabels';
import { useSubjectNames } from '../../hooks/useSubjectNames';

const EMPTY_FILTERS = { q: '', subject: '', grade: '', area: '', mode: '', minBudget: '', maxBudget: '' };

const toOptions = (values) => values.map((value) => ({ value: value, label: value }));

// Bộ lọc khi duyệt request (UC11). Chỉ áp dụng khi bấm Search để không gọi API sau mỗi phím gõ
export default function RequestFilters({ onApply }) {
  const [values, setValues] = useState(EMPTY_FILTERS);
  const subjects = useSubjectNames();

  const handleChange = (event) => {
    setValues({ ...values, [event.target.name]: event.target.value });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onApply(values);
  };

  const handleClear = () => {
    setValues(EMPTY_FILTERS);
    onApply(EMPTY_FILTERS);
  };

  return (
    <form className="request-filters" onSubmit={handleSubmit} role="search">
      <FormInput id="q" label="Từ khóa" value={values.q} onChange={handleChange} placeholder="Tìm theo tiêu đề, môn học hoặc mô tả" />
      <div className="request-filters-grid">
        <FormSelect id="subject" label="Môn học" value={values.subject} onChange={handleChange} options={toOptions(subjects.subjectNames)} placeholder="Tất cả môn học" />
        <FormSelect id="grade" label="Khối lớp" value={values.grade} onChange={handleChange} options={toOptions(GRADE_LEVELS)} placeholder="Tất cả khối lớp" />
        <FormSelect id="mode" label="Hình thức học" value={values.mode} onChange={handleChange} options={TEACHING_MODES} placeholder="Mọi hình thức" />
        <FormInput id="area" label="Khu vực" value={values.area} onChange={handleChange} placeholder="Ví dụ: Cầu Giấy" />
        <FormInput id="minBudget" label="Ngân sách tối thiểu (₫)" type="number" value={values.minBudget} onChange={handleChange} placeholder="0" />
        <FormInput id="maxBudget" label="Ngân sách tối đa (₫)" type="number" value={values.maxBudget} onChange={handleChange} placeholder="Tất cả" />
      </div>
      <div className="item-actions">
        <button type="submit" className="btn btn-primary btn-sm">
          <Search size={14} aria-hidden="true" />
          <span>Tìm kiếm</span>
        </button>
        <button type="button" className="btn btn-outline btn-sm" onClick={handleClear}>Xóa bộ lọc</button>
      </div>
    </form>
  );
}
