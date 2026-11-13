/* global fetch, AbortSignal */
/**
 * Integration Layer: GeminiClient (AI Provider)
 * Theo tài liệu đặc tả SRS: External service Google Gemini API cho tính năng sinh đề bài tập.
 */

const GEMINI_MODEL = 'gemini-3.5-flash';

/**
 * Gọi Google Gemini API để tạo câu hỏi bài tập tự động
 * @param {Object} options - { topic, grade, difficulty, num_questions, material_title }
 * @returns {Promise<{ title: string, instructions: string, questions: Array } | null>}
 */
export const generateAssignmentWithGemini = async ({
  topic,
  grade = 'Lớp 10',
  difficulty = 'MEDIUM',
  num_questions = 3,
  material_title = null,
}) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || !apiKey.trim()) {
    console.warn('[GeminiClient] Chưa cấu hình GEMINI_API_KEY trong .env. Sử dụng bộ tạo đề nội bộ.');
    return null;
  }

  const diffLabel = difficulty === 'EASY' ? 'Cơ bản' : difficulty === 'HARD' ? 'Nâng cao' : 'Trung bình';
  const effectiveTopic = (material_title || topic || '').trim();
  const count = Math.min(Math.max(parseInt(num_questions, 10) || 3, 1), 10);

  const prompt = `
Bạn là một trợ lý giáo viên chuyên nghiệp, phụ trách thiết kế đề bài tập cho học sinh tại Việt Nam.
Nhiệm vụ của bạn là tạo chính xác ${count} câu hỏi bài tập bám sát thông tin sau:
- Môn học / Chủ đề bài học: "${effectiveTopic}"
${material_title ? `- Dựa trên nội dung tài liệu: "${material_title}"` : ''}
- Khối lớp: "${grade}"
- Mức độ khó: "${diffLabel}"

Cấu trúc phân bổ câu hỏi:
1. Câu 1 đến câu ${Math.max(1, count - 2)}: Là dạng trắc nghiệm MULTIPLE_CHOICE, có 4 phương án lựa chọn [A, B, C, D] với nội dung chi tiết, và chỉ định rõ đáp án đúng correct_answer ("A", "B", "C" hoặc "D").
2. Câu tiếp theo: Là dạng tự luận ngắn SHORT_ANSWER, yêu cầu tính toán hoặc giải thích ngắn gọn, có đáp án chuẩn/gợi ý chấm điểm correct_answer.
3. Câu cuối cùng (nếu số câu >= 3): Là dạng bài tập vận dụng nộp tệp FILE_UPLOAD, yêu cầu học sinh giải chi tiết ra giấy rồi chụp ảnh hoặc nộp file tài liệu.

YÊU CẦU ĐỊNH DẠNG ĐẦU RA:
Bắt buộc trả về đúng định dạng JSON object sau (không có bất kỳ lời giải thích nào khác ngoài JSON):
{
  "title": "Tiêu đề bài tập ngắn gọn, trang trọng",
  "instructions": "Hướng dẫn chi tiết cho học sinh khi làm bài",
  "questions": [
    {
      "question_number": 1,
      "question_type": "MULTIPLE_CHOICE",
      "content": "Nội dung câu hỏi trắc nghiệm",
      "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
      "correct_answer": "A",
      "points": 3
    },
    {
      "question_number": 2,
      "question_type": "SHORT_ANSWER",
      "content": "Nội dung câu hỏi tự luận ngắn",
      "options": [],
      "correct_answer": "Gợi ý đáp án chuẩn",
      "points": 3
    },
    {
      "question_number": 3,
      "question_type": "FILE_UPLOAD",
      "content": "Đề bài tự luận vận dụng yêu cầu nộp tệp bài làm",
      "options": [],
      "correct_answer": "",
      "points": 4
    }
  ]
}
`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey.trim()}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.7,
        },
      }),
      signal: AbortSignal.timeout(15000), // Timeout 15s
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn(`[GeminiClient] Lỗi từ Google Gemini (${response.status}):`, errText.slice(0, 200));
      return null;
    }

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) return null;

    const parsed = JSON.parse(rawText);
    if (!Array.isArray(parsed.questions) || parsed.questions.length === 0) {
      return null;
    }

    // Chuẩn hóa và làm sạch mảng câu hỏi
    const questions = parsed.questions.map((q, idx) => ({
      question_number: idx + 1,
      question_type: q.question_type || (q.options?.length === 4 ? 'MULTIPLE_CHOICE' : 'SHORT_ANSWER'),
      content: q.content || '',
      options: Array.isArray(q.options) && q.options.length === 4 ? q.options : (q.question_type === 'MULTIPLE_CHOICE' ? ['', '', '', ''] : []),
      correct_answer: q.correct_answer || (q.question_type === 'MULTIPLE_CHOICE' ? 'A' : ''),
      points: Number(q.points) > 0 ? Number(q.points) : (idx === 0 ? 3 : 2),
    }));

    return {
      title: parsed.title || `Bài tập rèn luyện: ${effectiveTopic}`,
      instructions: parsed.instructions || `Đề bài được tạo tự động bởi Trợ lý AI Google Gemini (${diffLabel}, ${grade}). Các em vui lòng hoàn thành bài tập đúng hạn.`,
      questions,
    };
  } catch (error) {
    console.warn('[GeminiClient] Không thể gọi Gemini API, chuyển sang chế độ dự phòng:', error.message);
    return null;
  }
};

