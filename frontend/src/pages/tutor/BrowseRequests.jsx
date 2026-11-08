import { useMemo, useState } from 'react';
import { SearchX } from 'lucide-react';
import { usePagedList } from '../../hooks/usePagedList';
import { useRequestActions } from '../../hooks/useRequestActions';
import { browseRequests } from '../../services/tutorRequestService';
import ListState from '../../components/common/ListState';
import Pagination from '../../components/common/Pagination';
import RequestFilters from '../../components/tutor/RequestFilters';
import RequestGrid from '../../components/tutor/RequestGrid';
import '../../styles/tutorRequests.css';

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

// UC11 – duyệt các yêu cầu đang mở với bộ lọc và phân trang (Figma: Find Students)
export default function BrowseRequests() {
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

      {list.data && <p className="item-meta" aria-live="polite">{total} open requests found</p>}

      <ListState
        list={list}
        empty={{ icon: SearchX, title: 'No requests found', description: 'Try adjusting your filters or search keyword.' }}
      >
        {list.data && <RequestGrid items={list.data.items} actions={actions} />}
      </ListState>

      {list.data && <Pagination pagination={list.data.pagination} onPageChange={setPage} />}
    </div>
  );
}
