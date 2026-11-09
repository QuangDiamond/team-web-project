import FormSelect from '../common/FormSelect';
import { useSubjectNames } from '../../hooks/useSubjectNames';
import { toSelectOptions } from '../../utils/selectOptions';
import Alert from '../common/Alert';
import { TEACHING_MODES, AVAILABILITY_OPTIONS } from '../../constants/requestLabels';

export default function TutorSearchFilters({ filters, onChange }) {
  const categories = useSubjectNames();
  const handleChange = (event) => {
    onChange({ ...filters, [event.target.name]: event.target.value });
  };
  const value = (name) => filters[name] || '';
  return (
    <>
    {categories.error && <Alert type="error">Không tải được danh mục môn học/cấp học. Vui lòng tải lại trang.</Alert>}
    <div className="directory-filters">
      <FormSelect id="subject" label="Môn học" value={value('subject')} onChange={handleChange} placeholder="Tất cả môn học" options={toSelectOptions(categories.subjectNames, value('subject'))} disabled={categories.loading} />
      <FormSelect id="mode" label="Hình thức" value={value('mode')} onChange={handleChange} placeholder="Tất cả hình thức" options={TEACHING_MODES} />
      <FormSelect id="min_rating" label="Đánh giá" value={value('min_rating')} onChange={handleChange} placeholder="Tất cả đánh giá" options={[{ value: '4', label: 'Từ 4 sao' }, { value: '4.5', label: 'Từ 4,5 sao' }, { value: '5', label: '5 sao' }]} />
      <fieldset className="directory-price-range">
        <legend>Học phí (₫/buổi)</legend>
        <div className="directory-price-inputs">
          <input type="number" name="min_price" aria-label="Học phí thấp nhất" placeholder="Từ" min="0" value={value('min_price')} onChange={handleChange} />
          <span aria-hidden="true">—</span>
          <input type="number" name="max_price" aria-label="Học phí cao nhất" placeholder="Đến" min="0" value={value('max_price')} onChange={handleChange} />
        </div>
      </fieldset>
    </div>
    <details className="directory-extra-filters" open={Boolean(filters.grade || filters.availability)}>
      <summary>Bộ lọc nâng cao</summary>
      <div className="directory-extra-grid">
      <FormSelect id="grade" label="Cấp học / Trình độ" value={value('grade')} onChange={handleChange} placeholder="Tất cả trình độ" options={toSelectOptions(categories.gradeNames, value('grade'))} disabled={categories.loading} />
      <FormSelect id="availability" label="Trạng thái nhận lớp" value={value('availability')} onChange={handleChange} placeholder="Tất cả trạng thái" options={AVAILABILITY_OPTIONS} />
      </div>
    </details>
    </>
  );
}
