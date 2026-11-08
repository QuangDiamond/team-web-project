// Ô nhập nhiều dòng có label, gợi ý, bộ đếm ký tự và dòng lỗi bên dưới
export default function FormTextarea({ id, label, value, onChange, error, hint, placeholder, maxLength, rows = 3, disabled, optional = false, required = false }) {
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
      <label htmlFor={id} className="form-label">
        {label}
        {required && <span className="form-required" aria-hidden="true"> *</span>}
        {optional && <span className="form-optional"> (optional)</span>}
      </label>
      <div className={error ? 'form-control has-error' : 'form-control'}>
        <textarea
          id={id}
          name={id}
          rows={rows}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          maxLength={maxLength}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={describedBy}
        />
      </div>
      {hint && <p id={hintId} className="form-field-hint">{hint}</p>}
      {error && <p id={errorId} className="form-error">{error}</p>}
    </div>
  );
}
