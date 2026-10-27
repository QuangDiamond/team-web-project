import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import FormInput from './FormInput';

// Ô mật khẩu có nút hiện/ẩn
export default function PasswordInput(props) {
  const [visible, setVisible] = useState(false);

  const toggleButton = (
    <button
      type="button"
      className="form-control-action"
      onClick={() => setVisible(!visible)}
      aria-label={visible ? 'Hide password' : 'Show password'}
      aria-pressed={visible}
    >
      {visible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
    </button>
  );

  return (
    <FormInput
      {...props}
      type={visible ? 'text' : 'password'}
      endAdornment={toggleButton}
    />
  );
}
