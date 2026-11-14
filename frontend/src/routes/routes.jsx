import { createBrowserRouter, Navigate, useLocation, useParams } from 'react-router-dom';
import Layout from '../layouts/Layout';
import GuestRoute from './GuestRoute';
import PrivateRoute from './PrivateRoute';
import { useAuth } from '../hooks/useAuth';
import DashboardLayout from '../layouts/DashboardLayout';
import Home from '../pages/Home';
import TutorSearch from '../pages/TutorSearch';
import RequestSearch from '../pages/RequestSearch';
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import RegisterSuccess from '../pages/auth/RegisterSuccess';
import RegisterComplete from '../pages/auth/RegisterComplete';
import ForgotPassword from '../pages/auth/ForgotPassword';
import ResetPassword from '../pages/auth/ResetPassword';
import ChangePassword from '../pages/dashboard/ChangePassword';
import Checkout from '../pages/payment/Checkout';
import PaymentResult from '../pages/payment/PaymentResult';
import Receipt from '../pages/payment/Receipt';
import CreditsTransactions from '../pages/credits/CreditsTransactions';
import UserManagement from '../pages/admin/UserManagement';
import UserDetail from '../pages/admin/UserDetail';
import Profile from '../pages/Profile';
import PublicProfile from '../pages/PublicProfile';
import { getPublicProfileReturn } from '../utils/publicProfileReturn';
import NotFound from '../pages/NotFound';
import ClassroomsPage from '../pages/classroom/ClassroomsPage';
import ClassroomDetail from '../pages/classroom/ClassroomDetail';
import CreateAssignmentPage from '../pages/classroom/CreateAssignmentPage';
import GradeAssignmentPage from '../pages/classroom/GradeAssignmentPage';
import JoinClassPage from '../pages/classroom/JoinClassPage';
import PlansPricing from '../pages/admin/PlansPricing';
import Categories from '../pages/admin/Categories';
import RoleRoute from './RoleRoute';
import StudentDashboard from '../pages/student/StudentDashboard';
import StudentAssignmentsPage from '../pages/student/StudentAssignmentsPage';
import StudentSchedulePage from '../pages/student/StudentSchedulePage';
import AiTutorSuggestions from '../pages/parent/AiTutorSuggestions';
import ParentDashboard from '../pages/parent/ParentDashboard';
import ChatPage from '../pages/chat/ChatPage';
import TutorProfile from '../pages/tutor/TutorProfile';
import TutorPosts from '../pages/tutor/TutorPosts';
import TutorPostForm from '../pages/tutor/TutorPostForm';
import TutorDashboard from '../pages/tutor/TutorDashboard';
import TutoringRequests from '../pages/parent/TutoringRequests';
import TutoringRequestForm from '../pages/parent/TutoringRequestForm';
import TutoringRequestDetail from '../pages/parent/TutoringRequestDetail';
import Invitations from '../pages/parent/Invitations';
import ReceivedInvitations from '../pages/tutor/ReceivedInvitations';
import BrowseRequests from '../pages/tutor/BrowseRequests';
import SuggestedRequests from '../pages/tutor/SuggestedRequests';
import SavedRequests from '../pages/tutor/SavedRequests';
import TutorRequestDetail from '../pages/tutor/TutorRequestDetail';
import MyApplications from '../pages/tutor/MyApplications';
import MySchedule from '../pages/tutor/MySchedule';
 import MyConnections from '../pages/connections/MyConnections';
import Notifications from '../pages/notifications/Notifications';
import Moderation from '../pages/admin/Moderation';
import AuditLogs from '../pages/admin/AuditLogs';
import AdminDashboard from '../pages/admin/AdminDashboard';
import { ADMIN_MENU, PARENT_MENU, STUDENT_MENU, TUTOR_MENU } from '../constants/dashboardMenus';

