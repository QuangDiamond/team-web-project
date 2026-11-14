// Ô nhập có label và dòng lỗi ngay bên dưới (lỗi được đọc bởi screen reader qua aria-describedby)
export default function FormInput({
  id,
  label,
  type = 'text',
  value,
  onChange,
  onBlur,
  error,
  placeholder,
  autoComplete,
  disabled,
  maxLength,
  endAdornment,
  belowControl,
  required = false,
}) {
  const errorId = `${id}-error`;
  let describedBy;
  if (error) {
    describedBy = errorId;
  }

  return (
    <div className="form-field">
      <label htmlFor={id} className="form-label">{label}{required && <span className="form-required" aria-hidden="true"> *</span>}</label>
      <div className={error ? 'form-control has-error' : 'form-control'}>
        <input
          id={id}
          name={id}
          type={type}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          autoComplete={autoComplete}
          disabled={disabled}
          required={required}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={describedBy}
        />
        {endAdornment}
      </div>
      {belowControl}
      {error && <p id={errorId} className="form-error">{error}</p>}
    </div>
  );
}
