import { CreditCard, Landmark, QrCode } from 'lucide-react';

// Phương thức thanh toán (SC20 field 4)
export const PAYMENT_METHODS = [
  { value: 'VIETQR', label: 'VietQR', description: 'Quét mã QR bằng ứng dụng ngân hàng', Icon: QrCode },
  { value: 'ATM_CARD', label: 'Thẻ ATM', description: 'Thẻ ghi nợ nội địa (NAPAS)', Icon: Landmark },
  { value: 'CREDIT_CARD', label: 'Thẻ tín dụng', description: 'Visa, Mastercard, JCB', Icon: CreditCard },
];

export const getPaymentMethodLabel = (value) => {
  const method = PAYMENT_METHODS.find((item) => item.value === value);
  if (!method) {
    return value;
  }
  return method.label;
};

// Credit pack mua 1–10 gói.
export const QUANTITY_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const dateTimeFormatter = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' });
const dateFormatter = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium' });

export const formatDateTime = (value) => {
  if (!value) {
    return '—';
  }
  return dateTimeFormatter.format(new Date(value));
};

export const formatDate = (value) => {
  if (!value) {
    return '—';
  }
  return dateFormatter.format(new Date(value));
};

export const pluralize = (count, word) => {
  return `${count.toLocaleString('vi-VN')} ${word}`;
};
