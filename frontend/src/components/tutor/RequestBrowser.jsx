import { useMemo, useState } from 'react';
import { SearchX } from 'lucide-react';
import { usePagedList } from '../../hooks/usePagedList';
import { useRequestActions } from '../../hooks/useRequestActions';
import { browseRequests } from '../../services/tutorRequestService';
import ListState from '../common/ListState';
import Pagination from '../common/Pagination';
import RequestFilters from './RequestFilters';
import RequestGrid from './RequestGrid';

const PAGE_SIZE = 9;

// Bỏ các bộ lọc rỗng để không gửi query thừa lên backend
const toQueryParams = (filters) => {
  const params = {};
  Object.keys(filters).forEach((name) => {
    if (filters[name] !== '') {
      params[name] = filters[name];
    }
  });
  return params;
};

// UC11 – duyệt các yêu cầu đang mở với bộ lọc và phân trang. readOnly: khách / không phải gia sư, ẩn lưu và ứng tuyển
export default function RequestBrowser({ readOnly = false }) {
  const [filters, setFilters] = useState({});
  const [page, setPage] = useState(1);

  const params = useMemo(() => ({ ...toQueryParams(filters), page: page, limit: PAGE_SIZE }), [filters, page]);
  const list = usePagedList(browseRequests, params);
  const actions = useRequestActions({ patchItem: list.patchItem });

  const handleApplyFilters = (values) => {
    setFilters(values);
    setPage(1);
  };

  let total = 0;
  if (list.data) {
    total = list.data.pagination.total;
  }

  return (
    <div className="page-stack">
      <RequestFilters onApply={handleApplyFilters} />

      {list.data && <p className="item-meta" aria-live="polite">{total} yêu cầu đang mở được tìm thấy</p>}

      <ListState
        list={list}
        empty={{ icon: SearchX, title: "Không tìm thấy yêu cầu", description: "Hãy điều chỉnh bộ lọc hoặc từ khóa tìm kiếm." }}
      >
        {list.data && <RequestGrid items={list.data.items} actions={actions} readOnly={readOnly} />}
      </ListState>

      {list.data && <Pagination pagination={list.data.pagination} onPageChange={setPage} />}
    </div>
  );
}
