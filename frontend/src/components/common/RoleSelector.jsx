import { GraduationCap, BookOpen, Users } from 'lucide-react';

const ROLE_OPTIONS = [
  { value: 'STUDENT', title: 'Học sinh', description: 'Tôi muốn tìm gia sư', Icon: GraduationCap },
  { value: 'TUTOR', title: 'Gia sư', description: 'Tôi muốn giảng dạy', Icon: BookOpen },
  { value: 'PARENT', title: 'Phụ huynh', description: 'Tôi muốn tìm gia sư cho con', Icon: Users },
];

// Chọn role bằng thẻ, bên dưới là radio thật để dùng được bàn phím và screen reader
export default function RoleSelector({ value, onChange, error }) {
  return (
    <fieldset className="role-selector" aria-describedby={error ? 'role-error' : undefined}>
      <legend className="visually-hidden">Chọn vai trò của bạn</legend>
      <div className="role-options">
        {ROLE_OPTIONS.map((option) => {
          const checked = value === option.value;
          const Icon = option.Icon;
          return (
            <label key={option.value} className={checked ? 'role-card is-selected' : 'role-card'}>
              <input
                type="radio"
                name="role"
                value={option.value}
                checked={checked}
                onChange={() => onChange(option.value)}
                className="visually-hidden"
              />
              <Icon size={22} className="role-card-icon" aria-hidden="true" />
              <span className="role-card-title">{option.title}</span>
              <span className="role-card-description">{option.description}</span>
            </label>
          );
        })}
      </div>
      {error && <p id="role-error" className="form-error">{error}</p>}
    </fieldset>
  );
}

// Lấy tên hiển thị của role cho "Account summary"
export const getRoleTitle = (role) => {
  const option = ROLE_OPTIONS.find((item) => item.value === role);
  if (!option) {
    return '—';
  }
  return option.title;
};