function WorkspaceRedirect() {
  const { user } = useAuth();
  const location = useLocation();
  const profileReturn = getPublicProfileReturn();
  if (location.pathname === '/dashboard' && profileReturn) return <Navigate to={profileReturn} replace />;
  const prefixes = { STUDENT: '/student', PARENT: '/parent', TUTOR: '/tutor', ADMIN: '/admin' };
  const prefix = prefixes[user.role];
  if (!prefix) return <Navigate to="/" replace />;
  return <Navigate to={`${prefix}${location.pathname}${location.search}${location.hash}`} replace />;
}

// Đường dẫn cũ /parent/requests/:id/applications: đơn ứng tuyển nay nằm trong trang chi tiết request
function ApplicationsRedirect() {
  const { id } = useParams();
  return <Navigate to={`/parent/requests/${id}`} replace />;
}

function SuggestionsRedirect() {
  const { requestId } = useParams();
  if (requestId) return <Navigate to={`/parent/requests/${requestId}/suggestions`} replace />;
  return <Navigate to="/parent/suggestions" replace />;
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'tutors', element: <TutorSearch /> },
      { path: 'requests', element: <RequestSearch /> },
      { path: 'profile', element: <Profile /> },
      { path: 'join-class', element: <JoinClassPage /> },
      { path: 'join-class/:code', element: <JoinClassPage /> },
      { path: 'tutors/:profileId', element: <PublicProfile role="TUTOR" /> },
      {
        element: <PrivateRoute />,
        children: [{ path: 'parents/:userId', element: <PublicProfile role="PARENT" /> }],
      },
      // Trang thanh toán cũ (placeholder) nay là Checkout (UC17)
      { path: 'payment', element: <Navigate to="/checkout" replace /> },
    ],
  },
  { path: 'forgot-password', element: <ForgotPassword /> },
  { path: 'reset-password', element: <ResetPassword /> },
  // Các màn auth có bố cục riêng (AuthLayout), không dùng header/footer của Layout
  {
    element: <GuestRoute />,
    children: [
      { path: 'login', element: <Login /> },
      { path: 'register', element: <Register /> },
      { path: 'register/success', element: <RegisterSuccess /> },
      { path: 'register/complete', element: <RegisterComplete /> },
    ],
  },
  // Preserve shared login targets, payment callbacks and existing bookmarks.
  {
    element: <PrivateRoute />,
    children: [
      { path: 'dashboard', element: <WorkspaceRedirect /> },
      { path: 'change-password', element: <WorkspaceRedirect /> },
      {
        element: <PrivateRoute roles={['TUTOR', 'PARENT']} />,
        children: [
          { path: 'credits', element: <WorkspaceRedirect /> },
          { path: 'checkout', element: <WorkspaceRedirect /> },
          { path: 'payment/result', element: <WorkspaceRedirect /> },
          { path: 'receipts/:orderCode', element: <WorkspaceRedirect /> },
        ],
      },
    ],
  },
  // Student dashboard (UC36): dùng khung DashboardLayout chung, xem docs/architecture/dashboard-frame.md
  {
    element: <RoleRoute roles={['STUDENT']} />,
    children: [
      {
        path: 'student',
        element: <DashboardLayout menu={STUDENT_MENU} />,
        children: [
          { path: 'dashboard', element: <StudentDashboard />, handle: { title: "Tổng quan" } },
          { path: 'classes', element: <ClassroomsPage />, handle: { title: 'Lớp học của tôi' } },
          { path: 'classes/:id', element: <ClassroomDetail />, handle: { title: 'Chi tiết lớp học' } },
          { path: 'schedule', element: <StudentSchedulePage />, handle: { title: "Lịch học của tôi" } },
          { path: 'assignments', element: <StudentAssignmentsPage />, handle: { title: "Tất cả bài tập" } },
          { path: 'change-password', element: <ChangePassword />, handle: { title: "Bảo mật tài khoản" } },
          { path: 'notifications', element: <Notifications />, handle: { title: "Thông báo" } },
        ],
      },
    ],
  },
  // Parent workspace: UC10 quản lý request, UC09 gợi ý gia sư, UC13 duyệt đơn ứng tuyển, UC14 lời mời đã gửi, UC16 xác nhận thỏa thuận, UC33 thông báo
  {
    element: <RoleRoute roles={['PARENT']} />,
    children: [
      {
        path: 'parent',
        element: <DashboardLayout menu={PARENT_MENU} />,
        children: [
          { path: 'credits', element: <CreditsTransactions />, handle: { title: "Credits và giao dịch" } },
          { path: 'checkout', element: <Checkout />, handle: { title: "Thanh toán" } },
          { path: 'payment/result', element: <PaymentResult />, handle: { title: "Kết quả thanh toán" } },
          { path: 'receipts/:orderCode', element: <Receipt />, handle: { title: "Biên nhận" } },
          { path: 'dashboard', element: <ParentDashboard />, handle: { title: "Tổng quan" } },
          { path: 'classes', element: <ClassroomsPage />, handle: { title: 'Lớp học của con' } },
          { path: 'classes/:id', element: <ClassroomDetail />, handle: { title: 'Chi tiết lớp học' } },
          { path: 'change-password', element: <ChangePassword />, handle: { title: "Bảo mật tài khoản" } },
          { path: 'requests', element: <TutoringRequests />, handle: { title: "Yêu cầu tìm gia sư của tôi" } },
          { path: 'requests/new', element: <TutoringRequestForm />, handle: { title: "Tạo yêu cầu tìm gia sư" } },
          { path: 'requests/:id', element: <TutoringRequestDetail />, handle: { title: "Yêu cầu tìm gia sư" } },
          { path: 'requests/:id/edit', element: <TutoringRequestForm />, handle: { title: "Sửa yêu cầu tìm gia sư" } },
          {
            path: 'requests/:requestId/suggestions',
            element: <AiTutorSuggestions />,
            handle: { title: 'Gợi ý' },
          },
          { path: 'requests/:requestId/ai-suggestions', element: <SuggestionsRedirect /> },
          // Đơn ứng tuyển nay nằm trong trang chi tiết yêu cầu; giữ đường dẫn cũ để link cũ vẫn dùng được
          { path: 'requests/:id/applications', element: <ApplicationsRedirect /> },
          { path: 'applications', element: <Navigate to="/parent/requests" replace /> },
          { path: 'suggestions', element: <AiTutorSuggestions />, handle: { title: 'Gợi ý' } },
          { path: 'ai-suggestions', element: <SuggestionsRedirect /> },
          { path: 'invitations', element: <Invitations />, handle: { title: "Lời mời" } },
          { path: 'messages', element: <ChatPage basePath="/parent/messages" />, handle: { title: "Tin nhắn" } },
          { path: 'messages/:conversationId', element: <ChatPage basePath="/parent/messages" />, handle: { title: "Tin nhắn" } },
          { path: 'contracts', element: <MyConnections />, handle: { title: "Thỏa thuận và kết nối" } },
          { path: 'connections', element: <MyConnections />, handle: { title: "Thỏa thuận và kết nối" } },
          { path: 'notifications', element: <Notifications />, handle: { title: "Thông báo" } },
        ],
      },
    ],
  },
  // Tutor workspace: UC11 duyệt / lưu / gợi ý request, UC12 ứng tuyển, UC15 phản hồi lời mời, UC16 xác nhận thỏa thuận, UC33 thông báo
  {
    element: <RoleRoute roles={['TUTOR']} />,
    children: [
      {
        path: 'tutor',
        element: <DashboardLayout menu={TUTOR_MENU} />,
        children: [
          { path: 'schedule', element: <MySchedule />, handle: { title: 'My Schedule' } },
          { path: 'credits', element: <CreditsTransactions />, handle: { title: "Credits và giao dịch" } },
          { path: 'checkout', element: <Checkout />, handle: { title: "Thanh toán" } },
          { path: 'payment/result', element: <PaymentResult />, handle: { title: "Kết quả thanh toán" } },
          { path: 'receipts/:orderCode', element: <Receipt />, handle: { title: "Biên nhận" } },
          { path: 'dashboard', element: <TutorDashboard />, handle: { title: "Tổng quan" } },
          { path: 'classes', element: <ClassroomsPage />, handle: { title: 'Quản lý lớp học' } },
          { path: 'classes/:id', element: <ClassroomDetail />, handle: { title: 'Chi tiết lớp học' } },
          { path: 'classes/:id/assignments/new', element: <CreateAssignmentPage />, handle: { title: 'Tạo bài tập mới' } },
          { path: 'classes/:id/assignments/:assignmentId/edit', element: <CreateAssignmentPage />, handle: { title: 'Chỉnh sửa bài tập' } },
          { path: 'classes/:id/assignments/:assignmentId/grade', element: <GradeAssignmentPage />, handle: { title: 'Chấm điểm bài tập' } },
          { path: 'change-password', element: <ChangePassword />, handle: { title: "Bảo mật tài khoản" } },
          { path: 'requests', element: <BrowseRequests />, handle: { title: "Tìm yêu cầu" } },
          { path: 'requests/suggested', element: <SuggestedRequests />, handle: { title: 'Gợi ý' } },
          { path: 'requests/saved', element: <SavedRequests />, handle: { title: "Yêu cầu đã lưu" } },
          { path: 'requests/:id', element: <TutorRequestDetail />, handle: { title: "Chi tiết yêu cầu" } },
          { path: 'applications', element: <MyApplications />, handle: { title: "Đơn ứng tuyển của tôi" } },
          { path: 'invitations', element: <ReceivedInvitations />, handle: { title: "Lời mời" } },
          { path: 'messages', element: <ChatPage basePath="/tutor/messages" />, handle: { title: "Tin nhắn" } },
          { path: 'messages/:conversationId', element: <ChatPage basePath="/tutor/messages" />, handle: { title: "Tin nhắn" } },
          { path: 'contracts', element: <MyConnections />, handle: { title: "Thỏa thuận và kết nối" } },
          { path: 'connections', element: <MyConnections />, handle: { title: "Thỏa thuận và kết nối" } },
          { path: 'notifications', element: <Notifications />, handle: { title: "Thông báo" } },
          { path: 'profile', element: <TutorProfile />, handle: { title: "Hồ sơ của tôi" } },
          { path: 'posts', element: <TutorPosts />, handle: { title: "Bài đăng của tôi" } },
          { path: 'posts/new', element: <TutorPostForm />, handle: { title: "Bài đăng mới" } },
          { path: 'posts/:id/edit', element: <TutorPostForm />, handle: { title: "Sửa bài đăng" } },
        ],
      },
    ],
  },
  // Admin workspace: UC38 Moderate Content & Reports, UC40 View System Statistics, UC33 Notifications
  {
    element: <RoleRoute roles={['ADMIN']} />,
    children: [
      {
        path: 'admin',
        element: <DashboardLayout menu={ADMIN_MENU} />,
        children: [
          { path: 'plans', element: <PlansPricing />, handle: { title: "Gói dịch vụ và giá" } },
          { path: 'categories', element: <Categories />, handle: { title: 'Quản lý danh mục' } },
          { path: 'users', element: <UserManagement />, handle: { title: "Quản lý người dùng" } },
          { path: 'users/:userId', element: <UserDetail />, handle: { title: "Chi tiết người dùng" } },
          { path: 'dashboard', element: <AdminDashboard />, handle: { title: "Thống kê hệ thống" } },
          { path: 'change-password', element: <ChangePassword />, handle: { title: "Bảo mật tài khoản" } },
          { path: 'moderation', element: <Moderation />, handle: { title: "Kiểm duyệt nội dung và báo cáo" } },
          { path: 'audit-logs', element: <AuditLogs />, handle: { title: "Nhật ký kiểm duyệt" } },
          { path: 'notifications', element: <Notifications />, handle: { title: "Thông báo" } },
        ],
      },
    ],
  },
  { path: '*', element: <NotFound /> },
]);
