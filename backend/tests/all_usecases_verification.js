import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { User } from '../src/models/User.js';
import { TutorProfile } from '../src/models/TutorProfile.js';
import { Classroom } from '../src/models/Classroom.js';
import { ClassMember } from '../src/models/ClassMember.js';
import { Assignment } from '../src/models/Assignment.js';
import { AssignmentSubmission } from '../src/models/AssignmentSubmission.js';
import { Conversation } from '../src/models/Conversation.js';
import { Message } from '../src/models/Message.js';

import * as classroomService from '../src/services/classroom.service.js';

async function runTestSuite() {
  console.log('===============================================================');
  console.log('🚀 BẮT ĐẦU KIỂM THỬ TẤT CẢ CÁC TRƯỜNG HỢP BIÊN & LỖI HỆ THỐNG');
  console.log('===============================================================\n');

  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/WDP_DB');
  console.log('✅ Đã kết nối cơ sở dữ liệu MongoDB\n');

  let passed = 0;
  let failed = 0;

  function record(id, title, isPass, detail) {
    if (isPass) {
      passed++;
      console.log(`  [PASS] ${id}: ${title} - ${detail || 'OK'}`);
    } else {
      failed++;
      console.log(`  [FAIL] ${id}: ${title} -> LỖI: ${detail}`);
    }
  }

  // Chuẩn bị tài khoản test
  let testTutor = await User.findOne({ email: 'test.tutor.suite@gmail.com' });
  if (!testTutor) {
    testTutor = await User.create({
      full_name: 'Gia sư Test Suite',
      email: 'test.tutor.suite@gmail.com',
      password_hash: 'test',
      role: 'TUTOR',
      account_status: 'ACTIVE',
    });
  }
  let testTutorProfile = await TutorProfile.findOne({ user_id: testTutor._id });
  if (!testTutorProfile) {
    testTutorProfile = await TutorProfile.create({
      user_id: testTutor._id,
      headline: 'Gia sư Test Suite',
      bio: 'Bio test',
      is_complete: true,
      availability_status: 'AVAILABLE',
    });
  }

  let testStudent1 = await User.findOne({ email: 'test.student1.suite@gmail.com' });
  if (!testStudent1) {
    testStudent1 = await User.create({
      full_name: 'Học sinh 1 Test Suite',
      email: 'test.student1.suite@gmail.com',
      password_hash: 'test',
      role: 'STUDENT',
      account_status: 'ACTIVE',
    });
  }

  let testStudent2 = await User.findOne({ email: 'test.student2.suite@gmail.com' });
  if (!testStudent2) {
    testStudent2 = await User.create({
      full_name: 'Học sinh 2 Test Suite',
      email: 'test.student2.suite@gmail.com',
      password_hash: 'test',
      role: 'STUDENT',
      account_status: 'ACTIVE',
    });
  }

  let testOutsider = await User.findOne({ email: 'test.outsider.suite@gmail.com' });
  if (!testOutsider) {
    testOutsider = await User.create({
      full_name: 'Người ngoài lớp',
      email: 'test.outsider.suite@gmail.com',
      password_hash: 'test',
      role: 'STUDENT',
      account_status: 'ACTIVE',
    });
  }

  console.log('--- NHÓM 1: KHỞI TẠO & THIẾT LẬP LỚP HỌC (UC21 & UC22) ---');

  // Dọn dẹp lớp test cũ
  await Classroom.deleteMany({ tutor_profile_id: testTutorProfile._id });

  const createResult = await classroomService.createClassroom({
    tutorProfile: testTutorProfile,
    user: testTutor,
    data: { name: 'Toán 9 Luyện Đề VIP', subject: 'Toán học', grade: 'Lớp 9', capacity: 20 },
  });
  const createdClass = createResult.classroom;

  // Test 1.1: Trùng tên lớp của cùng một Gia sư
  try {
    let threw = false;
    try {
      await classroomService.createClassroom({
        tutorProfile: testTutorProfile,
        user: testTutor,
        data: { name: 'Toán 9 Luyện Đề VIP', subject: 'Toán học', grade: 'Lớp 9', capacity: 20 },
      });
    } catch (e) {
      threw = (e.status === 400 || e.statusCode === 400) && (e.message.includes('mang tên này') || e.message.includes('trùng'));
    }
    record('1.1', 'Chặn trùng tên lớp của cùng một Gia sư (E1)', threw, 'Hệ thống đã chặn tạo trùng tên chuẩn xác');
  } catch (err) {
    record('1.1', 'Chặn trùng tên lớp của cùng một Gia sư (E1)', false, err.message);
  }

  // Test 1.2: Tên lớp vi phạm độ dài (< 3 ký tự hoặc > 100 ký tự)
  try {
    let threwShort = false;
    try {
      await classroomService.createClassroom({
        tutorProfile: testTutorProfile,
        user: testTutor,
        data: { name: 'AB', subject: 'Toán' },
      });
    } catch (e) {
      threwShort = (e.status === 400 || e.statusCode === 400) && e.message.includes('từ 3 đến 100 ký tự');
    }
    record('1.2', 'Chặn tên lớp vi phạm độ dài (< 3 ký tự)', threwShort, 'Bắt lỗi tên quá ngắn chính xác');
  } catch (err) {
    record('1.2', 'Chặn tên lớp vi phạm độ dài (< 3 ký tự)', false, err.message);
  }

  // Test 1.3: Sĩ số lớp bất hợp lý (sĩ số <= 0 hoặc > 200)
  try {
    let threwCap = false;
    try {
      await classroomService.createClassroom({
        tutorProfile: testTutorProfile,
        user: testTutor,
        data: { name: 'Lớp Sĩ Số Lỗi', subject: 'Toán', capacity: 300 },
      });
    } catch (e) {
      threwCap = (e.status === 400 || e.statusCode === 400) && e.message.includes('1 đến 200');
    }
    record('1.3', 'Chặn sĩ số lớp bất hợp lý (> 200 học sinh)', threwCap, 'Bắt lỗi sĩ số vượt hạn mức chính xác');
  } catch (err) {
    record('1.3', 'Chặn sĩ số lớp bất hợp lý (> 200 học sinh)', false, err.message);
  }

  // Test 1.4: Cấp lại mã tham gia (Regenerate code)
  try {
    const oldCode = createdClass.join_code;
    const regenResult = await classroomService.regenerateJoinCode({
      classroomId: createdClass._id,
      tutorProfile: testTutorProfile,
    });
    const newCode = regenResult.join_code;

    let oldCodeFailed = false;
    try {
      await classroomService.getClassroomByJoinCode({ joinCode: oldCode });
    } catch (e) {
      oldCodeFailed = e.status === 404 || e.statusCode === 404;
    }

    const isSuccess = Boolean(newCode && newCode !== oldCode && oldCodeFailed);
    record('1.4', 'Cấp lại mã tham gia (Mã cũ vô hiệu, mã mới sinh ra)', isSuccess, `Mã cũ: ${oldCode} -> Mã mới: ${newCode}`);
    createdClass.join_code = newCode;
  } catch (err) {
    record('1.4', 'Cấp lại mã tham gia', false, err.message);
  }

  // Test 1.6: Đăng thông báo bảng tin rỗng
  try {
    let threwEmpty = false;
    try {
      await classroomService.createClassAnnouncement({
        classroomId: createdClass._id,
        tutorProfile: testTutorProfile,
        data: { content: '   ' },
      });
    } catch (e) {
      threwEmpty = (e.status === 400 || e.statusCode === 400) && e.message.includes('không được để trống');
    }
    record('1.6', 'Chặn đăng thông báo rỗng trên Bảng tin', threwEmpty, 'Bắt lỗi thông báo trống chính xác');
  } catch (err) {
    record('1.6', 'Chặn đăng thông báo rỗng trên Bảng tin', false, err.message);
  }

  console.log('\n--- NHÓM 2: THAM GIA LỚP HỌC & QUẢN LÝ THÀNH VIÊN (UC23 & UC24) ---');

  // Test 2.1: Gia sư tự tham gia lớp của chính mình bằng mã/link
  try {
    let threwTutor = false;
    try {
      await classroomService.joinClassroomByCode({
        joinCode: createdClass.join_code,
        user: testTutor,
      });
    } catch (e) {
      threwTutor = (e.status === 400 || e.statusCode === 400) && e.message.includes('Gia sư');
    }
    record('2.1', 'Chặn Gia sư tham gia lớp học với vai trò học sinh (UC24)', threwTutor, 'Bảo vệ vai trò gia sư');
  } catch (err) {
    record('2.1', 'Chặn Gia sư tham gia lớp học với vai trò học sinh', false, err.message);
  }

  // Test 2.2: Nhập mã tham gia không tồn tại
  try {
    let threwNotFound = false;
    try {
      await classroomService.joinClassroomByCode({
        joinCode: 'KHONGTONTAI999',
        user: testStudent1,
      });
    } catch (e) {
      threwNotFound = e.status === 404 || e.statusCode === 404;
    }
    record('2.2', 'Chặn tham gia bằng mã không tồn tại', threwNotFound, 'Trả về mã 404 chuẩn xác');
  } catch (err) {
    record('2.2', 'Chặn tham gia bằng mã không tồn tại', false, err.message);
  }

  // Test 2.3: Tham gia lớp đã bị Lưu trữ (Archived)
  try {
    await classroomService.updateClassroomStatus({
      classroomId: createdClass._id,
      tutorProfile: testTutorProfile,
      status: 'ARCHIVED',
    });

    let threwArchived = false;
    try {
      await classroomService.joinClassroomByCode({
        joinCode: createdClass.join_code,
        user: testStudent1,
      });
    } catch (e) {
      threwArchived = (e.status === 400 || e.statusCode === 400) && e.message.includes('lưu trữ');
    }
    record('2.3', 'Chặn tham gia vào lớp học đã lưu trữ (ARCHIVED)', threwArchived, 'Bảo vệ trạng thái đóng lớp');

    // Khôi phục lại trạng thái ACTIVE để tiếp tục test
    await classroomService.updateClassroomStatus({
      classroomId: createdClass._id,
      tutorProfile: testTutorProfile,
      status: 'ACTIVE',
    });
  } catch (err) {
    record('2.3', 'Chặn tham gia vào lớp học đã lưu trữ', false, err.message);
  }

  // Test 2.4: Lớp học đã đầy sĩ số (Max Capacity)
  try {
    // Tạm thời set capacity = 1
    await Classroom.findByIdAndUpdate(createdClass._id, { capacity: 1 });
    await ClassMember.deleteMany({ class_id: createdClass._id });

    // Học sinh 1 tham gia thành công
    await classroomService.joinClassroomByCode({
      joinCode: createdClass.join_code,
      user: testStudent1,
    });

    // Học sinh 2 cố tham gia khi lớp đã đạt 1/1
    let threwFull = false;
    try {
      await classroomService.joinClassroomByCode({
        joinCode: createdClass.join_code,
        user: testStudent2,
      });
    } catch (e) {
      threwFull = (e.status === 400 || e.statusCode === 400) && e.message.includes('sĩ số tối đa');
    }
    record('2.4', 'Chặn tham gia khi lớp đã đạt sĩ số tối đa (Capacity Limit)', threwFull, 'Tuân thủ giới hạn capacity');

    // Khôi phục capacity = 20
    await Classroom.findByIdAndUpdate(createdClass._id, { capacity: 20 });
  } catch (err) {
    record('2.4', 'Chặn tham gia khi lớp đã đạt sĩ số tối đa', false, err.message);
  }

  // Test 2.5: Học sinh đã trong lớp bấm tham gia lại (Duplicate join)
  try {
    let threwDup = false;
    try {
      await classroomService.joinClassroomByCode({
        joinCode: createdClass.join_code,
        user: testStudent1,
      });
    } catch (e) {
      threwDup = (e.status === 400 || e.statusCode === 400) && e.message.includes('đã là thành viên');
    }
    record('2.5', 'Chặn học sinh tham gia trùng lặp nhiều lần (Duplicate Join)', threwDup, 'Ngăn nhân bản bản ghi member');
  } catch (err) {
    record('2.5', 'Chặn học sinh tham gia trùng lặp nhiều lần', false, err.message);
  }

  // Test 2.6: Gia sư xóa học sinh khỏi lớp học (UC23)
  try {
    // Cho học sinh 2 tham gia
    await classroomService.joinClassroomByCode({
      joinCode: createdClass.join_code,
      user: testStudent2,
    });

    const member2Doc = await ClassMember.findOne({ class_id: createdClass._id, user_id: testStudent2._id });

    // Gia sư gỡ học sinh 2 khỏi lớp
    const removedResult = await classroomService.removeMemberFromClass({
      classroomId: createdClass._id,
      memberId: member2Doc._id,
      tutorProfile: testTutorProfile,
      reason: 'Vi phạm nội quy lớp',
    });

    const isRemoved = removedResult.status === 'REMOVED';
    record('2.6', 'Gia sư xóa học sinh khỏi lớp học (UC23)', isRemoved, `Trạng thái: ${removedResult.status}`);
  } catch (err) {
    record('2.6', 'Gia sư xóa học sinh khỏi lớp học (UC23)', false, err.message);
  }

  // Test 2.7: Gia sư thêm thành viên bằng email không tồn tại
  try {
    let threwEmail = false;
    try {
      await classroomService.addMemberToClass({
        classroomId: createdClass._id,
        tutorProfile: testTutorProfile,
        data: { email: 'email.hoantoan.khongtontai@gmail.com' },
      });
    } catch (e) {
      threwEmail = (e.status === 404 || e.statusCode === 404) && (e.message.includes('Không tìm thấy người dùng') || e.message.includes('Không tìm thấy tài khoản'));
    }
    record('2.7', 'Chặn thêm thành viên bằng email không tồn tại', threwEmail, 'Kiểm tra người dùng hệ thống');
  } catch (err) {
    record('2.7', 'Chặn thêm thành viên bằng email không tồn tại', false, err.message);
  }

  console.log('\n--- NHÓM 3: BÀI TẬP, CHẤM ĐIỂM & NỘP BÀI (UC26 & UC27) ---');

  // Test 3.1: Chặn tạo bài tập có tiêu đề rỗng
  try {
    let threwTitle = false;
    try {
      await classroomService.createAssignment({
        classroomId: createdClass._id,
        tutorProfile: testTutorProfile,
        data: { title: '   ', total_points: 10 },
      });
    } catch (e) {
      threwTitle = (e.status === 400 || e.statusCode === 400) && e.message.includes('Tiêu đề');
    }
    record('3.1', 'Chặn tạo bài tập khi để trống tiêu đề', threwTitle, 'Validation tiêu đề bắt buộc');
  } catch (err) {
    record('3.1', 'Chặn tạo bài tập khi để trống tiêu đề', false, err.message);
  }

  // Test 3.2: Tự động chấm điểm trắc nghiệm (Auto-grading)
  let testAssignment = null;
  try {
    testAssignment = await classroomService.createAssignment({
      classroomId: createdClass._id,
      tutorProfile: testTutorProfile,
      data: {
        title: 'Bài kiểm tra trắc nghiệm 15 phút',
        instructions: 'Chọn đáp án đúng nhất',
        due_date: new Date(Date.now() + 86400000), // 1 ngày sau
        total_points: 10,
        allow_resubmission: true,
        questions: [
          {
            question_type: 'MULTIPLE_CHOICE',
            content: '1 + 1 bằng mấy?',
            options: ['1', '2', '3', '4'],
            correct_answer: '2',
            points: 5,
          },
          {
            question_type: 'MULTIPLE_CHOICE',
            content: 'Căn bậc hai của 16 là?',
            options: ['2', '4', '8', '16'],
            correct_answer: '4',
            points: 5,
          },
        ],
      },
    });

    const q1 = testAssignment.questions[0]._id.toString();
    const q2 = testAssignment.questions[1]._id.toString();

    const submission1 = await classroomService.submitAssignment({
      assignmentId: testAssignment._id,
      user: testStudent1,
      answers: [
        { question_id: q1, text_response: '2' }, // Đúng (5đ)
        { question_id: q2, text_response: '8' }, // Sai (0đ)
      ],
    });

    const isAutoGradedCorrect = Number(submission1.provisional_score) === 5 && submission1.timeliness === 'ON_TIME';
    record('3.2', 'Tự động chấm trắc nghiệm chính xác (Auto-grading: 5/10đ)', isAutoGradedCorrect, `Điểm: ${submission1.provisional_score}đ, Timeliness: ${submission1.timeliness}`);
  } catch (err) {
    record('3.2', 'Tự động chấm trắc nghiệm chính xác', false, err.message);
  }

  // Test 3.3: Người ngoài lớp không được nộp bài (UC27 Authorization)
  try {
    let threwOutsider = false;
    try {
      await classroomService.submitAssignment({
        assignmentId: testAssignment._id,
        user: testOutsider,
        answers: [],
      });
    } catch (e) {
      threwOutsider = (e.status === 403 || e.statusCode === 403) && e.message.includes('thành viên đang học');
    }
    record('3.3', 'Chặn người ngoài lớp nộp bài tập (UC27 Authorization)', threwOutsider, 'Bảo mật phân quyền lớp');
  } catch (err) {
    record('3.3', 'Chặn người ngoài lớp nộp bài tập', false, err.message);
  }

  // Test 3.4: Học sinh nộp bài muộn (Quá deadline -> timeliness = LATE)
  try {
    const lateAssignment = await classroomService.createAssignment({
      classroomId: createdClass._id,
      tutorProfile: testTutorProfile,
      data: {
        title: 'Bài tập hết hạn',
        due_date: new Date(Date.now() - 3600000), // Hết hạn 1 tiếng trước
        allow_late_submission: true,
        questions: [{ content: 'Câu hỏi muộn', points: 10 }],
      },
    });

    const lateSub = await classroomService.submitAssignment({
      assignmentId: lateAssignment._id,
      user: testStudent1,
      answers: [],
    });

    const isLate = lateSub.timeliness === 'LATE';
    record('3.4', 'Tự động đánh dấu Nộp muộn (timeliness: LATE) khi quá hạn', isLate, `Timeliness: ${lateSub.timeliness}`);
  } catch (err) {
    record('3.4', 'Tự động đánh dấu Nộp muộn khi quá hạn', false, err.message);
  }

  // Test 3.5: Không cho nộp lại khi allow_resubmission = false
  try {
    const noResubmitAssignment = await classroomService.createAssignment({
      classroomId: createdClass._id,
      tutorProfile: testTutorProfile,
      data: {
        title: 'Bài thi 1 lần duy nhất',
        allow_resubmission: false,
        questions: [{ content: 'Thi thật', points: 10 }],
      },
    });

    // Lần 1 nộp thành công
    await classroomService.submitAssignment({
      assignmentId: noResubmitAssignment._id,
      user: testStudent1,
      answers: [],
    });

    // Lần 2 cố nộp lại
    let threwResubmit = false;
    try {
      await classroomService.submitAssignment({
        assignmentId: noResubmitAssignment._id,
        user: testStudent1,
        answers: [],
      });
    } catch (e) {
      threwResubmit = (e.status === 400 || e.statusCode === 400) && e.message.includes('không cho phép nộp lại');
    }
    record('3.5', 'Chặn nộp lại bài khi Gia sư tắt allow_resubmission', threwResubmit, 'Đảm bảo tính nghiêm túc của bài thi');
  } catch (err) {
    record('3.5', 'Chặn nộp lại bài khi Gia sư tắt allow_resubmission', false, err.message);
  }

  // Test 3.6: Gia sư chấm điểm chính thức và công bố kết quả (UC26)
  try {
    const submissions = await classroomService.getSubmissionsForAssignment({
      assignmentId: testAssignment._id,
      tutorProfile: testTutorProfile,
    });

    const subToGrade = submissions[0];
    const graded = await classroomService.gradeSubmission({
      submissionId: subToGrade._id,
      tutorProfile: testTutorProfile,
      data: {
        final_score: 9.0,
        overall_feedback: 'Bài làm rất tốt, cần chú ý câu 2',
      },
    });

    // Sau khi đã công bố điểm, học sinh không được nộp đè lên bài đã chấm
    let threwAfterGraded = false;
    try {
      await classroomService.submitAssignment({
        assignmentId: testAssignment._id,
        user: testStudent1,
        answers: [],
      });
    } catch (e) {
      threwAfterGraded =
        (e.status === 400 || e.statusCode === 400) &&
        (e.message.includes('công bố điểm') || e.message.includes('chấm điểm'));
    }

    const isGradedSuccess = graded.status === 'GRADED' && Number(graded.final_score) === 9 && threwAfterGraded;
    record('3.6', 'Gia sư chấm điểm chính thức & khóa nộp lại sau khi có điểm (UC26)', isGradedSuccess, `Điểm: ${graded.final_score}đ - Đã khóa nộp lại`);
  } catch (err) {
    record('3.6', 'Gia sư chấm điểm chính thức', false, err.message);
  }

  console.log('\n--- NHÓM 4: NHÓM CHAT LỚP HỌC & PHÂN QUYỀN (UC33 & SECURITY) ---');

  // Test 4.1: Gửi tin nhắn rỗng / khoảng trắng
  try {
    let threwEmptyMsg = false;
    try {
      await classroomService.sendClassChatMessage({
        classroomId: createdClass._id,
        user: testTutor,
        content: '     ',
      });
    } catch (e) {
      threwEmptyMsg = (e.status === 400 || e.statusCode === 400) && e.message.includes('không được để trống');
    }
    record('4.1', 'Chặn gửi tin nhắn rỗng / toàn dấu cách vào nhóm chat', threwEmptyMsg, 'Chống spam tin nhắn rỗng');
  } catch (err) {
    record('4.1', 'Chặn gửi tin nhắn rỗng vào nhóm chat', false, err.message);
  }

  // Test 4.2: Người ngoài lớp cố xem hoặc gửi tin nhắn vào nhóm chat (403 Forbidden)
  try {
    let threwOutsiderChat = false;
    try {
      await classroomService.sendClassChatMessage({
        classroomId: createdClass._id,
        user: testOutsider,
        content: 'Chào cả lớp tôi là người lạ',
      });
    } catch (e) {
      threwOutsiderChat = e.status === 403 || e.statusCode === 403;
    }
    record('4.2', 'Chặn người ngoài lớp gửi tin nhắn vào nhóm chat (403 Forbidden)', threwOutsiderChat, 'Bảo mật phòng chat lớp học');
  } catch (err) {
    record('4.2', 'Chặn người ngoài lớp gửi tin nhắn vào nhóm chat', false, err.message);
  }

  // Test 4.3: Đồng bộ thành viên chat tự động
  try {
    const chatData = await classroomService.getClassGroupChat({
      classroomId: createdClass._id,
      user: testTutor,
    });

    const hasTutor = chatData.group_members.some((m) => m.role === 'TUTOR');
    const hasStudent1 = chatData.group_members.some((m) => m.user?._id?.toString() === testStudent1._id.toString());

    const isChatSynced = hasTutor && hasStudent1;
    record('4.3', 'Đồng bộ danh sách thành viên nhóm chat tự động (UC33)', isChatSynced, `Số thành viên trong chat: ${chatData.group_members.length}`);
  } catch (err) {
    record('4.3', 'Đồng bộ danh sách thành viên nhóm chat tự động', false, err.message);
  }

  // Test 1.5: Xóa lớp học (UC22)
  // Bước 1: Khi lớp còn học viên (testStudent1), kiểm tra xem deleteClassroom có ném lỗi 400 bảo vệ không
  try {
    let threwHasMember = false;
    try {
      await classroomService.deleteClassroom({
        classroomId: createdClass._id,
        tutorProfile: testTutorProfile,
      });
    } catch (e) {
      threwHasMember = (e.status === 400 || e.statusCode === 400) && e.message.includes('Không thể xóa lớp học đang có');
    }
    record('1.5a', 'Chặn xóa lớp khi còn học sinh đang học (UC22.E1)', threwHasMember, 'Bảo vệ dữ liệu học viên');

    // Bước 2: Dọn dẹp học sinh, xóa lớp thành công
    await ClassMember.deleteMany({ class_id: createdClass._id });
    await classroomService.deleteClassroom({
      classroomId: createdClass._id,
      tutorProfile: testTutorProfile,
    });

    const foundAfterDelete = await Classroom.findById(createdClass._id);
    const isDeleted = !foundAfterDelete;
    record('1.5b', 'Xóa lớp thành công sau khi lớp không còn học sinh', isDeleted, 'Lớp đã bị xóa an toàn khỏi DB');
  } catch (err) {
    record('1.5', 'Xóa lớp học', false, err.message);
  }

  // Dọn dẹp toàn bộ dữ liệu test
  try {
    await Classroom.deleteMany({ tutor_profile_id: testTutorProfile._id });
    await ClassMember.deleteMany({ class_id: createdClass._id });
    await Assignment.deleteMany({ class_id: createdClass._id });
    await AssignmentSubmission.deleteMany({ class_id: createdClass._id });
    await Conversation.deleteMany({ class_id: createdClass._id });
    await Message.deleteMany({ class_id: createdClass._id });
    console.log('\n🧹 Đã dọn dẹp dữ liệu test suite tạm thời');
  } catch {}

  console.log('\n===============================================================');
  console.log(`📊 TỔNG KẾT KẾT QUẢ KIỂM THỬ: ${passed}/${passed + failed} TEST CASES ĐẠT`);
  if (failed === 0) {
    console.log('🎉 TẤT CẢ CÁC TRƯỜNG HỢP KIỂM THỬ ĐỀU ĐẠT CHUẨN XUẤT SẮC (100% PASS)!');
  } else {
    console.log(`⚠️ CÒN ${failed} TRƯỜNG HỢP CẦN XỬ LÝ`);
  }
  console.log('===============================================================');

  await mongoose.disconnect();
}

runTestSuite().catch((e) => {
  console.error('Lỗi thực thi test suite:', e);
  process.exit(1);
});
