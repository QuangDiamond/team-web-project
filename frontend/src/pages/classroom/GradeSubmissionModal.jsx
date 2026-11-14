import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import {
  BarChart3,
  X,
  AlertTriangle,
  Loader2,
  FileText,
  CheckCircle2,
  ExternalLink,
  Award,
  Send,
  Share2,
} from 'lucide-react';
import { getSubmissionsForAssignment, gradeSubmission, publishAssignmentResults } from '../../services/classroomService';
import { getAttachmentUrl } from '../../utils/fileUrl';

export default function GradeSubmissionModal({ isOpen, onClose, assignment, onGraded }) {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSub, setSelectedSub] = useState(null);
  const [finalScore, setFinalScore] = useState('');
  const [feedback, setFeedback] = useState('');
  const [answersFeedback, setAnswersFeedback] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const initAnswersFb = (sub) => {
    const map = {};
    (sub?.answers || []).forEach((a) => {
      const qId = a.question_id?.toString() || a.question_id;
      map[qId] = {
        score: a.score !== null && a.score !== undefined ? a.score : 0,
        comment: a.comment || '',
        is_overridden: Boolean(a.is_overridden),
      };
    });
    setAnswersFeedback(map);
  };

  useEffect(() => {
    if (isOpen && assignment?._id) {
      const fetchSubmissions = async () => {
        try {
          setLoading(true);
          setError('');
          const res = await getSubmissionsForAssignment(assignment._id);
          const list = res?.data || [];
          setSubmissions(list);
          if (list.length > 0) {
            setSelectedSub(list[0]);
            setFinalScore(
              list[0].final_score !== null && list[0].final_score !== undefined
                ? list[0].final_score
                : list[0].provisional_score || 0
            );
            setFeedback(list[0].overall_feedback || '');
            initAnswersFb(list[0]);
          } else {
            setSelectedSub(null);
            setAnswersFeedback({});
          }
        } catch (err) {
          setError(err?.response?.data?.message || err.message || 'Không thể tải danh sách bài nộp');
        } finally {
          setLoading(false);
        }
      };
      fetchSubmissions();
    }
  }, [isOpen, assignment]);

  if (!isOpen || !assignment) return null;

  const handleClose = () => {
    setError('');
    onClose();
  };

  const handleSelectSub = (sub) => {
    setSelectedSub(sub);
    setFinalScore(
      sub.final_score !== null && sub.final_score !== undefined
        ? sub.final_score
        : sub.provisional_score || 0
    );
    setFeedback(sub.overall_feedback || '');
    initAnswersFb(sub);
    setError('');
  };

  const handleAnswerFeedbackChange = (questionId, field, value, isAutoGraded = false) => {
    const qId = questionId?.toString() || questionId;
    setAnswersFeedback((prev) => {
      const curr = prev[qId] || { score: 0, comment: '', is_overridden: false };
      const updated = { ...curr, [field]: value };
      if (field === 'score' && isAutoGraded) {
        updated.is_overridden = true;
      }
      return { ...prev, [qId]: updated };
    });
  };

  const handleGrade = async (e) => {
    e.preventDefault();
    if (!selectedSub) return;

    try {
      setSubmitting(true);
      setError('');

      const answersFbPayload = Object.entries(answersFeedback).map(([qId, fb]) => ({
        question_id: qId,
        score: parseFloat(fb.score) || 0,
        comment: (fb.comment || '').trim(),
      }));

      const res = await gradeSubmission(selectedSub._id, {
        final_score: parseFloat(finalScore) || 0,
        overall_feedback: feedback.trim(),
        answers_feedback: answersFbPayload,
      });

      toast.success('Chấm điểm bài nộp thành công! Đã gửi thông báo cho học viên và phụ huynh liên kết.');
      // Cập nhật lại list
      setSubmissions((prev) =>
        prev.map((s) => (s._id === selectedSub._id ? { ...s, ...res.data } : s))
      );
      setSelectedSub((prev) => ({ ...prev, ...res.data }));
      if (onGraded) onGraded();
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || 'Lỗi khi lưu điểm');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePublishAllResults = async () => {
    try {
      setSubmitting(true);
      setError('');
      await publishAssignmentResults(assignment._id);
      toast.success('Công bố kết quả bài tập cho cả lớp thành công! Toàn bộ học sinh và phụ huynh đã nhận được thông báo.');
      if (onGraded) onGraded();
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || 'Lỗi khi công bố kết quả');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" style={{ maxWidth: '840px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart3 size={20} color="var(--color-primary-strong)" />
            <span>Chấm điểm bài tập: {assignment.title}</span>
          </h2>
          <button type="button" className="modal-close-btn" onClick={handleClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
          {error && (
            <div className="error-alert">
              <AlertTriangle size={16} />
              <div>{error}</div>
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <Loader2 size={18} className="spin" />
              <span>Đang tải bài làm của học sinh...</span>
            </div>
          ) : submissions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <FileText size={18} />
              <span>Chưa có học sinh nào nộp bài tập này.</span>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '20px' }}>
              {/* Danh sách học sinh nộp */}
              <div style={{ borderRight: '1px solid var(--color-border)', paddingRight: '16px' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                  Danh sách nộp bài ({submissions.length})
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {submissions.map((sub) => {
                    const studentName = sub.student_user_id?.full_name || sub.student_user_id?.email || 'Học sinh';
                    const isSelected = selectedSub?._id === sub._id;
                    const isGraded = sub.status === 'GRADED';

                    return (
                      <div
                        key={sub._id}
                        onClick={() => handleSelectSub(sub)}
                        style={{
                          padding: '10px 12px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          background: isSelected ? 'var(--color-primary-soft)' : 'var(--color-white)',
                          border: `1px solid ${isSelected ? 'var(--color-primary-strong)' : 'var(--color-border)'}`,
                          transition: 'all 0.15s',
                        }}
                      >
                        <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--color-text)' }}>{studentName}</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            {isGraded ? (
                              <>
                                <Award size={13} color="var(--color-success)" /> {sub.final_score}đ
                              </>
                            ) : (
                              `Tạm: ${sub.provisional_score || 0}đ`
                            )}
                          </span>
                          <span style={{ color: isGraded ? 'var(--color-success)' : 'var(--color-primary-strong)', fontWeight: isGraded ? 600 : 400 }}>
                            {isGraded ? 'Đã công bố' : 'Chờ chấm'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Chi tiết bài làm & Form chấm điểm */}
              {selectedSub && (
                <div>
                  <div style={{ marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--color-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', color: 'var(--color-text)' }}>
                        {selectedSub.student_user_id?.full_name || selectedSub.student_user_id?.email}
                      </h3>
                      <span
                        style={{
                          fontSize: '12px',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background: selectedSub.timeliness === 'LATE' ? 'var(--color-error-soft)' : 'var(--color-success-soft)',
                          color: selectedSub.timeliness === 'LATE' ? 'var(--color-error)' : 'var(--color-success)',
                          fontWeight: 600,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        {selectedSub.timeliness === 'LATE' ? (
                          <>
                            <AlertTriangle size={13} /> Nộp muộn
                          </>
                        ) : (
                          <>
                            <CheckCircle2 size={13} /> Đúng hạn
                          </>
                        )}
                      </span>
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                      Nộp lúc: {new Date(selectedSub.submitted_at).toLocaleString('vi-VN')} (Lần nộp #{selectedSub.attempt_number || 1})
                    </div>
                  </div>

                  {/* Câu trả lời của học sinh */}
                  <div style={{ marginBottom: '20px' }}>
                    <h4 style={{ margin: '0 0 10px 0', fontSize: '15px', color: 'var(--color-text)' }}>
                      Chi tiết bài làm của học sinh:
                    </h4>
                    {selectedSub.answers?.map((ans, idx) => {
                      const questionInfo = (assignment.questions || []).find(
                        (q) => q._id?.toString() === ans.question_id?.toString()
                      ) || assignment.questions?.[idx];

                      const isUrl =
                        ans.text_response &&
                        (ans.text_response.startsWith('http://') ||
                          ans.text_response.startsWith('https://') ||
                          ans.text_response.startsWith('drive.google.com') ||
                          ans.text_response.startsWith('docs.google.com'));

                      return (
                        <div
                          key={ans.question_id || idx}
                          style={{
                            background: 'var(--color-surface-subtle)',
                            border: '1px solid var(--color-border)',
                            padding: '12px',
                            borderRadius: '8px',
                            marginBottom: '10px',
                            fontSize: '14px',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>
                              Câu {idx + 1}: {questionInfo?.content || `Câu hỏi ${idx + 1}`}
                            </span>
                            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                              ({questionInfo?.points || 1}đ)
                            </span>
                          </div>

                          <div style={{ marginTop: '8px' }}>
                            {/* Dạng 1: Trắc nghiệm (MULTIPLE_CHOICE) */}
                            {questionInfo?.question_type === 'MULTIPLE_CHOICE' ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', fontSize: '13px' }}>
                                  <span style={{ color: 'var(--color-text-muted)' }}>Học sinh chọn:</span>
                                  <span
                                    style={{
                                      fontWeight: 700,
                                      color:
                                        (ans.text_response || '').trim().toUpperCase() ===
                                        (questionInfo.correct_answer || '').trim().toUpperCase()
                                          ? '#16a34a'
                                          : '#dc2626',
                                    }}
                                  >
                                    Phương án {ans.text_response || '(Chưa chọn)'}
                                  </span>
                                  {ans.is_auto_graded && (
                                    <span style={{ fontSize: '12px', color: 'var(--color-success)', fontWeight: 600 }}>
                                      (Trắc nghiệm tự chấm: +{ans.score || 0}đ)
                                    </span>
                                  )}
                                </div>

                                {/* Chi tiết 4 phương án A, B, C, D và đối chiếu đáp án */}
                                {Array.isArray(questionInfo.options) && questionInfo.options.length > 0 && (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
                                    {['A', 'B', 'C', 'D'].map((letter, optIdx) => {
                                      const rawOption = questionInfo.options[optIdx];
                                      if (rawOption === undefined || rawOption === null) return null;
                                      const optText = String(rawOption).trim();
                                      const cleanText =
                                        optText.startsWith(`${letter}.`) || optText.startsWith(`${letter}:`)
                                          ? optText.slice(2).trim()
                                          : optText;

                                      const studentChoice = (ans.text_response || '').trim().toUpperCase();
                                      const correctAns = (questionInfo.correct_answer || '').trim().toUpperCase();

                                      const isChosen = studentChoice === letter || studentChoice.startsWith(letter);
                                      const isCorrect = correctAns === letter || correctAns.startsWith(letter);

                                      let itemBg = '#ffffff';
                                      let itemBorder = '#e2e8f0';
                                      let badge = null;

                                      if (isCorrect && isChosen) {
                                        itemBg = '#f0fdf4';
                                        itemBorder = '#86efac';
                                        badge = (
                                          <span
                                            style={{
                                              fontSize: '11px',
                                              background: 'var(--color-success)',
                                              color: 'var(--color-white)',
                                              padding: '2px 8px',
                                              borderRadius: '10px',
                                              fontWeight: 600,
                                              display: 'inline-flex',
                                              alignItems: 'center',
                                              gap: '3px',
                                            }}
                                          >
                                            <CheckCircle2 size={12} /> Học sinh chọn đúng
                                          </span>
                                        );
                                      } else if (isChosen && !isCorrect) {
                                        itemBg = '#fef2f2';
                                        itemBorder = '#fca5a5';
                                        badge = (
                                          <span
                                            style={{
                                              fontSize: '11px',
                                              background: 'var(--color-error)',
                                              color: 'var(--color-white)',
                                              padding: '2px 8px',
                                              borderRadius: '10px',
                                              fontWeight: 600,
                                            }}
                                          >
                                            Học sinh đã chọn (Sai)
                                          </span>
                                        );
                                      } else if (isCorrect) {
                                        itemBg = '#eff6ff';
                                        itemBorder = '#93c5fd';
                                        badge = (
                                          <span
                                            style={{
                                              fontSize: '11px',
                                              background: 'var(--color-info)',
                                              color: 'var(--color-white)',
                                              padding: '2px 8px',
                                              borderRadius: '10px',
                                              fontWeight: 600,
                                              display: 'inline-flex',
                                              alignItems: 'center',
                                              gap: '3px',
                                            }}
                                          >
                                            <CheckCircle2 size={12} /> Đáp án đúng của đề
                                          </span>
                                        );
                                      }

                                      return (
                                        <div
                                          key={letter}
                                          style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: '7px 12px',
                                            borderRadius: '6px',
                                            background: itemBg,
                                            border: `1px solid ${itemBorder}`,
                                            fontSize: '13px',
                                            gap: '8px',
                                          }}
                                        >
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                                            <span
                                              style={{
                                                fontWeight: 700,
                                                minWidth: '18px',
                                                color: isCorrect ? 'var(--color-success)' : isChosen ? 'var(--color-error)' : 'var(--color-text-muted)',
                                              }}
                                            >
                                              {letter}.
                                            </span>
                                            <span style={{ color: isCorrect ? 'var(--color-success)' : 'var(--color-text)', fontWeight: isCorrect || isChosen ? 500 : 400 }}>
                                              {cleanText}
                                            </span>
                                          </div>
                                          {badge}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            ) : null}

                            {/* Dạng 2: Tự luận ngắn (SHORT_ANSWER) */}
                            {questionInfo?.question_type === 'SHORT_ANSWER' ? (
                              <div>
                                <div style={{ padding: '10px 12px', background: 'var(--color-surface)', border: '1px solid var(--color-control-border)', borderRadius: '6px' }}>
                                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                                    Câu trả lời của học sinh:
                                  </div>
                                  <div style={{ fontWeight: 600, color: 'var(--color-text)', whiteSpace: 'pre-wrap', fontSize: '14px' }}>
                                    {ans.text_response || '(Không trả lời)'}
                                  </div>
                                </div>

                                {questionInfo.correct_answer && (
                                  <div
                                    style={{
                                      marginTop: '8px',
                                      padding: '10px 12px',
                                      background: 'var(--color-success-soft)',
                                      border: '1px solid #bbf7d0',
                                      borderRadius: '6px',
                                    }}
                                  >
                                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                                      <CheckCircle2 size={13} />
                                      <span>Đáp án chuẩn / Gợi ý chấm điểm (Đối chiếu):</span>
                                    </div>
                                    <div style={{ fontSize: '13px', color: 'var(--color-success)', whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>
                                      {questionInfo.correct_answer}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : null}

                            {/* Dạng 3: Nộp tệp / Tự luận dài (FILE_UPLOAD) */}
                            {questionInfo?.question_type === 'FILE_UPLOAD' ? (
                              <div>
                                {ans.file_url ? (
                                  <div style={{ padding: '10px 12px', background: 'var(--color-surface)', border: '1px solid var(--color-control-border)', borderRadius: '6px' }}>
                                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '6px' }}>
                                      Tệp bài làm đính kèm của học sinh:
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                      <a
                                        href={getAttachmentUrl(ans.file_url)}
                                        target="_blank"
                                        rel="noreferrer"
                                        style={{
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '6px',
                                          fontSize: '13px',
                                          padding: '7px 14px',
                                          textDecoration: 'none',
                                          color: 'var(--color-primary-strong)',
                                          borderColor: '#fdba74',
                                          background: 'var(--color-primary-soft)',
                                          border: '1px solid #fdba74',
                                          borderRadius: '6px',
                                          fontWeight: 600,
                                        }}
                                      >
                                        <FileText size={15} />
                                        <span>Mở tệp bài làm của học sinh</span>
                                        <ExternalLink size={13} />
                                      </a>
                                      {ans.file_size && (
                                        <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                                          ({(ans.file_size / (1024 * 1024)).toFixed(2)} MB)
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                ) : ans.text_response ? (
                                  <div style={{ padding: '10px 12px', background: 'var(--color-surface)', border: '1px solid var(--color-control-border)', borderRadius: '6px' }}>
                                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                                      Bài làm / Đường dẫn nộp bài:
                                    </div>
                                    {isUrl ? (
                                      <a
                                        href={ans.text_response.startsWith('http') ? ans.text_response : `https://${ans.text_response}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        style={{
                                          color: 'var(--color-info)',
                                          textDecoration: 'underline',
                                          fontWeight: 600,
                                          wordBreak: 'break-all',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '4px',
                                          fontSize: '14px',
                                        }}
                                      >
                                        <ExternalLink size={13} />
                                        <span>{ans.text_response}</span>
                                      </a>
                                    ) : (
                                      <span style={{ fontWeight: 600, color: 'var(--color-text)', whiteSpace: 'pre-wrap', fontSize: '14px' }}>
                                        {ans.text_response}
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', fontStyle: 'italic', padding: '6px 0' }}>
                                    (Học sinh không đính kèm tệp bài làm)
                                  </div>
                                )}

                                {questionInfo.correct_answer && (
                                  <div
                                    style={{
                                      marginTop: '8px',
                                      padding: '10px 12px',
                                      background: 'var(--color-info-soft)',
                                      border: '1px solid #bfdbfe',
                                      borderRadius: '6px',
                                    }}
                                  >
                                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-info)', marginBottom: '4px' }}>
                                      Gợi ý / Tiêu chí chấm điểm (Đối chiếu):
                                    </div>
                                    <div style={{ fontSize: '13px', color: 'var(--color-info)', whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>
                                      {questionInfo.correct_answer}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : null}
                          </div>

                          {/* Case 5.8, 5.9: Sửa/Override điểm câu hỏi kèm comment */}
                          <div style={{ marginTop: '10px', padding: '8px 12px', background: 'var(--color-surface)', borderRadius: '6px', border: '1px solid var(--color-control-border)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text)' }}>
                                  {ans.is_auto_graded ? 'Điểm câu (MCQ tự chấm):' : 'Điểm câu hỏi:'}
                                </label>
                                <input
                                  type="number"
                                  step="0.25"
                                  min="0"
                                  max={questionInfo?.points || 10}
                                  value={answersFeedback[ans.question_id]?.score ?? ans.score ?? 0}
                                  onChange={(e) => handleAnswerFeedbackChange(ans.question_id, 'score', e.target.value, ans.is_auto_graded)}
                                  style={{ width: '65px', padding: '3px 6px', fontSize: '13px', borderRadius: '4px', border: '1px solid var(--color-control-border)', fontWeight: 600 }}
                                />
                                <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>/ {questionInfo?.points || 1}đ</span>
                              </div>

                              {(answersFeedback[ans.question_id]?.is_overridden || ans.is_overridden) && (
                                <span style={{ fontSize: '11px', background: '#e0e7ff', color: '#3730a3', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>
                                  Đã override điểm
                                </span>
                              )}
                            </div>

                            <input
                              type="text"
                              placeholder="Nhận xét riêng cho câu này (hoặc lý do sửa/override điểm)..."
                              value={answersFeedback[ans.question_id]?.comment ?? ans.comment ?? ''}
                              onChange={(e) => handleAnswerFeedbackChange(ans.question_id, 'comment', e.target.value)}
                              style={{ width: '100%', padding: '4px 8px', fontSize: '12px', borderRadius: '4px', border: '1px solid var(--color-control-border)' }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Form chấm điểm */}
                  <form onSubmit={handleGrade} style={{ background: 'var(--color-primary-soft)', padding: '16px', borderRadius: '10px', border: '1px solid #fed7aa' }}>
                    <h4 style={{ margin: '0 0 12px 0', color: 'var(--color-primary-strong)', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Award size={16} />
                      <span>Nhập điểm & Nhận xét của gia sư:</span>
                    </h4>

                    <div className="form-group" style={{ marginBottom: '12px' }}>
                      <label style={{ fontSize: '13px', fontWeight: 600 }}>
                        Tổng điểm chính thức (Tối đa {assignment.total_points || 10} điểm):
                      </label>
                      <input
                        type="number"
                        step="0.25"
                        min="0"
                        max={assignment.total_points || 10}
                        value={finalScore}
                        onChange={(e) => setFinalScore(e.target.value)}
                        required
                        style={{ width: '130px', padding: '8px', fontSize: '15px', fontWeight: 600 }}
                      />
                    </div>

                    <div className="form-group" style={{ marginBottom: '14px' }}>
                      <label style={{ fontSize: '13px', fontWeight: 600 }}>
                        Nhận xét & Hướng dẫn học sinh (sẽ gửi cho cả Phụ huynh):
                      </label>
                      <textarea
                        rows={3}
                        placeholder="VD: Bài làm tốt, câu 2 trình bày rõ ràng, cần ôn tập thêm dạng toán câu 3..."
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        style={{ width: '100%', padding: '8px 10px', fontSize: '13px' }}
                      />
                    </div>

                    <button
                      type="submit"
                      className="btn-primary-orange"
                      disabled={submitting}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      {submitting ? (
                        <>
                          <Loader2 size={15} className="spin" />
                          <span>Đang lưu & công bố...</span>
                        </>
                      ) : (
                        <>
                          <Send size={15} />
                          <span>Công bố điểm cho Học sinh & Phụ huynh</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            {assignment && !assignment.results_published_at && (
              <button
                type="button"
                className="btn-outline-gray"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--color-info)' }}
                onClick={handlePublishAllResults}
                disabled={submitting}
              >
                <Share2 size={14} />
                <span>Công bố kết quả cho toàn bộ lớp</span>
              </button>
            )}
          </div>
          <button type="button" className="btn-outline-gray" onClick={handleClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
