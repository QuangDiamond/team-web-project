import { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Check } from 'lucide-react';

/**
 * Combobox component cho phép vừa chọn từ danh sách dropdown gợi ý, vừa có thể nhập tự do.
 * @param {Object} props
 * @param {string} props.id - ID của input
 * @param {string} props.name - Name của input
 * @param {string} props.value - Giá trị hiện tại
 * @param {Function} props.onChange - Callback khi giá trị thay đổi (nhận vào string value)
 * @param {string[]} props.options - Danh sách các gợi ý để lựa chọn
 * @param {string} [props.placeholder] - Placeholder hiển thị khi chưa có giá trị
 * @param {boolean} [props.required=false] - Bắt buộc nhập hay không
 * @param {boolean} [props.disabled=false] - Vô hiệu hóa hay không
 * @param {string} [props.className=''] - Class CSS bổ sung
 * @param {boolean} [props.autoFocus=false] - Tự động focus khi mount
 */
export default function Combobox({
  id,
  name,
  value = '',
  onChange,
  options = [],
  placeholder = 'Chọn hoặc nhập...',
  required = false,
  disabled = false,
  className = '',
  autoFocus = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Đóng dropdown khi click ra ngoài component
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const trimmedVal = (value || '').trim().toLowerCase();

  // Lọc các tùy chọn phù hợp theo từ khóa người dùng gõ
  const filteredOptions = useMemo(() => {
    if (!trimmedVal) return options;
    return options.filter((opt) => opt && opt.toLowerCase().includes(trimmedVal));
  }, [options, trimmedVal]);

  const handleSelectOption = (opt) => {
    if (onChange) onChange(opt);
    setIsOpen(false);
  };

  const handleInputChange = (e) => {
    if (onChange) onChange(e.target.value);
    if (!isOpen) setIsOpen(true);
  };

  const toggleDropdown = () => {
    if (disabled) return;
    setIsOpen((prev) => !prev);
    if (!isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div
      ref={containerRef}
      className={`combobox-container ${className}`}
      style={{ position: 'relative', width: '100%' }}
    >
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
        <input
          ref={inputRef}
          type="text"
          id={id}
          name={name}
          value={value}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          autoFocus={autoFocus}
          autoComplete="off"
          style={{
            width: '100%',
            paddingRight: '36px',
            boxSizing: 'border-box',
          }}
        />
        <button
          type="button"
          onClick={toggleDropdown}
          disabled={disabled}
          tabIndex={-1}
          aria-label="Toggle options"
          style={{
            position: 'absolute',
            right: '8px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'transparent',
            border: 'none',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: disabled ? 'not-allowed' : 'pointer',
            color: 'var(--color-text-muted, #64748b)',
          }}
        >
          <ChevronDown
            size={16}
            style={{
              transform: isOpen ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.2s ease',
            }}
          />
        </button>
      </div>

      {isOpen && !disabled && (
        <ul
          className="combobox-menu"
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            maxHeight: '220px',
            overflowY: 'auto',
            backgroundColor: 'var(--color-surface, #ffffff)',
            border: '1px solid var(--color-border, #cbd5e1)',
            borderRadius: '8px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            zIndex: 100,
            margin: 0,
            padding: '4px 0',
            listStyle: 'none',
          }}
        >
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt) => {
              const isSelected = opt.toLowerCase() === (value || '').toLowerCase().trim();
              return (
                <li
                  key={opt}
                  onClick={() => handleSelectOption(opt)}
                  style={{
                    padding: '8px 12px',
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: isSelected ? 'var(--color-primary-soft, #fff7ed)' : 'transparent',
                    color: isSelected ? 'var(--color-primary-strong, #ea580c)' : 'var(--color-text, #334155)',
                    fontWeight: isSelected ? 600 : 400,
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--color-surface-subtle, #f1f5f9)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <span>{opt}</span>
                  {isSelected && <Check size={14} style={{ color: 'var(--color-primary-strong, #ea580c)' }} />}
                </li>
              );
            })
          ) : (
            <li
              style={{
                padding: '8px 12px',
                fontSize: '12px',
                color: 'var(--color-text-muted, #64748b)',
                fontStyle: 'italic',
              }}
            >
              Gõ &quot;{value}&quot; để sử dụng giá trị mới
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

