import { useCallback, useEffect, useRef, useState } from 'react';

/*
 * Tải một danh sách có phân trang từ API (data = { items, pagination, ... }).
 * fetchPage: hàm trong services (ví dụ getMyRequests), params: object query (page, limit, bộ lọc).
 * Khi params đổi thì tự tải lại; kết quả của lần gọi cũ về muộn sẽ bị bỏ qua.
 */
export function usePagedList(fetchPage, params, page, enabled = true) {
  const [state, setState] = useState({ loading: true, error: null, data: null });
  const latestCall = useRef(0);
  const query = page === undefined ? params : { ...params, page, limit: 10 };
  const paramsKey = JSON.stringify(query);

  const load = useCallback(async () => {
    if (!enabled) return;
    latestCall.current += 1;
    const callNumber = latestCall.current;
    setState((previous) => ({ ...previous, loading: true, error: null }));
    try {
      const response = await fetchPage(JSON.parse(paramsKey));
      if (callNumber === latestCall.current) {
        setState({ loading: false, error: null, data: response.data });
      }
    } catch (error) {
      if (callNumber === latestCall.current) {
        setState({ loading: false, error: error, data: null });
      }
    }
  }, [fetchPage, paramsKey, enabled]);

  useEffect(() => {
    load();
    return () => { latestCall.current += 1; };
  }, [load]);

  // Cập nhật một item tại chỗ (ví dụ đổi trạng thái đã lưu) mà không phải tải lại cả danh sách
  const patchItem = useCallback((itemId, changes) => {
    setState((previous) => {
      if (!previous.data) {
        return previous;
      }
      const items = previous.data.items.map((item) => {
        if (item._id === itemId) {
          return { ...item, ...changes };
        }
        return item;
      });
      return { ...previous, data: { ...previous.data, items: items } };
    });
  }, []);

  // Billing/admin callers use flat fields; workspace callers use data/error.
  return {
    ...state,
    items: state.data?.items || [],
    pagination: state.data?.pagination || null,
    loadError: state.error?.message || '',
    reload: load,
    patchItem,
  };
}
