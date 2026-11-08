import { Router } from 'express';
import { requireTutorAuth, requireUserAuth } from '../middlewares/classroomAuth.middleware.js';
import * as classroomController from '../controllers/classroom.controller.js';

export const classroomRoutes = Router();

// ==========================================
// 1. PUBLIC & CODE PREVIEW (UC24)
// ==========================================
// Xem trước thông tin lớp học theo mã mời (không yêu cầu đăng nhập)
classroomRoutes.get('/preview/:joinCode', classroomController.previewClassroomByCode);

// ==========================================
// 2. TỔNG QUAN DANH SÁCH LỚP & THAM GIA
// ==========================================
// Lấy danh sách lớp của người dùng hiện tại (Gia sư / Học sinh / Phụ huynh)
classroomRoutes.get('/', requireUserAuth, classroomController.getMyClassrooms);

// UC21: Khởi tạo lớp học mới (Gia sư)
classroomRoutes.post('/', requireTutorAuth, classroomController.createClassroom);

// UC24: Tham gia lớp học bằng mã (Học sinh / Phụ huynh)
classroomRoutes.post('/join', requireUserAuth, classroomController.joinClassroom);

// Thỏa thuận kết nối đã xác nhận để tạo lớp (Gia sư)
classroomRoutes.get('/agreements', requireTutorAuth, classroomController.getConfirmedAgreements);

// ==========================================
// 3. QUẢN LÝ BÀI TẬP & CHẤM ĐIỂM (UC26 & UC27)
// Đặt TRƯỚC route `/:id` để tránh bị Express route matching nuốt mất
// ==========================================
// UC27: Lấy chi tiết bài tập theo ID (Học sinh / Gia sư)
classroomRoutes.get('/assignments/:assignmentId', requireUserAuth, classroomController.getAssignmentDetail);

// UC27: Nộp bài tập (Học sinh)
classroomRoutes.post('/assignments/:assignmentId/submit', requireUserAuth, classroomController.submitAssignment);

// UC26: Lấy danh sách bài nộp của học sinh (Gia sư chủ lớp)
classroomRoutes.get('/assignments/:assignmentId/submissions', requireTutorAuth, classroomController.getSubmissionsForAssignment);

// UC26: Chỉnh sửa bài tập (Gia sư chủ lớp)
classroomRoutes.put('/assignments/:assignmentId', requireTutorAuth, classroomController.updateAssignment);

// UC26: Xóa bài tập (Gia sư chủ lớp)
classroomRoutes.delete('/assignments/:assignmentId', requireTutorAuth, classroomController.deleteAssignment);

// UC26: Chấm điểm bài nộp của học sinh (Gia sư chủ lớp)
classroomRoutes.post('/submissions/:submissionId/grade', requireTutorAuth, classroomController.gradeSubmission);

// ==========================================
// 4. CÁC TÁC VỤ THEO LỚP HỌC (/:id/...)
// ==========================================
// Bảng tin lớp học (UC22)
classroomRoutes.get('/:id/announcements', requireUserAuth, classroomController.getClassAnnouncements);
classroomRoutes.post('/:id/announcements', requireTutorAuth, classroomController.createClassAnnouncement);
classroomRoutes.put('/:id/announcements/:announcementId', requireTutorAuth, classroomController.updateClassAnnouncement);
classroomRoutes.delete('/:id/announcements/:announcementId', requireTutorAuth, classroomController.deleteClassAnnouncement);
classroomRoutes.patch('/:id/announcements/:announcementId/pin', requireTutorAuth, classroomController.togglePinAnnouncement);

// Thành viên lớp học (UC23)
classroomRoutes.get('/:id/members', requireUserAuth, classroomController.getClassMembers);
classroomRoutes.post('/:id/members', requireTutorAuth, classroomController.addMemberToClass);
classroomRoutes.delete('/:id/members/:memberId', requireTutorAuth, classroomController.removeMemberFromClass);

// Danh sách bài tập trong lớp (UC26)
classroomRoutes.get('/:id/assignments', requireUserAuth, classroomController.getClassAssignments);
classroomRoutes.post('/:id/assignments', requireTutorAuth, classroomController.createAssignment);

// Phòng chat nhóm lớp học (UC33)
classroomRoutes.get('/:id/chat', requireUserAuth, classroomController.getClassGroupChat);
classroomRoutes.post('/:id/chat', requireUserAuth, classroomController.sendClassChatMessage);
classroomRoutes.post('/:id/chat/init', requireTutorAuth, classroomController.createClassGroupChat);

// Quản lý trạng thái và mã mời lớp học (UC22)
classroomRoutes.patch('/:id/status', requireTutorAuth, classroomController.updateClassroomStatus);
classroomRoutes.post('/:id/regenerate-code', requireTutorAuth, classroomController.regenerateJoinCode);

// ==========================================
// 5. CHI TIẾT & CHỈNH SỬA LỚP HỌC (/:id) - ĐẶT CUỐI CÙNG
// ==========================================
// UC22: Lấy chi tiết lớp học (Gia sư / Học viên / Phụ huynh)
classroomRoutes.get('/:id', requireUserAuth, classroomController.getClassroomDetail);

// UC22: Cập nhật thông tin lớp học (Gia sư)
classroomRoutes.put('/:id', requireTutorAuth, classroomController.updateClassroom);

// UC22: Xóa lớp học (Gia sư)
classroomRoutes.delete('/:id', requireTutorAuth, classroomController.deleteClassroom);
