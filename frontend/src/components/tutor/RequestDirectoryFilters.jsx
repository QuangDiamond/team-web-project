import { useState } from 'react';
import { Search } from 'lucide-react';
import FormInput from '../common/FormInput';
import FormSelect from '../common/FormSelect';
import { TEACHING_MODES } from '../../constants/requestLabels';
import { useSubjectNames } from '../../hooks/useSubjectNames';

const EMPTY_FILTERS = { q: '', subject: '', grade: '', area: '', mode: '', minBudget: '', maxBudget: '' };

const toOptions = (values) => values.map((value) => ({ value: value, label: value }));

// Bộ lọc yêu cầu ở trang công khai /requests, cùng bố cục với trang tìm gia sư (TutorDirectory).
// Chỉ áp dụng khi bấm Tìm kiếm để không gọi API sau mỗi phím gõ
export default function RequestDirectoryFilters({ onApply, total }) {
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
    <form className="directory-search" role="search" onSubmit={handleSubmit}>
      <div className="directory-search-bar">
        <div className="directory-keyword">
          <Search size={20} aria-hidden="true" />
          <input
            name="q"
            type="search"
            value={values.q}
            onChange={handleChange}
            placeholder="Tiêu đề, môn học hoặc mô tả..."
            aria-label="Tìm yêu cầu theo tiêu đề, môn học hoặc mô tả"
            maxLength={100}
          />
        </div>
        <button type="submit" className="btn btn-primary">
          <span>Tìm kiếm</span>
        </button>
      </div>

      <div className="directory-filters">
        <FormSelect id="subject" label="Môn học" value={values.subject} onChange={handleChange} options={toOptions(subjects.subjectNames)} placeholder="Tất cả môn học" />
        <FormSelect id="grade" label="Cấp học / Trình độ" value={values.grade} onChange={handleChange} options={toOptions(subjects.gradeNames)} placeholder="Tất cả trình độ" />
        <FormSelect id="mode" label="Hình thức" value={values.mode} onChange={handleChange} options={TEACHING_MODES} placeholder="Mọi hình thức" />
        <fieldset className="directory-price-range">
          <legend>Ngân sách (₫/buổi)</legend>
          <div className="directory-price-inputs">
            <input type="number" name="minBudget" aria-label="Ngân sách thấp nhất" placeholder="Từ" min="0" value={values.minBudget} onChange={handleChange} />
            <span aria-hidden="true">—</span>
            <input type="number" name="maxBudget" aria-label="Ngân sách cao nhất" placeholder="Đến" min="0" value={values.maxBudget} onChange={handleChange} />
          </div>
        </fieldset>
      </div>

      <details className="directory-extra-filters" open={Boolean(values.area)}>
        <summary>Bộ lọc nâng cao</summary>
        <div className="directory-extra-grid">
          <FormInput id="area" label="Khu vực" value={values.area} onChange={handleChange} placeholder="Ví dụ: Cầu Giấy" />
        </div>
      </details>

      <div className="directory-results-toolbar">
        <button type="button" className="btn btn-outline btn-sm" onClick={handleClear}>Xóa bộ lọc</button>
        {total !== null && <p className="item-meta" role="status">Tìm thấy {total} yêu cầu đang mở</p>}
      </div>
    </form>
  );
}
