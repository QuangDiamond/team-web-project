import { createBrowserRouter } from 'react-router-dom';
import Layout from '../layouts/Layout';
import Home from '../pages/Home';
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import Payment from '../pages/payment/Payment';
import Profile from '../pages/Profile';
import NotFound from '../pages/NotFound';
import ClassroomsPage from '../pages/classroom/ClassroomsPage';
import ClassroomDetail from '../pages/classroom/ClassroomDetail';
import JoinClassPage from '../pages/classroom/JoinClassPage';

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
      { path: 'classes', element: <ClassroomsPage /> },
      { path: 'classes/:id', element: <ClassroomDetail /> },
      { path: 'join-class', element: <JoinClassPage /> },
      { path: 'join-class/:code', element: <JoinClassPage /> },
    ],
  },
  { path: '*', element: <NotFound /> },
]);