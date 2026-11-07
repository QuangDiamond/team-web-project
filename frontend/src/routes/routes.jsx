import { createBrowserRouter, Navigate } from 'react-router-dom';
import Layout from '../layouts/Layout';
import GuestRoute from './GuestRoute';
import PrivateRoute from './PrivateRoute';
import DashboardLayout from '../components/layout/DashboardLayout';
import Home from '../pages/Home';
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import RegisterSuccess from '../pages/auth/RegisterSuccess';
import RegisterComplete from '../pages/auth/RegisterComplete';
import Checkout from '../pages/payment/Checkout';
import PaymentResult from '../pages/payment/PaymentResult';
import Receipt from '../pages/payment/Receipt';
import CreditsTransactions from '../pages/credits/CreditsTransactions';
import UserManagement from '../pages/admin/UserManagement';
import UserDetail from '../pages/admin/UserDetail';
import Profile from '../pages/Profile';
import NotFound from '../pages/NotFound';
import DashboardHome from '../pages/dashboard/DashboardHome';
import PlansPricing from '../pages/admin/PlansPricing';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'profile', element: <Profile /> },
      // Trang thanh toán cũ (placeholder) nay là Checkout (UC17)
      { path: 'payment', element: <Navigate to="/checkout" replace /> },
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
  // Khu vực đã đăng nhập: sidebar + top bar (DashboardLayout), giới hạn thêm theo role
  {
    element: <PrivateRoute />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          { path: 'dashboard', element: <DashboardHome /> },
          {
            element: <PrivateRoute roles={['ADMIN']} />,
            children: [
              { path: 'admin/plans', element: <PlansPricing /> },
              { path: 'admin/users', element: <UserManagement /> },
              { path: 'admin/users/:userId', element: <UserDetail /> },
            ],
          },
          {
            element: <PrivateRoute roles={['TUTOR', 'PARENT']} />,
            children: [
              { path: 'credits', element: <CreditsTransactions /> },
              { path: 'checkout', element: <Checkout /> },
              { path: 'payment/result', element: <PaymentResult /> },
              { path: 'receipts/:orderCode', element: <Receipt /> },
            ],
          },
        ],
      },
    ],
  },
  { path: '*', element: <NotFound /> },
]);
