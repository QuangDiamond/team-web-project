import { useEffect, useState } from 'react';

const PAGE_SIZE = 10;

// Tải 1 trang danh sách mỗi khi bộ lọc hoặc số trang đổi.
// fetchPage(params) phải trả về response { data: { items, pagination } }; enabled = false thì không gọi (vd: bộ lọc sai)
export function usePagedList(fetchPage, filterParams, page, enabled) {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  // Chuỗi hóa bộ lọc để effect chỉ chạy lại khi giá trị thật sự đổi
  const filterKey = JSON.stringify(filterParams);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }
    // Bỏ kết quả của request cũ nếu người dùng đổi bộ lọc trước khi nó trả về
    let ignore = false;
    setLoading(true);
    setLoadError('');
    fetchPage({ ...JSON.parse(filterKey), page: page, limit: PAGE_SIZE })
      .then((response) => {
        if (ignore) {
          return;
        }
        setItems(response.data.items);
        setPagination(response.data.pagination);
      })
      .catch((error) => {
        if (ignore) {
          return;
        }
        setLoadError(error.message);
      })
      .finally(() => {
        if (!ignore) {
          setLoading(false);
        }
      });
    return () => {
      ignore = true;
    };
  }, [fetchPage, filterKey, page, enabled, reloadKey]);

  const reload = () => {
    setReloadKey(reloadKey + 1);
  };

  return { items, pagination, loading, loadError, reload };
}
