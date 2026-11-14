import { toast } from 'sonner';
import { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import ListState from '../../components/common/ListState';
import Pagination from '../../components/common/Pagination';
import CategoryDialog from '../../components/admin/CategoryDialog';
import { usePagedList } from '../../hooks/usePagedList';
import { getCategories } from '../../services/categoryService';
import '../../styles/categories.css';

const FETCHERS = {
  subjects: (params) => getCategories('subjects', params),
  grades: (params) => getCategories('grades', params),
};
const TABS = [{ value: 'subjects', label: 'Môn học' }, { value: 'grades', label: 'Cấp học / Trình độ' }];

export default function Categories() {
  const [type, setType] = useState('subjects');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [dialog, setDialog] = useState(null);
  const list = usePagedList(FETCHERS[type], { page, limit: 10, q: query });

  const changeTab = (value) => {
    setType(value);
    setPage(1);
    setSearch('');
    setQuery('');

  };
  const handleSearch = (event) => {
    event.preventDefault();
    setPage(1);
    setQuery(search.trim());
  };
  const handleSaved = () => {
    setDialog(null);
    toast.success('Đã cập nhật danh mục.');
    if (dialog.removing && list.items.length === 1 && page > 1) setPage(page - 1);
    else list.reload();
  };

  return (
    <div className="categories-page page-stack">
      <PageHeader title="Quản lý danh mục" description="Nguồn dữ liệu chung cho bài đăng, yêu cầu tìm gia sư và các bộ lọc." />

      <div className="category-tabs" role="tablist" aria-label="Loại danh mục">
        {TABS.map((tab) => (
          <button key={tab.value} type="button" role="tab" aria-selected={type === tab.value} className={type === tab.value ? 'category-tab is-active' : 'category-tab'} onClick={() => changeTab(tab.value)}>{tab.label}</button>
        ))}
      </div>
      <section className="card category-panel">
        <div className="category-toolbar">
          <form onSubmit={handleSearch} role="search" className="category-search">
            <input type="search" aria-label="Tìm danh mục" placeholder="Tìm theo tên danh mục..." value={search} onChange={(event) => setSearch(event.target.value)} maxLength={100} />
            <button className="btn btn-outline" type="submit">Tìm kiếm</button>
          </form>
          <button className="btn btn-primary btn-sm" type="button" onClick={() => setDialog({ item: null, removing: false })}><Plus size={16} aria-hidden="true" /> Thêm danh mục</button>
        </div>
        <ListState list={list} empty={{ title: 'Chưa có danh mục', description: 'Thêm danh mục mới hoặc thử từ khóa khác.' }}>
          <div className="category-table-wrapper">
            <table className="category-table">
              <thead><tr><th>Tên danh mục</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
              <tbody>{list.items.map((item) => (
                <tr key={item._id}>
                  <th scope="row">{item.name}</th>
                  <td>{item.is_active ? 'Đang sử dụng' : 'Đã tắt'}</td>
                  <td><div className="category-row-actions">
                    <button className="btn btn-outline btn-sm" type="button" onClick={() => setDialog({ item, removing: false })} aria-label={`Sửa ${item.name}`}><Pencil size={16} aria-hidden="true" /> Sửa</button>
                    <button className="btn btn-outline btn-sm" type="button" onClick={() => setDialog({ item, removing: true })} aria-label={`Xóa ${item.name}`}><Trash2 size={16} aria-hidden="true" /> Xóa</button>
                  </div></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </ListState>
        <Pagination pagination={list.pagination} onPageChange={setPage} disabled={list.loading} />
      </section>
      {dialog && <CategoryDialog type={type} item={dialog.item} removing={dialog.removing} onClose={() => setDialog(null)} onSaved={handleSaved} />}
    </div>
  );
}
