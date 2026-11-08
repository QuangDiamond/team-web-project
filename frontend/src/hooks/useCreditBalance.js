import { useCallback, useEffect, useState } from 'react';
import { getCreditBalance } from '../services/creditService.js';

// Số dư credit hiện tại (dùng trong hộp thoại ứng tuyển / mời gia sư để hiện chi phí)
export function useCreditBalance() {
  const [state, setState] = useState({ loading: true, error: null, balance: null });

  const load = useCallback(async () => {
    setState({ loading: true, error: null, balance: null });
    try {
      const response = await getCreditBalance();
      setState({ loading: false, error: null, balance: response.data.balance });
    } catch (error) {
      setState({ loading: false, error: error, balance: null });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, reload: load };
}
