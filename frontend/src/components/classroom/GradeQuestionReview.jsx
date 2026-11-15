import { CheckCircle2, AlertTriangle, FileText, ExternalLink } from 'lucide-react';
import { getAttachmentUrl } from '../../utils/fileUrl';

export default function GradeQuestionReview({
  questions = [],
  answers = [],
  answersFeedback = {},
  onAnswerFeedbackChange,
}) {
  return (
    <div className="grade-questions-container">
      {answers.map((ans, idx) => {
        const questionInfo =
          questions.find((q) => q._id?.toString() === ans.question_id?.toString()) ||
          questions[idx];

        const isUrl =
          ans.text_response &&
          (ans.text_response.startsWith('http://') ||
            ans.text_response.startsWith('https://') ||
            ans.text_response.startsWith('drive.google.com') ||
            ans.text_response.startsWith('docs.google.com'));

        const qId = ans.question_id?.toString() || ans.question_id || idx;
        const currentFeedback = answersFeedback[qId] || {
          score: ans.score ?? 0,
          comment: ans.comment ?? '',
          is_overridden: ans.is_overridden ?? false,
        };

        return (
          <div key={qId} className="grade-question-card">
            {/* Header: Số thứ tự, Nội dung, Điểm tối đa */}
            <div className="grade-q-header">
              <div className="grade-q-title">
                <span style={{ color: 'var(--color-primary-strong)', fontWeight: 700, marginRight: '6px' }}>
                  Câu {idx + 1}:
                </span>
                <span>{questionInfo?.content || `Câu hỏi ${idx + 1}`}</span>
              </div>
              <span className="grade-q-points-badge">
                {questionInfo?.points || 1} điểm
              </span>
            </div>

            {/* DẠNG 1: TRẮC NGHIỆM (MULTIPLE_CHOICE) */}
            {questionInfo?.question_type === 'MULTIPLE_CHOICE' && (
              <div style={{ marginTop: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', fontSize: '13px', marginBottom: '10px' }}>
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

                {/* 4 Phương án A, B, C, D */}
                {Array.isArray(questionInfo.options) && questionInfo.options.length > 0 && (
                  <div className="grade-options-list">
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

                      let rowClass = '';
                      let badge = null;

                      if (isCorrect && isChosen) {
                        rowClass = 'correct-and-chosen';
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
                        rowClass = 'chosen-wrong';
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
                        rowClass = 'correct-answer-key';
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
                        <div key={letter} className={`grade-option-row ${rowClass}`}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                            <span
                              className="grade-option-label"
                              style={{
                                color: isCorrect ? 'var(--color-success)' : isChosen ? 'var(--color-error)' : 'var(--color-text-muted)',
                              }}
                            >
                              {letter}.
                            </span>
                            <span
                              style={{
                                color: isCorrect ? 'var(--color-success)' : 'var(--color-text)',
                                fontWeight: isCorrect || isChosen ? 500 : 400,
                              }}
                            >
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
            )}

            {/* DẠNG 2: TỰ LUẬN NGẮN (SHORT_ANSWER) */}
            {questionInfo?.question_type === 'SHORT_ANSWER' && (
              <div style={{ marginTop: '8px' }}>
                <div className="grade-answer-display-card">
                  <div className="grade-answer-label">Câu trả lời của học sinh:</div>
                  <div className="grade-answer-content">
                    {ans.text_response || '(Học sinh để trống / không trả lời)'}
                  </div>
                </div>

                {questionInfo.correct_answer && (
                  <div className="grade-key-comparison-box">
                    <div className="grade-key-title">
                      <CheckCircle2 size={14} />
                      <span>Đáp án chuẩn / Gợi ý chấm điểm (Đối chiếu):</span>
                    </div>
                    <div className="grade-key-content">{questionInfo.correct_answer}</div>
                  </div>
                )}
              </div>
            )}

            {/* DẠNG 3: NỘP TỆP / TỰ LUẬN DÀI (FILE_UPLOAD) */}
            {questionInfo?.question_type === 'FILE_UPLOAD' && (
              <div style={{ marginTop: '8px' }}>
                {ans.file_url ? (
                  <div className="grade-answer-display-card">
                    <div className="grade-answer-label">Tệp bài làm đính kèm của học sinh:</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <a
                        href={getAttachmentUrl(ans.file_url)}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-outline-gray"
                        style={{
                          color: 'var(--color-primary-strong)',
                          borderColor: '#fdba74',
                          background: 'var(--color-primary-soft)',
                          fontWeight: 600,
                          textDecoration: 'none',
                        }}
                      >
                        <FileText size={15} />
                        <span>Mở / Tải tệp bài làm của học sinh</span>
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
                  <div className="grade-answer-display-card">
                    <div className="grade-answer-label">Bài làm / Đường dẫn nộp bài:</div>
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
                      <div className="grade-answer-content">{ans.text_response}</div>
                    )}
                  </div>
                ) : (
                  <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', fontStyle: 'italic', padding: '6px 0' }}>
                    (Học sinh không đính kèm tệp bài làm)
                  </div>
                )}

                {questionInfo.correct_answer && (
                  <div className="grade-key-comparison-box file-rubric">
                    <div className="grade-key-title file-rubric">
                      <CheckCircle2 size={14} />
                      <span>Gợi ý / Tiêu chí chấm điểm (Đối chiếu):</span>
                    </div>
                    <div className="grade-key-content file-rubric">{questionInfo.correct_answer}</div>
                  </div>
                )}
              </div>
            )}

            {/* Điều khiển điểm câu hỏi & Nhận xét riêng câu này */}
            <div className="grade-q-grading-row">
              <div className="grade-q-score-control">
                <div className="grade-q-score-input-wrap">
                  <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)' }}>
                    {ans.is_auto_graded ? 'Điểm câu (MCQ tự chấm):' : 'Điểm câu hỏi này:'}
                  </label>
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    max={questionInfo?.points || 10}
                    value={currentFeedback.score}
                    onChange={(e) =>
                      onAnswerFeedbackChange(qId, 'score', e.target.value, ans.is_auto_graded)
                    }
                    className="grade-q-score-input"
                  />
                  <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                    / {questionInfo?.points || 1}đ
                  </span>
                </div>

                {(currentFeedback.is_overridden || ans.is_overridden) && (
                  <span
                    style={{
                      fontSize: '11px',
                      background: '#e0e7ff',
                      color: '#3730a3',
                      padding: '3px 8px',
                      borderRadius: '12px',
                      fontWeight: 600,
                    }}
                  >
                    Đã điều chỉnh (Override)
                  </span>
                )}
              </div>

              <input
                type="text"
                placeholder="Nhận xét riêng cho câu này (hoặc lý do sửa/override điểm)..."
                value={currentFeedback.comment}
                onChange={(e) => onAnswerFeedbackChange(qId, 'comment', e.target.value)}
                className="grade-q-comment-input"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

