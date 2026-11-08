import { useCallback, useEffect, useState } from 'react';
import { getTutorSuggestions, refreshTutorSuggestions } from '../services/aiSuggestionService.js';

// Dữ liệu gợi ý gia sư của một request (UC09): lần đầu đọc (có cache), "Refresh" tính lại theo trọng số
export function useAiSuggestions(requestId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [refreshError, setRefreshError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getTutorSuggestions(requestId);
      setData(response.data);
    } catch (loadError) {
      setError(loadError);
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  useEffect(() => {
    load();
  }, [load]);

  const refresh = useCallback(
    async (weights) => {
      setRefreshing(true);
      setRefreshError(null);
      try {
        const response = await refreshTutorSuggestions(requestId, weights);
        setData(response.data);
      } catch (refreshFailure) {
        setRefreshError(refreshFailure);
      } finally {
        setRefreshing(false);
      }
    },
    [requestId]
  );

  return { data, loading, refreshing, error, refreshError, reload: load, refresh };
}
