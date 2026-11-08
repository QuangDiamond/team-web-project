export default function ClassroomAssignmentsTab({
  assignments,
  loadingAssignments,
  isOwner,
  studentCount = 0,
  user,
  onOpenCreateAssignment,
  onOpenEditAssignment,
  onDeleteAssignment,
  onSelectGrading,
  onSelectDoAssignment,
}) {
  const handleCreateClick = () => {
    if (studentCount === 0) {
      alert('Lớp học phải có ít nhất một học sinh tham gia để có thể tạo và giao bài tập.');
      return;
    }
    onOpenCreateAssignment();
  };

  return (
    <div>
      <div className="members-toolbar">
        <div>
          <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', color: '#0f172a' }}>
            Quản lý bài tập & Chấm điểm
          </h3>
          <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>
            Tạo bài tập trắc nghiệm, tự luận, nộp tệp và tự động chấm điểm bài làm của học sinh.
          </p>
        </div>

        {isOwner && (
          <button
            type="button"
            className="btn-primary-orange"
            style={{ fontSize: '14px', padding: '9px 16px' }}
            onClick={handleCreateClick}
            title={studentCount === 0 ? 'Lớp cần có ít nhất 1 học sinh để tạo bài tập' : 'Tạo bài tập mới'}
          >
            <span>➕</span> Tạo bài tập mới
          </button>
        )}
      </div>

      {loadingAssignments ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
          ⏳ Đang tải bài tập...
        </div>
      ) : assignments.length === 0 ? (
        <div className="classroom-empty-state" style={{ padding: '40px 20px' }}>
          <div className="empty-icon">📝</div>
          <h3>Chưa có bài tập nào</h3>
          <p>
            {studentCount === 0
              ? 'Lớp học hiện chưa có học sinh. Hãy mời học sinh tham gia trước khi giao bài tập!'
              : 'Hãy tạo bài tập đầu tiên để củng cố kiến thức cho học sinh sau mỗi buổi học!'}
          </p>
          {isOwner && (
            <button
              type="button"
              className="btn-primary-orange"
              onClick={handleCreateClick}
              disabled={studentCount === 0}
              style={studentCount === 0 ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
            >
              <span>➕</span> Tạo bài tập đầu tiên
            </button>
          )}
        </div>
      ) : (
        <div className="assignments-grid">
          {assignments.map((asg) => (
            <div key={asg._id} className="assignment-card">
              <div>
                <div
                  className="card-badges"
                  style={{ marginBottom: '8px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}
                >
                  <span className="badge badge-subject">
                    {asg.status === 'PUBLISHED' ? 'Đã công bố' : 'Bản nháp'}
                  </span>
                  {asg.is_ai_generated && (
                    <span
                      className="badge"
                      style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' }}
                    >
                      ✨ AI sinh đề
                    </span>
                  )}
                  <span className="badge badge-grade">{asg.total_points || 10} Điểm</span>
                </div>

                <h4 className="assignment-title">{asg.title}</h4>

                {asg.instructions && (
                  <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 10px 0', lineHeight: 1.4 }}>
                    {asg.instructions}
                  </p>
                )}

                <div className="assignment-due">
                  <span>⏰</span> Hạn nộp:{' '}
                  {asg.due_date ? new Date(asg.due_date).toLocaleString('vi-VN') : 'Không giới hạn'}
                </div>

                <div className="assignment-meta-row">
                  <span>Câu hỏi: {asg.questions?.length || 0}</span>
                  <span>Đã nộp: {asg.submission_count || 0}</span>
                </div>
              </div>

              {/* Actions for Tutor */}
              {isOwner ? (
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <button
                    type="button"
                    className="btn-primary-orange"
                    style={{ flex: 2, fontSize: '13px', padding: '8px' }}
                    onClick={() => onSelectGrading(asg)}
                    title="Chấm điểm bài nộp (Gia sư)"
                  >
                    📊 Chấm bài ({asg.submission_count || 0})
                  </button>
                  <button
                    type="button"
                    className="btn-outline-gray"
                    style={{ flex: 1, fontSize: '13px', padding: '8px' }}
                    onClick={() => onOpenEditAssignment(asg)}
                    title={asg.results_published_at ? 'Bài đã công bố điểm, chỉ xem/sửa thông tin chung' : 'Sửa đề bài'}
                  >
                    ✏️ Sửa
                  </button>
                  <button
                    type="button"
                    className="btn-outline-gray"
                    style={{ color: '#ef4444', fontSize: '13px', padding: '8px 10px' }}
                    onClick={() => onDeleteAssignment(asg._id, asg.title)}
                    title="Xóa bài tập"
                  >
                    🗑️
                  </button>
                </div>
              ) : (
                /* Actions for Student / Parent */
                <div style={{ marginTop: '12px' }}>
                  {user?.role === 'PARENT' ? (
                    /* Chế độ giám sát bài tập dành cho Phụ huynh */
                    <div>
                      {asg.my_submission ? (
                        <div
                          style={{
                            marginBottom: '8px',
                            padding: '10px 12px',
                            background: '#f0fdf4',
                            borderRadius: '8px',
                            border: '1px solid #bbf7d0',
                          }}
                        >
                          <div style={{ fontSize: '12px', color: '#166534', fontWeight: 600, marginBottom: '4px' }}>
                            👶 Bài làm của con: {asg.my_submission.student_user_id?.full_name || 'Học sinh'}
                          </div>
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              fontSize: '13px',
                            }}
                          >
                            <span style={{ fontWeight: 700, color: '#15803d' }}>
                              {asg.my_submission.status === 'GRADED'
                                ? `⭐ Điểm chính thức: ${asg.my_submission.final_score}/${asg.total_points || 10}đ`
                                : `⏳ Điểm tạm tính: ${asg.my_submission.provisional_score || 0}đ`}
                            </span>
                            <span
                              style={{
                                fontSize: '11px',
                                color: asg.my_submission.timeliness === 'LATE' ? '#dc2626' : '#16a34a',
                              }}
                            >
                              {asg.my_submission.timeliness === 'LATE' ? 'Nộp muộn' : 'Đúng hạn'}
                            </span>
                          </div>
                          {asg.my_submission.overall_feedback && (
                            <div style={{ fontSize: '12px', color: '#0369a1', marginTop: '6px' }}>
                              💬 Gia sư nhận xét: "{asg.my_submission.overall_feedback}"
                            </div>
                          )}
                        </div>
                      ) : (
                        <div
                          style={{
                            marginBottom: '8px',
                            padding: '8px 12px',
                            background: '#fffbeb',
                            borderRadius: '8px',
                            border: '1px solid #fef3c7',
                            fontSize: '12px',
                            color: '#b45309',
                          }}
                        >
                          ⏳ Con chưa nộp bài tập này
                        </div>
                      )}

                      <button
                        type="button"
                        className="btn-outline-gray"
                        style={{ width: '100%', fontSize: '13px', padding: '8px', background: '#ffffff' }}
                        onClick={() => onSelectDoAssignment(asg)}
                      >
                        👁️ {asg.my_submission ? 'Xem bài làm của con & Điểm' : 'Xem đề bài tập'}
                      </button>
                    </div>
                  ) : (
                    /* Chế độ làm bài dành cho Học sinh */
                    <div>
                      {asg.my_submission ? (
                        <div
                          style={{
                            marginBottom: '8px',
                            padding: '8px 10px',
                            background: '#f8fafc',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              fontSize: '13px',
                            }}
                          >
                            <span style={{ fontWeight: 600 }}>
                              {asg.my_submission.status === 'GRADED'
                                ? `⭐ Điểm: ${asg.my_submission.final_score}/${asg.total_points || 10}đ`
                                : `⏳ Điểm tạm tính: ${asg.my_submission.provisional_score || 0}đ`}
                            </span>
                            <span
                              style={{
                                fontSize: '11px',
                                color: asg.my_submission.timeliness === 'LATE' ? '#dc2626' : '#16a34a',
                              }}
                            >
                              {asg.my_submission.timeliness === 'LATE' ? 'Nộp muộn' : 'Đúng hạn'}
                            </span>
                          </div>
                          {asg.my_submission.overall_feedback && (
                            <div style={{ fontSize: '12px', color: '#0369a1', marginTop: '4px' }}>
                              💬 Nhận xét: "{asg.my_submission.overall_feedback}"
                            </div>
                          )}
                        </div>
                      ) : null}

                      <button
                        type="button"
                        className="btn-primary-orange"
                        style={{ width: '100%', fontSize: '13px', padding: '8px' }}
                        onClick={() => onSelectDoAssignment(asg)}
                      >
                        {asg.my_submission
                          ? asg.results_published_at ||
                            asg.my_submission.status === 'GRADED' ||
                            asg.allow_resubmission === false
                            ? '👁️ Xem bài đã nộp & Điểm'
                            : '🔄 Nộp lại bài'
                          : '✍️ Làm bài tập'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

