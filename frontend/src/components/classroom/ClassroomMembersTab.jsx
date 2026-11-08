import { useState } from 'react';

export default function ClassroomMembersTab({
  classroom,
  members,
  loadingMembers,
  isOwner,
  studentCount,
  parentMembers,
  studentMembers,
  onOpenAddMember,
  onSelectRemoveMember,
  onCopy,
}) {
  const [memberFilter, setMemberFilter] = useState('ALL'); // 'ALL' | 'STUDENT' | 'PARENT'
  const capacity = classroom.capacity || 20;

  const displayedMembers = members.filter((m) => {
    if (memberFilter === 'STUDENT') return m.user_id?.role === 'STUDENT';
    if (memberFilter === 'PARENT') return m.user_id?.role === 'PARENT';
    return true;
  });

  return (
    <div>
      <div className="members-toolbar">
        <div>
          <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', color: '#0f172a' }}>
            Danh sách thành viên trong lớp
          </h3>
          <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>
            Sĩ số học viên: <strong>{studentCount}</strong> / {capacity} học sinh
            {parentMembers.length > 0 && (
              <span style={{ marginLeft: '8px', color: '#0284c7', fontWeight: 500 }}>
                (kèm {parentMembers.length} phụ huynh theo dõi)
              </span>
            )}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn-outline-gray"
            style={{ fontSize: '13px', padding: '8px 12px' }}
            onClick={() => onCopy(classroom.join_code, 'mã lớp')}
            title="Sao chép mã tham gia lớp"
          >
            📋 Mã: <strong>{classroom.join_code}</strong>
          </button>
          <button
            type="button"
            className="btn-outline-gray"
            style={{ fontSize: '13px', padding: '8px 12px' }}
            onClick={() =>
              onCopy(
                classroom.invite_link || `${window.location.origin}/join-class/${classroom.join_code}`,
                'link mời'
              )
            }
            title="Sao chép link mời tham gia"
          >
            🔗 Link mời
          </button>

          {isOwner && (
            <button
              type="button"
              className="btn-primary-orange"
              style={{ fontSize: '14px', padding: '9px 16px' }}
              onClick={onOpenAddMember}
            >
              <span>➕</span> Thêm học viên vào lớp
            </button>
          )}
        </div>
      </div>

      {loadingMembers ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
          ⏳ Đang tải danh sách thành viên...
        </div>
      ) : members.length === 0 ? (
        <div className="classroom-empty-state" style={{ padding: '40px 20px' }}>
          <div className="empty-icon">👥</div>
          <h3>Chưa có học viên nào tham gia lớp</h3>
          <p>
            Chia sẻ mã <code>{classroom.join_code}</code> hoặc link mời để học sinh tham gia!
          </p>
          {isOwner && (
            <button
              type="button"
              className="btn-primary-orange"
              onClick={onOpenAddMember}
            >
              <span>➕</span> Thêm học viên ngay
            </button>
          )}
        </div>
      ) : (
        <div>
          {/* Bộ lọc phân loại thành viên: Tất cả / Học sinh / Phụ huynh */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn-outline-gray"
              style={{
                padding: '6px 14px',
                fontSize: '13px',
                borderRadius: '20px',
                background: memberFilter === 'ALL' ? '#f1f5f9' : '#ffffff',
                borderColor: memberFilter === 'ALL' ? '#94a3b8' : '#e2e8f0',
                fontWeight: memberFilter === 'ALL' ? 600 : 400,
              }}
              onClick={() => setMemberFilter('ALL')}
            >
              Tất cả ({members.length})
            </button>
            <button
              type="button"
              className="btn-outline-gray"
              style={{
                padding: '6px 14px',
                fontSize: '13px',
                borderRadius: '20px',
                background: memberFilter === 'STUDENT' ? '#f0fdf4' : '#ffffff',
                borderColor: memberFilter === 'STUDENT' ? '#86efac' : '#e2e8f0',
                color: memberFilter === 'STUDENT' ? '#15803d' : '#334155',
                fontWeight: memberFilter === 'STUDENT' ? 600 : 400,
              }}
              onClick={() => setMemberFilter('STUDENT')}
            >
              🎒 Học sinh ({studentMembers.length})
            </button>
            <button
              type="button"
              className="btn-outline-gray"
              style={{
                padding: '6px 14px',
                fontSize: '13px',
                borderRadius: '20px',
                background: memberFilter === 'PARENT' ? '#eff6ff' : '#ffffff',
                borderColor: memberFilter === 'PARENT' ? '#bfdbfe' : '#e2e8f0',
                color: memberFilter === 'PARENT' ? '#1d4ed8' : '#334155',
                fontWeight: memberFilter === 'PARENT' ? 600 : 400,
              }}
              onClick={() => setMemberFilter('PARENT')}
            >
              👨‍👩‍👧 Phụ huynh ({parentMembers.length})
            </button>
          </div>

          <div className="members-table-wrapper">
            <table className="members-table">
              <thead>
                <tr>
                  <th>Thành viên & Liên kết</th>
                  <th>Email</th>
                  <th>Số điện thoại</th>
                  <th>Ngày tham gia</th>
                  <th>Trạng thái</th>
                  {isOwner && <th style={{ textAlign: 'right' }}>Tác vụ</th>}
                </tr>
              </thead>
              <tbody>
                {displayedMembers.map((mem) => {
                  const u = mem.user_id || {};
                  const name = u.full_name || 'Học viên';
                  const isActive = mem.status === 'ACTIVE';

                  return (
                    <tr key={mem._id}>
                      <td>
                        <div className="member-cell">
                          <div className="member-avatar">{name.charAt(0).toUpperCase()}</div>
                          <div>
                            <div style={{ fontWeight: 600, color: '#0f172a' }}>{name}</div>
                            <div style={{ fontSize: '12px', color: '#64748b' }}>
                              {u.role === 'PARENT'
                                ? 'Phụ huynh'
                                : u.role === 'STUDENT'
                                ? 'Học sinh'
                                : u.role === 'ADMIN'
                                ? 'Quản trị viên'
                                : 'Thành viên'}
                            </div>
                            {/* Xem liên kết phụ huynh - học viên */}
                            {u.role === 'PARENT' && mem.linked_children && mem.linked_children.length > 0 && (
                              <div style={{ fontSize: '11px', color: '#e85a2c', marginTop: '2px' }}>
                                👶 Con: {mem.linked_children.map((c) => c.full_name || c.email).join(', ')}
                              </div>
                            )}
                            {u.role === 'STUDENT' && mem.linked_parent && (
                              <div style={{ fontSize: '11px', color: '#0284c7', marginTop: '2px' }}>
                                👨‍👩‍👧 Phụ huynh: {mem.linked_parent.full_name || mem.linked_parent.email}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>{u.email || '—'}</td>
                      <td>{u.phone_number || '—'}</td>
                      <td>{mem.joined_at ? new Date(mem.joined_at).toLocaleDateString('vi-VN') : '—'}</td>
                      <td>
                        <span className={`status-pill ${isActive ? 'active' : 'removed'}`}>
                          {isActive ? (u.role === 'PARENT' ? 'Đang theo dõi' : 'Đang học') : 'Đã gỡ'}
                        </span>
                        {mem.removal_reason && (
                          <div style={{ fontSize: '11px', color: '#991b1b', marginTop: '2px' }}>
                            Lý do: {mem.removal_reason}
                          </div>
                        )}
                      </td>
                      {isOwner && (
                        <td style={{ textAlign: 'right' }}>
                          {isActive && (
                            <button
                              type="button"
                              className="btn-outline-gray"
                              style={{ color: '#dc2626', fontSize: '12px', padding: '4px 10px' }}
                              onClick={() => onSelectRemoveMember(mem)}
                            >
                              Xóa khỏi lớp
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
