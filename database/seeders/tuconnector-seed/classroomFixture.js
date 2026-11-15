// Dữ liệu demo lớp học: học sinh (có / không có phụ huynh), lớp học của các gia sư demo và thành viên lớp.
// Dùng chung id với marketplaceFixture (demo.tutorXX, demo.parentXX). Mật khẩu học sinh: Abc123456!
const { createHash } = require('crypto');
const { ObjectId } = require('mongodb');

const demoId = (key) => new ObjectId(
  createHash('sha256').update(`tuconnector:marketplace-demo:v1:${key}`).digest('hex').slice(0, 24)
);
// Cùng hash bcrypt với marketplaceFixture (mật khẩu Abc123456!)
const passwordHash = '$2b$10$HS3VyCwsSRtfQmV07uQrTO6wjXWXloYuboRkkL768/HHNL8shHXH2';

const studentNames = [
  'Nguyễn Gia Huy', 'Trần Minh Khôi', 'Lê Bảo Ngọc', 'Phạm Thảo My',
  'Vũ Hoàng Long', 'Đặng Khánh An', 'Bùi Tuấn Kiệt', 'Đỗ Phương Linh',
  'Hoàng Minh Quân', 'Phan Thu Uyên', 'Võ Đức Anh', 'Đinh Ngọc Hân',
  'Dương Quốc Việt', 'Mai Thanh Trúc', 'Trịnh Gia Bảo', 'Lý Hà Vy',
  'Ngô Nhật Minh', 'Hồ Bảo Trâm', 'Cao Đăng Khoa', 'Tạ Minh Thư',
  'Lương Anh Khoa', 'Đoàn Thùy Chi', 'Châu Gia Hưng', 'Tống Khánh Vy',
];
const studentGrades = ['Lớp 9', 'Lớp 12', 'Lớp 10', 'Lớp 11'];

// Khớp thứ tự gia sư trong marketplaceFixture: 0–7 dạy Toán (Lớp 9, Lớp 12), 8–15 dạy Tiếng Anh (IELTS, TOEIC)
const TUTOR_COUNT = 16;
const classGoals = {
  'Toán Lớp 9': 'Ôn thi vào 10',
  'Toán Lớp 12': 'Luyện đề tốt nghiệp',
  'Tiếng Anh IELTS': 'Mục tiêu 6.5+',
  'Tiếng Anh TOEIC': 'Mục tiêu 650+',
};

// Học sinh 0–13 đã liên kết phụ huynh (mỗi phụ huynh 2 con), 14–15 phụ huynh mời nhưng chưa xác nhận, 16–23 không có phụ huynh
const LINKED_STUDENT_COUNT = 14;
const PENDING_STUDENT_COUNT = 2;

const at = (value) => new Date(value);

function buildClassroomSeed() {
  const data = { users: [], links: [], classrooms: [], members: [] };
  const createdAt = at('2026-11-01T08:00:00+07:00');

  const students = studentNames.map((name, index) => {
    const number = String(index + 1).padStart(2, '0');
    const student = {
      _id: demoId(`student:${index}`), full_name: name, email: `demo.student${number}@example.com`,
      phone: null, role: 'STUDENT', password_hash: passwordHash, has_password: true,
      email_verify_status: true, is_onboarded: true, account_status: 'ACTIVE',
      is_login_locked: false, failed_login_attempts: 0, avatar_url: null, google_account: null,
      notification_preferences: { enable_email: false, enable_in_app: true },
      credit_wallet: null, subscription: null,
      student_profile: { full_name: name, grade_level: studentGrades[index % studentGrades.length] },
      last_login_at: null, created_at: createdAt, updated_at: createdAt,
    };
    data.users.push(student);
    return student;
  });

  students.forEach((student, index) => {
    if (index >= LINKED_STUDENT_COUNT + PENDING_STUDENT_COUNT) {
      return;
    }
    let status = 'ACCEPTED';
    let parentIndex = Math.floor(index / 2);
    if (index >= LINKED_STUDENT_COUNT) {
      status = 'PENDING';
      parentIndex = 7 + index - LINKED_STUDENT_COUNT;
    }
    data.links.push({
      _id: demoId(`parent-link:${index}`), parent_user_id: demoId(`parent:${parentIndex}`),
      student_user_id: student._id, status: status,
      created_at: at('2026-11-02T09:00:00+07:00'), updated_at: at('2026-11-02T10:00:00+07:00'),
    });
  });

  for (let tutorIndex = 0; tutorIndex < TUTOR_COUNT; tutorIndex += 1) {
    let subject = 'Toán';
    let grades = ['Lớp 9', 'Lớp 12'];
    if (tutorIndex >= 8) {
      subject = 'Tiếng Anh';
      grades = ['IELTS', 'TOEIC'];
    }
    const grade = grades[tutorIndex % 2];
    const number = String(tutorIndex + 1).padStart(2, '0');
    const joinCode = `DEMOCL${number}`;
    const classId = demoId(`classroom:${tutorIndex}`);
    const classCreatedAt = at(`2026-11-0${3 + tutorIndex % 5}T09:00:00+07:00`);
    // 4 gia sư cùng dạy một môn + cấp: đánh số nhóm để tên lớp không trùng nhau
    const groupNumber = Math.floor((tutorIndex % 8) / 2) + 1;
    data.classrooms.push({
      _id: classId, tutor_profile_id: demoId(`profile:${tutorIndex}`), agreement_id: null,
      name: `${subject} ${grade} – ${classGoals[`${subject} ${grade}`]} (Nhóm ${groupNumber})`, subject: subject, grade: grade,
      description: `Lớp ${subject} ${grade} học 2 buổi mỗi tuần, có bài tập sau mỗi buổi và báo cáo tiến độ cho phụ huynh.`,
      capacity: 10, join_code: joinCode, invite_link: `https://tuconnector.vn/join/${joinCode}`, status: 'ACTIVE',
      created_at: classCreatedAt, updated_at: classCreatedAt, topics: [],
    });

    // 5–8 học sinh mỗi lớp, chọn xoay vòng để mỗi học sinh học vài lớp
    const memberCount = 5 + tutorIndex % 4;
    for (let slot = 0; slot < memberCount; slot += 1) {
      const studentIndex = (tutorIndex * 3 + slot) % students.length;
      data.members.push({
        _id: demoId(`class-member:${tutorIndex}:${studentIndex}`), class_id: classId,
        user_id: students[studentIndex]._id,
        joined_at: new Date(classCreatedAt.getTime() + (slot + 1) * 3600000),
        status: 'ACTIVE', removal_reason: null,
      });
    }
  }
  return data;
}

module.exports = { ...buildClassroomSeed(), buildClassroomSeed, demoId };
