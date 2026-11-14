import { toast } from 'sonner';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  AlertTriangle,
  BookOpen,
  CalendarDays,
  GraduationCap,
  Users,
  UserCheck,
  Settings,
  RefreshCw,
  Archive,
  RotateCcw,
  Trash2,
  Copy,
  Link as LinkIcon,
  Bell,
  ClipboardList,
  MessageSquare,
  LoaderCircle,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import {
  getClassroomDetail,
  updateClassroomStatus,
  regenerateJoinCode,
  deleteClassroom,
  getClassAnnouncements,
  getClassMembers,
  getClassGroupChat,
  sendClassChatMessage,
  getClassAssignments,
  deleteAssignment,
} from '../../services/classroomService';
import EditClassroomModal from './EditClassroomModal';
import AddMemberModal from './AddMemberModal';
import RemoveMemberModal from './RemoveMemberModal';
import GradeSubmissionModal from './GradeSubmissionModal';
import DoAssignmentModal from './DoAssignmentModal';
import ClassroomAnnouncementsTab from '../../components/classroom/ClassroomAnnouncementsTab';
import ClassroomMembersTab from '../../components/classroom/ClassroomMembersTab';
import ClassroomAssignmentsTab from '../../components/classroom/ClassroomAssignmentsTab';
import ClassroomChatTab from '../../components/classroom/ClassroomChatTab';
import ClassroomScheduleTab from '../../components/classroom/ClassroomScheduleTab';
import ClassroomMaterialsTab from '../../components/classroom/ClassroomMaterialsTab';
import MyClassDetail from '../tutor/MyClassDetail';
import './classroom.css';

