import { createBrowserRouter, Navigate, useLocation } from 'react-router-dom';
import Layout from '../layouts/Layout';
import GuestRoute from './GuestRoute';
import PrivateRoute from './PrivateRoute';
import { useAuth } from '../hooks/useAuth';
import DashboardLayout from '../layouts/DashboardLayout';
import Home from '../pages/Home';
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
import JoinClassPage from '../pages/classroom/JoinClassPage';
import PlansPricing from '../pages/admin/PlansPricing';
import RoleRoute from './RoleRoute';
import StudentDashboard from '../pages/student/StudentDashboard';
import AiTutorSuggestions from '../pages/parent/AiTutorSuggestions';
import ParentDashboard from '../pages/parent/ParentDashboard';
import RequestPicker from '../pages/parent/RequestPicker';
import ChatPage from '../pages/chat/ChatPage';
import TutorProfile from '../pages/tutor/TutorProfile';
import TutorPosts from '../pages/tutor/TutorPosts';
import TutorPostForm from '../pages/tutor/TutorPostForm';
import TutorDashboard from '../pages/tutor/TutorDashboard';
import TutoringRequests from '../pages/parent/TutoringRequests';
import TutoringRequestForm from '../pages/parent/TutoringRequestForm';
import TutoringRequestDetail from '../pages/parent/TutoringRequestDetail';
import SentInvitations from '../pages/parent/SentInvitations';
import ApplicationsReview from '../pages/parent/ApplicationsReview';
import ReceivedInvitations from '../pages/tutor/ReceivedInvitations';
import BrowseRequests from '../pages/tutor/BrowseRequests';
import SuggestedRequests from '../pages/tutor/SuggestedRequests';
import SavedRequests from '../pages/tutor/SavedRequests';
import TutorRequestDetail from '../pages/tutor/TutorRequestDetail';
import MyApplications from '../pages/tutor/MyApplications';
import MyConnections from '../pages/connections/MyConnections';
import Notifications from '../pages/notifications/Notifications';
import Moderation from '../pages/admin/Moderation';
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

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
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
          { path: 'dashboard', element: <StudentDashboard />, handle: { title: 'Overview' } },
          { path: 'classes', element: <ClassroomsPage />, handle: { title: 'Lớp học của tôi' } },
          { path: 'classes/:id', element: <ClassroomDetail />, handle: { title: 'Chi tiết lớp học' } },
          { path: 'change-password', element: <ChangePassword />, handle: { title: 'Account Security' } },
          { path: 'notifications', element: <Notifications />, handle: { title: 'Notifications' } },
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
          { path: 'credits', element: <CreditsTransactions />, handle: { title: 'Credits & Transactions' } },
          { path: 'checkout', element: <Checkout />, handle: { title: 'Checkout' } },
          { path: 'payment/result', element: <PaymentResult />, handle: { title: 'Payment Result' } },
          { path: 'receipts/:orderCode', element: <Receipt />, handle: { title: 'Receipt' } },
          { path: 'dashboard', element: <ParentDashboard />, handle: { title: 'Overview' } },
          { path: 'classes', element: <ClassroomsPage />, handle: { title: 'Lớp học của con' } },
          { path: 'classes/:id', element: <ClassroomDetail />, handle: { title: 'Chi tiết lớp học' } },
          { path: 'change-password', element: <ChangePassword />, handle: { title: 'Account Security' } },
          { path: 'requests', element: <TutoringRequests />, handle: { title: 'My Tutoring Requests' } },
          { path: 'requests/new', element: <TutoringRequestForm />, handle: { title: 'Create Tutoring Request' } },
          { path: 'requests/:id', element: <TutoringRequestDetail />, handle: { title: 'Tutoring Request' } },
          { path: 'requests/:id/edit', element: <TutoringRequestForm />, handle: { title: 'Edit Tutoring Request' } },
          {
            path: 'requests/:requestId/ai-suggestions',
            element: <AiTutorSuggestions />,
            handle: { title: 'AI Tutor Suggestions' },
          },
          { path: 'requests/:id/applications', element: <ApplicationsReview />, handle: { title: 'Applications' } },
          { path: 'applications', element: <RequestPicker mode="applications" />, handle: { title: 'Applications' } },
          { path: 'ai-suggestions', element: <RequestPicker mode="suggestions" />, handle: { title: 'AI Tutor Suggestions' } },
          { path: 'invitations', element: <SentInvitations />, handle: { title: 'My Invitations' } },
          { path: 'messages', element: <ChatPage basePath="/parent/messages" />, handle: { title: 'Messages' } },
          { path: 'messages/:conversationId', element: <ChatPage basePath="/parent/messages" />, handle: { title: 'Messages' } },
          { path: 'contracts', element: <MyConnections />, handle: { title: 'Contracts & Connections' } },
          { path: 'connections', element: <MyConnections />, handle: { title: 'Contracts & Connections' } },
          { path: 'notifications', element: <Notifications />, handle: { title: 'Notifications' } },
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
          { path: 'credits', element: <CreditsTransactions />, handle: { title: 'Credits & Transactions' } },
          { path: 'checkout', element: <Checkout />, handle: { title: 'Checkout' } },
          { path: 'payment/result', element: <PaymentResult />, handle: { title: 'Payment Result' } },
          { path: 'receipts/:orderCode', element: <Receipt />, handle: { title: 'Receipt' } },
          { path: 'dashboard', element: <TutorDashboard />, handle: { title: 'Overview' } },
          { path: 'classes', element: <ClassroomsPage />, handle: { title: 'Quản lý lớp học' } },
          { path: 'classes/:id', element: <ClassroomDetail />, handle: { title: 'Chi tiết lớp học' } },
          { path: 'change-password', element: <ChangePassword />, handle: { title: 'Account Security' } },
          { path: 'requests', element: <BrowseRequests />, handle: { title: 'Browse Requests' } },
          { path: 'requests/suggested', element: <SuggestedRequests />, handle: { title: 'Suggested for You' } },
          { path: 'requests/saved', element: <SavedRequests />, handle: { title: 'Saved Requests' } },
          { path: 'requests/:id', element: <TutorRequestDetail />, handle: { title: 'Request Details' } },
          { path: 'applications', element: <MyApplications />, handle: { title: 'My Applications' } },
          { path: 'invitations', element: <ReceivedInvitations />, handle: { title: 'Invitations' } },
          { path: 'messages', element: <ChatPage basePath="/tutor/messages" />, handle: { title: 'Messages' } },
          { path: 'messages/:conversationId', element: <ChatPage basePath="/tutor/messages" />, handle: { title: 'Messages' } },
          { path: 'contracts', element: <MyConnections />, handle: { title: 'Contracts & Connections' } },
          { path: 'connections', element: <MyConnections />, handle: { title: 'Contracts & Connections' } },
          { path: 'notifications', element: <Notifications />, handle: { title: 'Notifications' } },
          { path: 'profile', element: <TutorProfile />, handle: { title: 'My Profile' } },
          { path: 'posts', element: <TutorPosts />, handle: { title: 'My Posts' } },
          { path: 'posts/new', element: <TutorPostForm />, handle: { title: 'New Post' } },
          { path: 'posts/:id/edit', element: <TutorPostForm />, handle: { title: 'Edit Post' } },
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
          { path: 'plans', element: <PlansPricing />, handle: { title: 'Plans & Pricing' } },
          { path: 'users', element: <UserManagement />, handle: { title: 'User Management' } },
          { path: 'users/:userId', element: <UserDetail />, handle: { title: 'User Details' } },
          { path: 'dashboard', element: <AdminDashboard />, handle: { title: 'System Statistics' } },
          { path: 'change-password', element: <ChangePassword />, handle: { title: 'Account Security' } },
          { path: 'moderation', element: <Moderation />, handle: { title: 'Content Moderation & Reports' } },
          { path: 'notifications', element: <Notifications />, handle: { title: 'Notifications' } },
        ],
      },
    ],
  },
  { path: '*', element: <NotFound /> },
]);
