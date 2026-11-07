import { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useHistoryFilters } from '../../hooks/useHistoryFilters';
import { usePagedList } from '../../hooks/usePagedList';
import { getUsers } from '../../services/adminService';
import PageHeader from '../../components/common/PageHeader';
import Alert from '../../components/common/Alert';
import Pagination from '../../components/common/Pagination';
import UserFilters from '../../components/admin/UserFilters';
import UserTable from '../../components/admin/UserTable';
import CreateAdminDialog from '../../components/admin/CreateAdminDialog';
import ListState from '../../components/common/ListState';
import '../../styles/userManagement.css';

const EMPTY_FILTERS = { q: '', role: '', status: '', from: '', to: '' };

// SC39 – User Management (UC37): Admin tìm, lọc user, mở chi tiết; tạo admin mới (A1)
export default function UserManagement() {
  const { user } = useAuth();
  const filterState = useHistoryFilters(EMPTY_FILTERS);
  const hasValidFilters = filterState.dateError === '';
  const list = usePagedList(getUsers, filterState.filterParams, filterState.page, hasValidFilters);
  const [createOpen, setCreateOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleCreated = (message) => {
    setCreateOpen(false);
    setSuccessMessage(message);
    list.reload();
  };

  const openCreateDialog = () => {
    setSuccessMessage('');
    setCreateOpen(true);
  };

  return (
    <div className="user-management">
      <PageHeader
        eyebrow="ADMIN"
        title="User Management"
        description="Search, review, and manage student, parent, tutor and admin accounts."
        actions={(
          <button type="button" className="btn btn-primary btn-sm" onClick={openCreateDialog}>
            <UserPlus size={16} aria-hidden="true" />
            <span>Create admin</span>
          </button>
        )}
      />

      {successMessage && <Alert type="success">{successMessage}</Alert>}

      <UserFilters filters={filterState.filters} onChange={filterState.changeFilter} dateError={filterState.dateError} />

      <section className="card user-list" aria-label="Users">
        {list.pagination && !list.loadError && (
          <p className="user-list-count" aria-live="polite">
            {list.pagination.total} {list.pagination.total === 1 ? 'user' : 'users'}
          </p>
        )}
        <ListState
          loading={list.loading}
          loadError={list.loadError}
          onRetry={list.reload}
          isEmpty={list.items.length === 0}
          filtersActive={true}
          onClearFilters={filterState.clearFilters}
          emptyTitle="No users"
        />
        {!list.loadError && list.items.length > 0 && <UserTable users={list.items} currentUserId={user._id} />}
        <Pagination
          pagination={list.pagination}
          onPageChange={filterState.setPage}
          disabled={list.loading}
          label="User pages"
        />
      </section>

      {createOpen && <CreateAdminDialog onClose={() => setCreateOpen(false)} onCreated={handleCreated} />}
    </div>
  );
}
