import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import {
  Eye,
  PenTool,
  X,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Info,
  Lock,
  Users,
  ClipboardList,
  Award,
  RotateCcw,
  Send,
  Loader2,
} from 'lucide-react';
import { submitAssignment } from '../../services/classroomService';
import { useAuth } from '../../hooks/useAuth.jsx';

export default function DoAssignmentModal({ isOpen, onClose, assignment, onSubmitted }) {
  const { user } = useAuth();
  const isParent = user?.role === 'PARENT';
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const mySubmission = assignment?.my_submission;
  const isPastDue = assignment?.due_date && new Date() > new Date(assignment.due_date);
  const isBlockedByLate = isPastDue && !assignment?.allow_late_submission;
  const isBlockedByGraded = Boolean(assignment?.results_published_at || mySubmission?.status === 'GRADED');
  const isBlockedByResubmit = mySubmission && !assignment?.allow_resubmission;
  const canSubmit = !isParent && !isBlockedByLate && !isBlockedByGraded && !isBlockedByResubmit;

  const autoSaveKey = assignment?._id ? `draft_assignment_${assignment._id}_${user?._id || user?.id || 'guest'}` : null;

  const resetForm = () => {
    setResult(null);
    setError('');
    // Pre-fill answers from previous submission if any, otherwise load from localStorage (Case 6.2)
    const initialAnswers = {};
    if (mySubmission?.answers) {
      mySubmission.answers.forEach((ans) => {
        initialAnswers[ans.question_id] = ans.text_response || '';
      });
    } else if (autoSaveKey) {
      try {
        const saved = localStorage.getItem(autoSaveKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed === 'object') {
            Object.assign(initialAnswers, parsed);
          }
        }
      } catch {
        // ignore storage parse errors
      }
    }
    setAnswers(initialAnswers);
  };

  useEffect(() => {
    if (isOpen && assignment) {
      resetForm();
    }
  }, [isOpen, assignment, mySubmission]);

  if (!isOpen || !assignment) return null;

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleAnswerChange = (questionId, value) => {
    setAnswers((prev) => {
      const updated = {
        ...prev,
        [questionId]: value,
      };
      if (autoSaveKey && !mySubmission) {
        try {
          localStorage.setItem(autoSaveKey, JSON.stringify(updated));
        } catch {
          // ignore storage quota errors
        }
      }
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!canSubmit) {
      return setError('Không thể nộp bài tập do chính sách thời hạn hoặc số lần nộp');
    }

    // Case 6.6 & 6.7: Kiểm tra định dạng tệp và dung lượng
    const DISALLOWED_EXTENSIONS = ['.exe', '.bat', '.cmd', '.sh', '.bin', '.msi', '.com'];
    for (const q of assignment.questions || []) {
      if (q.question_type === 'FILE_UPLOAD') {
        const fileVal = answers[q._id];
        if (fileVal && typeof fileVal === 'string') {
          const lower = fileVal.trim().toLowerCase();
          if (DISALLOWED_EXTENSIONS.some((ext) => lower.endsWith(ext) || lower.includes(`${ext}?`))) {
            setError('Tệp đính kèm không hợp lệ. Hệ thống không cho phép tải lên tệp thực thi (.exe, .bat, ...)');
            return;
          }
        }
      }
    }

    const formattedAnswers = (assignment.questions || []).map((q) => ({
      question_id: q._id,
      text_response: answers[q._id] || '',
    }));

    try {
      setSubmitting(true);
      setError('');
      const res = await submitAssignment(assignment._id, formattedAnswers);
      setResult(res?.data || null);

      // Case 6.2: Xóa draft khỏi localStorage sau khi nộp thành công
      if (autoSaveKey) {
        try {
          localStorage.removeItem(autoSaveKey);
        } catch {
          // ignore
        }
      }

      toast.success('Nộp bài tập thành công!');
      if (onSubmitted) {
        onSubmitted();
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || 'Không thể nộp bài tập');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" style={{ maxWidth: '720px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isParent ? (
              <>
                <Eye size={20} color="var(--color-info)" />
                <span>Xem đề bài tập: {assignment.title}</span>
              </>
            ) : (
              <>
                <PenTool size={20} color="var(--color-primary-strong)" />
                <span>Làm bài tập: {assignment.title}</span>
              </>
            )}
          </h2>
          <button type="button" className="modal-close-btn" onClick={handleClose}>
            <X size={18} />
          </button>
        </div>

        {result ? (
          <div className="modal-body">
            <div className="success-container" style={{ textAlign: 'center', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
                <CheckCircle2 size={48} color="var(--color-success)" />
              </div>
              <h3 style={{ margin: '0 0 8px 0', color: 'var(--color-text)' }}>Đã nộp bài tập thành công!</h3>
              <p style={{ color: 'var(--color-text-muted)', margin: '0 0 20px 0' }}>Hệ thống đã ghi nhận bài làm của bạn.</p>

              <div
                style={{
                  background: 'var(--color-surface-subtle)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '12px',
                  padding: '20px',
                  textAlign: 'left',
                  margin: '0 auto',
                  maxWidth: '440px',
                }}
              >
                <div style={{ marginBottom: '8px' }}>
                  <strong>Điểm tự động (Trắc nghiệm):</strong>{' '}
                  <span style={{ fontSize: '18px', color: 'var(--color-success)', fontWeight: 700 }}>
                    {result.provisional_score || 0} / {assignment.total_points} điểm
                  </span>
                </div>
                <div style={{ marginBottom: '8px', fontSize: '14px', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>Trạng thái:</span>
                  {result.timeliness === 'LATE' ? (
                    <span style={{ color: 'var(--color-warning)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <AlertTriangle size={14} /> Nộp muộn
                    </span>
                  ) : (
                    <span style={{ color: 'var(--color-success)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle2 size={14} /> Đúng hạn
                    </span>
                  )}{' '}
                  <span>(Lần nộp #{result.attempt_number || 1})</span>
                </div>
                <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                  Gia sư sẽ chấm các câu tự luận / file và công bố điểm chính thức sớm nhất.
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn-primary-orange" onClick={handleClose}>
                Hoàn tất
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              {error && (
                <div className="error-alert">
                  <AlertTriangle size={16} />
                  <div>{error}</div>
                </div>
              )}

              {/* Thông báo chế độ xem của Phụ huynh */}
              {isParent && (
                <div
                  style={{
                    marginBottom: '16px',
                    padding: '12px 16px',
                    background: 'var(--color-info-soft)',
                    border: '1px solid #bfdbfe',
                    borderRadius: '10px',
                    color: 'var(--color-info)',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  <Users size={22} />
                  <div>
                    <strong>Chế độ giám sát của Phụ huynh:</strong> Bạn đang xem đề bài
                    {mySubmission ? ` và bài làm của con (${mySubmission.student_user_id?.full_name || 'Học sinh'})` : ''}.
                    Chỉ học sinh mới có quyền thực hiện và nộp bài tập.
                  </div>
                </div>
              )}

              {/* Deadline & Warning Notices */}
              {isBlockedByGraded && !isParent && (
                <div
                  style={{
                    background: 'var(--color-warning-soft)',
                    border: '1px solid #fde68a',
                    color: 'var(--color-warning)',
                    padding: '12px',
                    borderRadius: '8px',
                    marginBottom: '14px',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <Lock size={15} />
                  <div>
                    <strong>Lưu ý:</strong> Bài tập này đã được gia sư công bố điểm cho cả lớp. Không được nộp lại sau khi đã công bố điểm.
                  </div>
                </div>
              )}

              {isBlockedByLate && !isBlockedByGraded && !isParent && (
                <div
                  style={{
                    background: 'var(--color-error-soft)',
                    border: '1px solid #fca5a5',
                    color: 'var(--color-error)',
                    padding: '12px',
                    borderRadius: '8px',
                    marginBottom: '14px',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <AlertCircle size={15} />
                  <div>Bài tập này đã hết hạn nộp lúc {new Date(assignment.due_date).toLocaleString('vi-VN')} và không cho phép nộp trễ.</div>
                </div>
              )}

              {isBlockedByResubmit && !isParent && (
                <div
                  style={{
                    background: 'var(--color-info-soft)',
                    border: '1px solid #bfdbfe',
                    color: 'var(--color-info)',
                    padding: '12px',
                    borderRadius: '8px',
                    marginBottom: '14px',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <Info size={15} />
                  <div>Bạn đã nộp bài tập này (Lần #{mySubmission.attempt_number}). Gia sư không kích hoạt chính sách cho phép nộp lại.</div>
                </div>
              )}

              {mySubmission && (
                <div
                  style={{
                    background: 'var(--color-surface-subtle)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    marginBottom: '16px',
                    fontSize: '13px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, color: 'var(--color-text)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <ClipboardList size={14} />
                      {isParent
                        ? `Bài nộp của con (${mySubmission.student_user_id?.full_name || 'Học sinh'}): Lần #${mySubmission.attempt_number}`
                        : `Lịch sử nộp trước: Lần #${mySubmission.attempt_number}`}{' '}
                      (Nộp lúc {new Date(mySubmission.submitted_at).toLocaleString('vi-VN')})
                    </span>
                    <span
                      style={{
                        color: mySubmission.status === 'GRADED' ? 'var(--color-success)' : 'var(--color-primary-strong)',
                        fontWeight: 600,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      {mySubmission.status === 'GRADED' ? (
                        <>
                          <Award size={14} />
                          <span>Điểm chính thức: {mySubmission.final_score}/{assignment.total_points}đ</span>
                        </>
                      ) : (
                        `Điểm tạm tính: ${mySubmission.provisional_score || 0}đ (Đang chờ chấm)`
                      )}
                    </span>
                  </div>
                  {mySubmission.overall_feedback && (
                    <div style={{ marginTop: '8px', padding: '8px', background: 'var(--color-surface)', borderRadius: '6px', borderLeft: '3px solid var(--color-info)' }}>
                      <strong>Nhận xét của gia sư:</strong> {mySubmission.overall_feedback}
                    </div>
                  )}
                </div>
              )}

              {assignment.instructions && (
                <div
                  style={{
                    background: 'var(--color-info-soft)',
                    border: '1px solid #bfdbfe',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    marginBottom: '16px',
                    fontSize: '14px',
                    color: 'var(--color-info)',
                  }}
                >
                  <strong>Hướng dẫn:</strong> {assignment.instructions}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {(assignment.questions || []).map((q, idx) => (
                  <div
                    key={q._id || idx}
                    style={{
                      background: 'var(--color-surface-subtle)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '12px',
                      padding: '16px',
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--color-text)', marginBottom: '10px' }}>
                      Câu {idx + 1}: {q.content}{' '}
                      <span style={{ fontWeight: 400, color: 'var(--color-text-muted)', fontSize: '13px' }}>
                        ({q.points || 1} điểm - {q.question_type === 'MULTIPLE_CHOICE' ? 'Trắc nghiệm' : q.question_type === 'SHORT_ANSWER' ? 'Tự luận ngắn' : 'Nộp tệp/link'})
                      </span>
                    </div>

                    {/* Trắc nghiệm (MULTIPLE_CHOICE) */}
                    {q.question_type === 'MULTIPLE_CHOICE' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {['A', 'B', 'C', 'D'].map((letter, optIdx) => {
                          const optText = q.options?.[optIdx];
                          if (!optText) return null;
                          const isSelected = answers[q._id] === letter;

                          return (
                            <label
                              key={letter}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                padding: '10px 14px',
                                borderRadius: '8px',
                                border: `1px solid ${isSelected ? 'var(--color-primary-strong)' : 'var(--color-control-border)'}`,
                                background: isSelected ? 'var(--color-primary-soft)' : 'var(--color-white)',
                                cursor: canSubmit ? 'pointer' : 'default',
                                transition: 'all 0.15s',
                              }}
                            >
                              <input
                                type="radio"
                                name={`q_${q._id}`}
                                checked={isSelected}
                                disabled={!canSubmit}
                                onChange={() => handleAnswerChange(q._id, letter)}
                                style={{ accentColor: 'var(--color-primary-strong)' }}
                              />
                              <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>{letter}.</span>
                              <span style={{ color: 'var(--color-text)' }}>{optText}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}

                    {/* Tự luận ngắn (SHORT_ANSWER) */}
                    {q.question_type === 'SHORT_ANSWER' && (
                      <div>
                        <textarea
                          rows={3}
                          placeholder="Nhập câu trả lời của bạn..."
                          value={answers[q._id] || ''}
                          onChange={(e) => handleAnswerChange(q._id, e.target.value)}
                          disabled={!canSubmit}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            borderRadius: '8px',
                            border: '1px solid var(--color-control-border)',
                            fontSize: '14px',
                            background: 'var(--color-surface)',
                          }}
                        />
                      </div>
                    )}

                    {/* Nộp tệp / đính kèm URL (FILE_UPLOAD) */}
                    {q.question_type === 'FILE_UPLOAD' && (
                      <div>
                        <input
                          type="text"
                          placeholder="Dán liên kết tệp nộp bài (Google Drive, Figma, GitHub, Dropbox...)"
                          value={answers[q._id] || ''}
                          onChange={(e) => handleAnswerChange(q._id, e.target.value)}
                          disabled={!canSubmit}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            borderRadius: '8px',
                            border: '1px solid var(--color-control-border)',
                            fontSize: '14px',
                            background: 'var(--color-surface)',
                          }}
                        />
                        <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Info size={13} color="var(--color-info)" />
                          <span>Hỗ trợ tệp tài liệu, hình ảnh, mã nguồn (tối đa 20MB). Không chấp nhận tệp thực thi (.exe, .bat, ...). Hãy đảm bảo liên kết ở chế độ công khai để gia sư chấm bài.</span>
                        </div>
                      </div>
                    )}

                    {/* Case 6.10: Hiển thị đáp án chính thức khi gia sư đã công bố kết quả */}
                    {assignment.results_published_at && q.correct_answer && (
                      <div
                        style={{
                          marginTop: '12px',
                          padding: '8px 12px',
                          background: 'var(--color-success-soft)',
                          border: '1px solid #bbf7d0',
                          borderRadius: '8px',
                          fontSize: '13px',
                          color: 'var(--color-success)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <CheckCircle2 size={15} color="var(--color-success)" />
                        <span><strong>Đáp án chuẩn của gia sư:</strong> {q.correct_answer}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn-outline-gray" onClick={handleClose} disabled={submitting}>
                Đóng
              </button>
              {canSubmit && (
                <button
                  type="submit"
                  className="btn-primary-orange"
                  disabled={submitting}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  {submitting ? (
                    <>
                      <Loader2 size={15} className="spin" />
                      <span>Đang nộp...</span>
                    </>
                  ) : mySubmission ? (
                    <>
                      <RotateCcw size={15} />
                      <span>Nộp lại bài tập</span>
                    </>
                  ) : (
                    <>
                      <Send size={15} />
                      <span>Nộp bài tập</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
