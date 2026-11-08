import { useCallback, useState } from 'react';
import { getTutorSuggestions } from '../services/aiSuggestionService.js';
import { usePagedList } from './usePagedList';

// Retain the hook name for existing imports; every load reads current profile selections.
export function useAiSuggestions(requestId) {
  const [page, setPage] = useState(1);
  const fetchPage = useCallback((params) => getTutorSuggestions(requestId, params), [requestId]);
  const list = usePagedList(fetchPage, { page, limit: 10 });
  const refresh = () => {
    if (page === 1) list.reload();
    else setPage(1);
  };
  return {
    data: list.data,
    loading: list.loading,
    refreshing: list.loading && Boolean(list.data),
    error: list.error,
    refreshError: null,
    reload: list.reload,
    refresh,
    page,
    setPage,
  };
}
