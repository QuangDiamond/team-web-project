import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ClipboardCheck, LoaderCircle } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import Alert from '../../components/common/Alert';
import FormSelect from '../../components/common/FormSelect';
import { createSessionAttendance, getSessionAttendance, updateSessionAttendance } from '../../services/sessionAttendanceService';
import '../../styles/sessionAttendance.css';

const PAGE_SIZE = 100;
const ATTENDANCE_OPTIONS = [
  { value: 'PRESENT', label: 'Có mặt' },
  { value: 'ABSENT', label: 'Vắng mặt' },
  { value: 'LATE', label: 'Đi muộn' },
];
const DATE_FORMATTER = new Intl.DateTimeFormat('vi-VN', {
  dateStyle: 'full',
  timeStyle: 'short',
});

async function getAllAttendance(classId, sessionId) {
  const firstResponse = await getSessionAttendance(classId, sessionId, { page: 1, limit: PAGE_SIZE });
  const allItems = [...firstResponse.data.items];
  const totalPages = firstResponse.data.pagination.totalPages;
  const otherPages = [];

  for (let page = 2; page <= totalPages; page += 1) {
    otherPages.push(getSessionAttendance(classId, sessionId, { page, limit: PAGE_SIZE }));
  }

  const remainingResponses = await Promise.all(otherPages);
  for (const response of remainingResponses) {
    allItems.push(...response.data.items);
  }

  return {
    ...firstResponse.data,
    items: allItems,
  };
}