export default function ClassroomDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const searchParams = new URLSearchParams(location.search);
  const initialTab = searchParams.get('tab') || location.state?.activeTab || 'announcements';

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
  const [activeTab, setActiveTab] = useState(initialTab); // announcements, members, assignments, chat

  useEffect(() => {
    if (location.state?.toastMessage) {
      toast.success(location.state.toastMessage, { id: `classroom-result-${location.key}` });
      navigate(location.pathname + location.search, { replace: true, state: null });
    }
  }, [location.key, location.pathname, location.search, location.state?.toastMessage, navigate]);

  // Modals State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [removeMemberTarget, setRemoveMemberTarget] = useState(null);
  const [gradingAssignmentTarget, setGradingAssignmentTarget] = useState(null);
  const [doAssignmentTarget, setDoAssignmentTarget] = useState(null);

  // Tab 1: Announcements State
  const [announcements, setAnnouncements] = useState([]);

  // Tab 2: Members State
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

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

  // Tự động cuộn xuống tin nhắn mới nhất trong nhóm chat
  useEffect(() => {
    if (activeTab === 'chat' && chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, activeTab]);

  // Tự động làm mới tin nhắn định kỳ khi đang mở tab chat
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
      toast.success(`Đã sao chép ${label}!`);
    }
  };

  // Status toggle (ACTIVE <-> ARCHIVED)
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
      toast.success(`Lớp học đã chuyển sang trạng thái ${newStatus === 'ACTIVE' ? 'Hoạt động' : 'Đã lưu trữ'}`);
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || 'Lỗi khi đổi trạng thái');
    }
  };

  // Regenerate join code
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
      toast.success('Đã cấp mã tham gia và liên kết mời mới thành công!');
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || 'Lỗi khi cấp lại mã');
    }
  };

  // Delete classroom (UC22 Case 2.5: Xóa khi còn thành viên -> Yêu cầu xác nhận, gợi ý Archive)
  const handleDeleteClassroom = async () => {
    if (!classroom) return;

    // Kiểm tra nếu lớp vẫn còn thành viên học sinh
    if (studentCount > 0 || members.length > 0) {
      const shouldArchive = window.confirm(
        `Lớp học "${classroom.name}" hiện vẫn còn ${studentCount || members.length} học viên tham gia.\n\nTheo quy định bảo vệ dữ liệu học tập, bạn không nên xóa lớp đang có người học.\n\nBấm "OK" để chuyển lớp sang trạng thái Lưu trữ (Archive) nhằm lưu lại lịch sử bài tập & điểm số.\nBấm "Cancel" để hủy thao tác.`
      );
      if (shouldArchive) {
        await handleToggleStatus();
      }
      return;
    }

    if (
      !window.confirm(
        `Bạn có chắc chắn muốn xóa lớp học "${classroom.name}"? Hành động này sẽ xóa toàn bộ bảng tin, tài liệu và nhóm chat!`
      )
    ) {
      return;
    }

    try {
      await deleteClassroom(classroom._id);
      toast.success('Đã xóa lớp học thành công!');
      navigate(backUrl);
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || 'Không thể xóa lớp học');
    }
  };

  // Send chat message
  const handleSendChat = async (e, attachments = []) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!chatInput.trim() && attachments.length === 0) return false;

    try {
      setSendingChat(true);
      const res = await sendClassChatMessage(id, chatInput.trim(), attachments);
      setChatMessages((prev) => [...prev, res?.data]);
      setChatInput('');
      return true;
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || 'Lỗi gửi tin nhắn');
      return false;
    } finally {
      setSendingChat(false);
    }
  };

  // Chuyển sang trang tạo bài tập mới
  const handleOpenCreateAssignment = () => {
    navigate(`/tutor/classes/${id}/assignments/new`);
  };

  // Chuyển sang trang chỉnh sửa bài tập
  const handleOpenEditAssignment = (asg) => {
    navigate(`/tutor/classes/${id}/assignments/${asg._id}/edit`);
  };

  // Xóa bài tập
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
      toast.success('Đã xóa bài tập thành công!');
      fetchAssignments();
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || 'Không thể xóa bài tập');
    }
  };

  if (loading) {
    return (
      <div className="classroom-container" style={{ textAlign: 'center', padding: '80px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
          <LoaderCircle size={36} className="spin" style={{ color: '#e85a2c' }} />
        </div>
        <p style={{ color: '#64748b' }}>Đang tải thông tin lớp học...</p>
      </div>
    );
  }

  if (error || !classroom) {
    return (
      <div className="classroom-container">
        <div className="error-alert">
          <AlertTriangle size={18} style={{ flexShrink: 0 }} />
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
  const studentCount = typeof classroom.student_count === 'number' ? classroom.student_count : studentMembers.length;
  const capacity = classroom.capacity || 50;
  const percent = Math.min(Math.round((studentCount / capacity) * 100), 100);
  const isOwner = Boolean(classroom.is_owner || user?.role === 'TUTOR');

  return (
    <div className="classroom-container">

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
              <span className="badge" style={{ background: '#fff7ed', color: '#c2410c', border: '1px solid #fed7aa', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <GraduationCap size={13} /> Bạn là Gia sư phụ trách lớp
              </span>
            ) : user?.role === 'PARENT' ? (
              <span className="badge" style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Users size={13} /> Bạn là Phụ huynh theo dõi lớp
              </span>
            ) : (
              <span className="badge" style={{ background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <UserCheck size={13} /> Bạn là Học viên trong lớp
              </span>
            )}
          </div>

          {/* Banner thông báo khi lớp đang ở trạng thái ARCHIVED (Case 2.4: Read-only) */}
          {classroom.status === 'ARCHIVED' && (
            <div
              className="archived-notice-banner"
              style={{
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderLeft: '4px solid #64748b',
                padding: '10px 14px',
                borderRadius: '8px',
                marginBottom: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#334155',
                fontSize: '13px',
              }}
            >
              <Archive size={16} style={{ color: '#64748b', flexShrink: 0 }} />
              <div>
                <strong>Lớp học đã lưu trữ (Chỉ đọc)</strong>: Thành viên có thể xem lại tài liệu và lịch sử bài tập, không thể nộp bài hoặc đăng nội dung mới.
              </div>
            </div>
          )}

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
                <strong>{studentCount}</strong> / {capacity} học sinh
              </span>
            </div>
            <div className="capacity-progress-bar">
              <div className="capacity-progress-fill" style={{ width: `${percent}%` }}></div>
            </div>
          </div>

          {/* Nút tác vụ quản lý lớp học - Chỉ hiển thị cho chủ lớp (Tutor) */}
          {isOwner && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '16px' }}>
              {classroom.status === 'ACTIVE' && (
                <>
                  <button
                    type="button"
                    className="btn-outline-gray"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    onClick={() => setIsEditModalOpen(true)}
                    title="Chỉnh sửa tên, môn, sĩ số, mô tả"
                  >
                    <Settings size={14} />
                    <span>Chỉnh sửa thông tin</span>
                  </button>
                  <button
                    type="button"
                    className="btn-outline-gray"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    onClick={handleRegenerateCode}
                    title="Cấp lại mã tham gia mới"
                  >
                    <RefreshCw size={14} />
                    <span>Đổi mã mời</span>
                  </button>
                </>
              )}
              <button
                type="button"
                className="btn-outline-gray"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                onClick={handleToggleStatus}
                title="Chuyển đổi trạng thái lưu trữ"
              >
                {classroom.status === 'ACTIVE' ? (
                  <>
                    <Archive size={14} />
                    <span>Lưu trữ lớp</span>
                  </>
                ) : (
                  <>
                    <RotateCcw size={14} />
                    <span>Kích hoạt lại</span>
                  </>
                )}
              </button>
              <button
                type="button"
                className="btn-outline-gray"
                style={{ color: '#dc2626', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                onClick={handleDeleteClassroom}
                title="Xóa lớp học (chỉ khi không còn thành viên/buổi học)"
              >
                <Trash2 size={14} />
                <span>Xóa lớp</span>
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
          <div className="join-code-label">Mã tham gia lớp học</div>
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
              style={{ padding: '8px 14px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              onClick={() => handleCopy(classroom.join_code, 'mã tham gia')}
            >
              <Copy size={13} />
              <span>Sao chép mã</span>
            </button>
            <button
              type="button"
              className="btn-outline-gray"
              style={{ padding: '8px 14px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              onClick={() =>
                handleCopy(
                  classroom.invite_link || `${window.location.origin}/join-class/${classroom.join_code}`,
                  'liên kết mời tham gia'
                )
              }
            >
              <LinkIcon size={13} />
              <span>Liên kết mời</span>
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
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            onClick={() => setActiveTab('announcements')}
          >
            <Bell size={15} />
            <span>Bảng tin</span>
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'members' ? 'active' : ''}`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            onClick={() => setActiveTab('members')}
          >
            <Users size={15} />
            <span>Thành viên</span>
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'assignments' ? 'active' : ''}`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            onClick={() => setActiveTab('assignments')}
          >
            <ClipboardList size={15} />
            <span>Bài tập</span>
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            onClick={() => setActiveTab('chat')}
          >
            <MessageSquare size={15} />
            <span>Nhóm Chat lớp</span>
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'materials' ? 'active' : ''}`}
            onClick={() => setActiveTab('materials')}
          >
            <BookOpen size={15} aria-hidden="true" />
            {user?.role === 'TUTOR' ? ' Tài liệu & chủ đề' : ' Tài liệu'}
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'schedule' ? 'active' : ''}`}
            onClick={() => setActiveTab('schedule')}
          >
            <CalendarDays size={15} aria-hidden="true" /> Lịch lớp học
          </button>
        </div>
      </div>

      {/* ==========================================
          TAB 1: BẢNG TIN LỚP HỌC
          ========================================== */}
      {activeTab === 'announcements' && (
        <ClassroomAnnouncementsTab
          classroomId={id}
          announcements={announcements}
          setAnnouncements={setAnnouncements}
          isOwner={isOwner}
        />
      )}

      {/* ==========================================
          TAB 2: QUẢN LÝ THÀNH VIÊN LỚP
          ========================================== */}
      {activeTab === 'members' && (
        <ClassroomMembersTab
          classroom={classroom}
          members={members}
          loadingMembers={loadingMembers}
          isOwner={isOwner}
          studentCount={studentCount}
          onOpenAddMember={() => setIsAddMemberOpen(true)}
          onSelectRemoveMember={(mem) => setRemoveMemberTarget(mem)}
          onCopy={handleCopy}
        />
      )}

      {/* ==========================================
          TAB 3: BÀI TẬP & CHẤM ĐIỂM
          ========================================== */}
      {activeTab === 'assignments' && (
        <ClassroomAssignmentsTab
          classroomId={id}
          assignments={assignments}
          loadingAssignments={loadingAssignments}
          isOwner={isOwner}
          studentCount={studentCount}
          user={user}
          onOpenCreateAssignment={handleOpenCreateAssignment}
          onOpenEditAssignment={handleOpenEditAssignment}
          onDeleteAssignment={handleDeleteAssignment}
          onSelectGrading={(asg) => setGradingAssignmentTarget(asg)}
          onSelectDoAssignment={(asg) => setDoAssignmentTarget(asg)}
        />
      )}

      {/* ==========================================
          TAB 4: NHÓM CHAT LỚP HỌC
          ========================================== */}
      {activeTab === 'chat' && (
        <ClassroomChatTab
          classroom={classroom}
          chatMessages={chatMessages}
          chatGroupMembers={chatGroupMembers}
          showChatMembers={showChatMembers}
          setShowChatMembers={setShowChatMembers}
          chatInput={chatInput}
          setChatInput={setChatInput}
          sendingChat={sendingChat}
          onSendChat={handleSendChat}
          onOpenAddMember={() => setIsAddMemberOpen(true)}
          onSelectRemoveMember={(m) => setRemoveMemberTarget(m)}
          chatBottomRef={chatBottomRef}
          isOwner={isOwner}
        />
      )}

      {/* ==========================================
          TAB 5: TÀI LIỆU & LỊCH LỚP HỌC
          ========================================== */}
      {activeTab === 'materials' && (
        user?.role === 'TUTOR' ? (
          <MyClassDetail
            embedded
            classId={id}
            classroom={classroom}
            activeTab="materials"
          />
        ) : (
          <ClassroomMaterialsTab classId={id} />
        )
      )}

      {activeTab === 'schedule' && (
        user?.role === 'TUTOR' ? (
          <MyClassDetail
            embedded
            classId={id}
            classroom={classroom}
            activeTab="schedule"
          />
        ) : (
          <ClassroomScheduleTab
            classId={id}
            classroom={classroom}
          />
        )
      )}

      {/* ==========================================
          MODALS
          ========================================== */}

      {/* Modal chỉnh sửa lớp học */}
      <EditClassroomModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        classroom={classroom}
        onUpdated={(updated) => setClassroom(updated)}
      />

      {/* Modal thêm học viên */}
      <AddMemberModal
        isOpen={isAddMemberOpen}
        onClose={() => setIsAddMemberOpen(false)}
        classroomId={classroom._id}
        onMemberAdded={() => fetchMembers()}
      />

      {/* Modal xóa học viên */}
      <RemoveMemberModal
        isOpen={Boolean(removeMemberTarget)}
        onClose={() => setRemoveMemberTarget(null)}
        classroomId={classroom._id}
        member={removeMemberTarget}
        onMemberRemoved={() => fetchMembers()}
      />

      {/* Modal chấm điểm bài tập */}
      <GradeSubmissionModal
        isOpen={Boolean(gradingAssignmentTarget)}
        onClose={() => setGradingAssignmentTarget(null)}
        assignment={gradingAssignmentTarget}
        onGraded={() => fetchAssignments()}
      />

      {/* Modal làm bài tập */}
      <DoAssignmentModal
        isOpen={Boolean(doAssignmentTarget)}
        onClose={() => setDoAssignmentTarget(null)}
        assignment={doAssignmentTarget}
        onSubmitted={() => fetchAssignments()}
      />
    </div>
  );
}
