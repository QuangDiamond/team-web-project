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
import { STUDENT_MENU } from '../constants/dashboardMenus';

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
  { path: '*', element: <NotFound /> },
]);
