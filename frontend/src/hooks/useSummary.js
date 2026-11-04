import { useCallback, useEffect, useState } from 'react';

// Tải một object số liệu từ API (fetcher trả về response có data), kèm trạng thái loading / lỗi và hàm tải lại
export function useSummary(fetcher) {
  const [state, setState] = useState({ loading: true, error: null, data: null });

  const load = useCallback(async () => {
    setState({ loading: true, error: null, data: null });
    try {
      const response = await fetcher();
      setState({ loading: false, error: null, data: response.data });
    } catch (error) {
      setState({ loading: false, error: error, data: null });
    }
  }, [fetcher]);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, reload: load };
}
