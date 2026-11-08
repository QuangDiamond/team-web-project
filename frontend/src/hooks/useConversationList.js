import { useCallback, useEffect, useState } from 'react';
import { getConversations } from '../services/chatService.js';
import { usePolling } from './usePolling.js';

const LIST_LIMIT = 50;
const POLL_INTERVAL_MS = 8000;

// Danh sách hội thoại của người dùng, tự làm mới định kỳ (polling) mà không nháy giao diện
export function useConversationList() {
  const [state, setState] = useState({ loading: true, error: null, items: [] });

  const refresh = useCallback(async () => {
    try {
      const response = await getConversations({ page: 1, limit: LIST_LIMIT });
      setState({ loading: false, error: null, items: response.data.items });
    } catch (error) {
      // Lỗi khi làm mới nền thì giữ danh sách cũ, chỉ báo lỗi nếu chưa có dữ liệu nào
      setState((previous) => {
        if (previous.items.length > 0) {
          return previous;
        }
        return { loading: false, error: error, items: [] };
      });
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  usePolling(refresh, POLL_INTERVAL_MS);

  return { ...state, refresh };
}
