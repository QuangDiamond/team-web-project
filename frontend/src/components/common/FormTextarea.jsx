// Ô nhập nhiều dòng, cùng kiểu với FormInput (label + dòng lỗi bên dưới)
export default function FormTextarea({ id, label, value, onChange, error, placeholder, disabled, rows = 4, maxLength, optional = false }) {
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
        <textarea
          id={id}
          name={id}
          rows={rows}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={maxLength}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={describedBy}
        />
      </div>
      {error && <p id={errorId} className="form-error">{error}</p>}
    </div>
  );
}