export default function SessionAttendance({
  classId: providedClassId,
  sessionId: providedSessionId,
  embedded = false,
  onClose,
}) {
  const routeParams = useParams();
  const classId = providedClassId || routeParams.classId;
  const sessionId = providedSessionId || routeParams.sessionId;
  const [attendanceData, setAttendanceData] = useState(null);
  const [records, setRecords] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let isCurrentRequest = true;
    setIsLoading(true);
    setError('');

    getAllAttendance(classId, sessionId)
      .then((data) => {
        if (!isCurrentRequest) {
          return;
        }
        const nextRecords = {};
        for (const item of data.items) {
          nextRecords[item.student_user_id] = {
            status: item.status || '',
            comment: item.comment || '',
          };
        }
        setAttendanceData(data);
        setRecords(nextRecords);
      })
      .catch((requestError) => {
        if (isCurrentRequest) {
          setError(requestError.message || 'Không thể tải danh sách điểm danh.');
        }
      })
      .finally(() => {
        if (isCurrentRequest) {
          setIsLoading(false);
        }
      });

    return () => {
      isCurrentRequest = false;
    };
  }, [classId, sessionId, reloadKey]);

  const session = attendanceData?.session;
  const canEdit = useMemo(() => {
    if (!session || session.status === 'CANCELLED') {
      return false;
    }
    const now = Date.now();
    const startsAt = new Date(session.start_time).getTime();
    const updateDeadline = new Date(session.end_time).getTime() + (24 * 60 * 60 * 1000);
    return now >= startsAt && now <= updateDeadline;
  }, [session]);
  let submitLabel = 'Lưu điểm danh';
  if (attendanceData?.has_attendance) {
    submitLabel = 'Cập nhật điểm danh';
  }
  if (isSaving) {
    submitLabel = 'Đang lưu...';
  }
  let attendanceWindowMessage = '';
  if (session?.status === 'CANCELLED') {
    attendanceWindowMessage = 'Buổi học đã bị hủy nên không thể điểm danh.';
  } else if (session && Date.now() < new Date(session.start_time).getTime()) {
    attendanceWindowMessage = 'Có thể điểm danh từ thời điểm buổi học bắt đầu.';
  } else if (!canEdit) {
    attendanceWindowMessage = 'Đã quá 24 giờ sau khi buổi học kết thúc; chỉ có thể xem điểm danh.';
  }

  const updateRecord = (studentUserId, field, value) => {
    setRecords((currentRecords) => ({
      ...currentRecords,
      [studentUserId]: {
        ...currentRecords[studentUserId],
        [field]: value,
      },
    }));
    setNotice('');
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setNotice('');
    if (!canEdit) {
      setError(attendanceWindowMessage || 'Chỉ có thể điểm danh từ khi buổi học bắt đầu.');
      return;
    }
    const missingStatus = attendanceData.items.some((item) => !records[item.student_user_id]?.status);
    if (missingStatus) {
      setError('Hãy chọn trạng thái cho tất cả học sinh trước khi lưu.');
      return;
    }

    const payload = {
      records: attendanceData.items.map((item) => ({
        student_user_id: item.student_user_id,
        status: records[item.student_user_id].status,
        comment: records[item.student_user_id].comment.trim() || null,
      })),
    };

    setIsSaving(true);
    try {
      if (attendanceData.has_attendance) {
        await updateSessionAttendance(classId, sessionId, payload);
      } else {
        await createSessionAttendance(classId, sessionId, payload);
      }
      setNotice('Đã lưu điểm danh cho buổi học.');
      setReloadKey((currentKey) => currentKey + 1);
    } catch (requestError) {
      setError(requestError.message || 'Không thể lưu điểm danh.');
    } finally {
      setIsSaving(false);
    }
  };

  const goBackUrl = `/tutor/classes/${classId}?tab=schedule`;

  if (isLoading) {
    return (
      <div id={embedded ? 'session-attendance-preview' : undefined} className={embedded ? 'class-detail-section class-material-preview-section session-attendance-preview' : ''}>
        {embedded && (
          <div className="class-detail-section-heading session-attendance-preview-heading">
            <span className="class-detail-section-icon" aria-hidden="true"><ClipboardCheck size={18} /></span>
            <div><h2>Điểm danh buổi học</h2><p>Đang tải danh sách học sinh</p></div>
            <button type="button" className="btn btn-outline btn-sm" onClick={onClose}>Đóng xem trước</button>
          </div>
        )}
        <div className="schedule-loading session-attendance-inline-loading" role="status">
          <LoaderCircle size={24} className="spin" aria-hidden="true" />
          <span>Đang tải danh sách học sinh...</span>
        </div>
      </div>
    );
  }

  if (error && !attendanceData) {
    return (
      <div id={embedded ? 'session-attendance-preview' : undefined} className={embedded ? 'class-detail-section class-material-preview-section session-attendance-preview' : 'page-stack session-attendance-page'}>
        {embedded && (
          <div className="class-detail-section-heading session-attendance-preview-heading">
            <span className="class-detail-section-icon" aria-hidden="true"><ClipboardCheck size={18} /></span>
            <div><h2>Điểm danh buổi học</h2><p>{sessionId}</p></div>
            <button type="button" className="btn btn-outline btn-sm" onClick={onClose}>Đóng</button>
          </div>
        )}
        <Alert type="error"><p>{error}</p></Alert>
        {!embedded && (
          <Link className="btn btn-outline btn-sm session-attendance-back" to={goBackUrl}>
            <ArrowLeft size={16} aria-hidden="true" /> Quay lại lịch lớp
          </Link>
        )}
      </div>
    );
  }

  return (
    <div id={embedded ? 'session-attendance-preview' : undefined} className={embedded ? 'class-detail-section class-material-preview-section session-attendance-preview' : 'page-stack session-attendance-page'}>
      {!embedded && (
        <Link className="session-attendance-back-link" to={goBackUrl}>
          <ArrowLeft size={16} aria-hidden="true" /> Quay lại lịch lớp
        </Link>
      )}
      {embedded ? (
        <div className="class-detail-section-heading session-attendance-preview-heading">
          <span className="class-detail-section-icon" aria-hidden="true"><ClipboardCheck size={18} /></span>
          <div>
            <h2>Điểm danh buổi học</h2>
            <p>{session?.title || 'Buổi học'} · {session && DATE_FORMATTER.format(new Date(session.start_time))}</p>
          </div>
          <button type="button" className="btn btn-outline btn-sm" onClick={onClose}>Đóng xem trước</button>
        </div>
      ) : (
        <section className="session-attendance-header">
          <span className="schedule-toolbar-icon" aria-hidden="true"><ClipboardCheck size={19} /></span>
          <div>
            <h2>Điểm danh buổi học</h2>
            <p>{session?.title || 'Buổi học'} · {session && DATE_FORMATTER.format(new Date(session.start_time))}</p>
          </div>
        </section>
      )}

      {!canEdit && (
        <Alert type="info">
          <p>{attendanceWindowMessage}</p>
        </Alert>
      )}
      {error && <Alert type="error"><p>{error}</p></Alert>}
      {notice && <Alert type="success"><p>{notice}</p></Alert>}

      {attendanceData.items.length === 0 ? (
        <section className="session-attendance-empty">
          <h3>Lớp chưa có học sinh đang hoạt động</h3>
          <p>Thêm học sinh vào lớp trước khi thực hiện điểm danh.</p>
        </section>
      ) : (
        <form className="session-attendance-list" onSubmit={handleSubmit}>
          {attendanceData.items.map((student) => (
            <article className="session-attendance-card" key={student.student_user_id}>
              <div className="session-attendance-student">
                <strong>{student.full_name}</strong>
                <span>{student.email}</span>
              </div>
              <FormSelect
                id={`attendance-status-${student.student_user_id}`}
                label="Trạng thái"
                value={records[student.student_user_id]?.status || ''}
                onChange={(event) => updateRecord(student.student_user_id, 'status', event.target.value)}
                options={ATTENDANCE_OPTIONS}
                placeholder="Chọn trạng thái"
                required
                disabled={!canEdit || isSaving}
              />
              <div className="form-field session-attendance-comment-field">
                <label className="form-label" htmlFor={`attendance-comment-${student.student_user_id}`}>
                  Nhận xét (không bắt buộc)
                </label>
                <textarea
                  id={`attendance-comment-${student.student_user_id}`}
                  value={records[student.student_user_id]?.comment || ''}
                  onChange={(event) => updateRecord(student.student_user_id, 'comment', event.target.value)}
                  maxLength={500}
                  rows={2}
                  disabled={!canEdit || isSaving}
                  placeholder="Nhận xét ngắn về buổi học của học sinh"
                />
              </div>
            </article>
          ))}
          <div className="session-attendance-actions">
            <span>{attendanceData.items.length} học sinh</span>
            <button type="submit" className="btn btn-primary btn-sm" disabled={!canEdit || isSaving}>
              {submitLabel}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
