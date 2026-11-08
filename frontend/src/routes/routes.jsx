import { createBrowserRouter } from 'react-router-dom';
import Layout from '../layouts/Layout';
import GuestRoute from './GuestRoute';
import Home from '../pages/Home';
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import RegisterSuccess from '../pages/auth/RegisterSuccess';
import RegisterComplete from '../pages/auth/RegisterComplete';
import Payment from '../pages/payment/Payment';
import Profile from '../pages/Profile';
import NotFound from '../pages/NotFound';
import RoleRoute from './RoleRoute';
import DashboardLayout from '../layouts/DashboardLayout';
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
import { PARENT_MENU, STUDENT_MENU, TUTOR_MENU } from '../constants/dashboardMenus';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'profile', element: <Profile /> },
      { path: 'payment', element: <Payment /> },
    ],
  },
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
  // Student dashboard (UC36): dùng khung DashboardLayout chung, xem docs/architecture/dashboard-frame.md
  {
    element: <RoleRoute roles={['STUDENT']} />,
    children: [
      {
        path: 'student',
        element: <DashboardLayout menu={STUDENT_MENU} />,
        children: [
          { path: 'dashboard', element: <StudentDashboard />, handle: { title: 'Overview' } },
        ],
      },
    ],
  },
  // Parent workspace: UC10 quản lý request, UC09 gợi ý gia sư, UC14 lời mời đã gửi.
  // Dashboard của Parent do thành viên khác bổ sung vào nhóm route này
  {
    element: <RoleRoute roles={['PARENT']} />,
    children: [
      {
        path: 'parent',
        element: <DashboardLayout menu={PARENT_MENU} />,
        children: [
          { path: 'dashboard', element: <ParentDashboard />, handle: { title: 'Overview' } },
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
        ],
      },
    ],
  },
  // Tutor workspace: UC11 duyệt / lưu / gợi ý request, UC12 ứng tuyển. Dashboard của Tutor bổ sung vào nhóm route này
  {
    element: <RoleRoute roles={['TUTOR']} />,
    children: [
      {
        path: 'tutor',
        element: <DashboardLayout menu={TUTOR_MENU} />,
        children: [
          { path: 'dashboard', element: <TutorDashboard />, handle: { title: 'Overview' } },
          { path: 'requests', element: <BrowseRequests />, handle: { title: 'Browse Requests' } },
          { path: 'requests/suggested', element: <SuggestedRequests />, handle: { title: 'Suggested for You' } },
          { path: 'requests/saved', element: <SavedRequests />, handle: { title: 'Saved Requests' } },
          { path: 'requests/:id', element: <TutorRequestDetail />, handle: { title: 'Request Details' } },
          { path: 'applications', element: <MyApplications />, handle: { title: 'My Applications' } },
          { path: 'invitations', element: <ReceivedInvitations />, handle: { title: 'Invitations' } },
          { path: 'messages', element: <ChatPage basePath="/tutor/messages" />, handle: { title: 'Messages' } },
          { path: 'messages/:conversationId', element: <ChatPage basePath="/tutor/messages" />, handle: { title: 'Messages' } },
          { path: 'profile', element: <TutorProfile />, handle: { title: 'My Profile' } },
          { path: 'posts', element: <TutorPosts />, handle: { title: 'My Posts' } },
          { path: 'posts/new', element: <TutorPostForm />, handle: { title: 'New Post' } },
          { path: 'posts/:id/edit', element: <TutorPostForm />, handle: { title: 'Edit Post' } },
        ],
      },
    ],
  },
  { path: '*', element: <NotFound /> },
]);
