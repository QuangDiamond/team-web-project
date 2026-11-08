import { useState, useEffect } from 'react';
import { createAssignment, updateAssignment } from '../../services/classroomService';

export default function CreateAssignmentModal({
  isOpen,
  onClose,
  classroomId,
  assignmentToEdit = null,
  classroomSubject = '',
  onAssignmentCreated,
  showToast,
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
  const [error, setError] = useState('');

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
    setError('');
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

  // Tính năng UC26: Tạo câu hỏi bằng AI theo môn học / chủ đề
  const handleGenerateAiQuestions = () => {
    setAiLoading(true);
    setTimeout(() => {
      const subject = (aiTopic || classroomSubject || 'Toán học').trim();
      let aiQuestions = [];

      if (/toán|math/i.test(subject)) {
        aiQuestions = [
          {
            question_type: 'MULTIPLE_CHOICE',
            content: 'Nghiệm của phương trình bậc hai x² - 5x + 6 = 0 là gì?',
            options: ['x = 2 hoặc x = 3', 'x = -2 hoặc x = -3', 'x = 1 hoặc x = 6', 'Vô nghiệm'],
            correct_answer: 'A',
            points: 3,
          },
          {
            question_type: 'SHORT_ANSWER',
            content: 'Nêu công thức tính biệt thức Delta (Δ) của phương trình ax² + bx + c = 0.',
            options: [],
            correct_answer: 'Delta = b^2 - 4ac',
            points: 3,
          },
          {
            question_type: 'FILE_UPLOAD',
            content: 'Trình bày chi tiết lời giải bài toán vẽ đồ thị hàm số y = 2x - 3 lên giấy, chụp ảnh và đính kèm liên kết nộp bài.',
            options: [],
            correct_answer: '',
            points: 4,
          },
        ];
      } else if (/anh|english/i.test(subject)) {
        aiQuestions = [
          {
            question_type: 'MULTIPLE_CHOICE',
            content: 'Choose the correct form: If I had studied harder, I _____ the exam.',
            options: ['would have passed', 'will pass', 'would pass', 'had passed'],
            correct_answer: 'A',
            points: 3,
          },
          {
            question_type: 'SHORT_ANSWER',
            content: 'Write a paragraph (50-70 words) introducing your favorite hobby.',
            options: [],
            correct_answer: '',
            points: 4,
          },
          {
            question_type: 'FILE_UPLOAD',
            content: 'Record an audio file reading the passage in unit 3 and submit your recording link.',
            options: [],
            correct_answer: '',
            points: 3,
          },
        ];
      } else {
        // Chủ đề tổng quát
        aiQuestions = [
          {
            question_type: 'MULTIPLE_CHOICE',
            content: `Khái niệm cơ bản nào dưới đây là chính xác nhất đối với nội dung "${subject}"?`,
            options: ['Khái niệm định nghĩa chuẩn', 'Phương án đối nghịch', 'Giả thuyết chưa chứng minh', 'Không có đáp án đúng'],
            correct_answer: 'A',
            points: 3,
          },
          {
            question_type: 'SHORT_ANSWER',
            content: `Hãy tóm tắt ngắn gọn 3 luận điểm chính đã học trong chủ đề "${subject}".`,
            options: [],
            correct_answer: '',
            points: 3,
          },
          {
            question_type: 'FILE_UPLOAD',
            content: `Làm bài thu hoạch tổng quan về chuyên đề "${subject}" và đính kèm link tài liệu.`,
            options: [],
            correct_answer: '',
            points: 4,
          },
        ];
      }

      setQuestions(aiQuestions);
      setIsAiGenerated(true);
      setTitle((prev) => prev || `Bài tập rèn luyện: ${subject}`);
      setInstructions((prev) => prev || `Đề bài được sinh tự động bởi trợ lý AI theo nội dung ${subject}. Các em hoàn thành đầy đủ cả trắc nghiệm và tự luận.`);
      setTotalPoints(10);
      setAiLoading(false);
      setShowAiPrompt(false);
      if (showToast) {
        showToast('✨ Trợ lý AI đã tạo đề bài mẫu thành công! (Trừ 1 lượt hạn mức AI)');
      }
    }, 600);
  };

  const handleSubmit = async (submitStatus = status) => {
    if (!title.trim()) {
      return setError('Vui lòng nhập tiêu đề bài tập');
    }

    try {
      setSubmitting(true);
      setError('');

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
        if (showToast) {
          showToast(submitStatus === 'PUBLISHED' ? 'Đã xuất bản bài tập!' : 'Đã cập nhật bản nháp bài tập!');
        }
      } else {
        res = await createAssignment(classroomId, payload);
        if (showToast) {
          showToast(submitStatus === 'PUBLISHED' ? 'Tạo và xuất bản bài tập thành công!' : 'Đã lưu bản nháp bài tập!');
        }
      }

      if (onAssignmentCreated) {
        onAssignmentCreated(res?.data);
      }
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Không thể lưu bài tập');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" style={{ maxWidth: '720px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            <span>{isEditing ? '✏️' : '📝'}</span> {isEditing ? 'Chỉnh sửa bài tập' : 'Tạo bài tập mới'}
          </h2>
          <button type="button" className="modal-close-btn" onClick={handleClose}>
            ×
          </button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(status); }}>
          <div className="modal-body" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
            {error && (
              <div className="error-alert">
                <span>⚠️</span>
                <div>{error}</div>
              </div>
            )}

            {isQuestionLocked && (
              <div style={{ background: '#fef3c7', border: '1px solid #fde68a', color: '#92400e', padding: '10px 14px', borderRadius: '8px', marginBottom: '14px', fontSize: '13px' }}>
                🔒 <strong>Lưu ý:</strong> Bài tập đã công bố điểm cho học sinh, không thể chỉnh sửa nội dung và danh sách câu hỏi.
              </div>
            )}

            {/* AI Assistant Banner */}
            {!isQuestionLocked && (
              <div
                style={{
                  background: 'linear-gradient(135deg, #f0fdf4 0%, #e0f2fe 100%)',
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
                  <div style={{ fontWeight: 600, color: '#0f766e', fontSize: '14px' }}>
                    ✨ Trợ lý AI tạo đề bài thông minh
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    Tự động tạo trắc nghiệm, trả lời ngắn và nộp file theo môn học. (Trừ vào hạn mức AI gói gia sư)
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAiPrompt(!showAiPrompt)}
                  style={{
                    background: '#0d9488',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 14px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {showAiPrompt ? 'Đóng AI' : '✨ Tạo bằng AI'}
                </button>
              </div>
            )}

            {/* AI topic input popup */}
            {showAiPrompt && !isQuestionLocked && (
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  padding: '12px',
                  marginBottom: '16px',
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'center',
                }}
              >
                <input
                  type="text"
                  placeholder="Nhập môn học hoặc chủ đề đề bài (VD: Toán lớp 10, Tiếng Anh B1...)"
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  style={{ flex: 1, padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
                <button
                  type="button"
                  className="btn-primary-orange"
                  style={{ padding: '7px 14px', fontSize: '13px' }}
                  onClick={handleGenerateAiQuestions}
                  disabled={aiLoading}
                >
                  {aiLoading ? '⏳ Đang sinh đề...' : 'Tạo đề ngay'}
                </button>
              </div>
            )}

            <div className="form-group">
              <label>
                Tiêu đề bài tập <span className="required">*</span>
                {isAiGenerated && (
                  <span style={{ marginLeft: '8px', fontSize: '11px', background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>
                    ✨ Tạo bởi AI
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
                  style={{ width: '18px', height: '18px', accentColor: '#e85a2c', cursor: 'pointer' }}
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
                  style={{ width: '18px', height: '18px', accentColor: '#e85a2c', cursor: 'pointer' }}
                />
                <label htmlFor="allowResubmission" style={{ margin: 0, cursor: 'pointer', fontSize: '13px' }}>
                  Cho phép nộp lại để cải thiện điểm
                </label>
              </div>
            </div>

            {/* Questions section */}
            <div style={{ marginTop: '20px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div>
                  <h4 style={{ margin: 0, color: '#0f172a' }}>Danh sách câu hỏi ({questions.length})</h4>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Hỗ trợ Trắc nghiệm, Tự luận ngắn và Nộp file</div>
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
                      + Nộp file
                    </button>
                  </div>
                )}
              </div>

              {questions.map((q, idx) => (
                <div
                  key={q._id || idx}
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    padding: '14px',
                    marginBottom: '12px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <strong style={{ color: '#0f172a' }}>Câu {idx + 1}</strong>
                      <select
                        value={q.question_type}
                        onChange={(e) => handleQuestionChange(idx, 'question_type', e.target.value)}
                        disabled={isQuestionLocked}
                        style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '12px', border: '1px solid #cbd5e1' }}
                      >
                        <option value="MULTIPLE_CHOICE">🔘 Trắc nghiệm</option>
                        <option value="SHORT_ANSWER">✍️ Trả lời ngắn</option>
                        <option value="FILE_UPLOAD">📎 Nộp file</option>
                      </select>
                    </div>

                    {!isQuestionLocked && questions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveQuestion(idx)}
                        style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', fontSize: '13px' }}
                      >
                        🗑️ Xóa câu
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
                          <span style={{ fontWeight: 600, fontSize: '13px', color: '#64748b' }}>{letter}.</span>
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
                        style={{ fontSize: '13px', background: '#ffffff' }}
                      />
                    </div>
                  )}

                  {/* Nộp file */}
                  {q.question_type === 'FILE_UPLOAD' && (
                    <div style={{ marginBottom: '8px', fontSize: '12px', color: '#64748b', fontStyle: 'italic' }}>
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
              >
                💾 Lưu bản nháp (DRAFT)
              </button>

              <button
                type="button"
                className="btn-primary-orange"
                onClick={() => handleSubmit('PUBLISHED')}
                disabled={submitting}
              >
                {submitting ? 'Đang lưu...' : '🚀 Xuất bản & Giao bài'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
