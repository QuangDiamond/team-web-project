import { ProductCode, VnpLocale, dateFormat } from 'vnpay';
import { VNPay, ignoreLogger } from 'vnpay';

const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);

const vnpay = new VNPay({
    // ⚡ Cấu hình bắt buộc
    tmnCode: process.env.VNP_TMNCODE,
    secureSecret: process.env.VNP_HASHSECRET,
    vnpayHost: 'https://sandbox.vnpayment.vn',

    // 🔧 Cấu hình tùy chọn
    testMode: true, // Chế độ test
    hashAlgorithm: 'SHA512', // Thuật toán mã hóa
    enableLog: true, // Bật/tắt log
    loggerFn: ignoreLogger, // Custom logger
});

export const paymentUrl = async (req, res) => {
  try {
    const result = await vnpay.buildPaymentUrl({
      vnp_Amount: 10000,
      vnp_IpAddr: req.ip,
      vnp_TxnRef: 'ORD-123456',
      vnp_OrderInfo: 'Thanh toan don hang ORD-123456',
      vnp_OrderType: ProductCode.Other,
      vnp_ReturnUrl: process.env.VNP_RETURN_URL,
      vnp_Locale: VnpLocale.VN,
    vnp_CreateDate: dateFormat(new Date()), // tùy chọn, mặc định là thời gian hiện tại
    vnp_ExpireDate: dateFormat(tomorrow), // tùy chọn

    });

    return res.status(201).json(result);
  } catch (error) {
    console.log(error);
    return res.status(500).json(error);
  }
};