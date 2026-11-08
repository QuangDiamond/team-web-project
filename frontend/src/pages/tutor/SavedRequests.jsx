import { useState } from 'react';
import { Bookmark } from 'lucide-react';
import { usePagedList } from '../../hooks/usePagedList';
import { useRequestActions } from '../../hooks/useRequestActions';
import { getSavedRequests } from '../../services/tutorRequestService';
import ListState from '../../components/common/ListState';
import Pagination from '../../components/common/Pagination';
import RequestGrid from '../../components/tutor/RequestGrid';
import '../../styles/tutorRequests.css';

const PAGE_SIZE = 9;

// UC11 – các yêu cầu gia sư đã lưu (bỏ lưu thì tải lại danh sách)
export default function SavedRequests() {
  const [page, setPage] = useState(1);
  const list = usePagedList(getSavedRequests, { page: page, limit: PAGE_SIZE });
  const actions = useRequestActions({ patchItem: list.patchItem, onSaveChanged: list.reload });

  return (
    <div className="page-stack">
      <ListState
        list={list}
        empty={{
          icon: Bookmark,
          title: 'No saved requests',
          description: 'Save a request with the bookmark button to find it here later.',
        }}
      >
        {list.data && <RequestGrid items={list.data.items} actions={actions} />}
      </ListState>

      {list.data && <Pagination pagination={list.data.pagination} onPageChange={setPage} />}
    </div>
  );
}
