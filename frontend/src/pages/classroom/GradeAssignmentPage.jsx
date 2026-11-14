import { toast } from 'sonner';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Share2,
  Loader2,
  FileText,
  Award,
} from 'lucide-react';
import {
  getClassroomDetail,
  getAssignmentDetail,
  getSubmissionsForAssignment,
  gradeSubmission,
  publishAssignmentResults,
} from '../../services/classroomService';
import GradeSubmissionsList from '../../components/classroom/GradeSubmissionsList';
import GradeQuestionReview from '../../components/classroom/GradeQuestionReview';
import GradeSummarySection from '../../components/classroom/GradeSummarySection';
import '../../styles/gradeAssignment.css';

export default function GradeAssignmentPage() {
  const { id: classroomId, assignmentId } = useParams();

  const [classroom, setClassroom] = useState(null);
  const [assignment, setAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [selectedSub, setSelectedSub] = useState(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState('');

  // Form states for the selected student
  const [finalScore, setFinalScore] = useState('');
  const [feedback, setFeedback] = useState('');
  const [answersFeedback, setAnswersFeedback] = useState({});

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

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const [classRes, asgRes, subsRes] = await Promise.all([
        classroomId ? getClassroomDetail(classroomId).catch(() => null) : null,
        getAssignmentDetail(assignmentId),
        getSubmissionsForAssignment(assignmentId),
      ]);

      if (classRes?.data) {
        setClassroom(classRes.data);
      }

      const asgData = asgRes?.data;
      setAssignment(asgData);

      const subsList = subsRes?.data || [];
      setSubmissions(subsList);

      if (subsList.length > 0) {
        // Retain selected submission if already selected, or pick the first
        const activeSub =
          subsList.find((s) => s._id === selectedSub?._id) || subsList[0];
        setSelectedSub(activeSub);
        setFinalScore(
          activeSub.final_score !== null && activeSub.final_score !== undefined
            ? activeSub.final_score
            : activeSub.provisional_score || 0
        );
        setFeedback(activeSub.overall_feedback || '');
        initAnswersFb(activeSub);
      } else {
        setSelectedSub(null);
      }
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Không thể tải dữ liệu bài tập và danh sách bài nộp');
    } finally {
      setLoading(false);
    }
  }, [classroomId, assignmentId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

  // Tính tổng điểm từ các câu hỏi đã chấm
  const currentQuestionsSum = useMemo(() => {
    return Object.values(answersFeedback).reduce((sum, item) => {
      const val = parseFloat(item?.score) || 0;
      return sum + val;
    }, 0);
  }, [answersFeedback]);

  const handleApplyQuestionsSum = () => {
    setFinalScore(currentQuestionsSum);
  };

  const handleSubmitGrade = async (e) => {
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

      toast.success('Đã lưu và công bố điểm cho học sinh thành công!');

      // Cập nhật lại danh sách submissions
      setSubmissions((prev) =>
        prev.map((s) => (s._id === selectedSub._id ? { ...s, ...res.data } : s))
      );
      setSelectedSub((prev) => ({ ...prev, ...res.data }));
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || 'Lỗi khi lưu điểm');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePublishAll = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn công bố điểm cho toàn bộ học sinh trong lớp?')) {
      return;
    }

    try {
      setPublishing(true);
      setError('');

      await publishAssignmentResults(assignmentId);
      toast.success('Đã công bố điểm cho toàn bộ học sinh và phụ huynh trong lớp thành công!');

      // Cập nhật lại trạng thái bài tập
      setAssignment((prev) => ({
        ...prev,
        results_published_at: new Date().toISOString(),
      }));
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || 'Lỗi khi công bố điểm cho cả lớp');
    } finally {
      setPublishing(false);
    }
  };

  if (loading) {
    return (
      <div className="grade-page-container" style={{ textAlign: 'center', padding: '100px 20px' }}>
        <Loader2 size={32} className="spin" style={{ color: 'var(--color-primary-strong)', margin: '0 auto 12px' }} />
        <p style={{ color: 'var(--color-text-muted)', fontSize: '15px' }}>Đang tải giao diện chấm điểm bài tập...</p>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="grade-page-container">
        <div className="error-alert">
          <AlertTriangle size={18} />
          <span>{error || 'Không tìm thấy thông tin bài tập này.'}</span>
        </div>
        <Link
          to={`/tutor/classes/${classroomId}?tab=assignments`}
          className="grade-back-btn"
          style={{ marginTop: '16px' }}
        >
          <ArrowLeft size={16} />
          <span>Quay lại lớp học</span>
        </Link>
      </div>
    );
  }

  const isAllPublished = Boolean(assignment.results_published_at);

  return (
    <div className="grade-page-container">

      {/* Top Bar: Navigation & Quick Actions */}
      <div className="grade-top-bar">
        <Link
          to={`/tutor/classes/${classroomId}?tab=assignments`}
          className="grade-back-btn"
        >
          <ArrowLeft size={16} />
          <span>Quay lại lớp: {classroom?.title || 'Lớp học'}</span>
        </Link>

        {isAllPublished ? (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              padding: '6px 12px',
              borderRadius: '8px',
              background: 'var(--color-success-soft)',
              color: 'var(--color-success)',
              fontWeight: 600,
            }}
          >
            <CheckCircle2 size={15} />
            <span>Đã công bố điểm cho cả lớp ({new Date(assignment.results_published_at).toLocaleDateString('vi-VN')})</span>
          </span>
        ) : (
          <button
            type="button"
            className="btn-outline-gray"
            onClick={handlePublishAll}
            disabled={publishing}
            style={{
              color: 'var(--color-info)',
              borderColor: '#93c5fd',
              background: 'var(--color-info-soft)',
              fontWeight: 600,
            }}
          >
            {publishing ? (
              <>
                <Loader2 size={15} className="spin" />
                <span>Đang công bố...</span>
              </>
            ) : (
              <>
                <Share2 size={15} />
                <span>Công bố điểm cho toàn bộ lớp</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Assignment Header Card */}
      <div className="grade-header-card">
        <div className="grade-header-title-row">
          <div>
            <h1 className="grade-assignment-title">
              <BarChart3 size={24} color="var(--color-primary-strong)" />
              <span>Chấm điểm: {assignment.title}</span>
            </h1>
            {assignment.instructions && (
              <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: 'var(--color-text-muted)' }}>
                {assignment.instructions}
              </p>
            )}
          </div>

          <div className="grade-meta-badges">
            <span className="grade-meta-badge points">
              <Award size={14} />
              <span>Thang điểm: {assignment.total_points || 10}đ</span>
            </span>
            <span className="grade-meta-badge highlight">
              <span>{assignment.questions?.length || 0} câu hỏi</span>
            </span>
            <span className="grade-meta-badge">
              <Clock size={14} />
              <span>
                Hạn: {assignment.due_date ? new Date(assignment.due_date).toLocaleString('vi-VN') : 'Không giới hạn'}
              </span>
            </span>
            <span className="grade-meta-badge">
              <span>Đã nộp: {submissions.length} học sinh</span>
            </span>
          </div>
        </div>
      </div>

      {/* Error alert if any */}
      {error && (
        <div className="error-alert" style={{ marginBottom: '20px' }}>
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Main Two-Column Layout */}
      {submissions.length === 0 ? (
        <div
          style={{
            background: 'var(--color-surface)',
            borderRadius: '12px',
            border: '1px solid var(--color-border)',
            padding: '60px 20px',
            textAlign: 'center',
            color: 'var(--color-text-muted)',
          }}
        >
          <FileText size={40} style={{ margin: '0 auto 12px', color: 'var(--color-text-muted)' }} />
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-text)', margin: '0 0 6px 0' }}>
            Chưa có học sinh nào nộp bài
          </h3>
          <p style={{ margin: 0, fontSize: '14px' }}>
            Học sinh trong lớp chưa nộp bài tập này. Khi có bài làm mới, bạn có thể chấm trực tiếp tại đây.
          </p>
        </div>
      ) : (
        <div className="grade-layout-grid">
          {/* Left Column: Submissions List */}
          <GradeSubmissionsList
            submissions={submissions}
            selectedSub={selectedSub}
            onSelectSub={handleSelectSub}
            totalPoints={assignment.total_points || 10}
          />

          {/* Right Column: Selected Submission Detail & Grading Form */}
          {selectedSub && (
            <div className="grade-main-pane">
              {/* Student Submission Banner */}
              <div className="grade-student-banner">
                <div className="grade-student-info">
                  <h3>
                    {selectedSub.student_user_id?.full_name || selectedSub.student_user_id?.email || 'Học sinh'}
                  </h3>
                  <div className="grade-student-meta">
                    <span>Email: {selectedSub.student_user_id?.email}</span>
                    <span>• Lần nộp #{selectedSub.attempt_number || 1}</span>
                    <span>
                      • Nộp lúc: {new Date(selectedSub.submitted_at).toLocaleString('vi-VN')}
                    </span>
                  </div>
                </div>

                <span
                  style={{
                    fontSize: '12px',
                    padding: '4px 10px',
                    borderRadius: '8px',
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
                      <AlertTriangle size={14} /> Nộp muộn
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={14} /> Đúng hạn
                    </>
                  )}
                </span>
              </div>

              {/* Questions Review */}
              <GradeQuestionReview
                questions={assignment.questions || []}
                answers={selectedSub.answers || []}
                answersFeedback={answersFeedback}
                onAnswerFeedbackChange={handleAnswerFeedbackChange}
              />

              {/* Summary Grading Card */}
              <GradeSummarySection
                totalPoints={assignment.total_points || 10}
                finalScore={finalScore}
                onFinalScoreChange={setFinalScore}
                feedback={feedback}
                onFeedbackChange={setFeedback}
                onSubmitGrade={handleSubmitGrade}
                submitting={submitting}
                questionsSum={currentQuestionsSum}
                onApplyQuestionsSum={handleApplyQuestionsSum}
                isGraded={selectedSub.status === 'GRADED'}
                gradedAt={selectedSub.graded_at}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

