// Ô nhập nhiều dòng có label, gợi ý, bộ đếm ký tự và dòng lỗi bên dưới
export default function FormTextarea({ id, label, value, onChange, error, hint, placeholder, maxLength, rows = 3, disabled }) {
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;

  const describedByIds = [];
  if (hint) {
    describedByIds.push(hintId);
  }
  if (error) {
    describedByIds.push(errorId);
  }
  let describedBy;
  if (describedByIds.length > 0) {
    describedBy = describedByIds.join(' ');
  }

  return (
    <div className="form-field">
      <label htmlFor={id} className="form-label">{label}</label>
      <div className={error ? 'form-control has-error' : 'form-control'}>
        <textarea
          id={id}
          name={id}
          rows={rows}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          maxLength={maxLength}
          disabled={disabled}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={describedBy}
        />
      </div>
      <div className="form-textarea-meta">
        {hint && <p id={hintId} className="form-field-hint">{hint}</p>}
        {maxLength && <span className="form-counter" aria-hidden="true">{value.length}/{maxLength}</span>}
      </div>
      {error && <p id={errorId} className="form-error">{error}</p>}
    </div>
  );
}
