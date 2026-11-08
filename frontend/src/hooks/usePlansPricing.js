import { useCallback, useEffect, useState } from 'react';
import * as adminService from '../services/adminService.js';

// Tải danh sách plan + credit pack cho màn Plans & Pricing (UC39)
export function usePlansPricing() {
  const [plans, setPlans] = useState([]);
  const [creditPacks, setCreditPacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const reload = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const [plansResponse, packsResponse] = await Promise.all([
        adminService.getPlans(),
        adminService.getCreditPacks(),
      ]);
      setPlans(plansResponse.data.items);
      setCreditPacks(packsResponse.data.items);
    } catch (error) {
      setLoadError(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { plans, creditPacks, loading, loadError, reload };
}
