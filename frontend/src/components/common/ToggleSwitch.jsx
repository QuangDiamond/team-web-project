// Công tắc bật/tắt: checkbox thật với role="switch" để screen reader đọc là "on/off"
export default function ToggleSwitch({ id, label, description, checked, onChange, disabled }) {
  const descriptionId = `${id}-description`;
  let describedBy;
  if (description) {
    describedBy = descriptionId;
  }

  return (
    <div className="toggle-field">
      <div className="toggle-text">
        <label htmlFor={id} className="form-label">{label}</label>
        {description && <p id={descriptionId} className="toggle-description">{description}</p>}
      </div>
      <span className="toggle">
        <input
          id={id}
          name={id}
          type="checkbox"
          role="switch"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          disabled={disabled}
          aria-describedby={describedBy}
        />
        <span className="toggle-track" aria-hidden="true">
          <span className="toggle-thumb" />
        </span>
      </span>
    </div>
  );
}
