import { useState } from 'react';
import {
  createClassAnnouncement,
  updateClassAnnouncement,
  deleteClassAnnouncement,
  togglePinAnnouncement,
} from '../../services/classroomService';

export default function ClassroomAnnouncementsTab({
  classroomId,
  announcements,
  setAnnouncements,
  isOwner,
  showToast,
}) {
  const [announcementContent, setAnnouncementContent] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [postingAnnouncement, setPostingAnnouncement] = useState(false);
  const [editingAnnouncementId, setEditingAnnouncementId] = useState(null);
  const [editContent, setEditContent] = useState('');

  // Đăng thông báo mới
  const handlePostAnnouncement = async (e) => {
    e.preventDefault();
    if (!announcementContent.trim()) return;

    try {
      setPostingAnnouncement(true);
      const res = await createClassAnnouncement(classroomId, {
        content: announcementContent.trim(),
        is_pinned: isPinned,
      });
      setAnnouncements((prev) => [res?.data, ...prev]);
      setAnnouncementContent('');
      setIsPinned(false);
      showToast('Đã đăng thông báo lên bảng tin!');
    } catch (err) {
      alert(err?.response?.data?.message || err.message || 'Không thể đăng thông báo');
    } finally {
      setPostingAnnouncement(false);
    }
  };

  // Ghim / Bỏ ghim thông báo
  const handleTogglePin = async (announcementId) => {
    try {
      const res = await togglePinAnnouncement(classroomId, announcementId);
      setAnnouncements((prev) =>
        prev
          .map((a) => (a._id === announcementId ? { ...a, is_pinned: res?.data?.is_pinned } : a))
          .sort((a, b) => (b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0))
      );
      showToast(res?.data?.is_pinned ? 'Đã ghim thông báo lên đầu trang!' : 'Đã bỏ ghim thông báo');
    } catch (err) {
      alert(err?.response?.data?.message || err.message || 'Lỗi khi ghim thông báo');
    }
  };

  // Xóa thông báo
  const handleDeleteAnnouncement = async (announcementId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa thông báo này không?')) return;
    try {
      await deleteClassAnnouncement(classroomId, announcementId);
      setAnnouncements((prev) => prev.filter((a) => a._id !== announcementId));
      showToast('Đã xóa thông báo');
    } catch (err) {
      alert(err?.response?.data?.message || err.message || 'Lỗi khi xóa');
    }
  };

  // Lưu chỉnh sửa thông báo
  const handleSaveEditAnnouncement = async (announcementId) => {
    if (!editContent.trim()) return;
    try {
      const res = await updateClassAnnouncement(classroomId, announcementId, { content: editContent.trim() });
      setAnnouncements((prev) =>
        prev.map((a) => (a._id === announcementId ? { ...a, content: res?.data?.content } : a))
      );
      setEditingAnnouncementId(null);
      showToast('Đã cập nhật thông báo');
    } catch (err) {
      alert(err?.response?.data?.message || err.message || 'Lỗi khi cập nhật');
    }
  };

  return (
    <div>
      {/* Trình tạo bài đăng thông báo (Chỉ hiển thị cho Gia sư chủ lớp) */}
      {isOwner && (
        <form className="announcement-composer" onSubmit={handlePostAnnouncement}>
          <div className="composer-header">
            <span>✍️</span> Đăng thông báo mới cho lớp học
          </div>
          <textarea
            className="composer-textarea"
            placeholder="Nhập thông báo, dặn dò học viên, nội dung bài học... (tối đa 5000 ký tự)"
            value={announcementContent}
            onChange={(e) => setAnnouncementContent(e.target.value)}
            maxLength={5000}
            required
          />

          <div className="composer-actions">
            <label className="composer-pin-check">
              <input
                type="checkbox"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
              />
              📌 Ghim lên đầu bảng tin
            </label>

            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span className="composer-char-count">{announcementContent.length} / 5000 ký tự</span>
              <button
                type="submit"
                className="btn-primary-orange"
                style={{ padding: '8px 18px', fontSize: '14px' }}
                disabled={postingAnnouncement || !announcementContent.trim()}
              >
                {postingAnnouncement ? 'Đang đăng...' : '📢 Đăng thông báo'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Danh sách thông báo */}
      <div className="announcements-feed">
        {announcements.length === 0 ? (
          <div className="classroom-empty-state" style={{ padding: '40px 20px' }}>
            <div className="empty-icon">📢</div>
            <h3>Chưa có thông báo nào trên bảng tin</h3>
            <p>Hãy đăng bài đầu tiên để chào mừng học sinh hoặc dặn dò lịch học!</p>
          </div>
        ) : (
          announcements.map((item) => {
            const authorName = item.author_profile_id?.user_id?.full_name || 'Gia sư phụ trách';
            const authorHeadline = item.author_profile_id?.headline || 'Gia sư TuConnector';
            const isEditing = editingAnnouncementId === item._id;

            return (
              <div
                key={item._id}
                className={`announcement-card ${item.is_pinned ? 'pinned' : ''}`}
              >
                <div className="announcement-header">
                  <div className="announcement-author-info">
                    <div className="author-avatar">{authorName.charAt(0).toUpperCase()}</div>
                    <div>
                      <div className="author-name">{authorName}</div>
                      <div className="author-sub">
                        {authorHeadline} • {new Date(item.created_at || Date.now()).toLocaleDateString('vi-VN')}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {item.is_pinned && (
                      <span className="announcement-badge-pinned">📌 Đã ghim</span>
                    )}

                    {isOwner && (
                      <div className="announcement-menu-actions">
                        <button
                          type="button"
                          className="btn-icon-action"
                          onClick={() => handleTogglePin(item._id)}
                          title={item.is_pinned ? 'Bỏ ghim' : 'Ghim lên đầu'}
                        >
                          {item.is_pinned ? 'Bỏ ghim' : '📌 Ghim'}
                        </button>
                        <button
                          type="button"
                          className="btn-icon-action"
                          onClick={() => {
                            setEditingAnnouncementId(item._id);
                            setEditContent(item.content);
                          }}
                          title="Sửa nội dung"
                        >
                          ✏️ Sửa
                        </button>
                        <button
                          type="button"
                          className="btn-icon-action delete"
                          onClick={() => handleDeleteAnnouncement(item._id)}
                          title="Xóa thông báo"
                        >
                          🗑️
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {isEditing ? (
                  <div style={{ marginTop: '12px' }}>
                    <textarea
                      className="composer-textarea"
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={3}
                      style={{ marginBottom: '8px' }}
                    />
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        className="btn-outline-gray"
                        style={{ fontSize: '13px' }}
                        onClick={() => setEditingAnnouncementId(null)}
                      >
                        Hủy
                      </button>
                      <button
                        type="button"
                        className="btn-primary-orange"
                        style={{ fontSize: '13px', padding: '6px 14px' }}
                        onClick={() => handleSaveEditAnnouncement(item._id)}
                      >
                        Lưu lại
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="announcement-content">{item.content}</div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
