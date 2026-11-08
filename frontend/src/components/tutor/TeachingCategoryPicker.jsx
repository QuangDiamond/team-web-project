import { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import { getTeachingCategoryOptions } from '../../services/categoryService';

const categoryKey = (item) => `${item.type}:${item.category_id}`;
const normalizeSearch = (text) => text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/đ/g, 'd');

export default function TeachingCategoryPicker({ value, onChange, disabled, error }) {
  const [options, setOptions] = useState([]);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  useEffect(() => {
    if (activeIndex >= 0) document.getElementById(`teaching-category-option-${activeIndex}`)?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);
  useEffect(() => {
    let ignore = false;
    getTeachingCategoryOptions().then((items) => {
      if (!ignore) setOptions(items);
    }).catch(() => {
      if (!ignore) setLoadError('Không tải được danh mục. Vui lòng tải lại trang.');
    }).finally(() => {
      if (!ignore) setLoading(false);
    });
    return () => { ignore = true; };
  }, []);

  const selected = new Set(value.map(categoryKey));
  const matches = options.filter((item) => !selected.has(categoryKey(item)) && normalizeSearch(item.name).includes(normalizeSearch(query.trim())));
  const expanded = open && !disabled && !loading && !loadError;
  const choose = (item) => {
    if (value.length >= 50 || selected.has(categoryKey(item))) return;
    onChange([...value, item]);
    setQuery('');
    setActiveIndex(-1);
  };
  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      setOpen(false);
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      setOpen(true);
      if (matches.length === 0) return;
      let next = activeIndex + 1;
      if (event.key === 'ArrowUp') {
        next = activeIndex - 1;
        if (activeIndex < 0) next = matches.length - 1;
      }
      setActiveIndex((next + matches.length) % matches.length);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (expanded && matches.length > 0) choose(matches[Math.max(0, activeIndex)]);
    }
  };

  return (
    <div className="teaching-category-picker form-field" onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
    }}>
      <label className="form-label" htmlFor="teaching_categories">Môn học và cấp học / trình độ giảng dạy</label>
      <p className="form-field-hint">Chọn nhiều mục từ danh mục chung, ví dụ: Toán, Lớp 9, IELTS. Tối đa 50 mục.</p>
      <ul className="teaching-category-tags" aria-label="Các danh mục đã chọn">
        {value.map((item) => (
          <li key={categoryKey(item)}>
            <span>{item.name}</span>
            <button type="button" aria-label={`Bỏ ${item.name}`} disabled={disabled} onClick={() => onChange(value.filter((entry) => categoryKey(entry) !== categoryKey(item)))}><X size={14} aria-hidden="true" /></button>
          </li>
        ))}
      </ul>
      <div className="teaching-category-control">
        <Search size={18} aria-hidden="true" />
        <input id="teaching_categories" role="combobox" aria-expanded={Boolean(expanded)} aria-controls="teaching-category-options" aria-autocomplete="list"
          aria-activedescendant={expanded && activeIndex >= 0 && matches[activeIndex] ? `teaching-category-option-${activeIndex}` : undefined}
          aria-invalid={Boolean(error)} aria-describedby="teaching-category-message"
          value={query} disabled={disabled || loading || Boolean(loadError)} maxLength={100}
          placeholder={loading ? 'Đang tải danh mục...' : 'Nhập để tìm môn học hoặc trình độ...'}
          onFocus={() => setOpen(true)} onKeyDown={handleKeyDown}
          onChange={(event) => { setQuery(event.target.value); setActiveIndex(-1); setOpen(true); }} />
      </div>
      {expanded && (
        <ul id="teaching-category-options" role="listbox" aria-label="Môn học và trình độ" className="teaching-category-options">
          {matches.map((item, index) => (
            <li key={categoryKey(item)} role="option" id={`teaching-category-option-${index}`} aria-selected={index === activeIndex}
              className={index === activeIndex ? 'is-active' : ''}>
              <button type="button" tabIndex={-1} disabled={value.length >= 50} onMouseDown={(event) => event.preventDefault()} onClick={() => choose(item)}>
                <span>{item.name}</span><small>{item.type === 'subjects' ? 'Môn học' : 'Cấp học / Trình độ'}</small>
              </button>
            </li>
          ))}
          {matches.length === 0 && <li className="teaching-category-empty" role="presentation">Không có danh mục phù hợp.</li>}
        </ul>
      )}
      <p id="teaching-category-message" className={error || loadError ? 'form-error' : 'form-field-hint'} role="status">{error || loadError || `${value.length}/50 mục đã chọn`}</p>
    </div>
  );
}
