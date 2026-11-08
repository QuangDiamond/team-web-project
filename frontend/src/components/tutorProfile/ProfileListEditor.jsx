import { Plus, Trash2 } from 'lucide-react';
import FormInput from '../common/FormInput';
import FormTextarea from '../common/FormTextarea';

/*
 * Soạn một danh sách mục con của hồ sơ (kinh nghiệm, học vấn, thành tích).
 * fields: [{ name, label, type: 'text' | 'date' | 'number' | 'textarea', optional }]
 * errors: mảng lỗi theo từng mục, ví dụ [{ title: 'Experience title is required' }]
 */
export default function ProfileListEditor({ sectionId, title, items, fields, emptyItem, maxItems, addLabel, errors, disabled, onChange }) {
  const updateItem = (index, fieldName, value) => {
    const nextItems = items.map((item, itemIndex) => {
      if (itemIndex === index) {
        return { ...item, [fieldName]: value };
      }
      return item;
    });
    onChange(nextItems);
  };

  const removeItem = (index) => {
    onChange(items.filter((item, itemIndex) => itemIndex !== index));
  };

  const addItem = () => {
    onChange([...items, { ...emptyItem }]);
  };

  return (
    <fieldset className="profile-section" disabled={disabled}>
      <legend className="profile-section-title">{title}</legend>

      {items.length === 0 && <p className="item-meta">Nothing added yet.</p>}

      {items.map((item, index) => {
        const itemErrors = errors[index] || {};
        return (
          <div key={`${sectionId}-${index}`} className="profile-item">
            <div className="profile-item-fields">
              {fields.map((field) => {
                const fieldId = `${sectionId}-${index}-${field.name}`;
                if (field.type === 'textarea') {
                  return (
                    <FormTextarea
                      key={field.name}
                      id={fieldId}
                      label={field.label}
                      optional={field.optional}
                      required={!field.optional}
                      rows={2}
                      value={item[field.name]}
                      onChange={(event) => updateItem(index, field.name, event.target.value)}
                      error={itemErrors[field.name]}
                    />
                  );
                }
                return (
                  <FormInput
                    key={field.name}
                    id={fieldId}
                    label={field.optional ? `${field.label} (optional)` : field.label}
                    required={!field.optional}
                    type={field.type}
                    value={field.allowNow && item[field.name] === 'NOW' ? '' : item[field.name]}
                    disabled={field.allowNow && item[field.name] === 'NOW'}
                    belowControl={field.allowNow && (
                      <label className="checkbox form-inline-checkbox">
                        <input type="checkbox" checked={item[field.name] === 'NOW'}
                          onChange={(event) => updateItem(index, field.name, event.target.checked ? 'NOW' : '')} />
                        <span>Now</span>
                      </label>
                    )}
                    onChange={(event) => updateItem(index, field.name, event.target.value)}
                    error={itemErrors[field.name]}
                  />
                );
              })}
            </div>
            <button
              type="button"
              className="dashboard-icon-button profile-item-remove"
              aria-label={`Remove ${title} item ${index + 1}`}
              onClick={() => removeItem(index)}
            >
              <Trash2 size={16} aria-hidden="true" />
            </button>
          </div>
        );
      })}

      {items.length < maxItems && (
        <button type="button" className="btn btn-outline btn-sm" onClick={addItem}>
          <Plus size={14} aria-hidden="true" />
          <span>{addLabel}</span>
        </button>
      )}
    </fieldset>
  );
}
