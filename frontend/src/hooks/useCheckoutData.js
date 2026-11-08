import { useCallback, useEffect, useState } from 'react';
import * as paymentService from '../services/paymentService.js';

// Tải danh mục gói (catalog) và tình trạng gói hiện tại (me) cho màn Checkout
export function useCheckoutData() {
  const [catalog, setCatalog] = useState(null);
  const [billing, setBilling] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const reload = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const [catalogResponse, billingResponse] = await Promise.all([
        paymentService.getCatalog(),
        paymentService.getMyBilling(),
      ]);
      setCatalog(catalogResponse.data);
      setBilling(billingResponse.data);
    } catch (error) {
      setLoadError(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { catalog, billing, loading, loadError, reload };
}
