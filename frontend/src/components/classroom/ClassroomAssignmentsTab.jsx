import {
  Plus,
  Loader2,
  FileText,
  Sparkles,
  Clock,
  BarChart3,
  Pencil,
  Trash2,
  GraduationCap,
  Award,
  MessageSquare,
  Eye,
  RotateCcw,
  PenTool,
} from 'lucide-react';

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
            style={{ fontSize: '14px', padding: '9px 16px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            onClick={handleCreateClick}
            title={studentCount === 0 ? 'Lớp cần có ít nhất 1 học sinh để tạo bài tập' : 'Tạo bài tập mới'}
          >
            <Plus size={15} />
            <span>Tạo bài tập mới</span>
          </button>
        )}
      </div>

      {loadingAssignments ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <Loader2 size={18} className="spin" />
          <span>Đang tải bài tập...</span>
        </div>
      ) : assignments.length === 0 ? (
        <div className="classroom-empty-state" style={{ padding: '40px 20px' }}>
          <div className="empty-icon" style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
            <FileText size={44} color="#94a3b8" />
          </div>
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
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                ...(studentCount === 0 ? { opacity: 0.6, cursor: 'not-allowed' } : {}),
              }}
            >
              <Plus size={15} />
              <span>Tạo bài tập đầu tiên</span>
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
                      style={{
                        background: '#ecfdf5',
                        color: '#059669',
                        border: '1px solid #a7f3d0',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <Sparkles size={12} />
                      <span>AI sinh đề</span>
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

                <div className="assignment-due" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Clock size={13} color="#64748b" />
                  <span>
                    Hạn nộp: {asg.due_date ? new Date(asg.due_date).toLocaleString('vi-VN') : 'Không giới hạn'}
                  </span>
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
                    style={{ flex: 2, fontSize: '13px', padding: '8px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                    onClick={() => onSelectGrading(asg)}
                    title="Chấm điểm bài nộp (Gia sư)"
                  >
                    <BarChart3 size={14} />
                    <span>Chấm bài ({asg.submission_count || 0})</span>
                  </button>
                  <button
                    type="button"
                    className="btn-outline-gray"
                    style={{ flex: 1, fontSize: '13px', padding: '8px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                    onClick={() => onOpenEditAssignment(asg)}
                    title={asg.results_published_at ? 'Bài đã công bố điểm, chỉ xem/sửa thông tin chung' : 'Sửa đề bài'}
                  >
                    <Pencil size={13} />
                    <span>Sửa</span>
                  </button>
                  <button
                    type="button"
                    className="btn-outline-gray"
                    style={{ color: '#ef4444', fontSize: '13px', padding: '8px 10px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                    onClick={() => onDeleteAssignment(asg._id, asg.title)}
                    title="Xóa bài tập"
                  >
                    <Trash2 size={14} />
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
                          <div style={{ fontSize: '12px', color: '#166534', fontWeight: 600, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <GraduationCap size={13} />
                            <span>Bài làm của con: {asg.my_submission.student_user_id?.full_name || 'Học sinh'}</span>
                          </div>
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              fontSize: '13px',
                            }}
                          >
                            <span style={{ fontWeight: 700, color: '#15803d', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              {asg.my_submission.status === 'GRADED' ? (
                                <>
                                  <Award size={13} />
                                  <span>Điểm chính thức: {asg.my_submission.final_score}/{asg.total_points || 10}đ</span>
                                </>
                              ) : (
                                <>
                                  <Clock size={13} />
                                  <span>Điểm tạm tính: {asg.my_submission.provisional_score || 0}đ</span>
                                </>
                              )}
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
                            <div style={{ fontSize: '12px', color: '#0369a1', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <MessageSquare size={13} />
                              <span>Gia sư nhận xét: "{asg.my_submission.overall_feedback}"</span>
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
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <Clock size={13} />
                          <span>Con chưa nộp bài tập này</span>
                        </div>
                      )}

                      <button
                        type="button"
                        className="btn-outline-gray"
                        style={{ width: '100%', fontSize: '13px', padding: '8px', background: '#ffffff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                        onClick={() => onSelectDoAssignment(asg)}
                      >
                        <Eye size={14} />
                        <span>{asg.my_submission ? 'Xem bài làm của con & Điểm' : 'Xem đề bài tập'}</span>
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
                            <span style={{ fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              {asg.my_submission.status === 'GRADED' ? (
                                <>
                                  <Award size={13} color="#16a34a" />
                                  <span>Điểm: {asg.my_submission.final_score}/{asg.total_points || 10}đ</span>
                                </>
                              ) : (
                                <>
                                  <Clock size={13} />
                                  <span>Điểm tạm tính: {asg.my_submission.provisional_score || 0}đ</span>
                                </>
                              )}
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
                            <div style={{ fontSize: '12px', color: '#0369a1', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <MessageSquare size={13} />
                              <span>Nhận xét: "{asg.my_submission.overall_feedback}"</span>
                            </div>
                          )}
                        </div>
                      ) : null}

                      <button
                        type="button"
                        className="btn-primary-orange"
                        style={{ width: '100%', fontSize: '13px', padding: '8px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                        onClick={() => onSelectDoAssignment(asg)}
                      >
                        {asg.my_submission ? (
                          asg.results_published_at ||
                          asg.my_submission.status === 'GRADED' ||
                          asg.allow_resubmission === false ? (
                            <>
                              <Eye size={14} />
                              <span>Xem bài đã nộp & Điểm</span>
                            </>
                          ) : (
                            <>
                              <RotateCcw size={14} />
                              <span>Nộp lại bài</span>
                            </>
                          )
                        ) : (
                          <>
                            <PenTool size={14} />
                            <span>Làm bài tập</span>
                          </>
                        )}
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
