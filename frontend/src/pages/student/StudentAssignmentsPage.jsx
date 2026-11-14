import { useState, useEffect, useCallback, useId } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ClipboardList,
  Search,
  BookOpen,
  Clock,
  Award,
  AlertCircle,
  RotateCcw,
  PenTool,
  Eye,
  Lock,
  ExternalLink,
  Loader2,
  MessageSquare,
} from 'lucide-react';
import {
  getAllStudentAssignments,
  getJoinedClasses,
} from '../../services/studentDashboardService';
import Pagination from '../../components/common/Pagination';
import { formatDate } from '../../utils/dateFormat';
import '../../styles/studentAssignments.css';

const TABS = [
  { key: 'ALL', label: 'Tất cả' },
  { key: 'PENDING', label: 'Cần làm' },
  { key: 'SUBMITTED', label: 'Đã nộp bài' },
  { key: 'GRADED', label: 'Đã chấm điểm' },
  { key: 'OVERDUE', label: 'Quá hạn' },
];

export default function StudentAssignmentsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [classes, setClasses] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(false);

  // Dữ liệu danh sách bài tập
  const [assignments, setAssignments] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 9, total: 0, totalPages: 0 });
  const [counts, setCounts] = useState({ ALL: 0, PENDING: 0, SUBMITTED: 0, GRADED: 0, OVERDUE: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const searchInputId = useId();
  const classSelectId = useId();

  // 1. Tải danh sách lớp để lọc
  useEffect(() => {
    let isMounted = true;
    const fetchClasses = async () => {
      try {
        setLoadingClasses(true);
        const res = await getJoinedClasses({ page: 1, limit: 100 });
        if (isMounted && res?.data?.items) {
          setClasses(res.data.items);
        }
      } catch (err) {
        console.warn('Lỗi tải danh sách lớp tham gia:', err.message);
      } finally {
        if (isMounted) setLoadingClasses(false);
      }
    };
    fetchClasses();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Tải danh sách bài tập (View: ASSIGNMENTS)
  const fetchAssignments = useCallback(
    async (page = 1) => {
      try {
        setLoading(true);
        setError('');
        const res = await getAllStudentAssignments({
          page,
          limit: 9,
          status: activeTab,
          classId: selectedClassId || undefined,
          search: searchQuery.trim() || undefined,
        });

        if (res?.data) {
          setAssignments(res.data.items || []);
          if (res.data.pagination) {
            setPagination(res.data.pagination);
          }
          if (res.data.counts) {
            setCounts(res.data.counts);
          }
        }
      } catch (err) {
        setError(err?.response?.data?.message || err.message || 'Không thể tải danh sách bài tập');
      } finally {
        setLoading(false);
      }
    },
    [activeTab, selectedClassId, searchQuery]
  );

  useEffect(() => {
    fetchAssignments(1);
  }, [fetchAssignments]);

  // 4. Mở bài làm
  const handleOpenAssignment = (assignmentId) => {
    navigate(`/student/assignments/${assignmentId}`);
  };

  return (
    <div className="student-assignments-page">

      {/* Header */}
      <div className="student-assignments-header">
        <div>
          <h1 className="student-assignments-title">Bài tập học sinh</h1>
          <p className="student-assignments-subtitle">
            Theo dõi tiến độ, hạn nộp và làm bài tập từ tất cả các lớp học bạn đang tham gia.
          </p>
        </div>
      </div>

      {/* Toolbar: Tabs & Bộ lọc */}
      <div className="student-assignments-toolbar">
            {/* Tabs */}
            <div className="assignments-tabs" role="tablist">
              {TABS.map((tab) => {
                const count = counts[tab.key] || 0;
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    className={`assignments-tab-btn ${isActive ? 'is-active' : ''}`}
                    onClick={() => setActiveTab(tab.key)}
                  >
                    <span>{tab.label}</span>
                    <span className="assignments-tab-count">{count}</span>
                  </button>
                );
              })}
            </div>

            {/* Filter row */}
            <div className="assignments-filter-row">
              <div className="assignments-search-box">
                <Search size={16} className="assignments-search-icon" aria-hidden="true" />
                <input
                  id={searchInputId}
                  type="text"
                  className="assignments-search-input"
                  placeholder="Tìm kiếm theo tiêu đề bài tập..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor={classSelectId} className="sr-only">
                  Lọc theo lớp học
                </label>
                <select
                  id={classSelectId}
                  className="assignments-class-select"
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  disabled={loadingClasses}
                >
                  <option value="">Tất cả lớp học</option>
                  {classes.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name} ({c.subject || 'Môn học'})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Loading state */}
          {loading ? (
            <div className="assignment-state-box">
              <Loader2 size={32} className="spin" color="var(--color-primary-strong)" />
              <p className="assignment-state-desc">Đang tải danh sách bài tập...</p>
            </div>
          ) : error ? (
            <div className="assignment-state-box">
              <div className="assignment-state-icon" style={{ background: 'var(--color-error-soft)', color: 'var(--color-error)' }}>
                <AlertCircle size={28} />
              </div>
              <h3 className="assignment-state-title">Không thể tải bài tập</h3>
              <p className="assignment-state-desc">{error}</p>
              <button
                type="button"
                className="btn-primary-orange"
                style={{ padding: '8px 16px', fontSize: '13px' }}
                onClick={() => fetchAssignments(pagination.page)}
              >
                Thử lại
              </button>
            </div>
          ) : assignments.length === 0 ? (
            <div className="assignment-state-box">
              <div className="assignment-state-icon">
                <ClipboardList size={28} />
              </div>
              <h3 className="assignment-state-title">Chưa có bài tập nào phù hợp</h3>
              <p className="assignment-state-desc">
                {searchQuery || selectedClassId || activeTab !== 'ALL'
                  ? 'Không tìm thấy bài tập nào khớp với bộ lọc hiện tại. Hãy thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.'
                  : 'Hiện tại các lớp học của bạn chưa có bài tập nào được giao.'}
              </p>
              {(searchQuery || selectedClassId || activeTab !== 'ALL') && (
                <button
                  type="button"
                  className="btn-outline-gray"
                  style={{ padding: '8px 16px', fontSize: '13px', background: 'var(--color-surface)' }}
                  onClick={() => {
                    setActiveTab('ALL');
                    setSearchQuery('');
                    setSelectedClassId('');
                  }}
                >
                  Xóa bộ lọc
                </button>
              )}
            </div>
          ) : (
            /* Danh sách bài tập */
            <>
              <div className="assignments-cards-grid">
                {assignments.map((item) => {
                  const sub = item.submission;
                  let cardModifier = 'is-pending';
                  let badgeClass = 'badge-pending';
                  let badgeLabel = 'Cần làm';

                  if (item.status === 'GRADED') {
                    cardModifier = 'is-graded';
                    badgeClass = 'badge-graded';
                    badgeLabel = 'Đã chấm';
                  } else if (item.status === 'SUBMITTED') {
                    cardModifier = 'is-submitted';
                    badgeClass = 'badge-submitted';
                    badgeLabel = 'Đã nộp';
                  } else if (item.status === 'OVERDUE') {
                    cardModifier = 'is-overdue';
                    badgeClass = 'badge-overdue';
                    badgeLabel = 'Quá hạn';
                  }

                  return (
                    <div key={item._id} className={`assignment-card-item ${cardModifier}`}>
                      {/* Card top */}
                      <div className="assignment-card-top">
                        {item.class ? (
                          <Link
                            to={`/student/classes/${item.class._id}`}
                            className="assignment-class-tag"
                            title={`${item.class.name} · ${item.class.subject || ''}`}
                          >
                            <BookOpen size={13} />
                            <span>{item.class.name}</span>
                          </Link>
                        ) : (
                          <span className="assignment-class-tag">
                            <BookOpen size={13} />
                            <span>Lớp học</span>
                          </span>
                        )}

                        <span className={`assignment-status-badge ${badgeClass}`}>{badgeLabel}</span>
                      </div>

                      {/* Tiêu đề bài tập */}
                      <h2 className="assignment-card-title">{item.title}</h2>

                      {/* Meta thông tin */}
                      <div className="assignment-card-meta">
                        <div className="assignment-meta-row">
                          <Clock size={14} />
                          <span className="assignment-meta-text">
                            {item.due_date ? `Hạn nộp: ${formatDate(item.due_date)}` : 'Không có hạn nộp'}
                          </span>
                        </div>

                        <div className="assignment-meta-row">
                          <Award size={14} />
                          <span className="assignment-meta-text">
                            {item.question_count} câu hỏi · Thang điểm {item.total_points}đ
                          </span>
                        </div>

                        {item.status === 'OVERDUE' && (
                          <div
                            className="assignment-meta-row"
                            style={{ color: item.can_submit ? 'var(--color-warning)' : 'var(--color-error)' }}
                          >
                            <AlertCircle size={14} />
                            <span className="assignment-meta-text">
                              {item.can_submit ? 'Cho phép nộp muộn' : 'Đã đóng nộp bài'}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Kết quả bài nộp / Điểm nếu có */}
                      {sub && (
                        <div className={`assignment-submission-box ${sub.status === 'GRADED' ? 'is-graded' : ''}`}>
                          <div className="assignment-score-row">
                            <span className="assignment-score-val">
                              {sub.status === 'GRADED' ? (
                                <>
                                  <Award size={14} />
                                  <span>
                                    Điểm: {sub.final_score}/{item.total_points}đ
                                  </span>
                                </>
                              ) : (
                                <>
                                  <Clock size={14} />
                                  <span>Điểm tạm tính: {sub.provisional_score || 0}đ</span>
                                </>
                              )}
                            </span>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span className="attempt-badge">Lần #{sub.attempt_number || 1}</span>
                              <span
                                className={`assignment-timeliness ${
                                  sub.timeliness === 'LATE' ? 'timeliness-late' : 'timeliness-ontime'
                                }`}
                              >
                                {sub.timeliness === 'LATE' ? 'Nộp muộn' : 'Đúng hạn'}
                              </span>
                            </div>
                          </div>

                          {sub.overall_feedback && (
                            <p className="assignment-feedback-text">
                              <MessageSquare size={13} style={{ flexShrink: 0, marginTop: '2px' }} />
                              <span>Gia sư: "{sub.overall_feedback}"</span>
                            </p>
                          )}
                        </div>
                      )}

                      {/* Nút hành động */}
                      <div className="assignment-card-footer">
                        {item.can_submit ? (
                          <button
                            type="button"
                            className="assignment-btn-action assignment-btn-primary"
                            onClick={() => handleOpenAssignment(item._id)}
                          >
                            {sub ? (
                              <RotateCcw size={14} />
                            ) : (
                              <PenTool size={14} />
                            )}
                            <span>{sub ? 'Nộp lại bài' : 'Làm bài tập'}</span>
                          </button>
                        ) : sub || item.results_published_at ? (
                          <button
                            type="button"
                            className="assignment-btn-action assignment-btn-outline"
                            onClick={() => handleOpenAssignment(item._id)}
                          >
                            <Eye size={14} />
                            <span>Xem chi tiết & Điểm</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="assignment-btn-action assignment-btn-disabled"
                            disabled
                          >
                            <Lock size={14} />
                            <span>Đã hết hạn</span>
                          </button>
                        )}

                        {item.class && (
                          <Link
                            to={`/student/classes/${item.class._id}`}
                            className="assignment-btn-action assignment-btn-outline"
                            style={{ flex: '0 0 auto', padding: '8px 10px' }}
                            title="Vào lớp học"
                          >
                            <ExternalLink size={14} />
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Phân trang bài tập */}
              <Pagination
                pagination={pagination}
                onPageChange={(p) => fetchAssignments(p)}
                label="Phân trang bài tập"
              />
            </>
          )}
    </div>
  );
}
