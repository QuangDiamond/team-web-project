import FormSelect from './FormSelect';
import { MAX_CREDITS_PER_ACTION, MIN_CREDITS_PER_ACTION } from '../../constants/credits';

/*
 * Chọn số credit dùng cho lần ứng tuyển / mời. Dùng nhiều hơn thì được ưu tiên hiện lên đầu danh sách phía nhận.
 * balance: số dư hiện tại (null khi chưa tải xong) để không cho chọn quá số dư.
 */
export default function CreditAmountField({ id, value, onChange, balance, disabled, audience }) {
  let maxChoice = MAX_CREDITS_PER_ACTION;
  if (balance !== null && balance < MAX_CREDITS_PER_ACTION) {
    maxChoice = Math.max(balance, MIN_CREDITS_PER_ACTION);
  }

  const options = [];
  for (let amount = MIN_CREDITS_PER_ACTION; amount <= maxChoice; amount += 1) {
    let label = `${amount} credits`;
    if (amount === 1) {
      label = '1 credit';
    }
    options.push({ value: String(amount), label: label });
  }

  return (
    <FormSelect
      id={id}
      label="Credits to spend"
      value={value}
      onChange={onChange}
      options={options}
      disabled={disabled}
      hint={`The more credits you spend, the higher you appear in ${audience} list. Credits are not refunded.`}
    />
  );
}
