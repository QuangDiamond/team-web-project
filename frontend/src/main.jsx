import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from './hooks/useAuth';
import { router } from './routes/routes';
import './styles/index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
      {/* Toast dùng chung cả app: gọi toast.success / toast.error từ 'sonner' */}
      <Toaster position="top-right" richColors closeButton />
    </AuthProvider>
  </StrictMode>
);
