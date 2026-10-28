import { createBrowserRouter } from 'react-router-dom';
import Layout from '../layouts/Layout';
import Home from '../pages/Home';
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import Payment from '../pages/payment/Payment';
import Profile from '../pages/Profile';
import ApplicationsReview from '../pages/applications/ApplicationsReview';
import InvitationsInbox from '../pages/invitations/InvitationsInbox';
import MyConnections from '../pages/connections/MyConnections';
import Notifications from '../pages/notifications/Notifications';
import Moderation from '../pages/admin/Moderation';
import AdminDashboard from '../pages/admin/AdminDashboard';
import NotFound from '../pages/NotFound';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'login', element: <Login /> },
      { path: 'register', element: <Register /> },
      { path: 'profile', element: <Profile /> },
      { path: 'payment', element: <Payment /> },
      { path: 'applications', element: <ApplicationsReview /> },
      { path: 'requests/applications', element: <ApplicationsReview /> },
      { path: 'requests/:requestId/applications', element: <ApplicationsReview /> },
      { path: 'invitations', element: <InvitationsInbox /> },
      { path: 'tutor/invitations', element: <InvitationsInbox /> },
      { path: 'connections', element: <MyConnections /> },
      { path: 'contracts', element: <MyConnections /> },
      { path: 'notifications', element: <Notifications /> },
      { path: 'admin/moderation', element: <Moderation /> },
      { path: 'moderation', element: <Moderation /> },
      { path: 'admin/dashboard', element: <AdminDashboard /> },
      { path: 'dashboard', element: <AdminDashboard /> },
    ],
  },
  { path: '*', element: <NotFound /> },
]);