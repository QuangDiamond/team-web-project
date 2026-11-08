import FormSelect from './FormSelect';
import { MAX_CREDITS_PER_ACTION, MIN_CREDITS_PER_ACTION } from '../../constants/credits';

/*
 * Chọn số credit dùng cho lần ứng tuyển / mời. Dùng nhiều hơn thì được ưu tiên hiện lên đầu danh sách phía nhận.
 * balance: số dư hiện tại (null khi chưa tải xong) để không cho chọn quá số dư.
 * audience: người nhận, viết sau chữ "danh sách của" (vd "phụ huynh", "gia sư").
 */
export default function CreditAmountField({ id, value, onChange, balance, disabled, audience }) {
  let maxChoice = MAX_CREDITS_PER_ACTION;
  if (balance !== null && balance < MAX_CREDITS_PER_ACTION) {
    maxChoice = Math.max(balance, MIN_CREDITS_PER_ACTION);
  }

  const options = [];
  for (let amount = MIN_CREDITS_PER_ACTION; amount <= maxChoice; amount += 1) {
    options.push({ value: String(amount), label: `${amount} tín dụng` });
  }

  return (
    <FormSelect
      id={id}
      label="Số tín dụng sử dụng"
      value={value}
      onChange={onChange}
      options={options}
      disabled={disabled}
      hint={`Dùng càng nhiều tín dụng, bạn càng được xếp lên đầu danh sách của ${audience}. Tín dụng không được hoàn lại.`}
    />
  );
}
