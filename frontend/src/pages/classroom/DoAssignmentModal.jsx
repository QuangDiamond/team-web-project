import { useState, useEffect } from 'react';
import { submitAssignment } from '../../services/classroomService';
import { useAuth } from '../../hooks/useAuth.jsx';

export default function DoAssignmentModal({ isOpen, onClose, assignment, onSubmitted, showToast }) {
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

  const resetForm = () => {
    setResult(null);
    setError('');
    // Pre-fill answers from previous submission if any
    const initialAnswers = {};
    if (mySubmission?.answers) {
      mySubmission.answers.forEach((ans) => {
        initialAnswers[ans.question_id] = ans.text_response || '';
      });
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
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!canSubmit) {
      return setError('Không thể nộp bài tập do chính sách thời hạn hoặc số lần nộp');
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
      if (showToast) {
        showToast('Nộp bài tập thành công!');
      }
      if (onSubmitted) {
        onSubmitted();
      }
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Không thể nộp bài tập');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" style={{ maxWidth: '720px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            {isParent ? (
              <>
                <span>👁️</span> Xem đề bài tập: {assignment.title}
              </>
            ) : (
              <>
                <span>✍️</span> Làm bài tập: {assignment.title}
              </>
            )}
          </h2>
          <button type="button" className="modal-close-btn" onClick={handleClose}>
            ×
          </button>
        </div>

        {result ? (
          <div className="modal-body">
            <div className="success-container" style={{ textAlign: 'center', padding: '20px' }}>
              <div className="success-icon-badge" style={{ fontSize: '48px', marginBottom: '12px' }}>🎉</div>
              <h3 style={{ margin: '0 0 8px 0', color: '#0f172a' }}>Đã nộp bài tập thành công!</h3>
              <p style={{ color: '#64748b', margin: '0 0 20px 0' }}>Hệ thống đã ghi nhận bài làm của bạn.</p>

              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '20px',
                  textAlign: 'left',
                  margin: '0 auto',
                  maxWidth: '440px',
                }}
              >
                <div style={{ marginBottom: '8px' }}>
                  <strong>Điểm tự động (Trắc nghiệm):</strong>{' '}
                  <span style={{ fontSize: '18px', color: '#16a34a', fontWeight: 700 }}>
                    {result.provisional_score || 0} / {assignment.total_points} điểm
                  </span>
                </div>
                <div style={{ marginBottom: '8px', fontSize: '14px', color: '#64748b' }}>
                  Trạng thái: {result.timeliness === 'LATE' ? '⚠️ Nộp muộn' : '✅ Đúng hạn'} (Lần nộp #{result.attempt_number || 1})
                </div>
                <div style={{ fontSize: '13px', color: '#64748b' }}>
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
                  <span>⚠️</span>
                  <div>{error}</div>
                </div>
              )}

              {/* Thông báo chế độ xem của Phụ huynh */}
              {isParent && (
                <div
                  style={{
                    marginBottom: '16px',
                    padding: '12px 16px',
                    background: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    borderRadius: '10px',
                    color: '#1d4ed8',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  <span style={{ fontSize: '22px' }}>👨‍👩‍👧</span>
                  <div>
                    <strong>Chế độ giám sát của Phụ huynh:</strong> Bạn đang xem đề bài
                    {mySubmission ? ` và bài làm của con (${mySubmission.student_user_id?.full_name || 'Học sinh'})` : ''}.
                    Chỉ học sinh mới có quyền thực hiện và nộp bài tập.
                  </div>
                </div>
              )}

              {/* Deadline & Warning Notices */}
              {isBlockedByGraded && !isParent && (
                <div style={{ background: '#fef3c7', border: '1px solid #fde68a', color: '#92400e', padding: '12px', borderRadius: '8px', marginBottom: '14px', fontSize: '13px' }}>
                  🔒 <strong>Lưu ý:</strong> Bài tập này đã được gia sư công bố điểm cho cả lớp. Không được nộp lại sau khi đã công bố điểm.
                </div>
              )}

              {isBlockedByLate && !isBlockedByGraded && !isParent && (
                <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#991b1b', padding: '12px', borderRadius: '8px', marginBottom: '14px', fontSize: '13px' }}>
                  ⛔ Bài tập này đã hết hạn nộp lúc {new Date(assignment.due_date).toLocaleString('vi-VN')} và không cho phép nộp trễ.
                </div>
              )}

              {isBlockedByResubmit && !isParent && (
                <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1e40af', padding: '12px', borderRadius: '8px', marginBottom: '14px', fontSize: '13px' }}>
                  ℹ️ Bạn đã nộp bài tập này (Lần #{mySubmission.attempt_number}). Gia sư không kích hoạt chính sách cho phép nộp lại.
                </div>
              )}

              {mySubmission && (
                <div
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    marginBottom: '16px',
                    fontSize: '13px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, color: '#334155' }}>
                      {isParent
                        ? `📋 Bài nộp của con (${mySubmission.student_user_id?.full_name || 'Học sinh'}): Lần #${mySubmission.attempt_number}`
                        : `📋 Lịch sử nộp trước: Lần #${mySubmission.attempt_number}`}{' '}
                      (Nộp lúc {new Date(mySubmission.submitted_at).toLocaleString('vi-VN')})
                    </span>
                    <span style={{ color: mySubmission.status === 'GRADED' ? '#16a34a' : '#e85a2c', fontWeight: 600 }}>
                      {mySubmission.status === 'GRADED'
                        ? `⭐ Điểm chính thức: ${mySubmission.final_score}/${assignment.total_points}đ`
                        : `Điểm tạm tính: ${mySubmission.provisional_score || 0}đ (Đang chờ chấm)`}
                    </span>
                  </div>
                  {mySubmission.overall_feedback && (
                    <div style={{ marginTop: '8px', padding: '8px', background: '#ffffff', borderRadius: '6px', borderLeft: '3px solid #0284c7' }}>
                      <strong>Nhận xét của gia sư:</strong> {mySubmission.overall_feedback}
                    </div>
                  )}
                </div>
              )}

              {assignment.instructions && (
                <div
                  style={{
                    background: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    marginBottom: '16px',
                    fontSize: '14px',
                    color: '#1e40af',
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
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      padding: '16px',
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '15px', color: '#0f172a', marginBottom: '10px' }}>
                      Câu {idx + 1}: {q.content}{' '}
                      <span style={{ fontWeight: 400, color: '#64748b', fontSize: '13px' }}>
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
                                border: `1px solid ${isSelected ? '#e85a2c' : '#cbd5e1'}`,
                                background: isSelected ? '#fff5f0' : '#ffffff',
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
                                style={{ accentColor: '#e85a2c' }}
                              />
                              <span style={{ fontWeight: 600, color: '#334155' }}>{letter}.</span>
                              <span style={{ color: '#0f172a' }}>{optText}</span>
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
                            border: '1px solid #cbd5e1',
                            fontSize: '14px',
                            background: '#ffffff',
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
                            border: '1px solid #cbd5e1',
                            fontSize: '14px',
                            background: '#ffffff',
                          }}
                        />
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                          💡 Hãy đảm bảo liên kết được đặt ở chế độ công khai (bất kỳ ai có liên kết đều có thể xem) để gia sư chấm điểm.
                        </div>
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
                <button type="submit" className="btn-primary-orange" disabled={submitting}>
                  {submitting ? 'Đang nộp...' : mySubmission ? '🔄 Nộp lại bài tập' : '🚀 Nộp bài tập'}
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
