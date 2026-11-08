import { CreditCard, Landmark, QrCode } from 'lucide-react';

// Phương thức thanh toán (SC20 field 4)
export const PAYMENT_METHODS = [
  { value: 'VIETQR', label: 'VietQR', description: 'Scan a QR code with your banking app', Icon: QrCode },
  { value: 'ATM_CARD', label: 'ATM card', description: 'Domestic debit card (NAPAS)', Icon: Landmark },
  { value: 'CREDIT_CARD', label: 'Credit card', description: 'Visa, Mastercard, JCB', Icon: CreditCard },
];

export const getPaymentMethodLabel = (value) => {
  const method = PAYMENT_METHODS.find((item) => item.value === value);
  if (!method) {
    return value;
  }
  return method.label;
};

// D9: Pro mua 1–12 tháng, credit pack mua 1–10 gói
export const DURATION_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
export const QUANTITY_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const dateTimeFormatter = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
const dateFormatter = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' });

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
  if (count === 1) {
    return `${count} ${word}`;
  }
  return `${count} ${word}s`;
};
