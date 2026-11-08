import { useState } from 'react';
import { Search } from 'lucide-react';
import FormInput from '../common/FormInput';
import FormSelect from '../common/FormSelect';
import { TEACHING_MODES } from '../../constants/requestLabels';

const EMPTY_FILTERS = { q: '', subject: '', grade: '', area: '', mode: '', minBudget: '', maxBudget: '' };

const toOptions = (values) => values.map((value) => ({ value: value, label: value }));

// Bộ lọc khi duyệt request (UC11). Chỉ áp dụng khi bấm Search để không gọi API sau mỗi phím gõ
export default function RequestFilters({ options, onApply }) {
  const [values, setValues] = useState(EMPTY_FILTERS);

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
      <FormInput id="q" label="Keyword" value={values.q} onChange={handleChange} placeholder="Search by title, subject or description" />
      <div className="request-filters-grid">
        <FormSelect id="subject" label="Subject" value={values.subject} onChange={handleChange} options={toOptions(options.subjects)} placeholder="All subjects" />
        <FormSelect id="grade" label="Grade level" value={values.grade} onChange={handleChange} options={toOptions(options.grades)} placeholder="All grades" />
        <FormSelect id="mode" label="Session mode" value={values.mode} onChange={handleChange} options={TEACHING_MODES} placeholder="Any mode" />
        <FormInput id="area" label="Area" value={values.area} onChange={handleChange} placeholder="e.g. Cầu Giấy" />
        <FormInput id="minBudget" label="Min budget (₫)" type="number" value={values.minBudget} onChange={handleChange} placeholder="0" />
        <FormInput id="maxBudget" label="Max budget (₫)" type="number" value={values.maxBudget} onChange={handleChange} placeholder="Any" />
      </div>
      <div className="item-actions">
        <button type="submit" className="btn btn-primary btn-sm">
          <Search size={14} aria-hidden="true" />
          <span>Search</span>
        </button>
        <button type="button" className="btn btn-outline btn-sm" onClick={handleClear}>Clear</button>
      </div>
    </form>
  );
}
