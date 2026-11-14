import { toast } from 'sonner';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  PenTool,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Award,
  Send,
  Loader2,
  FileText,
  UploadCloud,
  Trash2,
  RotateCcw,
  Calendar,
  MessageSquare,
  HelpCircle,
} from 'lucide-react';
import { getAssignmentDetail, submitAssignment } from '../../services/classroomService';
import { useAuth } from '../../hooks/useAuth';
import { getAttachmentUrl, formatFileSize } from '../../utils/fileUrl';
import { formatDate } from '../../utils/dateFormat';
import './classroom.css';

export default function DoAssignmentPage() {
  const { id: paramClassId, assignmentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const isParent = user?.role === 'PARENT';
  const isTutor = user?.role === 'TUTOR';
  const isReadOnly = isParent || isTutor;

  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const [answers, setAnswers] = useState({});
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [lastSaved, setLastSaved] = useState(null);

  const classId = paramClassId || assignment?.class_id || assignment?.class?._id;
  const mySubmission = result || assignment?.my_submission;

  const isPastDue = assignment?.due_date && new Date() > new Date(assignment.due_date);
  const isBlockedByLate = isPastDue && !assignment?.allow_late_submission;
  const isBlockedByGraded = Boolean(assignment?.results_published_at || mySubmission?.status === 'GRADED');
  const isBlockedByResubmit = mySubmission && !assignment?.allow_resubmission;
  const canSubmit = !isReadOnly && !isBlockedByLate && !isBlockedByGraded && !isBlockedByResubmit;

  const autoSaveKey = assignmentId && user?._id ? `draft_assignment_${assignmentId}_${user._id}` : null;

  // Tải chi tiết bài tập
  const fetchAssignment = useCallback(async () => {
    if (!assignmentId) return;
    try {
      setLoading(true);
      const res = await getAssignmentDetail(assignmentId);
      const data = res?.data;
      setAssignment(data);

      const initialAnswers = {};
      const initialFiles = {};

      if (data?.my_submission?.answers) {
        data.my_submission.answers.forEach((ans) => {
          initialAnswers[ans.question_id] = ans.text_response || '';
          if (ans.file_url) {
            initialFiles[ans.question_id] = {
              file_name: ans.text_response && !ans.text_response.startsWith('http') ? ans.text_response : 'Tệp bài làm đã nộp',
              file_url: ans.file_url,
              file_size: ans.file_size,
            };
          }
        });
      } else if (autoSaveKey) {
        try {
          const saved = localStorage.getItem(autoSaveKey);
          if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed && typeof parsed === 'object') {
              Object.assign(initialAnswers, parsed);
              setLastSaved(new Date());
            }
          }
        } catch {
          // bỏ qua lỗi đọc localStorage
        }
      }

      setAnswers(initialAnswers);
      setUploadedFiles(initialFiles);
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || 'Không thể tải thông tin bài tập');
    } finally {
      setLoading(false);
    }
  }, [assignmentId, autoSaveKey]);

  useEffect(() => {
    fetchAssignment();
  }, [fetchAssignment]);

  // Xử lý thay đổi câu trả lời & tự động lưu nháp
  const handleAnswerChange = (questionId, value) => {
    setAnswers((prev) => {
      const updated = {
        ...prev,
        [questionId]: value,
      };
      if (autoSaveKey && !mySubmission) {
        try {
          localStorage.setItem(autoSaveKey, JSON.stringify(updated));
          setLastSaved(new Date());
        } catch {
          // ignore storage quota errors
        }
      }
      return updated;
    });
  };

  // Chọn tệp từ máy tính
  const handleSelectFile = (questionId, event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const DISALLOWED_EXTENSIONS = ['.exe', '.bat', '.cmd', '.sh', '.bin', '.msi', '.com'];
    const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
    const lowerName = file.name.toLowerCase();

    if (DISALLOWED_EXTENSIONS.some((ext) => lowerName.endsWith(ext))) {
      toast.error(`Tệp "${file.name}" không hợp lệ. Không chấp nhận tệp thực thi (.exe, .bat, ...)`);
      event.target.value = '';
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error(`Tệp "${file.name}" vượt quá dung lượng tối đa cho phép là 20MB.`);
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result;
      setUploadedFiles((prev) => ({
        ...prev,
        [questionId]: {
          file_name: file.name,
          file_size: file.size,
          file_data: base64,
          mime_type: file.type || 'application/octet-stream',
        },
      }));
      toast.success(`Đã chọn tệp "${file.name}" (${formatFileSize(file.size)})`);
    };
    reader.onerror = () => {
      toast.error('Không thể đọc tệp. Vui lòng thử lại.');
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  // Xóa tệp đã chọn
  const handleRemoveFile = (questionId) => {
    setUploadedFiles((prev) => {
      const next = { ...prev };
      delete next[questionId];
      return next;
    });
  };

  // Nộp bài tập
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    if (!canSubmit) {
      toast.error('Không thể nộp bài tập do chính sách thời hạn hoặc số lần nộp');
      return;
    }

    // Kiểm tra định dạng link tệp
    const DISALLOWED_EXTENSIONS = ['.exe', '.bat', '.cmd', '.sh', '.bin', '.msi', '.com'];
    for (const q of assignment.questions || []) {
      if (q.question_type === 'FILE_UPLOAD') {
        const fileVal = answers[q._id];
        if (fileVal && typeof fileVal === 'string') {
          const lower = fileVal.trim().toLowerCase();
          if (DISALLOWED_EXTENSIONS.some((ext) => lower.endsWith(ext) || lower.includes(`${ext}?`))) {
            toast.error('Tệp đính kèm không hợp lệ. Hệ thống không cho phép tải lên tệp thực thi (.exe, .bat, ...)');
            return;
          }
        }
      }
    }

    const formattedAnswers = (assignment.questions || []).map((q) => {
      const uploaded = uploadedFiles[q._id];
      const ansObj = {
        question_id: q._id,
        text_response: answers[q._id] || (uploaded ? uploaded.file_name : ''),
      };

      if (uploaded) {
        if (uploaded.file_data) {
          ansObj.file_data = uploaded.file_data;
          ansObj.file_name = uploaded.file_name;
          ansObj.file_size = uploaded.file_size;
        } else if (uploaded.file_url) {
          ansObj.file_url = uploaded.file_url;
          ansObj.file_size = uploaded.file_size;
        }
      } else if (q.question_type === 'FILE_UPLOAD' && answers[q._id]) {
        ansObj.file_url = answers[q._id];
      }

      return ansObj;
    });

    try {
      setSubmitting(true);
      const res = await submitAssignment(assignment._id, formattedAnswers);
      const subResult = res?.data || null;
      setResult(subResult);

      if (autoSaveKey) {
        try {
          localStorage.removeItem(autoSaveKey);
        } catch {
          // ignore
        }
      }

      toast.success('Nộp bài tập thành công!');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || 'Không thể nộp bài tập');
    } finally {
      setSubmitting(false);
    }
  };

  // Xác định đường dẫn quay lại
  const backUrl = useMemo(() => {
    if (classId) {
      if (isTutor) return `/tutor/classes/${classId}?tab=assignments`;
      if (isParent) return `/parent/classes/${classId}?tab=assignments`;
      return `/student/classes/${classId}?tab=assignments`;
    }
    return '/student/assignments';
  }, [classId, isTutor, isParent]);

  if (loading) {
    return (
      <div className="classroom-container" style={{ padding: '80px 20px', textAlign: 'center' }}>
        <Loader2 size={36} className="spin" style={{ margin: '0 auto 16px auto', color: 'var(--color-primary-strong)' }} />
        <p style={{ color: 'var(--color-text-muted)', fontSize: '15px' }}>Đang tải nội dung bài tập...</p>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="classroom-container" style={{ maxWidth: '800px', margin: '40px auto', padding: '30px', textAlign: 'center' }}>
        <AlertTriangle size={48} style={{ color: 'var(--color-warning)', margin: '0 auto 16px' }} />
        <h2>Không tìm thấy bài tập</h2>
        <p style={{ color: 'var(--color-text-muted)', marginTop: '8px', marginBottom: '20px' }}>
          Bài tập có thể đã bị xóa hoặc bạn không có quyền truy cập.
        </p>
        <Link to={backUrl} className="btn-primary-orange" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <ArrowLeft size={16} /> Quay lại
        </Link>
      </div>
    );
  }

  return (
    <div className="classroom-container" style={{ maxWidth: '960px', margin: '0 auto', padding: '24px 16px 80px 16px' }}>
      {/* 1. Header & Navigation Breadcrumb */}
      <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <Link
          to={backUrl}
          className="btn-outline-gray"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', padding: '8px 14px', textDecoration: 'none' }}
        >
          <ArrowLeft size={16} />
          <span>{classId ? 'Quay lại lớp học' : 'Danh sách bài tập'}</span>
        </Link>

        {assignment.class && (
          <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
            Lớp: <strong>{assignment.class.name}</strong> • Môn {assignment.class.subject} ({assignment.class.grade})
          </span>
        )}
      </div>

      {/* 2. Banner thông tin bài tập */}
      <div
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '20px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
          <div style={{ flex: 1, minWidth: '280px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  padding: '3px 8px',
                  borderRadius: '6px',
                  background: isReadOnly ? 'var(--color-info-soft)' : 'var(--color-primary-soft)',
                  color: isReadOnly ? 'var(--color-info)' : 'var(--color-primary-strong)',
                }}
              >
                {isReadOnly ? 'Chế độ xem trước' : 'Bài tập học sinh'}
              </span>
              <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                {assignment.questions?.length || 0} câu hỏi
              </span>
            </div>

            <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-text)', margin: '0 0 8px 0', lineHeight: 1.3 }}>
              {assignment.title}
            </h1>

            {assignment.instructions && (
              <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', margin: 0, lineHeight: 1.6 }}>
                {assignment.instructions}
              </p>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '180px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--color-text)' }}>
              <Award size={16} style={{ color: 'var(--color-primary-strong)' }} />
              <span>Tổng điểm: <strong>{assignment.total_points || 10} điểm</strong></span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: isPastDue ? 'var(--color-error)' : 'var(--color-text)' }}>
              <Calendar size={16} />
              <span>
                Hạn nộp: {assignment.due_date ? formatDate(assignment.due_date) : 'Không giới hạn'}
              </span>
            </div>

            {assignment.allow_late_submission && (
              <span style={{ fontSize: '12px', color: 'var(--color-warning)' }}>
                * Cho phép nộp muộn sau hạn
              </span>
            )}
          </div>
        </div>

        {/* Tài liệu đính kèm từ gia sư (nếu có) */}
        {Array.isArray(assignment.attachments) && assignment.attachments.length > 0 && (
          <div
            style={{
              paddingTop: '14px',
              borderTop: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              flexWrap: 'wrap',
            }}
          >
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)' }}>
              Tài liệu tham khảo đính kèm:
            </span>
            {assignment.attachments.map((att, idx) => (
              <a
                key={idx}
                href={getAttachmentUrl(att.file_url)}
                target="_blank"
                rel="noreferrer"
                className="btn-outline-gray"
                style={{ fontSize: '12px', padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
              >
                <FileText size={13} />
                <span>{att.title || 'Xem tài liệu lớp học'}</span>
              </a>
            ))}
          </div>
        )}
      </div>

      {/* 3. Banner thông báo trạng thái bài làm */}
      {mySubmission && (
        <div
          style={{
            background: mySubmission.status === 'GRADED' ? 'var(--color-success-soft)' : 'var(--color-surface-subtle)',
            border: `1px solid ${mySubmission.status === 'GRADED' ? '#bbf7d0' : 'var(--color-border)'}`,
            borderRadius: '12px',
            padding: '18px 20px',
            marginBottom: '24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <CheckCircle2 size={18} style={{ color: mySubmission.status === 'GRADED' ? 'var(--color-success)' : 'var(--color-info)' }} />
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--color-text)' }}>
                  {mySubmission.status === 'GRADED' ? 'Bài làm đã được chấm điểm chính thức' : 'Bạn đã nộp bài tập này'}
                </h3>
                <span
                  style={{
                    fontSize: '11px',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    background: mySubmission.timeliness === 'LATE' ? 'var(--color-error-soft)' : 'var(--color-success-soft)',
                    color: mySubmission.timeliness === 'LATE' ? 'var(--color-error)' : 'var(--color-success)',
                    fontWeight: 600,
                  }}
                >
                  {mySubmission.timeliness === 'LATE' ? 'Nộp muộn' : 'Đúng hạn'}
                </span>
              </div>

              <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-text-muted)' }}>
                {mySubmission.status === 'GRADED'
                  ? `Gia sư đã công bố điểm vào lúc ${formatDate(mySubmission.graded_at)}.`
                  : 'Gia sư sẽ chấm các câu tự luận / tệp đính kèm và công bố điểm chính thức sớm nhất.'}
              </p>

              {mySubmission.overall_feedback && (
                <div style={{ marginTop: '8px', fontSize: '13px', color: 'var(--color-info)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MessageSquare size={14} />
                  <span><strong>Nhận xét chung:</strong> &quot;{mySubmission.overall_feedback}&quot;</span>
                </div>
              )}
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                {mySubmission.status === 'GRADED' ? 'Điểm chính thức:' : 'Điểm tạm tính (MCQ):'}
              </div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--color-primary-strong)' }}>
                {mySubmission.status === 'GRADED' ? mySubmission.final_score : mySubmission.provisional_score || 0}
                <span style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text-muted)' }}>
                  /{assignment.total_points || 10}đ
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Danh sách câu hỏi làm bài */}
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '30px' }}>
          {(assignment.questions || []).map((q, idx) => {
            const qNum = q.question_number || idx + 1;
            const subAnswer = mySubmission?.answers?.find((a) => a.question_id?.toString() === q._id?.toString());

            return (
              <div
                key={q._id || idx}
                style={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '12px',
                  padding: '20px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                }}
              >
                {/* Tiêu đề câu hỏi */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '50%',
                        background: 'var(--color-primary-soft)',
                        color: 'var(--color-primary-strong)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '13px',
                        fontWeight: 700,
                      }}
                    >
                      {qNum}
                    </span>
                    <span style={{ fontWeight: 700, fontSize: '15px', color: 'var(--color-text)' }}>
                      Câu {qNum}
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                      ({q.points || 1} điểm · {q.question_type === 'MULTIPLE_CHOICE' ? 'Trắc nghiệm' : q.question_type === 'SHORT_ANSWER' ? 'Tự luận ngắn' : 'Nộp tệp/link'})
                    </span>
                  </div>

                  {subAnswer && subAnswer.score !== null && subAnswer.score !== undefined && (
                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: '6px',
                        background: subAnswer.score > 0 ? 'var(--color-success-soft)' : 'var(--color-error-soft)',
                        color: subAnswer.score > 0 ? 'var(--color-success)' : 'var(--color-error)',
                      }}
                    >
                      +{subAnswer.score}/{q.points || 1}đ
                    </span>
                  )}
                </div>

                {/* Nội dung đề bài */}
                <div style={{ fontSize: '15px', color: 'var(--color-text)', lineHeight: 1.6, marginBottom: '16px', fontWeight: 500 }}>
                  {q.content}
                </div>

                {/* DẠNG 1: TRẮC NGHIỆM (MULTIPLE_CHOICE) */}
                {q.question_type === 'MULTIPLE_CHOICE' && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px' }}>
                    {['A', 'B', 'C', 'D'].map((letter, optIdx) => {
                      const optText = q.options?.[optIdx] || '';
                      if (!optText) return null;

                      const cleanText =
                        optText.startsWith(`${letter}.`) || optText.startsWith(`${letter}:`)
                          ? optText.slice(2).trim()
                          : optText;

                      const isSelected = answers[q._id] === letter;
                      const isCorrect = assignment.results_published_at && q.correct_answer === letter;

                      let borderColor = 'var(--color-border)';
                      let bg = 'var(--color-surface)';
                      if (isSelected) {
                        borderColor = 'var(--color-primary-strong)';
                        bg = 'var(--color-primary-soft)';
                      }
                      if (isCorrect) {
                        borderColor = 'var(--color-success)';
                        bg = 'var(--color-success-soft)';
                      }

                      return (
                        <label
                          key={letter}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '12px 14px',
                            borderRadius: '8px',
                            border: `1.5px solid ${borderColor}`,
                            background: bg,
                            cursor: canSubmit ? 'pointer' : 'default',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <input
                            type="radio"
                            name={`question_${q._id}`}
                            value={letter}
                            checked={isSelected}
                            onChange={() => handleAnswerChange(q._id, letter)}
                            disabled={!canSubmit}
                            style={{ accentColor: 'var(--color-primary-strong)', width: '16px', height: '16px' }}
                          />
                          <span style={{ fontWeight: 700, color: isSelected ? 'var(--color-primary-strong)' : 'var(--color-text)' }}>
                            {letter}.
                          </span>
                          <span style={{ fontSize: '14px', color: 'var(--color-text)', flex: 1 }}>
                            {cleanText}
                          </span>
                          {isCorrect && (
                            <span style={{ fontSize: '11px', color: 'var(--color-success)', fontWeight: 600 }}>
                              (Đáp án đúng)
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                )}

                {/* DẠNG 2: TỰ LUẬN NGẮN (SHORT_ANSWER) */}
                {q.question_type === 'SHORT_ANSWER' && (
                  <div>
                    <textarea
                      rows={4}
                      placeholder={canSubmit ? 'Nhập câu trả lời chi tiết của bạn tại đây...' : 'Chưa có câu trả lời'}
                      value={answers[q._id] || ''}
                      onChange={(e) => handleAnswerChange(q._id, e.target.value)}
                      disabled={!canSubmit}
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '1px solid var(--color-control-border)',
                        fontSize: '14px',
                        lineHeight: 1.5,
                        background: canSubmit ? 'var(--color-surface)' : 'var(--color-surface-subtle)',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                )}

                {/* DẠNG 3: NỘP TỆP (FILE_UPLOAD) */}
                {q.question_type === 'FILE_UPLOAD' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {/* Thẻ tệp đã chọn từ máy hoặc có trong bài nộp */}
                    {uploadedFiles[q._id] ? (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px 16px',
                          background: 'var(--color-primary-soft, #fff7ed)',
                          border: '1px solid #fdba74',
                          borderRadius: '8px',
                          gap: '12px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                          <div
                            style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '8px',
                              background: 'var(--color-primary-strong)',
                              color: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            <FileText size={20} />
                          </div>
                          <div style={{ minWidth: 0, overflow: 'hidden' }}>
                            <div
                              style={{
                                fontWeight: 600,
                                fontSize: '14px',
                                color: 'var(--color-text)',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                              title={uploadedFiles[q._id].file_name}
                            >
                              {uploadedFiles[q._id].file_name}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                              {formatFileSize(uploadedFiles[q._id].file_size) || 'Tệp đính kèm'}
                              {uploadedFiles[q._id].file_url && (
                                <>
                                  {' • '}
                                  <a
                                    href={getAttachmentUrl(uploadedFiles[q._id].file_url)}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{ color: 'var(--color-primary-strong)', textDecoration: 'underline', fontWeight: 600 }}
                                  >
                                    Mở xem tệp đã tải
                                  </a>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {canSubmit && (
                          <button
                            type="button"
                            onClick={() => handleRemoveFile(q._id)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--color-error)',
                              cursor: 'pointer',
                              padding: '6px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '13px',
                              fontWeight: 600,
                            }}
                          >
                            <Trash2 size={16} />
                            <span>Xóa</span>
                          </button>
                        )}
                      </div>
                    ) : (
                      /* Nút tải tệp lên từ thiết bị */
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
                        <label
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '10px 18px',
                            background: canSubmit ? 'var(--color-primary-soft, #fff7ed)' : 'var(--color-surface-subtle)',
                            color: canSubmit ? 'var(--color-primary-strong, #ea580c)' : 'var(--color-text-muted)',
                            border: '1.5px dashed #fdba74',
                            borderRadius: '8px',
                            cursor: canSubmit ? 'pointer' : 'not-allowed',
                            fontSize: '13px',
                            fontWeight: 600,
                            transition: 'all 0.2s ease',
                          }}
                        >
                          <UploadCloud size={18} />
                          <span>Tải tệp lên từ thiết bị (PDF, Word, Ảnh...)</span>
                          <input
                            type="file"
                            onChange={(e) => handleSelectFile(q._id, e)}
                            disabled={!canSubmit}
                            style={{ display: 'none' }}
                            accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.gif,.webp,.zip,.rar,.7z"
                          />
                        </label>
                      </div>
                    )}

                    {/* Ô nhập link ngoài hoặc ghi chú bài làm */}
                    <div>
                      <input
                        type="text"
                        placeholder={uploadedFiles[q._id] ? "Ghi chú thêm về bài làm (tùy chọn)..." : "Hoặc dán liên kết tệp nộp bài (Google Drive, Figma, GitHub, Dropbox...)"}
                        value={answers[q._id] || ''}
                        onChange={(e) => handleAnswerChange(q._id, e.target.value)}
                        disabled={!canSubmit}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: '8px',
                          border: '1px solid var(--color-control-border)',
                          fontSize: '13px',
                          background: canSubmit ? 'var(--color-surface)' : 'var(--color-surface-subtle)',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>

                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <HelpCircle size={13} color="var(--color-info)" style={{ flexShrink: 0 }} />
                      <span>Hỗ trợ tệp tài liệu (PDF, Word, Excel, PowerPoint), Hình ảnh hoặc Mã nguồn (tối đa 20MB). Không chấp nhận file thực thi (.exe, .bat).</span>
                    </div>
                  </div>
                )}

                {/* Nhận xét riêng từng câu của gia sư khi đã chấm */}
                {subAnswer && subAnswer.comment && (
                  <div
                    style={{
                      marginTop: '12px',
                      padding: '10px 14px',
                      background: 'var(--color-surface-subtle)',
                      borderLeft: '3px solid var(--color-info)',
                      borderRadius: '0 8px 8px 0',
                      fontSize: '13px',
                    }}
                  >
                    <strong>Gia sư nhận xét:</strong> {subAnswer.comment}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 5. Sticky Bottom Action Bar */}
        <div
          style={{
            position: 'sticky',
            bottom: '20px',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
            padding: '16px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
            zIndex: 30,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--color-text-muted)' }}>
            {lastSaved && !mySubmission ? (
              <>
                <Clock size={15} style={{ color: 'var(--color-success)' }} />
                <span>Đã lưu nháp tự động lúc {lastSaved.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
              </>
            ) : mySubmission ? (
              <>
                <CheckCircle2 size={15} style={{ color: 'var(--color-success)' }} />
                <span>Bài nộp lần {mySubmission.attempt_number || 1} ({formatDate(mySubmission.submitted_at)})</span>
              </>
            ) : (
              <span>Bài làm sẽ được lưu nháp tự động</span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button
              type="button"
              className="btn-outline-gray"
              onClick={() => navigate(backUrl)}
              disabled={submitting}
              style={{ padding: '9px 18px', fontSize: '13px' }}
            >
              Quay lại
            </button>

            {canSubmit && (
              <button
                type="submit"
                className="btn-primary-orange"
                disabled={submitting}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '9px 24px',
                  fontSize: '14px',
                  fontWeight: 600,
                }}
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="spin" />
                    <span>Đang gửi bài...</span>
                  </>
                ) : mySubmission ? (
                  <>
                    <RotateCcw size={16} />
                    <span>Nộp lại bài làm</span>
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    <span>Nộp bài tập</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
