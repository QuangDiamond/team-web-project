import { Router } from 'express';
import { requireTutorAuth, requireUserAuth } from '../middlewares/classroomAuth.middleware.js';
import * as classroomController from '../controllers/classroom.controller.js';

export const classroomRoutes = Router();

// ==========================================
// UC24: Tham gia lớp học (Dành cho Học sinh / Phụ huynh)
// ==========================================
classroomRoutes.get('/preview/:joinCode', classroomController.previewClassroomByCode);
classroomRoutes.post('/join', requireUserAuth, classroomController.joinClassroom);

// ==========================================
// Thỏa thuận kết nối đã xác nhận (Gia sư)
// ==========================================
classroomRoutes.get('/agreements', requireTutorAuth, classroomController.getConfirmedAgreements);

// ==========================================
// UC22, UC23, UC26: Xem thông tin lớp, Bảng tin, Thành viên & Danh sách bài tập (Cả Gia sư và Học sinh)
// ==========================================
classroomRoutes.get('/:id', requireUserAuth, classroomController.getClassroomDetail);
classroomRoutes.get('/:id/announcements', requireUserAuth, classroomController.getClassAnnouncements);
classroomRoutes.get('/:id/members', requireUserAuth, classroomController.getClassMembers);
classroomRoutes.get('/:id/assignments', requireUserAuth, classroomController.getClassAssignments);

// ==========================================
// UC27: Nộp bài tập & Chi tiết bài tập (Học sinh)
// ==========================================
classroomRoutes.get('/assignments/:assignmentId', requireUserAuth, classroomController.getAssignmentDetail);
classroomRoutes.post('/assignments/:assignmentId/submit', requireUserAuth, classroomController.submitAssignment);

// ==========================================
// UC33: Phòng chat nhóm lớp học (Cả Gia sư và Học sinh)
// ==========================================
classroomRoutes.get('/:id/chat', requireUserAuth, classroomController.getClassGroupChat);
classroomRoutes.post('/:id/chat', requireUserAuth, classroomController.sendClassChatMessage);

// ==========================================
// Danh sách lớp học của người dùng (Cả Gia sư, Học viên và Phụ huynh)
// ==========================================
classroomRoutes.get('/', requireUserAuth, classroomController.getMyClassrooms);

// ==========================================
// Các route quản lý của Gia sư chủ lớp (requireTutorAuth)
// ==========================================
classroomRoutes.use(requireTutorAuth);

// UC21: Khởi tạo lớp học của gia sư
classroomRoutes.post('/', classroomController.createClassroom);

// UC22: Quản lý thiết lập lớp học, mã mời, trạng thái, xóa lớp
classroomRoutes.put('/:id', classroomController.updateClassroom);
classroomRoutes.patch('/:id/status', classroomController.updateClassroomStatus);
classroomRoutes.post('/:id/regenerate-code', classroomController.regenerateJoinCode);
classroomRoutes.delete('/:id', classroomController.deleteClassroom);

// UC22: Đăng, sửa, xóa, ghim thông báo bảng tin lớp học
classroomRoutes.post('/:id/announcements', classroomController.createClassAnnouncement);
classroomRoutes.put('/:id/announcements/:announcementId', classroomController.updateClassAnnouncement);
classroomRoutes.delete('/:id/announcements/:announcementId', classroomController.deleteClassAnnouncement);
classroomRoutes.patch('/:id/announcements/:announcementId/pin', classroomController.togglePinAnnouncement);

// UC23: Quản lý thành viên lớp học (Chỉ Gia sư chủ lớp)
classroomRoutes.post('/:id/members', classroomController.addMemberToClass);
classroomRoutes.delete('/:id/members/:memberId', classroomController.removeMemberFromClass);

// UC33: Khởi tạo phòng chat lớp học (Chỉ Gia sư chủ lớp)
classroomRoutes.post('/:id/chat/init', classroomController.createClassGroupChat);

// UC26: Quản lý bài tập & Chấm điểm (Chỉ Gia sư chủ lớp)
classroomRoutes.post('/:id/assignments', classroomController.createAssignment);
classroomRoutes.put('/assignments/:assignmentId', classroomController.updateAssignment);
classroomRoutes.delete('/assignments/:assignmentId', classroomController.deleteAssignment);
classroomRoutes.get('/assignments/:assignmentId/submissions', classroomController.getSubmissionsForAssignment);
classroomRoutes.post('/submissions/:submissionId/grade', classroomController.gradeSubmission);

