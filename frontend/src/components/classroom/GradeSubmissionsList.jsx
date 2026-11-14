import { useState } from 'react';
import { Award, Clock, CheckCircle2, AlertTriangle, Search } from 'lucide-react';

export default function GradeSubmissionsList({
  submissions = [],
  selectedSub,
  onSelectSub,
  totalPoints = 10,
}) {
  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'PENDING' | 'GRADED'
  const [search, setSearch] = useState('');

  const filteredSubmissions = submissions.filter((sub) => {
    const isGraded = sub.status === 'GRADED';
    if (filter === 'PENDING' && isGraded) return false;
    if (filter === 'GRADED' && !isGraded) return false;

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const name = (sub.student_user_id?.full_name || '').toLowerCase();
      const email = (sub.student_user_id?.email || '').toLowerCase();
      return name.includes(q) || email.includes(q);
    }
    return true;
  });

  const pendingCount = submissions.filter((s) => s.status !== 'GRADED').length;
  const gradedCount = submissions.filter((s) => s.status === 'GRADED').length;

  return (
    <div className="grade-sidebar-card">
      <div className="grade-sidebar-header">
        <h4 className="grade-sidebar-title">Bài nộp ({submissions.length})</h4>
      </div>

      {/* Filter Tabs */}
      <div className="grade-filter-tabs">
        <button
          type="button"
          className={`grade-filter-tab ${filter === 'ALL' ? 'active' : ''}`}
          onClick={() => setFilter('ALL')}
        >
          Tất cả ({submissions.length})
        </button>
        <button
          type="button"
          className={`grade-filter-tab ${filter === 'PENDING' ? 'active' : ''}`}
          onClick={() => setFilter('PENDING')}
        >
          Chờ chấm ({pendingCount})
        </button>
        <button
          type="button"
          className={`grade-filter-tab ${filter === 'GRADED' ? 'active' : ''}`}
          onClick={() => setFilter('GRADED')}
        >
          Đã chấm ({gradedCount})
        </button>
      </div>

      {/* Search Bar */}
      {submissions.length > 5 && (
        <div style={{ position: 'relative', marginBottom: '12px' }}>
          <input
            type="text"
            placeholder="Tìm tên học sinh..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '6px 10px 6px 30px',
              fontSize: '13px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
            }}
          />
          <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: '9px', top: '8px' }} />
        </div>
      )}

      {/* Submissions List */}
      <div className="grade-submissions-list">
        {filteredSubmissions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 10px', color: '#94a3b8', fontSize: '13px' }}>
            Không tìm thấy bài nộp phù hợp.
          </div>
        ) : (
          filteredSubmissions.map((sub) => {
            const studentName = sub.student_user_id?.full_name || sub.student_user_id?.email || 'Học sinh';
            const isSelected = selectedSub?._id === sub._id;
            const isGraded = sub.status === 'GRADED';
            const firstLetter = studentName.charAt(0).toUpperCase();

            return (
              <div
                key={sub._id}
                className={`grade-submission-item ${isSelected ? 'selected' : ''}`}
                onClick={() => onSelectSub(sub)}
              >
                <div className="grade-item-header">
                  <div className="grade-avatar-circle">{firstLetter}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="grade-item-name" title={studentName}>
                      {studentName}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                      <Clock size={11} />
                      <span>{new Date(sub.submitted_at).toLocaleDateString('vi-VN')}</span>
                      <span>• Lần #{sub.attempt_number || 1}</span>
                    </div>
                  </div>
                </div>

                <div className="grade-item-footer">
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                    {isGraded ? (
                      <span style={{ color: '#16a34a', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                        <Award size={13} /> {sub.final_score}/{totalPoints}đ
                      </span>
                    ) : (
                      <span style={{ color: '#ea580c' }}>
                        Tạm: {sub.provisional_score || 0}/{totalPoints}đ
                      </span>
                    )}
                  </span>

                  <span className={`grade-status-pill ${isGraded ? 'graded' : 'pending'}`}>
                    {isGraded ? 'Đã chấm' : 'Chờ chấm'}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

