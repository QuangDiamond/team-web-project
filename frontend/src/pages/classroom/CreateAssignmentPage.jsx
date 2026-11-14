import { toast } from 'sonner';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Sparkles,
  Loader2,
  Plus,
  Trash2,
  Save,
  Send,
  AlertTriangle,
  ExternalLink,
  Lock,
  ClipboardList,
  BookOpen,
  FileText,
} from 'lucide-react';
import {
  getClassroomDetail,
  getClassAssignments,
  getClassMaterials,
  getClassTopics,
  createAssignment,
  updateAssignment,
  generateAiQuestions,
} from '../../services/classroomService';
import './classroom.css';

export default function CreateAssignmentPage() {
  const { id: classroomId, assignmentId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const isEditing = Boolean(assignmentId);
  const [classroom, setClassroom] = useState(null);
  const [studentCount, setStudentCount] = useState(0);
  const [loadingData, setLoadingData] = useState(true);

  // Topics and Materials in classroom
  const [topics, setTopics] = useState([]);
  const [materials, setMaterials] = useState([]);

  // Topic Source Selector: 'TOPIC' | 'MATERIAL' | 'CUSTOM'
  const [topicSource, setTopicSource] = useState('TOPIC');
  const [selectedTopicId, setSelectedTopicId] = useState('');
  const [selectedMaterialId, setSelectedMaterialId] = useState('');

  const [title, setTitle] = useState('');
  const [instructions, setInstructions] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [totalPoints, setTotalPoints] = useState(10);
  const [allowLate, setAllowLate] = useState(true);
  const [allowResubmission, setAllowResubmission] = useState(true);
  const [status, setStatus] = useState('PUBLISHED');
  const [isAiGenerated, setIsAiGenerated] = useState(false);
  const [isQuestionLocked, setIsQuestionLocked] = useState(false);

  // AI Generator state
  const [showAiPrompt, setShowAiPrompt] = useState(
    Boolean(searchParams.get('materialId') || searchParams.get('materialTitle') || searchParams.get('topic'))
  );
  const [aiLoading, setAiLoading] = useState(false);
  const [aiTopic, setAiTopic] = useState(
    searchParams.get('materialTitle') || searchParams.get('topic') || ''
  );
  const [aiGrade, setAiGrade] = useState('Lớp 10');
  const [aiDifficulty, setAiDifficulty] = useState('MEDIUM');
  const [aiNumQuestions, setAiNumQuestions] = useState(3);
  const [aiSimulateTimeout, setAiSimulateTimeout] = useState(false);
  const [aiError, setAiError] = useState(null);

  // Questions state
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

  // Load classroom, topics, materials, and existing assignment (if editing)
  const loadInitialData = useCallback(async () => {
    try {
      setLoadingData(true);
      setError('');
      const classRes = await getClassroomDetail(classroomId);
      const cls = classRes?.data;
      setClassroom(cls);

      if (cls?.grade) {
        setAiGrade(cls.grade);
      }
      if (cls?.student_count !== undefined) {
        setStudentCount(cls.student_count);
      }

      // Tải danh sách chủ đề trong lớp
      let topicList = [];
      try {
        const topRes = await getClassTopics(classroomId);
        topicList = Array.isArray(topRes?.data?.items)
          ? topRes.data.items
          : Array.isArray(topRes?.data)
          ? topRes.data
          : Array.isArray(cls?.topics)
          ? cls.topics
          : [];
        setTopics(topicList);
      } catch {
        if (Array.isArray(cls?.topics)) {
          topicList = cls.topics;
          setTopics(topicList);
        }
      }

      // Tải danh sách tài liệu trong lớp
      let matList = [];
      try {
        const matRes = await getClassMaterials(classroomId);
        matList = Array.isArray(matRes?.data?.items)
          ? matRes.data.items
          : Array.isArray(matRes?.data)
          ? matRes.data
          : [];
        setMaterials(matList);
      } catch (matErr) {
        console.error('Không thể tải tài liệu lớp học:', matErr);
      }

      // Xử lý các query params khi chuyển đến từ mục "Tài liệu & Chủ đề"
      const urlMaterialId = searchParams.get('materialId');
      const urlMaterialTitle = searchParams.get('materialTitle');
      const urlTopic = searchParams.get('topic');

      if (urlMaterialId || urlMaterialTitle) {
        setTopicSource('MATERIAL');
        const matchedMat = matList.find((m) => m._id === urlMaterialId);
        const matTitle = matchedMat?.title || urlMaterialTitle;
        setSelectedMaterialId(urlMaterialId || (matchedMat ? matchedMat._id : ''));
        setShowAiPrompt(true);
        if (matTitle) {
          setAiTopic(matTitle);
          setTitle((prev) => prev || `Bài tập theo tài liệu: ${matTitle}`);
          setInstructions(
            (prev) =>
              prev ||
              `Đề bài được tạo dựa trên nội dung tài liệu "${matTitle}". Các em hãy ôn tập kỹ tài liệu trước khi làm bài.`
          );
        }
      } else if (urlTopic) {
        setTopicSource('TOPIC');
        setShowAiPrompt(true);
        setAiTopic(urlTopic);
        const matchedTopic = topicList.find(
          (t) => t.name === urlTopic || t._id === urlTopic
        );
        if (matchedTopic) {
          setSelectedTopicId(matchedTopic._id || matchedTopic.name);
        }
        setTitle((prev) => prev || `Bài tập theo chủ đề: ${urlTopic}`);
        setInstructions(
          (prev) =>
            prev ||
            `Bài tập rèn luyện cho chủ đề "${urlTopic}". Các em hãy xem lại kiến thức trước khi làm bài.`
        );
      } else {
        if (topicList.length > 0) {
          setTopicSource('TOPIC');
        } else if (matList.length > 0) {
          setTopicSource('MATERIAL');
        } else {
          setTopicSource('CUSTOM');
        }
      }

      // If editing existing assignment
      if (assignmentId) {
        const asgRes = await getClassAssignments(classroomId);
        const list = Array.isArray(asgRes?.data) ? asgRes.data : [];
        const existing = list.find((a) => a._id === assignmentId);
        if (existing) {
          setTitle(existing.title || '');
          setInstructions(existing.instructions || '');
          setDueDate(formatDateForInput(existing.due_date));
          setTotalPoints(existing.total_points || 10);
          setAllowLate(existing.allow_late_submission !== false);
          setAllowResubmission(existing.allow_resubmission !== false);
          setStatus(existing.status || 'PUBLISHED');
          setIsAiGenerated(Boolean(existing.is_ai_generated));
          setIsQuestionLocked(Boolean(existing.results_published_at));

          // If assignment has linked material
          if (Array.isArray(existing.attachments) && existing.attachments.length > 0) {
            const firstAttachment = existing.attachments[0];
            const matId = firstAttachment.material_id?._id || firstAttachment.material_id;
            if (matId) {
              setSelectedMaterialId(String(matId));
              setTopicSource('MATERIAL');
            }
          }

          if (Array.isArray(existing.questions) && existing.questions.length > 0) {
            setQuestions(
              existing.questions.map((q) => ({
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
          setError('Không tìm thấy bài tập cần chỉnh sửa.');
        }
      }
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Không thể tải thông tin lớp học.');
    } finally {
      setLoadingData(false);
    }
  }, [classroomId, assignmentId, searchParams]);

  useEffect(() => {
    if (classroomId) {
      loadInitialData();
    }
  }, [classroomId, loadInitialData]);

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

  const updateTitleAndInstructions = (source, name) => {
    if (!name) return;
    setTitle((prev) => {
      if (!prev || prev.startsWith('Bài tập theo ') || prev.startsWith('Bài tập rèn luyện:')) {
        return source === 'MATERIAL' ? `Bài tập theo tài liệu: ${name}` : `Bài tập theo chủ đề: ${name}`;
      }
      return prev;
    });
    setInstructions((prev) => {
      if (
        !prev ||
        prev.includes('Trợ lý AI') ||
        prev.includes('Bài tập rèn luyện cho') ||
        prev.includes('Đề bài được tạo dựa trên')
      ) {
        return source === 'MATERIAL'
          ? `Đề bài được tạo dựa trên nội dung tài liệu "${name}". Các em hãy ôn tập kỹ tài liệu trước khi làm bài.`
          : `Bài tập rèn luyện cho chủ đề "${name}". Các em hãy xem lại kiến thức trước khi làm bài.`;
      }
      return prev;
    });
  };

  const handleSwitchTopicSource = (source) => {
    setTopicSource(source);
    if (source === 'TOPIC') {
      setSelectedMaterialId('');
      if (selectedTopicId) {
        const t = topics.find((item) => item._id === selectedTopicId || item.name === selectedTopicId);
        if (t) {
          setAiTopic(t.name);
          updateTitleAndInstructions('TOPIC', t.name);
        }
      }
    } else if (source === 'MATERIAL') {
      setSelectedTopicId('');
      if (selectedMaterialId) {
        const m = materials.find((item) => item._id === selectedMaterialId);
        if (m) {
          setAiTopic(m.title);
          updateTitleAndInstructions('MATERIAL', m.title);
        }
      }
    } else {
      setSelectedTopicId('');
      setSelectedMaterialId('');
    }
  };

  const handleSelectTopic = (topicId) => {
    setSelectedTopicId(topicId);
    if (!topicId) return;
    const selected = topics.find((t) => t._id === topicId || t.name === topicId);
    if (selected) {
      setAiTopic(selected.name);
      updateTitleAndInstructions('TOPIC', selected.name);
    }
  };

  const handleSelectMaterial = (matId) => {
    setSelectedMaterialId(matId);
    if (!matId) return;
    const selected = materials.find((m) => m._id === matId);
    if (selected) {
      setAiTopic(selected.title || '');
      updateTitleAndInstructions('MATERIAL', selected.title || '');
    }
  };

  const handleCustomTopicChange = (val) => {
    setAiTopic(val);
    if (val && (!title || title.startsWith('Bài tập theo ') || title.startsWith('Bài tập rèn luyện:'))) {
      setTitle(`Bài tập rèn luyện: ${val}`);
    }
  };

  const renderTopicSelectorBar = (isAi = false) => (
    <div
      style={{
        background: isAi ? '#ffffff' : '#f8fafc',
        border: isAi ? '1px solid #fdba74' : '1px solid #e2e8f0',
        borderRadius: '10px',
        padding: '14px 16px',
        marginBottom: '16px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
        <label style={{ fontSize: '13px', fontWeight: 600, color: isAi ? '#9a3412' : '#334155', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
          <BookOpen size={15} color="#ea580c" />
          <span>Thanh chọn nguồn chủ đề & tài liệu (Topic / Material):</span>
        </label>
        <span style={{ fontSize: '12px', color: '#64748b' }}>
          {topicSource === 'TOPIC'
            ? `Chủ đề trong lớp (${topics.length})`
            : topicSource === 'MATERIAL'
            ? `Tài liệu trong lớp (${materials.length})`
            : 'Tự nhập chủ đề riêng'}
        </span>
      </div>

      {/* 3 Pill Tabs */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => handleSwitchTopicSource('TOPIC')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 14px',
            borderRadius: '8px',
            border: topicSource === 'TOPIC' ? '1px solid #ea580c' : '1px solid #cbd5e1',
            background: topicSource === 'TOPIC' ? '#ea580c' : '#ffffff',
            color: topicSource === 'TOPIC' ? '#ffffff' : '#334155',
            fontSize: '13px',
            fontWeight: topicSource === 'TOPIC' ? 600 : 500,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <BookOpen size={14} />
          <span>Từ Chủ đề ({topics.length})</span>
        </button>

        <button
          type="button"
          onClick={() => handleSwitchTopicSource('MATERIAL')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 14px',
            borderRadius: '8px',
            border: topicSource === 'MATERIAL' ? '1px solid #ea580c' : '1px solid #cbd5e1',
            background: topicSource === 'MATERIAL' ? '#ea580c' : '#ffffff',
            color: topicSource === 'MATERIAL' ? '#ffffff' : '#334155',
            fontSize: '13px',
            fontWeight: topicSource === 'MATERIAL' ? 600 : 500,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <FileText size={14} />
          <span>Từ Tài liệu ({materials.length})</span>
        </button>

        <button
          type="button"
          onClick={() => handleSwitchTopicSource('CUSTOM')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 14px',
            borderRadius: '8px',
            border: topicSource === 'CUSTOM' ? '1px solid #ea580c' : '1px solid #cbd5e1',
            background: topicSource === 'CUSTOM' ? '#ea580c' : '#ffffff',
            color: topicSource === 'CUSTOM' ? '#ffffff' : '#334155',
            fontSize: '13px',
            fontWeight: topicSource === 'CUSTOM' ? 600 : 500,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <Sparkles size={14} />
          <span>Tự nhập chủ đề khác</span>
        </button>
      </div>

      {/* Tab 1: Topic Dropdown */}
      {topicSource === 'TOPIC' && (
        <div>
          {topics.length > 0 ? (
            <div>
              <select
                value={selectedTopicId}
                onChange={(e) => handleSelectTopic(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  background: '#ffffff',
                }}
              >
                <option value="">-- Chọn một chủ đề đã tạo trong lớp --</option>
                {topics.map((t, idx) => (
                  <option key={t._id || idx} value={t._id || t.name}>
                    Chủ đề {idx + 1}: {t.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div style={{ padding: '9px 12px', background: '#f8fafc', borderRadius: '6px', border: '1px dashed #cbd5e1', fontSize: '13px', color: '#64748b' }}>
              Lớp chưa có chủ đề nào được tạo. Bạn có thể chọn <strong>"Từ Tài liệu"</strong> hoặc <strong>"Tự nhập chủ đề khác"</strong>.
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Material Dropdown */}
      {topicSource === 'MATERIAL' && (
        <div>
          {materials.length > 0 ? (
            <div>
              <select
                value={selectedMaterialId}
                onChange={(e) => handleSelectMaterial(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  background: '#ffffff',
                }}
              >
                <option value="">-- Chọn một tài liệu đã tải lên trong lớp --</option>
                {materials.map((m) => (
                  <option key={m._id} value={m._id}>
                    [{m.material_type || m.type || 'TÀI LIỆU'}] {m.title}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div style={{ padding: '9px 12px', background: '#f8fafc', borderRadius: '6px', border: '1px dashed #cbd5e1', fontSize: '13px', color: '#64748b' }}>
              Lớp chưa có tài liệu nào. Bạn có thể chọn <strong>"Từ Chủ đề"</strong> hoặc <strong>"Tự nhập chủ đề khác"</strong>.
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Custom Topic input */}
      {topicSource === 'CUSTOM' && (
        <div>
          <input
            type="text"
            placeholder="Ví dụ: Đạo hàm hàm số lượng giác, Ôn tập giữa kỳ..."
            value={aiTopic}
            onChange={(e) => handleCustomTopicChange(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 12px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '13px',
              background: '#ffffff',
            }}
          />
        </div>
      )}

      {/* Selected Indicator / Tag */}
      {aiTopic && (
        <div
          style={{
            marginTop: '10px',
            padding: '8px 12px',
            borderRadius: '6px',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            background: topicSource === 'MATERIAL' ? '#fffbeb' : topicSource === 'TOPIC' ? '#eff6ff' : '#f8fafc',
            border: `1px solid ${topicSource === 'MATERIAL' ? '#fde68a' : topicSource === 'TOPIC' ? '#bfdbfe' : '#e2e8f0'}`,
            color: topicSource === 'MATERIAL' ? '#92400e' : topicSource === 'TOPIC' ? '#1e40af' : '#334155',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {topicSource === 'MATERIAL' ? <FileText size={15} color="#ea580c" /> : <BookOpen size={15} color="#0284c7" />}
            <span>
              {topicSource === 'MATERIAL' ? 'Tài liệu đang chọn: ' : topicSource === 'TOPIC' ? 'Chủ đề đang chọn: ' : 'Chủ đề: '}
              <strong>{aiTopic}</strong>
            </span>
          </div>
          {(selectedMaterialId || selectedTopicId) && (
            <button
              type="button"
              onClick={() => {
                setSelectedMaterialId('');
                setSelectedTopicId('');
                setAiTopic('');
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#64748b',
                cursor: 'pointer',
                fontSize: '12px',
                textDecoration: 'underline',
              }}
            >
              Bỏ chọn
            </button>
          )}
        </div>
      )}
    </div>
  );

  // AI question generator (UC26 Cases 5.2, 5.3, 5.4)
  const handleGenerateAiQuestions = async () => {
    if (!aiTopic.trim()) {
      setAiError({ type: 'VALIDATION', message: 'Vui lòng nhập chủ đề hoặc chọn tài liệu cần tạo câu hỏi bằng AI' });
      return;
    }

    try {
      setAiLoading(true);
      setAiError(null);

      const matchedMat = materials.find((m) => m._id === selectedMaterialId);
      const res = await generateAiQuestions({
        topic: aiTopic.trim(),
        grade: aiGrade,
        difficulty: aiDifficulty,
        num_questions: parseInt(aiNumQuestions, 10) || 3,
        simulate_timeout: Boolean(aiSimulateTimeout),
        material_id: selectedMaterialId || null,
        material_title: matchedMat?.title || null,
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
        setStatus('DRAFT');
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
      return setError('Vui lòng nhập tiêu đề bài tập');
    }

    if (submitStatus === 'PUBLISHED') {
      if (studentCount === 0) {
        return setError('Lớp học chưa có học sinh nào tham gia. Không thể xuất bản bài tập khi lớp chưa có học sinh.');
      }

      if (!isQuestionLocked && Array.isArray(questions)) {
        for (let i = 0; i < questions.length; i++) {
          const q = questions[i];
          if (q.question_type === 'MULTIPLE_CHOICE') {
            if (!q.correct_answer || !String(q.correct_answer).trim()) {
              return setError(`Câu hỏi trắc nghiệm số ${i + 1} chưa có đáp án đúng (answer key). Vui lòng chọn đáp án trước khi xuất bản.`);
            }
          }
        }
      }
    }

    if (dueDate) {
      const d = new Date(dueDate);
      if (isNaN(d.getTime())) {
        return setError('Hạn nộp bài (due date) không hợp lệ');
      }
      if (d.getTime() < Date.now() - 60000) {
        return setError('Hạn nộp bài không được ở trong quá khứ. Vui lòng chọn thời điểm trong tương lai.');
      }
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

      payload.attachments = selectedMaterialId ? [{ material_id: selectedMaterialId }] : [];

      if (!isQuestionLocked) {
        payload.questions = questions;
      }

      if (isEditing) {
        await updateAssignment(assignmentId, payload);
      } else {
        await createAssignment(classroomId, payload);
      }

      navigate(`/tutor/classes/${classroomId}?tab=assignments`, {
        state: {
          activeTab: 'assignments',
          toastMessage: submitStatus === 'PUBLISHED' ? 'Tạo và xuất bản bài tập thành công!' : 'Đã lưu bản nháp bài tập!',
        },
      });
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || 'Không thể lưu bài tập');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingData) {
    return (
      <div className="classroom-container" style={{ padding: '60px 20px', textAlign: 'center' }}>
        <Loader2 size={32} className="spin" style={{ margin: '0 auto 12px auto', color: '#e85a2c' }} />
        <p style={{ color: '#64748b' }}>Đang tải thông tin lớp học...</p>
      </div>
    );
  }

  return (
    <div className="classroom-container" style={{ maxWidth: '960px', margin: '0 auto', padding: '24px 16px' }}>

      {/* Breadcrumb & Navigation */}
      <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <Link
          to={`/tutor/classes/${classroomId}?tab=assignments`}
          className="btn-outline-gray"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', padding: '8px 14px', textDecoration: 'none' }}
        >
          <ArrowLeft size={16} />
          <span>Quay lại chi tiết lớp học</span>
        </Link>

        {classroom && (
          <span style={{ fontSize: '13px', color: '#64748b' }}>
            Lớp: <strong>{classroom.name}</strong> • Môn {classroom.subject} ({classroom.grade})
          </span>
        )}
      </div>

      {/* Header */}
      <div className="classroom-header" style={{ marginBottom: '24px' }}>
        <div className="classroom-header-info">
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '24px' }}>
            <ClipboardList size={28} style={{ color: '#e85a2c' }} />
            <span>{isEditing ? 'Chỉnh sửa bài tập' : 'Tạo bài tập mới'}</span>
          </h1>
          <p>
            {isEditing
              ? 'Cập nhật nội dung câu hỏi, thời hạn nộp hoặc điều chỉnh điểm số của bài tập.'
              : 'Thiết kế bài tập trắc nghiệm, tự luận, tải tệp hoặc sinh câu hỏi tự động với Trợ lý AI.'}
          </p>
        </div>
      </div>

      {error && (
        <div className="error-alert" style={{ marginBottom: '20px' }}>
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* AI Assistant Section */}
      {!isEditing && (
        <div
          style={{
            background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
            border: '1px solid #fed7aa',
            borderRadius: '12px',
            padding: '18px 20px',
            marginBottom: '24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: '#ea580c',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                }}
              >
                <Sparkles size={20} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '15px', color: '#9a3412', fontWeight: 600 }}>
                  Trợ lý AI tạo đề tự động
                </h4>
                <p style={{ margin: 0, fontSize: '13px', color: '#c2410c' }}>
                  Nhập chủ đề và độ khó, AI sẽ tạo sẵn bộ câu hỏi trắc nghiệm & tự luận để bạn chỉnh sửa.
                </p>
              </div>
            </div>

            <button
              type="button"
              className={showAiPrompt ? 'btn-outline-gray' : 'btn-primary-orange'}
              style={{ fontSize: '13px', padding: '8px 14px' }}
              onClick={() => setShowAiPrompt(!showAiPrompt)}
            >
              {showAiPrompt ? 'Ẩn bảng AI' : 'Mở trợ lý AI'}
            </button>
          </div>

          {showAiPrompt && (
            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #fdba74' }}>
              {aiError && (
                <div
                  style={{
                    background: aiError.type === 'QUOTA' ? '#fee2e2' : '#fef3c7',
                    border: `1px solid ${aiError.type === 'QUOTA' ? '#fca5a5' : '#fcd34d'}`,
                    borderRadius: '8px',
                    padding: '12px 14px',
                    marginBottom: '14px',
                    fontSize: '13px',
                    color: aiError.type === 'QUOTA' ? '#991b1b' : '#92400e',
                  }}
                >
                  <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <AlertTriangle size={15} />
                    <span>{aiError.message}</span>
                  </div>
                  {aiError.type === 'QUOTA' && (
                    <div style={{ marginTop: '8px' }}>
                      <Link
                        to="/tutor/checkout"
                        className="btn-primary-orange"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '12px',
                          padding: '6px 12px',
                          textDecoration: 'none',
                        }}
                      >
                        <span>Nâng cấp gói PRO không giới hạn</span>
                        <ExternalLink size={13} />
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {/* Thanh chọn nguồn chủ đề & tài liệu cho Trợ lý AI */}
              {renderTopicSelectorBar(true)}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#431407' }}>Khối lớp:</label>
                  <input
                    type="text"
                    placeholder="Lớp 10, Lớp 11..."
                    value={aiGrade}
                    onChange={(e) => setAiGrade(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#431407' }}>Độ khó:</label>
                  <select value={aiDifficulty} onChange={(e) => setAiDifficulty(e.target.value)}>
                    <option value="EASY">Cơ bản</option>
                    <option value="MEDIUM">Trung bình</option>
                    <option value="HARD">Nâng cao</option>
                  </select>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#431407' }}>Số lượng câu:</label>
                  <select value={aiNumQuestions} onChange={(e) => setAiNumQuestions(e.target.value)}>
                    <option value="3">3 câu (1 MCQ + 1 tự luận + 1 nộp tệp)</option>
                    <option value="5">5 câu</option>
                    <option value="7">7 câu</option>
                    <option value="10">10 câu</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#7c2d12', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={aiSimulateTimeout}
                    onChange={(e) => setAiSimulateTimeout(e.target.checked)}
                  />
                  <span>Mô phỏng timeout để kiểm tra hoàn trả quota (Case 5.4)</span>
                </label>

                <button
                  type="button"
                  className="btn-primary-orange"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', fontSize: '13px' }}
                  onClick={handleGenerateAiQuestions}
                  disabled={aiLoading}
                >
                  {aiLoading ? (
                    <>
                      <Loader2 size={14} className="spin" />
                      <span>Đang tạo đề mẫu...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} />
                      <span>Sinh câu hỏi ngay</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Assignment Form */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#0f172a' }}>1. Thông tin chung bài tập</h3>

        {/* Thanh chọn Topic & Material */}
        {renderTopicSelectorBar(false)}

        <div className="form-group">
          <label htmlFor="title">
            Tiêu đề bài tập <span className="required">*</span>
          </label>
          <input
            type="text"
            id="title"
            placeholder="Ví dụ: Bài tập rèn luyện cuối tuần Chương 1..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="instructions">Hướng dẫn làm bài / Yêu cầu</label>
          <textarea
            id="instructions"
            rows="3"
            placeholder="Ghi chú thêm cho học sinh (thời gian làm bài, được dùng tài liệu hay không...)"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="dueDate">Hạn nộp bài (Due Date)</label>
            <input
              type="datetime-local"
              id="dueDate"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="totalPoints">Thang điểm tối đa</label>
            <input
              type="number"
              id="totalPoints"
              min="1"
              max="100"
              value={totalPoints}
              onChange={(e) => setTotalPoints(e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', marginTop: '8px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: '#334155' }}>
            <input
              type="checkbox"
              checked={allowLate}
              onChange={(e) => setAllowLate(e.target.checked)}
            />
            <span>Cho phép nộp muộn (sau hạn vẫn nộp được và đánh dấu Late)</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: '#334155' }}>
            <input
              type="checkbox"
              checked={allowResubmission}
              onChange={(e) => setAllowResubmission(e.target.checked)}
            />
            <span>Cho phép nộp lại bài làm (giữ bản mới nhất trước hạn)</span>
          </label>
        </div>
      </div>

      {/* Questions Section */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a' }}>
              2. Danh sách câu hỏi ({questions.length})
            </h3>
            {isQuestionLocked && (
              <span style={{ fontSize: '12px', color: '#dc2626', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                <Lock size={13} /> Bài tập đã công bố kết quả, câu hỏi đang ở chế độ khóa để bảo toàn dữ liệu.
              </span>
            )}
          </div>

          {!isQuestionLocked && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn-outline-gray"
                style={{ fontSize: '13px', padding: '6px 12px' }}
                onClick={() => handleAddQuestion('MULTIPLE_CHOICE')}
              >
                + Trắc nghiệm (MCQ)
              </button>
              <button
                type="button"
                className="btn-outline-gray"
                style={{ fontSize: '13px', padding: '6px 12px' }}
                onClick={() => handleAddQuestion('SHORT_ANSWER')}
              >
                + Tự luận ngắn
              </button>
              <button
                type="button"
                className="btn-outline-gray"
                style={{ fontSize: '13px', padding: '6px 12px' }}
                onClick={() => handleAddQuestion('FILE_UPLOAD')}
              >
                + Nộp tệp / Tự luận dài
              </button>
            </div>
          )}
        </div>

        {questions.map((q, idx) => (
          <div
            key={idx}
            style={{
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              padding: '16px',
              marginBottom: '16px',
              background: '#f8fafc',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    background: '#e2e8f0',
                    color: '#334155',
                    fontSize: '13px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {idx + 1}
                </span>

                <select
                  value={q.question_type}
                  onChange={(e) => handleQuestionChange(idx, 'question_type', e.target.value)}
                  disabled={isQuestionLocked}
                  style={{ width: 'auto', padding: '4px 8px', fontSize: '13px' }}
                >
                  <option value="MULTIPLE_CHOICE">Trắc nghiệm (MCQ)</option>
                  <option value="SHORT_ANSWER">Tự luận ngắn</option>
                  <option value="FILE_UPLOAD">Nộp tệp / File đính kèm</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: '#64748b' }}>
                  <span>Điểm:</span>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={q.points || 2}
                    onChange={(e) => handleQuestionChange(idx, 'points', parseInt(e.target.value, 10) || 1)}
                    disabled={isQuestionLocked}
                    style={{ width: '60px', padding: '4px 6px', fontSize: '13px' }}
                  />
                </label>

                {!isQuestionLocked && questions.length > 1 && (
                  <button
                    type="button"
                    style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                    onClick={() => handleRemoveQuestion(idx)}
                    title="Xóa câu hỏi này"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '13px' }}>Nội dung câu hỏi <span className="required">*</span></label>
              <textarea
                rows="2"
                placeholder="Nhập đề bài hoặc yêu cầu câu hỏi..."
                value={q.content}
                onChange={(e) => handleQuestionChange(idx, 'content', e.target.value)}
                disabled={isQuestionLocked}
              />
            </div>

            {/* MCQ Options & Answer Key */}
            {q.question_type === 'MULTIPLE_CHOICE' && (
              <div style={{ background: '#ffffff', borderRadius: '8px', padding: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
                  Các phương án lựa chọn (Chọn nút tròn để đặt đáp án đúng):
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
                  {['A', 'B', 'C', 'D'].map((letter, optIdx) => (
                    <div key={letter} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontWeight: 600, minWidth: '40px' }}>
                        <input
                          type="radio"
                          name={`correct_${idx}`}
                          checked={q.correct_answer === letter}
                          onChange={() => handleQuestionChange(idx, 'correct_answer', letter)}
                          disabled={isQuestionLocked}
                        />
                        <span>{letter}.</span>
                      </label>
                      <input
                        type="text"
                        placeholder={`Nội dung phương án ${letter}...`}
                        value={q.options?.[optIdx] || ''}
                        onChange={(e) => handleOptionChange(idx, optIdx, e.target.value)}
                        disabled={isQuestionLocked}
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          fontSize: '13px',
                          background: isQuestionLocked ? '#f8fafc' : '#ffffff',
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Short Answer Key */}
            {q.question_type === 'SHORT_ANSWER' && (
              <div style={{ background: '#ffffff', borderRadius: '8px', padding: '14px', border: '1px solid #e2e8f0' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '8px' }}>
                  Đáp án chuẩn / Gợi ý chấm điểm:
                </label>
                <textarea
                  rows="2"
                  placeholder="Nhập đáp án chuẩn, công thức hoặc từ khóa chấm điểm..."
                  value={q.correct_answer || ''}
                  onChange={(e) => handleQuestionChange(idx, 'correct_answer', e.target.value)}
                  disabled={isQuestionLocked}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    lineHeight: '1.5',
                    background: isQuestionLocked ? '#f8fafc' : '#ffffff',
                    resize: 'vertical',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                  }}
                />
                <span style={{ fontSize: '12px', color: '#64748b', marginTop: '6px', display: 'block' }}>
                  Gợi ý đáp án này dùng để đối chiếu khi gia sư chấm bài tự luận của học sinh.
                </span>
              </div>
            )}

            {/* File Upload Note */}
            {q.question_type === 'FILE_UPLOAD' && (
              <div style={{ background: '#f0fdf4', borderRadius: '8px', padding: '12px', border: '1px solid #bbf7d0', fontSize: '13px', color: '#166534' }}>
                Học sinh sẽ được yêu cầu đính kèm tệp làm bài (hình ảnh, tài liệu PDF, Word tối đa 20MB). Bạn sẽ chấm điểm trực tiếp và viết phản hồi sau khi học sinh nộp bài.
              </div>
            )}
          </div>
        ))}

        {!isQuestionLocked && (
          <button
            type="button"
            className="btn-outline-gray"
            style={{ width: '100%', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            onClick={() => handleAddQuestion('MULTIPLE_CHOICE')}
          >
            <Plus size={16} />
            <span>Thêm câu hỏi mới</span>
          </button>
        )}
      </div>

      {/* Sticky Bottom Actions Bar */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
        }}
      >
        <button
          type="button"
          className="btn-outline-gray"
          onClick={() => navigate(`/tutor/classes/${classroomId}?tab=assignments`)}
          disabled={submitting}
        >
          Hủy bỏ
        </button>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            className="btn-outline-gray"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 16px' }}
            onClick={() => handleSubmit('DRAFT')}
            disabled={submitting}
          >
            <Save size={15} />
            <span>{submitting ? 'Đang lưu...' : 'Lưu bản nháp'}</span>
          </button>

          <button
            type="button"
            className="btn-primary-orange"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 20px' }}
            onClick={() => handleSubmit('PUBLISHED')}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 size={15} className="spin" />
                <span>Đang xử lý...</span>
              </>
            ) : (
              <>
                <Send size={15} />
                <span>Giao bài ngay</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

