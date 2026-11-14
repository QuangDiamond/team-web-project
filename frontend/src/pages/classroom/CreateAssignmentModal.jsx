import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Pencil,
  ClipboardList,
  AlertTriangle,
  Lock,
  Sparkles,
  Trash2,
  Save,
  Send,
  X,
  Plus,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { createAssignment, updateAssignment, generateAiQuestions } from '../../services/classroomService';

export default function CreateAssignmentModal({
  isOpen,
  onClose,
  classroomId,
  assignmentToEdit = null,
  classroomGrade = '',
  studentCount = 0,
  onAssignmentCreated,
}) {
  const isEditing = Boolean(assignmentToEdit);
  const isQuestionLocked = Boolean(assignmentToEdit?.results_published_at);

  const [title, setTitle] = useState('');
  const [instructions, setInstructions] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [totalPoints, setTotalPoints] = useState(10);
  const [allowLate, setAllowLate] = useState(true);
  const [allowResubmission, setAllowResubmission] = useState(true);
  const [status, setStatus] = useState('PUBLISHED');
  const [isAiGenerated, setIsAiGenerated] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [aiGrade, setAiGrade] = useState(classroomGrade || 'Lớp 10');
  const [aiDifficulty, setAiDifficulty] = useState('MEDIUM');
  const [aiNumQuestions, setAiNumQuestions] = useState(3);
  const [aiSimulateTimeout, setAiSimulateTimeout] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [showAiPrompt, setShowAiPrompt] = useState(false);

  const [questions, setQuestions] = useState([
    {
      question_type: 'MULTIPLE_CHOICE',
      content: '',
      options: ['', '', '', ''],
      correct_answer: 'A',
      points: 2,
    },
  ]);
  const [submitting, setSubmitting] = useState(false);

  const formatDateForInput = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const resetForm = () => {
    if (assignmentToEdit) {
      setTitle(assignmentToEdit.title || '');
      setInstructions(assignmentToEdit.instructions || '');
      setDueDate(formatDateForInput(assignmentToEdit.due_date));
      setTotalPoints(assignmentToEdit.total_points || 10);
      setAllowLate(assignmentToEdit.allow_late_submission !== false);
      setAllowResubmission(assignmentToEdit.allow_resubmission !== false);
      setStatus(assignmentToEdit.status || 'PUBLISHED');
      setIsAiGenerated(Boolean(assignmentToEdit.is_ai_generated));
      if (Array.isArray(assignmentToEdit.questions) && assignmentToEdit.questions.length > 0) {
        setQuestions(
          assignmentToEdit.questions.map((q) => ({
            _id: q._id,
            question_type: q.question_type || 'MULTIPLE_CHOICE',
            content: q.content || '',
            options: Array.isArray(q.options) && q.options.length === 4 ? q.options : ['', '', '', ''],
            correct_answer: q.correct_answer || 'A',
            points: q.points || 2,
          }))
        );
      }
    } else {
      setTitle('');
      setInstructions('');
      setDueDate('');
      setTotalPoints(10);
      setAllowLate(true);
      setAllowResubmission(true);
      setStatus('PUBLISHED');
      setIsAiGenerated(false);
      setQuestions([
        {
          question_type: 'MULTIPLE_CHOICE',
          content: '',
          options: ['', '', '', ''],
          correct_answer: 'A',
          points: 2,
        },
      ]);
    }
    setShowAiPrompt(false);
  };

  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen, assignmentToEdit]);

  if (!isOpen) return null;

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleAddQuestion = (type = 'MULTIPLE_CHOICE') => {
    setQuestions((prev) => [
      ...prev,
      {
        question_type: type,
        content: '',
        options: type === 'MULTIPLE_CHOICE' ? ['', '', '', ''] : [],
        correct_answer: type === 'MULTIPLE_CHOICE' ? 'A' : '',
        points: 2,
      },
    ]);
  };

  const handleRemoveQuestion = (idx) => {
    if (isQuestionLocked) return;
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleQuestionChange = (idx, field, value) => {
    if (isQuestionLocked) return;
    setQuestions((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      if (field === 'question_type') {
        if (value === 'MULTIPLE_CHOICE') {
          next[idx].options = next[idx].options?.length === 4 ? next[idx].options : ['', '', '', ''];
          next[idx].correct_answer = next[idx].correct_answer || 'A';
        } else {
          next[idx].options = [];
          next[idx].correct_answer = '';
        }
      }
      return next;
    });
  };

  const handleOptionChange = (qIdx, optIdx, val) => {
    if (isQuestionLocked) return;
    setQuestions((prev) => {
      const next = [...prev];
      const opts = [...(next[qIdx].options || ['', '', '', ''])];
      opts[optIdx] = val;
      next[qIdx].options = opts;
      return next;
    });
  };

  // Tính năng UC26: Tạo câu hỏi bằng AI theo môn học / chủ đề (Cases 5.2, 5.3, 5.4)
  const handleGenerateAiQuestions = async () => {
    if (!aiTopic.trim()) {
      setAiError({ type: 'VALIDATION', message: 'Vui lòng nhập chủ đề / nội dung cần tạo câu hỏi bằng AI' });
      return;
    }

    try {
      setAiLoading(true);
      setAiError(null);

      const res = await generateAiQuestions({
        topic: aiTopic.trim(),
        grade: aiGrade,
        difficulty: aiDifficulty,
        num_questions: parseInt(aiNumQuestions, 10) || 3,
        simulate_timeout: Boolean(aiSimulateTimeout),
      });

      const draft = res?.data;
      if (draft?.questions && draft.questions.length > 0) {
        setQuestions(
          draft.questions.map((q, idx) => ({
            question_number: idx + 1,
            question_type: q.question_type || 'MULTIPLE_CHOICE',
            content: q.content || '',
            options: Array.isArray(q.options) && q.options.length === 4 ? q.options : ['', '', '', ''],
            correct_answer: q.correct_answer || (q.question_type === 'MULTIPLE_CHOICE' ? 'A' : ''),
            points: q.points || 2,
          }))
        );
        setTitle((prev) => prev || draft.title || `Bài tập rèn luyện: ${aiTopic.trim()}`);
        setInstructions((prev) => prev || draft.instructions || '');
        setTotalPoints(draft.total_points || 10);
        setIsAiGenerated(true);
        setStatus('DRAFT'); // Luôn để DRAFT để sửa, không publish thẳng (Case 5.2)
        setShowAiPrompt(false);
        toast.success(`Trợ lý AI đã tạo đề bài mẫu thành công! (Còn lại ${draft.ai_quota_left} lượt trong tháng)`);
      }
    } catch (err) {
      const errStatus = err?.response?.status;
      const data = err?.response?.data;
      const msg = data?.message || err.message || 'Không thể tạo đề bằng AI';

      if (errStatus === 403 || data?.code === 'AI_QUOTA_EXCEEDED' || /hạn mức AI/i.test(msg)) {
        setAiError({ type: 'QUOTA', message: msg });
      } else if (errStatus === 504 || /timeout/i.test(msg)) {
        setAiError({ type: 'TIMEOUT', message: msg });
      } else {
        toast.error(msg);
      }
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (submitStatus = status) => {
    if (!title.trim()) {
      toast.error('Vui lòng nhập tiêu đề bài tập');
      return;
    }

    // Case 5.7: Lớp chưa có student -> Publish khi lớp trống thì báo lỗi precondition
    if (submitStatus === 'PUBLISHED') {
      if (studentCount === 0) {
        toast.error('Lớp học chưa có học sinh nào tham gia. Không thể xuất bản bài tập khi lớp chưa có học sinh.');
        return;
      }

      // Case 5.5: MCQ thiếu đáp án -> Publish MCQ không có answer key thì báo lỗi validation
      if (!isQuestionLocked && Array.isArray(questions)) {
        for (let i = 0; i < questions.length; i++) {
          const q = questions[i];
          if (q.question_type === 'MULTIPLE_CHOICE') {
            if (!q.correct_answer || !String(q.correct_answer).trim()) {
              toast.error(`Câu hỏi trắc nghiệm số ${i + 1} chưa có đáp án đúng (answer key). Vui lòng chọn đáp án trước khi xuất bản.`);
              return;
            }
          }
        }
      }
    }

    // Case 5.6: Deadline quá khứ -> Đặt due date trong quá khứ thì báo lỗi
    if (dueDate) {
      const d = new Date(dueDate);
      if (isNaN(d.getTime())) {
        toast.error('Hạn nộp bài (due date) không hợp lệ');
        return;
      }
      if (d.getTime() < Date.now() - 60000) {
        toast.error('Hạn nộp bài không được ở trong quá khứ. Vui lòng chọn thời điểm trong tương lai.');
        return;
      }
    }

    try {
      setSubmitting(true);

      const payload = {
        title: title.trim(),
        instructions: instructions.trim(),
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
        total_points: parseInt(totalPoints, 10) || 10,
        allow_late_submission: Boolean(allowLate),
        allow_resubmission: Boolean(allowResubmission),
        status: submitStatus,
        is_ai_generated: Boolean(isAiGenerated),
      };

      if (!isQuestionLocked) {
        payload.questions = questions;
      }

      let res;
      if (isEditing) {
        res = await updateAssignment(assignmentToEdit._id, payload);
        toast.success(submitStatus === 'PUBLISHED' ? 'Cập nhật và xuất bản bài tập thành công!' : 'Đã cập nhật bản nháp bài tập thành công!');
      } else {
        res = await createAssignment(classroomId, payload);
        toast.success(submitStatus === 'PUBLISHED' ? 'Tạo và xuất bản bài tập thành công!' : 'Đã lưu bản nháp bài tập thành công!');
      }

      if (onAssignmentCreated) {
        onAssignmentCreated(res?.data);
      }
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || 'Không thể lưu bài tập');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" style={{ maxWidth: '720px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isEditing ? <Pencil size={20} style={{ color: 'var(--color-primary-strong)' }} /> : <ClipboardList size={20} style={{ color: 'var(--color-primary-strong)' }} />}
            <span>{isEditing ? 'Chỉnh sửa bài tập' : 'Tạo bài tập mới'}</span>
          </h2>
          <button type="button" className="modal-close-btn" onClick={handleClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(status); }}>
          <div className="modal-body" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
            {isQuestionLocked && (
              <div style={{ background: 'var(--color-warning-soft)', border: '1px solid #fde68a', color: 'var(--color-warning)', padding: '10px 14px', borderRadius: '8px', marginBottom: '14px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Lock size={16} style={{ flexShrink: 0 }} />
                <span><strong>Lưu ý:</strong> Bài tập đã công bố điểm cho học sinh, không thể chỉnh sửa nội dung và danh sách câu hỏi.</span>
              </div>
            )}

            {/* AI Assistant Banner */}
            {!isQuestionLocked && (
              <div
                style={{
                  background: 'linear-gradient(135deg, var(--color-success-soft) 0%, var(--color-info-soft) 100%)',
                  border: '1px solid #bbf7d0',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, color: '#0f766e', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Sparkles size={16} />
                    <span>Trợ lý AI tạo đề bài thông minh</span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                    Tự động tạo trắc nghiệm, trả lời ngắn và nộp tệp theo môn học. (Trừ vào hạn mức AI gói gia sư)
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAiPrompt(!showAiPrompt)}
                  style={{
                    background: '#0d9488',
                    color: 'var(--color-white)',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 14px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Sparkles size={14} />
                  <span>{showAiPrompt ? 'Đóng AI' : 'Tạo bằng AI'}</span>
                </button>
              </div>
            )}

            {/* AI topic input popup (Cases 5.2, 5.3, 5.4) */}
            {showAiPrompt && !isQuestionLocked && (
              <div
                style={{
                  background: 'var(--color-surface-subtle)',
                  border: '1px solid var(--color-control-border)',
                  borderRadius: '10px',
                  padding: '16px',
                  marginBottom: '16px',
                }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px' }}>
                      Chủ đề bài học <span className="required">*</span>:
                    </label>
                    <input
                      type="text"
                      placeholder="VD: Phương trình bậc hai, Thì quá khứ..."
                      value={aiTopic}
                      onChange={(e) => setAiTopic(e.target.value)}
                      style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid var(--color-control-border)', fontSize: '13px' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px' }}>
                      Khối lớp:
                    </label>
                    <select
                      value={aiGrade}
                      onChange={(e) => setAiGrade(e.target.value)}
                      style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid var(--color-control-border)', fontSize: '13px' }}
                    >
                      <option value="Lớp 6">Lớp 6</option>
                      <option value="Lớp 7">Lớp 7</option>
                      <option value="Lớp 8">Lớp 8</option>
                      <option value="Lớp 9">Lớp 9</option>
                      <option value="Lớp 10">Lớp 10</option>
                      <option value="Lớp 11">Lớp 11</option>
                      <option value="Lớp 12">Lớp 12</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px' }}>
                      Độ khó:
                    </label>
                    <select
                      value={aiDifficulty}
                      onChange={(e) => setAiDifficulty(e.target.value)}
                      style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid var(--color-control-border)', fontSize: '13px' }}
                    >
                      <option value="EASY">Cơ bản (Dễ)</option>
                      <option value="MEDIUM">Trung bình</option>
                      <option value="HARD">Nâng cao (Khó)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px' }}>
                      Số câu hỏi:
                    </label>
                    <select
                      value={aiNumQuestions}
                      onChange={(e) => setAiNumQuestions(e.target.value)}
                      style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid var(--color-control-border)', fontSize: '13px' }}
                    >
                      <option value={3}>3 câu</option>
                      <option value={5}>5 câu</option>
                      <option value={10}>10 câu</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--color-text-muted)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={aiSimulateTimeout}
                      onChange={(e) => setAiSimulateTimeout(e.target.checked)}
                    />
                    <span>Mô phỏng timeout / lỗi AI (Kiểm thử Case 5.4)</span>
                  </label>

                  <button
                    type="button"
                    className="btn-primary-orange"
                    style={{ padding: '8px 18px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    onClick={handleGenerateAiQuestions}
                    disabled={aiLoading}
                  >
                    {aiLoading ? (
                      <>
                        <Loader2 size={14} className="spin" />
                        <span>Đang sinh đề...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} />
                        <span>Tạo đề bằng AI</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Hiển thị lỗi AI (Hết hạn mức hoặc Timeout, Cases 5.3, 5.4) */}
                {aiError && (
                  <div
                    style={{
                      marginTop: '12px',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      background: aiError.type === 'QUOTA' ? 'var(--color-error-soft)' : 'var(--color-warning-soft)',
                      border: `1px solid ${aiError.type === 'QUOTA' ? '#fecdd3' : 'var(--color-warning-soft)'}`,
                      color: aiError.type === 'QUOTA' ? 'var(--color-error)' : 'var(--color-warning)',
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <AlertTriangle size={15} style={{ flexShrink: 0 }} />
                      <span>{aiError.message}</span>
                    </div>

                    {aiError.type === 'QUOTA' && (
                      <Link
                        to="/tutor/checkout"
                        style={{
                          background: 'var(--color-error)',
                          color: 'var(--color-white)',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 600,
                          textDecoration: 'none',
                          whiteSpace: 'nowrap',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <span>Nâng cấp gói ngay</span>
                        <ExternalLink size={12} />
                      </Link>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="form-group">
              <label>
                Tiêu đề bài tập <span className="required">*</span>
                {isAiGenerated && (
                  <span
                    style={{
                      marginLeft: '8px',
                      fontSize: '11px',
                      background: 'var(--color-success-soft)',
                      color: 'var(--color-success)',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Sparkles size={12} />
                    <span>Tạo bởi AI</span>
                  </span>
                )}
              </label>
              <input
                type="text"
                placeholder="VD: Bài tập tuần 1 - Phương trình bậc 2"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Hướng dẫn làm bài (Ghi chú cho học sinh)</label>
              <textarea
                rows={2}
                placeholder="Ghi chú thêm cho học sinh (công thức tham khảo, quy định nộp bài...)"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Hạn nộp bài (Deadline)</label>
                <input
                  type="datetime-local"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Tổng điểm bài tập</label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={totalPoints}
                  onChange={(e) => setTotalPoints(e.target.value)}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <input
                  type="checkbox"
                  id="allowLate"
                  checked={allowLate}
                  onChange={(e) => setAllowLate(e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary-strong)', cursor: 'pointer' }}
                />
                <label htmlFor="allowLate" style={{ margin: 0, cursor: 'pointer', fontSize: '13px' }}>
                  Cho phép nộp muộn sau deadline (ghi nhận trễ)
                </label>
              </div>

              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <input
                  type="checkbox"
                  id="allowResubmission"
                  checked={allowResubmission}
                  onChange={(e) => setAllowResubmission(e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary-strong)', cursor: 'pointer' }}
                />
                <label htmlFor="allowResubmission" style={{ margin: 0, cursor: 'pointer', fontSize: '13px' }}>
                  Cho phép nộp lại để cải thiện điểm
                </label>
              </div>
            </div>

            {/* Questions section */}
            <div style={{ marginTop: '20px', borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div>
                  <h4 style={{ margin: 0, color: 'var(--color-text)' }}>Danh sách câu hỏi ({questions.length})</h4>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Hỗ trợ Trắc nghiệm, Tự luận ngắn và Nộp tệp</div>
                </div>

                {!isQuestionLocked && (
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      className="btn-outline-gray"
                      onClick={() => handleAddQuestion('MULTIPLE_CHOICE')}
                      style={{ fontSize: '12px', padding: '5px 8px' }}
                    >
                      + Trắc nghiệm
                    </button>
                    <button
                      type="button"
                      className="btn-outline-gray"
                      onClick={() => handleAddQuestion('SHORT_ANSWER')}
                      style={{ fontSize: '12px', padding: '5px 8px' }}
                    >
                      + Tự luận ngắn
                    </button>
                    <button
                      type="button"
                      className="btn-outline-gray"
                      onClick={() => handleAddQuestion('FILE_UPLOAD')}
                      style={{ fontSize: '12px', padding: '5px 8px' }}
                    >
                      + Nộp tệp
                    </button>
                  </div>
                )}
              </div>

              {questions.map((q, idx) => (
                <div
                  key={q._id || idx}
                  style={{
                    background: 'var(--color-surface-subtle)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '10px',
                    padding: '14px',
                    marginBottom: '12px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <strong style={{ color: 'var(--color-text)' }}>Câu {idx + 1}</strong>
                      <select
                        value={q.question_type}
                        onChange={(e) => handleQuestionChange(idx, 'question_type', e.target.value)}
                        disabled={isQuestionLocked}
                        style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '12px', border: '1px solid var(--color-control-border)' }}
                      >
                        <option value="MULTIPLE_CHOICE">Trắc nghiệm</option>
                        <option value="SHORT_ANSWER">Trả lời ngắn</option>
                        <option value="FILE_UPLOAD">Nộp tệp</option>
                      </select>
                    </div>

                    {!isQuestionLocked && questions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveQuestion(idx)}
                        style={{
                          border: 'none',
                          background: 'transparent',
                          color: 'var(--color-error)',
                          cursor: 'pointer',
                          fontSize: '13px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <Trash2 size={13} />
                        <span>Xóa câu</span>
                      </button>
                    )}
                  </div>

                  <input
                    type="text"
                    placeholder={`Nội dung câu hỏi ${idx + 1}...`}
                    value={q.content}
                    onChange={(e) => handleQuestionChange(idx, 'content', e.target.value)}
                    disabled={isQuestionLocked}
                    style={{ marginBottom: '8px', width: '100%' }}
                    required
                  />

                  {/* Trắc nghiệm */}
                  {q.question_type === 'MULTIPLE_CHOICE' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                      {['A', 'B', 'C', 'D'].map((letter, optIdx) => (
                        <div key={letter} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--color-text-muted)' }}>{letter}.</span>
                          <input
                            type="text"
                            placeholder={`Lựa chọn ${letter}`}
                            value={q.options?.[optIdx] || ''}
                            onChange={(e) => handleOptionChange(idx, optIdx, e.target.value)}
                            disabled={isQuestionLocked}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Trả lời ngắn */}
                  {q.question_type === 'SHORT_ANSWER' && (
                    <div style={{ marginBottom: '8px' }}>
                      <input
                        type="text"
                        placeholder="Gợi ý đáp án chuẩn / từ khóa (tùy chọn, phục vụ gia sư khi chấm)"
                        value={q.correct_answer || ''}
                        onChange={(e) => handleQuestionChange(idx, 'correct_answer', e.target.value)}
                        disabled={isQuestionLocked}
                        style={{ fontSize: '13px', background: 'var(--color-surface)' }}
                      />
                    </div>
                  )}

                  {/* Nộp tệp */}
                  {q.question_type === 'FILE_UPLOAD' && (
                    <div style={{ marginBottom: '8px', fontSize: '12px', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                      Học sinh sẽ được yêu cầu tải lên tệp bài làm hoặc dán liên kết Google Drive / Figma / Github khi làm bài.
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center', fontSize: '13px' }}>
                    {q.question_type === 'MULTIPLE_CHOICE' && (
                      <div>
                        <span style={{ marginRight: '6px', fontWeight: 600 }}>Đáp án đúng:</span>
                        <select
                          value={q.correct_answer || 'A'}
                          onChange={(e) => handleQuestionChange(idx, 'correct_answer', e.target.value)}
                          disabled={isQuestionLocked}
                          style={{ padding: '4px 8px', borderRadius: '6px' }}
                        >
                          <option value="A">A</option>
                          <option value="B">B</option>
                          <option value="C">C</option>
                          <option value="D">D</option>
                        </select>
                      </div>
                    )}

                    <div>
                      <span style={{ marginRight: '6px', fontWeight: 600 }}>Điểm:</span>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={q.points || 1}
                        onChange={(e) => handleQuestionChange(idx, 'points', parseInt(e.target.value, 10))}
                        disabled={isQuestionLocked}
                        style={{ width: '60px', padding: '4px 8px' }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button type="button" className="btn-outline-gray" onClick={handleClose} disabled={submitting}>
              Hủy
            </button>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className="btn-outline-gray"
                onClick={() => handleSubmit('DRAFT')}
                disabled={submitting}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Save size={15} />
                <span>Lưu bản nháp (DRAFT)</span>
              </button>

              <button
                type="button"
                className="btn-primary-orange"
                onClick={() => handleSubmit('PUBLISHED')}
                disabled={submitting}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                {submitting ? (
                  <>
                    <Loader2 size={15} className="spin" />
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  <>
                    <Send size={15} />
                    <span>Xuất bản & Giao bài</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
