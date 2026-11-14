import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { UserCheck, Clock, AlertCircle, Loader2, X, Check, CheckCircle2, UserX } from 'lucide-react';
import { getClassMembers, markAttendance } from '../../services/classroomService';

export default function AttendanceModal({
  isOpen,
  onClose,
  session,
  classId,
  onSuccess,
}) {
  const [students, setStudents] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({}); // { [studentId]: { status, comment } }
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen || !classId) return;

    let isMounted = true;
    const fetchStudents = async () => {
      try {
        setLoadingMembers(true);
        setError('');
        const res = await getClassMembers(classId);
        const allMembers = res?.data?.items || res?.data || [];
        const studentList = allMembers.filter((m) => {
          const role = m.user_id?.role || m.role;
          return role === 'STUDENT';
        });

        if (isMounted) {
          setStudents(studentList);

          // Khởi tạo map điểm danh từ session.attendance (nếu đã từng điểm danh)
          const initialMap = {};
          if (session?.attendance && session.attendance.length > 0) {
            for (const record of session.attendance) {
              const sid = String(record.student_user_id?._id || record.student_user_id);
              initialMap[sid] = {
                status: record.status || 'PRESENT',
                comment: record.comment || '',
              };
            }
          }

          // Điền mặc định PRESENT cho những học sinh chưa có điểm danh
          for (const s of studentList) {
            const sid = String(s.user_id?._id || s.user_id || s._id);
            if (!initialMap[sid]) {
              initialMap[sid] = { status: 'PRESENT', comment: '' };
            }
          }
          setAttendanceMap(initialMap);
        }
      } catch (err) {
        if (isMounted) setError(err.message || 'Lỗi tải danh sách học sinh của lớp');
      } finally {
        if (isMounted) setLoadingMembers(false);
      }
    };

    fetchStudents();
    return () => {
      isMounted = false;
    };
  }, [isOpen, classId, session]);

  if (!isOpen || !session) return null;

  const handleStatusChange = (studentId, status) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
      },
    }));
  };

  const handleCommentChange = (studentId, comment) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        comment,
      },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (students.length === 0) {
      setError('Lớp học chưa có học sinh nào để điểm danh.');
      return;
    }

    const items = students.map((s) => {
      const sid = String(s.user_id?._id || s.user_id || s._id);
      const record = attendanceMap[sid] || { status: 'PRESENT', comment: '' };
      return {
        student_user_id: sid,
        status: record.status,
        comment: record.comment || null,
      };
    });

    try {
      setSubmitting(true);
      setError('');
      const res = await markAttendance(classId, session._id, { items });
      toast.success('Điểm danh buổi học thành công!');
      if (onSuccess) onSuccess(res?.data);
      onClose();
    } catch (err) {
      toast.error(err.message || 'Lỗi lưu kết quả điểm danh');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1100,
        background: 'rgba(15, 23, 42, 0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--color-surface)',
          borderRadius: '14px',
          maxWidth: '620px',
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 700, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UserCheck size={20} style={{ color: 'var(--color-primary-strong)' }} />
              <span>Điểm danh học sinh</span>
            </h3>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-text-muted)' }}>
              Buổi: <strong>{session.title || 'Buổi học'}</strong> ({new Date(session.start_time).toLocaleDateString('vi-VN')})
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body content */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          {loadingMembers && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '160px', gap: '10px', color: 'var(--color-text-muted)' }}>
              <Loader2 size={24} className="spin" />
              <span>Đang tải danh sách học sinh của lớp...</span>
            </div>
          )}

          {!loadingMembers && students.length === 0 && (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
              <AlertCircle size={36} style={{ color: 'var(--color-text-muted)', marginBottom: '8px' }} />
              <p style={{ margin: 0, fontWeight: 500 }}>Lớp học hiện chưa có học sinh nào tham gia.</p>
            </div>
          )}

          {!loadingMembers && students.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {students.map((student) => {
                const sid = String(student.user_id?._id || student.user_id || student._id);
                const name = student.user_id?.full_name || student.full_name || 'Học sinh';
                const email = student.user_id?.email || student.email || '';
                const currentRecord = attendanceMap[sid] || { status: 'PRESENT', comment: '' };

                return (
                  <div
                    key={sid}
                    style={{
                      padding: '12px 16px',
                      borderRadius: '10px',
                      border: '1px solid var(--color-border)',
                      background: 'var(--color-surface-subtle)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                      <div>
                        <strong style={{ fontSize: '14px', color: 'var(--color-text)' }}>{name}</strong>
                        {email && <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginLeft: '6px' }}>({email})</span>}
                      </div>

                      {/* Status selector */}
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(sid, 'PRESENT')}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            border: currentRecord.status === 'PRESENT' ? '2px solid var(--color-success)' : '1px solid var(--color-control-border)',
                            background: currentRecord.status === 'PRESENT' ? 'var(--color-success-soft)' : 'var(--color-white)',
                            color: currentRecord.status === 'PRESENT' ? 'var(--color-success)' : 'var(--color-text-muted)',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <CheckCircle2 size={13} />
                          <span>Có mặt</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleStatusChange(sid, 'LATE')}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            border: currentRecord.status === 'LATE' ? '2px solid var(--color-warning)' : '1px solid var(--color-control-border)',
                            background: currentRecord.status === 'LATE' ? 'var(--color-warning-soft)' : 'var(--color-white)',
                            color: currentRecord.status === 'LATE' ? 'var(--color-warning)' : 'var(--color-text-muted)',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <Clock size={13} />
                          <span>Đi muộn</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleStatusChange(sid, 'ABSENT')}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            border: currentRecord.status === 'ABSENT' ? '2px solid var(--color-error)' : '1px solid var(--color-control-border)',
                            background: currentRecord.status === 'ABSENT' ? 'var(--color-error-soft)' : 'var(--color-white)',
                            color: currentRecord.status === 'ABSENT' ? 'var(--color-error)' : 'var(--color-text-muted)',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <UserX size={13} />
                          <span>Vắng</span>
                        </button>
                      </div>
                    </div>

                    {/* Ghi chú điểm danh */}
                    <input
                      type="text"
                      placeholder="Ghi chú (ví dụ: xin vào muộn 15p, có phép...)"
                      value={currentRecord.comment || ''}
                      onChange={(e) => handleCommentChange(sid, e.target.value)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '6px',
                        border: '1px solid var(--color-control-border)',
                        fontSize: '12px',
                        background: 'var(--color-surface)',
                      }}
                      maxLength={200}
                    />
                  </div>
                );
              })}
            </div>
          )}

          {error && (
            <div style={{ marginTop: '16px', padding: '10px 14px', borderRadius: '8px', background: 'var(--color-error-soft)', border: '1px solid #fecaca', color: 'var(--color-error)', fontSize: '13px' }}>
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={onClose}
            disabled={submitting}
          >
            Đóng
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handleSubmit}
            disabled={submitting || students.length === 0}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            {submitting ? <Loader2 size={15} className="spin" /> : <Check size={15} />}
            <span>Lưu điểm danh</span>
          </button>
        </div>
      </div>
    </div>
  );
}

