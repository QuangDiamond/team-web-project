// Ô chọn một giá trị, cùng kiểu với FormInput. options: [{ value, label }]
export default function FormSelect({ id, label, value, onChange, options, error, disabled, placeholder, optional = false, hint }) {
  const errorId = `${id}-error`;
  let describedBy;
  if (error) {
    describedBy = errorId;
  }

  return (
    <div className="form-field">
      <label htmlFor={id} className="form-label">
        {label}
        {optional && <span className="form-optional"> (optional)</span>}
      </label>
      <div className={error ? 'form-control has-error' : 'form-control'}>
        <select
          id={id}
          name={id}
          value={value}
          onChange={onChange}
          disabled={disabled}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={describedBy}
        >
          {placeholder !== undefined && <option value="">{placeholder}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>
      {hint && !error && <p className="form-hint-left">{hint}</p>}
      {error && <p id={errorId} className="form-error">{error}</p>}
    </div>
  );
}
