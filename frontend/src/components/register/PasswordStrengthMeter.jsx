import { getPasswordStrength } from '../../utils/authValidators';

const SEGMENT_COUNT = 4;

// Thanh 4 vạch hiển thị độ mạnh mật khẩu, kèm chữ để không chỉ dựa vào màu
export default function PasswordStrengthMeter({ password }) {
  if (password.length === 0) {
    return null;
  }

  const strength = getPasswordStrength(password);
  const segments = [];
  for (let index = 0; index < SEGMENT_COUNT; index = index + 1) {
    const isFilled = index < strength.score;
    segments.push(
      <span key={index} className={isFilled ? 'strength-segment is-filled' : 'strength-segment'} />
    );
  }

  return (
    <div className={`password-strength strength-${strength.score}`}>
      <div className="strength-bar" aria-hidden="true">{segments}</div>
      {strength.label && <p className="strength-label">Password strength: {strength.label}</p>}
    </div>
  );
}
