import { Award, Send, Loader2, Calculator } from 'lucide-react';

export default function GradeSummarySection({
  totalPoints = 10,
  finalScore,
  onFinalScoreChange,
  feedback,
  onFeedbackChange,
  onSubmitGrade,
  submitting = false,
  questionsSum = 0,
  onApplyQuestionsSum,
  isGraded = false,
  gradedAt = null,
}) {
  return (
    <form onSubmit={onSubmitGrade} className="grade-summary-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
        <h4 className="grade-summary-title" style={{ margin: 0 }}>
          <Award size={18} />
          <span>Tổng kết điểm & Nhận xét của gia sư</span>
        </h4>

        {isGraded && gradedAt && (
          <span style={{ fontSize: '12px', color: '#166534', background: '#dcfce7', padding: '3px 8px', borderRadius: '6px', fontWeight: 600 }}>
            Đã chấm lúc: {new Date(gradedAt).toLocaleString('vi-VN')}
          </span>
        )}
      </div>

      <div className="grade-summary-grid">
        {/* Điểm tổng kết */}
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
            Tổng điểm chính thức (Tối đa {totalPoints}đ):
          </label>
          <input
            type="number"
            step="0.25"
            min="0"
            max={totalPoints}
            value={finalScore}
            onChange={(e) => onFinalScoreChange(e.target.value)}
            required
            className="grade-final-score-input"
          />

          {/* Quick sync helper */}
          {questionsSum > 0 && (
            <div style={{ marginTop: '8px' }}>
              <button
                type="button"
                onClick={onApplyQuestionsSum}
                className="btn-outline-gray"
                style={{
                  fontSize: '11px',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  width: '100%',
                  justifyContent: 'center',
                }}
                title="Lấy tổng điểm đã chấm ở các câu hỏi đưa vào đây"
              >
                <Calculator size={12} />
                <span>Tổng các câu: {questionsSum}đ</span>
              </button>
            </div>
          )}
        </div>

        {/* Nhận xét của gia sư */}
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
            Nhận xét & Lời khuyên (sẽ gửi thông báo cho cả Học sinh & Phụ huynh):
          </label>
          <textarea
            rows={4}
            placeholder="VD: Bài làm tiến bộ, câu trắc nghiệm làm tốt. Cần lưu ý cách trình bày các bước ở câu 2..."
            value={feedback}
            onChange={(e) => onFeedbackChange(e.target.value)}
            className="grade-overall-feedback-input"
          />
        </div>
      </div>

      <div className="grade-submit-btn-row">
        <span style={{ fontSize: '12px', color: '#64748b' }}>
          * Điểm và nhận xét sẽ được lưu và gửi thông báo trực tiếp đến tài khoản học viên và phụ huynh liên kết.
        </span>

        <button
          type="submit"
          disabled={submitting}
          className="btn-primary-orange"
        >
          {submitting ? (
            <>
              <Loader2 size={16} className="spin" />
              <span>Đang lưu điểm...</span>
            </>
          ) : (
            <>
              <Send size={16} />
              <span>{isGraded ? 'Cập nhật điểm & Nhận xét' : 'Lưu điểm & Công bố kết quả'}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}

