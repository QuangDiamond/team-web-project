import { useCallback, useEffect, useState } from 'react';
import { getMyBilling } from '../services/paymentService.js';

// Gói hiện tại, ngày gia hạn, số dư credit, AI quota còn lại (GET /payment/v1/me)
export function useMyBilling() {
  const [billing, setBilling] = useState(null);
  const [loadError, setLoadError] = useState('');

  const reload = useCallback(async () => {
    setLoadError('');
    try {
      const response = await getMyBilling();
      setBilling(response.data);
    } catch (error) {
      setLoadError(error.message);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { billing, loadError, reload };
}
