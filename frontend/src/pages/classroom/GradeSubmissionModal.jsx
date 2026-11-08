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
} from 'lucide-react';
import { getSubmissionsForAssignment, gradeSubmission } from '../../services/classroomService';

export default function GradeSubmissionModal({ isOpen, onClose, assignment, showToast }) {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSub, setSelectedSub] = useState(null);
  const [finalScore, setFinalScore] = useState('');
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

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
          } else {
            setSelectedSub(null);
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
    setError('');
  };

  const handleGrade = async (e) => {
    e.preventDefault();
    if (!selectedSub) return;

    try {
      setSubmitting(true);
      setError('');
      const res = await gradeSubmission(selectedSub._id, {
        final_score: parseFloat(finalScore) || 0,
        overall_feedback: feedback.trim(),
      });
      if (showToast) {
        showToast('Chấm điểm bài nộp thành công! Đã gửi thông báo cho học viên và phụ huynh liên kết.');
      }
      // Cập nhật lại list
      setSubmissions((prev) =>
        prev.map((s) => (s._id === selectedSub._id ? { ...s, ...res.data } : s))
      );
      setSelectedSub((prev) => ({ ...prev, ...res.data }));
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Lỗi khi lưu điểm');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" style={{ maxWidth: '840px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart3 size={20} color="#e85a2c" />
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
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <Loader2 size={18} className="spin" />
              <span>Đang tải bài làm của học sinh...</span>
            </div>
          ) : submissions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <FileText size={18} />
              <span>Chưa có học sinh nào nộp bài tập này.</span>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '20px' }}>
              {/* Danh sách học sinh nộp */}
              <div style={{ borderRight: '1px solid #e2e8f0', paddingRight: '16px' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#64748b', textTransform: 'uppercase' }}>
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
                          background: isSelected ? '#fff5f0' : '#ffffff',
                          border: `1px solid ${isSelected ? '#e85a2c' : '#e2e8f0'}`,
                          transition: 'all 0.15s',
                        }}
                      >
                        <div style={{ fontWeight: 600, fontSize: '14px', color: '#0f172a' }}>{studentName}</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            {isGraded ? (
                              <>
                                <Award size={13} color="#16a34a" /> {sub.final_score}đ
                              </>
                            ) : (
                              `Tạm: ${sub.provisional_score || 0}đ`
                            )}
                          </span>
                          <span style={{ color: isGraded ? '#16a34a' : '#e85a2c', fontWeight: isGraded ? 600 : 400 }}>
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
                  <div style={{ marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', color: '#0f172a' }}>
                        {selectedSub.student_user_id?.full_name || selectedSub.student_user_id?.email}
                      </h3>
                      <span
                        style={{
                          fontSize: '12px',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background: selectedSub.timeliness === 'LATE' ? '#fee2e2' : '#dcfce7',
                          color: selectedSub.timeliness === 'LATE' ? '#991b1b' : '#166534',
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
                    <div style={{ fontSize: '13px', color: '#64748b' }}>
                      Nộp lúc: {new Date(selectedSub.submitted_at).toLocaleString('vi-VN')} (Lần nộp #{selectedSub.attempt_number || 1})
                    </div>
                  </div>

                  {/* Câu trả lời của học sinh */}
                  <div style={{ marginBottom: '20px' }}>
                    <h4 style={{ margin: '0 0 10px 0', fontSize: '15px', color: '#334155' }}>
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
                            background: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            padding: '12px',
                            borderRadius: '8px',
                            marginBottom: '10px',
                            fontSize: '14px',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ fontWeight: 600, color: '#334155' }}>
                              Câu {idx + 1}: {questionInfo?.content || `Câu hỏi ${idx + 1}`}
                            </span>
                            <span style={{ fontSize: '12px', color: '#64748b' }}>
                              ({questionInfo?.points || 1}đ)
                            </span>
                          </div>

                          <div style={{ marginTop: '6px' }}>
                            <span style={{ color: '#64748b', fontSize: '13px' }}>Trả lời: </span>
                            {isUrl ? (
                              <a
                                href={ans.text_response.startsWith('http') ? ans.text_response : `https://${ans.text_response}`}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                  color: '#0284c7',
                                  textDecoration: 'underline',
                                  fontWeight: 600,
                                  wordBreak: 'break-all',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                              >
                                <ExternalLink size={13} />
                                <span>{ans.text_response}</span>
                              </a>
                            ) : (
                              <span style={{ fontWeight: 600, color: '#0f172a', whiteSpace: 'pre-wrap' }}>
                                {ans.text_response || '(Không trả lời)'}
                              </span>
                            )}

                            {ans.is_auto_graded && (
                              <span style={{ marginLeft: '10px', fontSize: '12px', color: '#16a34a', fontWeight: 600 }}>
                                (Trắc nghiệm tự chấm: +{ans.score || 0}đ)
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Form chấm điểm */}
                  <form onSubmit={handleGrade} style={{ background: '#fff5f0', padding: '16px', borderRadius: '10px', border: '1px solid #fed7aa' }}>
                    <h4 style={{ margin: '0 0 12px 0', color: '#c2410c', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '6px' }}>
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

        <div className="modal-footer">
          <button type="button" className="btn-outline-gray" onClick={handleClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
