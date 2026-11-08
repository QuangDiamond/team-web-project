import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  getClassroomDetail,
  updateClassroomStatus,
  regenerateJoinCode,
  deleteClassroom,
  getClassAnnouncements,
  createClassAnnouncement,
  updateClassAnnouncement,
  deleteClassAnnouncement,
  togglePinAnnouncement,
  getClassMembers,
  getClassGroupChat,
  sendClassChatMessage,
  getClassAssignments,
  deleteAssignment,
} from '../../services/classroomService';
import EditClassroomModal from './EditClassroomModal';
import AddMemberModal from './AddMemberModal';
import RemoveMemberModal from './RemoveMemberModal';
import CreateAssignmentModal from './CreateAssignmentModal';
import GradeSubmissionModal from './GradeSubmissionModal';
import DoAssignmentModal from './DoAssignmentModal';
import './classroom.css';

export default function ClassroomDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const backUrl =
    user?.role === 'TUTOR'
      ? '/tutor/classes'
      : user?.role === 'PARENT'
      ? '/parent/classes'
      : '/student/classes';

  // Classroom State
  const [classroom, setClassroom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('announcements'); // announcements, members, assignments, chat
  const [toastMessage, setToastMessage] = useState('');

  // Modals State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [removeMemberTarget, setRemoveMemberTarget] = useState(null);
  const [isCreateAssignmentOpen, setIsCreateAssignmentOpen] = useState(false);
  const [assignmentToEdit, setAssignmentToEdit] = useState(null);
  const [gradingAssignmentTarget, setGradingAssignmentTarget] = useState(null);
  const [doAssignmentTarget, setDoAssignmentTarget] = useState(null);

  // Tab 1: Announcements State
  const [announcements, setAnnouncements] = useState([]);
  const [announcementContent, setAnnouncementContent] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [postingAnnouncement, setPostingAnnouncement] = useState(false);
  const [editingAnnouncementId, setEditingAnnouncementId] = useState(null);
  const [editContent, setEditContent] = useState('');

  // Tab 2: Members State
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [memberFilter, setMemberFilter] = useState('ALL'); // 'ALL' | 'STUDENT' | 'PARENT'

  // Tab 3: Assignments State
  const [assignments, setAssignments] = useState([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);

  // Tab 4: Chat State
  const [chatMessages, setChatMessages] = useState([]);
  const [chatGroupMembers, setChatGroupMembers] = useState([]);
  const [showChatMembers, setShowChatMembers] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [sendingChat, setSendingChat] = useState(false);
  const chatBottomRef = useRef(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 3000);
  };

  // 1. Fetch Classroom Detail
  const fetchDetail = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await getClassroomDetail(id);
      setClassroom(res?.data);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Không thể tải thông tin lớp học');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchDetail();
    }
  }, [id, fetchDetail]);

  // 2. Fetch Tab Data
  const fetchAnnouncements = useCallback(async () => {
    try {
      const res = await getClassAnnouncements(id);
      setAnnouncements(res?.data || []);
    } catch (err) {
      console.warn('Lỗi tải bảng tin:', err.message);
    }
  }, [id]);

  const fetchMembers = useCallback(async () => {
    try {
      setLoadingMembers(true);
      const res = await getClassMembers(id);
      setMembers(res?.data || []);
    } catch (err) {
      console.warn('Lỗi tải thành viên:', err.message);
    } finally {
      setLoadingMembers(false);
    }
  }, [id]);

  const fetchAssignments = useCallback(async () => {
    try {
      setLoadingAssignments(true);
      const res = await getClassAssignments(id);
      setAssignments(res?.data || []);
    } catch (err) {
      console.warn('Lỗi tải bài tập:', err.message);
    } finally {
      setLoadingAssignments(false);
    }
  }, [id]);

  const fetchChat = useCallback(async () => {
    try {
      const res = await getClassGroupChat(id);
      setChatMessages(res?.data?.messages || []);
      setChatGroupMembers(res?.data?.group_members || []);
    } catch (err) {
      console.warn('Lỗi tải nhóm chat:', err.message);
    }
  }, [id]);

  useEffect(() => {
    if (!id) return;
    if (activeTab === 'announcements') fetchAnnouncements();
    if (activeTab === 'members') fetchMembers();
    if (activeTab === 'assignments') fetchAssignments();
    if (activeTab === 'chat') fetchChat();
  }, [id, activeTab, fetchAnnouncements, fetchMembers, fetchAssignments, fetchChat]);

  // UC33: Tự động cuộn xuống tin nhắn mới nhất trong nhóm chat
  useEffect(() => {
    if (activeTab === 'chat' && chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, activeTab]);

  // UC33: Tự động làm mới tin nhắn định kỳ khi đang mở tab chat
  useEffect(() => {
    if (!id || activeTab !== 'chat') return;
    const interval = setInterval(() => {
      fetchChat();
    }, 4000);
    return () => clearInterval(interval);
  }, [id, activeTab, fetchChat]);

  // Copy helper
  const handleCopy = (text, label) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
      showToast(`Đã sao chép ${label}!`);
    }
  };

  // UC22: Status toggle (ACTIVE <-> ARCHIVED)
  const handleToggleStatus = async () => {
    if (!classroom) return;
    const newStatus = classroom.status === 'ACTIVE' ? 'ARCHIVED' : 'ACTIVE';
    const confirmMsg =
      newStatus === 'ARCHIVED'
        ? 'Bạn có chắc chắn muốn lưu trữ lớp học này? Học viên sẽ không thể tham gia hoặc nộp bài mới.'
        : 'Bạn có chắc chắn muốn kích hoạt lại lớp học này?';

    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await updateClassroomStatus(classroom._id, newStatus);
      setClassroom(res?.data || { ...classroom, status: newStatus });
      showToast(`Lớp học đã chuyển sang trạng thái ${newStatus === 'ACTIVE' ? 'Hoạt động' : 'Đã lưu trữ'}`);
    } catch (err) {
      alert(err?.response?.data?.message || err.message || 'Lỗi khi đổi trạng thái');
    }
  };

  // UC22: Regenerate join code
  const handleRegenerateCode = async () => {
    if (!classroom) return;
    if (!window.confirm('Cấp mã mời mới sẽ vô hiệu hóa mã cũ. Bạn có chắc chắn muốn tiếp tục?')) return;

    try {
      const res = await regenerateJoinCode(classroom._id);
      setClassroom((prev) => ({
        ...prev,
        join_code: res?.data?.join_code,
        invite_link: res?.data?.invite_link,
      }));
      showToast('Đã cấp mã tham gia và link mời mới thành công!');
    } catch (err) {
      alert(err?.response?.data?.message || err.message || 'Lỗi khi cấp lại mã');
    }
  };

  // UC22: Delete classroom (with E1 active members check)
  const handleDeleteClassroom = async () => {
    if (!classroom) return;
    if (
      !window.confirm(
        `Bạn có chắc chắn muốn xóa lớp học "${classroom.name}"? Hành động này sẽ xóa toàn bộ bảng tin, tài liệu và nhóm chat!`
      )
    ) {
      return;
    }

    try {
      await deleteClassroom(classroom._id);
      alert('Đã xóa lớp học thành công!');
      navigate(backUrl);
    } catch (err) {
      alert(err?.response?.data?.message || err.message || 'Không thể xóa lớp học');
    }
  };

  // UC22: Post announcement
  const handlePostAnnouncement = async (e) => {
    e.preventDefault();
    if (!announcementContent.trim()) return;

    try {
      setPostingAnnouncement(true);
      const res = await createClassAnnouncement(id, {
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

  // UC22: Toggle Pin announcement
  const handleTogglePin = async (announcementId) => {
    try {
      const res = await togglePinAnnouncement(id, announcementId);
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

  // UC22: Delete announcement
  const handleDeleteAnnouncement = async (announcementId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa thông báo này không?')) return;
    try {
      await deleteClassAnnouncement(id, announcementId);
      setAnnouncements((prev) => prev.filter((a) => a._id !== announcementId));
      showToast('Đã xóa thông báo');
    } catch (err) {
      alert(err?.response?.data?.message || err.message || 'Lỗi khi xóa');
    }
  };

  // UC22: Save edit announcement
  const handleSaveEditAnnouncement = async (announcementId) => {
    if (!editContent.trim()) return;
    try {
      const res = await updateClassAnnouncement(id, announcementId, { content: editContent.trim() });
      setAnnouncements((prev) =>
        prev.map((a) => (a._id === announcementId ? { ...a, content: res?.data?.content } : a))
      );
      setEditingAnnouncementId(null);
      showToast('Đã cập nhật thông báo');
    } catch (err) {
      alert(err?.response?.data?.message || err.message || 'Lỗi khi cập nhật');
    }
  };

  // UC33: Send chat message
  const handleSendChat = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    try {
      setSendingChat(true);
      const res = await sendClassChatMessage(id, chatInput.trim());
      setChatMessages((prev) => [...prev, res?.data]);
      setChatInput('');
    } catch (err) {
      alert(err?.response?.data?.message || err.message || 'Lỗi gửi tin nhắn');
    } finally {
      setSendingChat(false);
    }
  };

  // UC26: Mở modal tạo bài tập mới
  const handleOpenCreateAssignment = () => {
    setAssignmentToEdit(null);
    setIsCreateAssignmentOpen(true);
  };

  // UC26: Mở modal chỉnh sửa bài tập
  const handleOpenEditAssignment = (asg) => {
    setAssignmentToEdit(asg);
    setIsCreateAssignmentOpen(true);
  };

  // UC26: Xóa bài tập (Gia sư chủ lớp)
  const handleDeleteAssignment = async (asgId, asgTitle) => {
    if (
      !window.confirm(
        `Bạn có chắc chắn muốn xóa bài tập "${asgTitle}" không? Toàn bộ bài làm của học sinh cũng sẽ bị xóa.`
      )
    ) {
      return;
    }
    try {
      await deleteAssignment(asgId);
      showToast('Đã xóa bài tập thành công!');
      fetchAssignments();
    } catch (err) {
      alert(err?.response?.data?.message || err.message || 'Không thể xóa bài tập');
    }
  };

  if (loading) {
    return (
      <div className="classroom-container" style={{ textAlign: 'center', padding: '80px' }}>
        <div style={{ fontSize: '36px', marginBottom: '12px' }}>⏳</div>
        <p style={{ color: '#64748b' }}>Đang tải thông tin lớp học...</p>
      </div>
    );
  }

  if (error || !classroom) {
    return (
      <div className="classroom-container">
        <div className="error-alert">
          <span>⚠️</span>
          <div>{error || 'Không tìm thấy lớp học'}</div>
        </div>
        <Link to={backUrl} className="btn-primary-orange" style={{ textDecoration: 'none' }}>
          ← Quay lại danh sách lớp học
        </Link>
      </div>
    );
  }

  const activeMembers = members.filter((m) => m.status === 'ACTIVE');
  const studentMembers = activeMembers.filter((m) => m.user_id?.role === 'STUDENT');
  const parentMembers = activeMembers.filter((m) => m.user_id?.role === 'PARENT');
  const studentCount = typeof classroom.student_count === 'number' ? classroom.student_count : studentMembers.length;
  const memberCount = classroom.member_count || activeMembers.length || 0;
  const capacity = classroom.capacity || 20;
  const percent = Math.min(Math.round((studentCount / capacity) * 100), 100);
  const isOwner = Boolean(classroom.is_owner || user?.role === 'TUTOR');

  const displayedMembers = members.filter((m) => {
    if (memberFilter === 'STUDENT') return m.user_id?.role === 'STUDENT';
    if (memberFilter === 'PARENT') return m.user_id?.role === 'PARENT';
    return true;
  });

  return (
    <div className="classroom-container">
      {/* Toast Notification */}
      {toastMessage && <div className="copy-toast">✨ {toastMessage}</div>}

      {/* Breadcrumb Navigation */}
      <div style={{ marginBottom: '16px', fontSize: '14px', color: '#64748b' }}>
        <Link to={backUrl} style={{ color: '#e85a2c', textDecoration: 'none', fontWeight: 600 }}>
          Lớp học của tôi
        </Link>{' '}
        / <span>{classroom.name}</span>
      </div>

      {/* Classroom Banner Header */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '16px',
          padding: '28px',
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '20px',
        }}
      >
        <div style={{ flex: 1, minWidth: '300px' }}>
          <div className="card-badges" style={{ marginBottom: '10px' }}>
            <span className="badge badge-subject">{classroom.subject}</span>
            <span className="badge badge-grade">{classroom.grade}</span>
            <span className="badge badge-status">
              {classroom.status === 'ACTIVE' ? 'Đang hoạt động' : 'Đã lưu trữ'}
            </span>
            {isOwner ? (
              <span className="badge" style={{ background: '#fff7ed', color: '#c2410c', border: '1px solid #fed7aa', fontWeight: 600 }}>
                👨‍🏫 Bạn là Gia sư phụ trách lớp
              </span>
            ) : user?.role === 'PARENT' ? (
              <span className="badge" style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', fontWeight: 600 }}>
                👨‍👩‍👧 Bạn là Phụ huynh theo dõi lớp
              </span>
            ) : (
              <span className="badge" style={{ background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', fontWeight: 600 }}>
                🎒 Bạn là Học viên trong lớp
              </span>
            )}
          </div>

          <h1 style={{ fontSize: '26px', fontWeight: 700, margin: '0 0 10px 0', color: '#0f172a' }}>
            {classroom.name}
          </h1>

          {classroom.description && (
            <p style={{ color: '#64748b', fontSize: '15px', margin: '0 0 16px 0', lineHeight: 1.5 }}>
              {classroom.description}
            </p>
          )}

          {/* Sĩ số lớp & Thanh tiến độ */}
          <div style={{ maxWidth: '320px', marginTop: '12px' }}>
            <div className="capacity-row">
              <span>Sĩ số học viên:</span>
              <span>
                <strong>{studentCount}</strong> / {capacity} học sinh ({percent}%)
                {parentMembers.length > 0 && (
                  <span style={{ marginLeft: '6px', fontSize: '12px', color: '#64748b', fontWeight: 'normal' }}>
                    (+ {parentMembers.length} phụ huynh)
                  </span>
                )}
              </span>
            </div>
            <div className="capacity-progress-bar">
              <div className="capacity-progress-fill" style={{ width: `${percent}%` }}></div>
            </div>
          </div>

          {/* Nút tác vụ quản lý lớp học (UC22) - Chỉ hiển thị cho chủ lớp (Tutor) */}
          {isOwner && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '16px' }}>
              <button
                type="button"
                className="btn-outline-gray"
                onClick={() => setIsEditModalOpen(true)}
                title="Chỉnh sửa tên, môn, sĩ số, mô tả"
              >
                ⚙️ Chỉnh sửa thông tin
              </button>
              <button
                type="button"
                className="btn-outline-gray"
                onClick={handleRegenerateCode}
                title="Cấp lại mã tham gia mới"
              >
                🔄 Đổi mã mời
              </button>
              <button
                type="button"
                className="btn-outline-gray"
                onClick={handleToggleStatus}
                title="Chuyển đổi trạng thái lưu trữ"
              >
                {classroom.status === 'ACTIVE' ? '📦 Lưu trữ lớp' : '⚡ Kích hoạt lại'}
              </button>
              <button
                type="button"
                className="btn-outline-gray"
                style={{ color: '#dc2626' }}
                onClick={handleDeleteClassroom}
                title="Xóa lớp học (chỉ khi không còn thành viên/buổi học)"
              >
                🗑️ Xóa lớp
              </button>
            </div>
          )}
        </div>

        {/* Join Code Quick Access Card */}
        <div
          style={{
            background: '#f8fafc',
            border: '1px dashed #cbd5e1',
            borderRadius: '12px',
            padding: '16px 20px',
            minWidth: '260px',
          }}
        >
          <div className="join-code-label">Mã tham gia lớp học (Join Code)</div>
          <div
            className="join-code-value"
            style={{ fontSize: '22px', margin: '6px 0 12px 0', letterSpacing: '1.5px' }}
          >
            {classroom.join_code}
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="btn-primary-orange"
              style={{ padding: '8px 14px', fontSize: '13px' }}
              onClick={() => handleCopy(classroom.join_code, 'mã tham gia')}
            >
              📋 Sao chép mã
            </button>
            <button
              type="button"
              className="btn-outline-gray"
              style={{ padding: '8px 14px', fontSize: '13px' }}
              onClick={() =>
                handleCopy(
                  classroom.invite_link || `${window.location.origin}/join-class/${classroom.join_code}`,
                  'link mời tham gia'
                )
              }
            >
              🔗 Link mời
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs for Classroom Space */}
      <div className="classroom-controls" style={{ marginBottom: '24px' }}>
        <div className="classroom-tabs">
          <button
            type="button"
            className={`tab-btn ${activeTab === 'announcements' ? 'active' : ''}`}
            onClick={() => setActiveTab('announcements')}
          >
            📢 Bảng tin (UC22)
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'members' ? 'active' : ''}`}
            onClick={() => setActiveTab('members')}
          >
            👥 Thành viên ({studentCount} HS{parentMembers.length > 0 ? ` + ${parentMembers.length} PH` : ''})
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'assignments' ? 'active' : ''}`}
            onClick={() => setActiveTab('assignments')}
          >
            📝 Bài tập ({assignments.length}) (UC26 & UC27)
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => setActiveTab('chat')}
          >
            💬 Nhóm Chat lớp (UC33)
          </button>
        </div>
      </div>

      {/* ==========================================
          TAB 1: BẢNG TIN LỚP HỌC (UC22)
          ========================================== */}
      {activeTab === 'announcements' && (
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
              ></textarea>

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
      )}

      {/* ==========================================
          TAB 2: QUẢN LÝ THÀNH VIÊN LỚP (UC23)
          ========================================== */}
      {activeTab === 'members' && (
        <div>
          <div className="members-toolbar">
            <div>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', color: '#0f172a' }}>
                Danh sách thành viên trong lớp (UC23)
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
                onClick={() => handleCopy(classroom.join_code, 'mã lớp')}
                title="Sao chép mã tham gia lớp"
              >
                📋 Mã: <strong>{classroom.join_code}</strong>
              </button>
              <button
                type="button"
                className="btn-outline-gray"
                style={{ fontSize: '13px', padding: '8px 12px' }}
                onClick={() =>
                  handleCopy(
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
                  onClick={() => setIsAddMemberOpen(true)}
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
                  onClick={() => setIsAddMemberOpen(true)}
                >
                  <span>➕</span> Thêm học viên ngay
                </button>
              )}
            </div>
          ) : (
            <div>
              {/* Bộ lọc phân loại thành viên: Tất cả / Học sinh / Phụ huynh (UC23) */}
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
                                {u.role === 'PARENT' ? 'Phụ huynh' : u.role === 'STUDENT' ? 'Học sinh' : u.role === 'ADMIN' ? 'Quản trị viên' : 'Thành viên'}
                              </div>
                              {/* Xem liên kết phụ huynh - học viên (UC23) */}
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
                                onClick={() => setRemoveMemberTarget(mem)}
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
      )}

      {/* ==========================================
          TAB 3: BÀI TẬP & CHẤM ĐIỂM (UC26 & UC27)
          ========================================== */}
      {activeTab === 'assignments' && (
        <div>
          <div className="members-toolbar">
            <div>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', color: '#0f172a' }}>
                Quản lý bài tập & Chấm điểm
              </h3>
              <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>
                Tạo bài tập trắc nghiệm, tự luận, nộp file và tự động chấm điểm bài làm của học sinh.
              </p>
            </div>

            {isOwner && (
              <button
                type="button"
                className="btn-primary-orange"
                style={{ fontSize: '14px', padding: '9px 16px' }}
                onClick={handleOpenCreateAssignment}
              >
                <span>➕</span> Tạo bài tập mới (UC26)
              </button>
            )}
          </div>

          {loadingAssignments ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
              ⏳ Đang tải bài tập...
            </div>
          ) : assignments.length === 0 ? (
            <div className="classroom-empty-state" style={{ padding: '40px 20px' }}>
              <div className="empty-icon">📝</div>
              <h3>Chưa có bài tập nào</h3>
              <p>Hãy tạo bài tập đầu tiên để củng cố kiến thức cho học sinh sau mỗi buổi học!</p>
              {isOwner && (
                <button
                  type="button"
                  className="btn-primary-orange"
                  onClick={handleOpenCreateAssignment}
                >
                  <span>➕</span> Tạo bài tập đầu tiên
                </button>
              )}
            </div>
          ) : (
            <div className="assignments-grid">
              {assignments.map((asg) => (
                <div key={asg._id} className="assignment-card">
                  <div>
                    <div className="card-badges" style={{ marginBottom: '8px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <span className="badge badge-subject">
                        {asg.status === 'PUBLISHED' ? 'Đã công bố' : 'Bản nháp'}
                      </span>
                      {asg.is_ai_generated && (
                        <span className="badge" style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' }}>
                          ✨ AI sinh đề
                        </span>
                      )}
                      <span className="badge badge-grade">{asg.total_points || 10} Điểm</span>
                    </div>

                    <h4 className="assignment-title">{asg.title}</h4>

                    {asg.instructions && (
                      <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 10px 0', lineHeight: 1.4 }}>
                        {asg.instructions}
                      </p>
                    )}

                    <div className="assignment-due">
                      <span>⏰</span> Hạn nộp:{' '}
                      {asg.due_date ? new Date(asg.due_date).toLocaleString('vi-VN') : 'Không giới hạn'}
                    </div>

                    <div className="assignment-meta-row">
                      <span>Câu hỏi: {asg.questions?.length || 0}</span>
                      <span>Đã nộp: {asg.submission_count || 0}</span>
                    </div>
                  </div>

                  {/* Actions for Tutor (UC26) */}
                  {isOwner ? (
                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                      <button
                        type="button"
                        className="btn-primary-orange"
                        style={{ flex: 2, fontSize: '13px', padding: '8px' }}
                        onClick={() => setGradingAssignmentTarget(asg)}
                        title="Chấm điểm bài nộp (Gia sư - UC26)"
                      >
                        📊 Chấm bài ({asg.submission_count || 0})
                      </button>
                      <button
                        type="button"
                        className="btn-outline-gray"
                        style={{ flex: 1, fontSize: '13px', padding: '8px' }}
                        onClick={() => handleOpenEditAssignment(asg)}
                        title={asg.results_published_at ? 'Bài đã công bố điểm, chỉ xem/sửa thông tin chung' : 'Sửa đề bài'}
                      >
                        ✏️ Sửa
                      </button>
                      <button
                        type="button"
                        className="btn-outline-gray"
                        style={{ color: '#ef4444', fontSize: '13px', padding: '8px 10px' }}
                        onClick={() => handleDeleteAssignment(asg._id, asg.title)}
                        title="Xóa bài tập"
                      >
                        🗑️
                      </button>
                    </div>
                  ) : (
                    /* Actions for Student / Parent (UC27) */
                    <div style={{ marginTop: '12px' }}>
                      {user?.role === 'PARENT' ? (
                        /* Chế độ giám sát bài tập dành cho Phụ huynh */
                        <div>
                          {asg.my_submission ? (
                            <div style={{ marginBottom: '8px', padding: '10px 12px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                              <div style={{ fontSize: '12px', color: '#166534', fontWeight: 600, marginBottom: '4px' }}>
                                👶 Bài làm của con: {asg.my_submission.student_user_id?.full_name || 'Học sinh'}
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                                <span style={{ fontWeight: 700, color: '#15803d' }}>
                                  {asg.my_submission.status === 'GRADED'
                                    ? `⭐ Điểm chính thức: ${asg.my_submission.final_score}/${asg.total_points || 10}đ`
                                    : `⏳ Điểm tạm tính: ${asg.my_submission.provisional_score || 0}đ`}
                                </span>
                                <span style={{ fontSize: '11px', color: asg.my_submission.timeliness === 'LATE' ? '#dc2626' : '#16a34a' }}>
                                  {asg.my_submission.timeliness === 'LATE' ? 'Nộp muộn' : 'Đúng hạn'}
                                </span>
                              </div>
                              {asg.my_submission.overall_feedback && (
                                <div style={{ fontSize: '12px', color: '#0369a1', marginTop: '6px' }}>
                                  💬 Gia sư nhận xét: "{asg.my_submission.overall_feedback}"
                                </div>
                              )}
                            </div>
                          ) : (
                            <div style={{ marginBottom: '8px', padding: '8px 12px', background: '#fffbeb', borderRadius: '8px', border: '1px solid #fef3c7', fontSize: '12px', color: '#b45309' }}>
                              ⏳ Con chưa nộp bài tập này
                            </div>
                          )}

                          <button
                            type="button"
                            className="btn-outline-gray"
                            style={{ width: '100%', fontSize: '13px', padding: '8px', background: '#ffffff' }}
                            onClick={() => setDoAssignmentTarget(asg)}
                          >
                            👁️ {asg.my_submission ? 'Xem bài làm của con & Điểm' : 'Xem đề bài tập'}
                          </button>
                        </div>
                      ) : (
                        /* Chế độ làm bài dành cho Học sinh */
                        <div>
                          {asg.my_submission ? (
                            <div style={{ marginBottom: '8px', padding: '8px 10px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                                <span style={{ fontWeight: 600 }}>
                                  {asg.my_submission.status === 'GRADED'
                                    ? `⭐ Điểm: ${asg.my_submission.final_score}/${asg.total_points || 10}đ`
                                    : `⏳ Điểm tạm tính: ${asg.my_submission.provisional_score || 0}đ`}
                                </span>
                                <span style={{ fontSize: '11px', color: asg.my_submission.timeliness === 'LATE' ? '#dc2626' : '#16a34a' }}>
                                  {asg.my_submission.timeliness === 'LATE' ? 'Nộp muộn' : 'Đúng hạn'}
                                </span>
                              </div>
                              {asg.my_submission.overall_feedback && (
                                <div style={{ fontSize: '12px', color: '#0369a1', marginTop: '4px' }}>
                                  💬 Nhận xét: "{asg.my_submission.overall_feedback}"
                                </div>
                              )}
                            </div>
                          ) : null}

                          <button
                            type="button"
                            className="btn-primary-orange"
                            style={{ width: '100%', fontSize: '13px', padding: '8px' }}
                            onClick={() => setDoAssignmentTarget(asg)}
                          >
                            {asg.my_submission
                              ? asg.results_published_at || asg.my_submission.status === 'GRADED' || asg.allow_resubmission === false
                                ? '👁️ Xem bài đã nộp & Điểm'
                                : '🔄 Nộp lại bài'
                              : '✍️ Làm bài tập (UC27)'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==========================================
          TAB 4: NHÓM CHAT LỚP HỌC (UC33)
          ========================================== */}
      {activeTab === 'chat' && (
        <div>
          <div className="members-toolbar" style={{ marginBottom: '16px' }}>
            <div>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', color: '#0f172a' }}>
                💬 Phòng chat nhóm lớp học (UC33)
              </h3>
              <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>
                Kênh trao đổi học tập trực tiếp giữa Gia sư và toàn thể học sinh, phụ huynh lớp <strong>{classroom.name}</strong>.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className="btn-outline-gray"
                style={{ fontSize: '13px', padding: '7px 12px' }}
                onClick={() => setShowChatMembers(!showChatMembers)}
              >
                👥 {showChatMembers ? 'Ẩn thành viên' : `Thành viên (${chatGroupMembers.length})`}
              </button>

              {isOwner && (
                <button
                  type="button"
                  className="btn-primary-orange"
                  style={{ fontSize: '13px', padding: '7px 12px' }}
                  onClick={() => setIsAddMemberOpen(true)}
                  title="Thêm thành viên vào lớp và nhóm chat"
                >
                  <span>➕</span> Thêm vào nhóm (UC33)
                </button>
              )}
            </div>
          </div>

          <div className="chat-box-container" style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
              <div className="chat-messages-area" style={{ flex: 1 }}>
                {chatMessages.length === 0 ? (
                  <div style={{ textAlign: 'center', margin: 'auto', color: '#94a3b8' }}>
                    👋 Chưa có tin nhắn nào trong nhóm chat lớp. Hãy gửi lời chào đầu tiên!
                  </div>
                ) : (
                  chatMessages.map((msg) => {
                    const isMine =
                      (msg.sender_user_id?._id || msg.sender_user_id) === classroom?.current_user_id;
                    const senderName = isMine ? 'Bạn' : msg.sender_user_id?.full_name || 'Thành viên';
                    const roleBadge =
                      msg.sender_user_id?.role === 'TUTOR'
                        ? '👨‍🏫 Gia sư'
                        : msg.sender_user_id?.role === 'PARENT'
                        ? '👨‍👩‍👧 Phụ huynh'
                        : '🎒 Học sinh';

                    return (
                      <div key={msg._id} className={`chat-bubble ${isMine ? 'mine' : 'theirs'}`}>
                        <div className="chat-bubble-author">
                          {senderName} {!isMine && <span style={{ fontWeight: 400, opacity: 0.85 }}>({roleBadge})</span>}
                        </div>
                        <div>{msg.content}</div>
                        <div style={{ fontSize: '10px', color: isMine ? '#ffedd5' : '#94a3b8', marginTop: '4px', textAlign: 'right' }}>
                          {new Date(msg.created_at || Date.now()).toLocaleTimeString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* Sidebar danh sách thành viên nhóm chat (UC33: Quản lý thành viên nhóm) */}
              {showChatMembers && (
                <div
                  style={{
                    width: '260px',
                    borderLeft: '1px solid #e2e8f0',
                    background: '#ffffff',
                    padding: '14px',
                    overflowY: 'auto',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h4 style={{ margin: 0, fontSize: '14px', color: '#334155' }}>
                      Thành viên ({chatGroupMembers.length})
                    </h4>
                    <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: 600 }}>● Đang hoạt động</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {chatGroupMembers.map((m, idx) => (
                      <div
                        key={m.member_id || idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 10px',
                          borderRadius: '8px',
                          background: '#f8fafc',
                          border: '1px solid #f1f5f9',
                        }}
                      >
                        <div style={{ overflow: 'hidden' }}>
                          <div style={{ fontWeight: 600, fontSize: '13px', color: '#0f172a', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                            {m.user?.full_name || m.user?.email || 'Người dùng'}
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>
                            {m.is_owner ? '👨‍🏫 Gia sư chủ nhóm' : m.role === 'PARENT' ? '👨‍👩‍👧 Phụ huynh' : '🎒 Học sinh'}
                          </div>
                        </div>

                        {isOwner && !m.is_owner && (
                          <button
                            type="button"
                            onClick={() => setRemoveMemberTarget(m)}
                            style={{
                              border: 'none',
                              background: 'transparent',
                              color: '#ef4444',
                              cursor: 'pointer',
                              fontSize: '12px',
                              padding: '2px 4px',
                            }}
                            title="Xóa thành viên khỏi nhóm chat"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <form className="chat-input-bar" onSubmit={handleSendChat}>
              <input
                type="text"
                className="chat-input-field"
                placeholder="Nhập tin nhắn gửi đến cả lớp..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
              />
              <button
                type="submit"
                className="btn-primary-orange"
                style={{ padding: '8px 18px' }}
                disabled={sendingChat || !chatInput.trim()}
              >
                {sendingChat ? 'Đang gửi...' : 'Gửi'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          MODALS
          ========================================== */}

      {/* Modal chỉnh sửa lớp học (UC22) */}
      <EditClassroomModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        classroom={classroom}
        onUpdated={(updated) => setClassroom(updated)}
        showToast={showToast}
      />

      {/* Modal thêm học viên (UC23) */}
      <AddMemberModal
        isOpen={isAddMemberOpen}
        onClose={() => setIsAddMemberOpen(false)}
        classroomId={classroom._id}
        onMemberAdded={() => fetchMembers()}
        showToast={showToast}
      />

      {/* Modal xóa học viên (UC23) */}
      <RemoveMemberModal
        isOpen={Boolean(removeMemberTarget)}
        onClose={() => setRemoveMemberTarget(null)}
        classroomId={classroom._id}
        member={removeMemberTarget}
        onMemberRemoved={() => fetchMembers()}
        showToast={showToast}
      />

      {/* Modal tạo hoặc sửa bài tập (UC26) */}
      <CreateAssignmentModal
        isOpen={isCreateAssignmentOpen}
        onClose={() => {
          setIsCreateAssignmentOpen(false);
          setAssignmentToEdit(null);
        }}
        classroomId={classroom._id}
        assignmentToEdit={assignmentToEdit}
        classroomSubject={classroom.subject_name}
        onAssignmentCreated={() => fetchAssignments()}
        showToast={showToast}
      />

      {/* Modal chấm điểm bài tập (UC26) */}
      <GradeSubmissionModal
        isOpen={Boolean(gradingAssignmentTarget)}
        onClose={() => setGradingAssignmentTarget(null)}
        assignment={gradingAssignmentTarget}
        showToast={showToast}
      />

      {/* Modal làm bài tập (UC27) */}
      <DoAssignmentModal
        isOpen={Boolean(doAssignmentTarget)}
        onClose={() => setDoAssignmentTarget(null)}
        assignment={doAssignmentTarget}
        onSubmitted={() => fetchAssignments()}
        showToast={showToast}
      />
    </div>
  );
}
