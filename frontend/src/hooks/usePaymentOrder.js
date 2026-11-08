import { useCallback, useEffect, useRef, useState } from 'react';
import { getOrder } from '../services/paymentService.js';

const POLL_INTERVAL_MS = 3000;
// Đợi tối đa ~30 giây cho kết quả từ cổng thanh toán (10 lần x 3 giây)
const MAX_POLL_ATTEMPTS = 10;

// Lấy đơn thanh toán theo mã; nếu còn PENDING thì hỏi lại mỗi 3 giây, tối đa ~30 giây
export function usePaymentOrder(orderCode) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(Boolean(orderCode));
  const [loadError, setLoadError] = useState(null);
  const [pollingStopped, setPollingStopped] = useState(false);
  const attemptsRef = useRef(0);

  const fetchOrder = useCallback(async () => {
    try {
      const response = await getOrder(orderCode);
      setOrder(response.data);
      setLoadError(null);
    } catch (error) {
      setLoadError(error);
    } finally {
      setLoading(false);
    }
  }, [orderCode]);

  // Lần tải đầu
  useEffect(() => {
    if (!orderCode) {
      return;
    }
    attemptsRef.current = 0;
    fetchOrder();
  }, [orderCode, fetchOrder]);

  // Còn PENDING thì hẹn giờ hỏi lại
  useEffect(() => {
    if (!order || order.status !== 'PENDING' || pollingStopped) {
      return undefined;
    }
    if (attemptsRef.current >= MAX_POLL_ATTEMPTS) {
      setPollingStopped(true);
      return undefined;
    }
    const timerId = setTimeout(() => {
      attemptsRef.current = attemptsRef.current + 1;
      fetchOrder();
    }, POLL_INTERVAL_MS);
    return () => {
      clearTimeout(timerId);
    };
  }, [order, pollingStopped, fetchOrder]);

  // Nút "Refresh" sau khi hết thời gian chờ: hỏi lại thêm một lượt nữa
  const refresh = useCallback(() => {
    attemptsRef.current = 0;
    setPollingStopped(false);
    setLoading(true);
    fetchOrder();
  }, [fetchOrder]);

  return { order, loading, loadError, pollingStopped, refresh };
}
