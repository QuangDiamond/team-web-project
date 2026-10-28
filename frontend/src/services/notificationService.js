import api from './api';

const fallbackNotifications = [
  {
    _id: 'noti_01',
    category: 'APPLICATION',
    title: 'Gia sư mới ứng tuyển yêu cầu của bạn',
    body: 'ThS. Nguyễn Văn Minh đã gửi hồ sơ ứng tuyển cho yêu cầu "Tìm gia sư Toán lớp 9 ôn thi vào 10".',
    target_type: 'PARENT_REQUEST',
    target_id: 'req_toan9',
    is_read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    delivery_logs: [
      { channel: 'IN_APP', status: 'DELIVERED', sent_at: new Date().toISOString() },
      { channel: 'EMAIL', status: 'DELIVERED', sent_at: new Date().toISOString() }
    ],
    deepLink: '/applications'
  },
  {
    _id: 'noti_02',
    category: 'INVITATION',
    title: 'Phụ huynh mời bạn dạy kèm',
    body: 'Phụ huynh Trần Thu Hà đã gửi lời mời bạn dạy kèm môn Tiếng Anh Lớp 10.',
    target_type: 'TUTOR_INVITATION',
    target_id: 'inv_ta10',
    is_read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    delivery_logs: [
      { channel: 'IN_APP', status: 'DELIVERED', sent_at: new Date().toISOString() },
      { channel: 'SMS', status: 'DELIVERED', sent_at: new Date().toISOString() }
    ],
    deepLink: '/invitations'
  },
  {
    _id: 'noti_03',
    category: 'CONVERSATION',
    title: 'Kết nối được xác nhận thành công (UC18)',
    body: 'Thỏa thuận dạy kèm môn Toán 9 giữa bạn và gia sư ThS. Nguyễn Văn Minh đã được cả hai bên xác nhận.',
    target_type: 'TUTORING_AGREEMENT',
    target_id: 'agr_ha_minh',
    is_read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    delivery_logs: [
      { channel: 'IN_APP', status: 'DELIVERED', sent_at: new Date().toISOString() },
      { channel: 'EMAIL', status: 'DELIVERED', sent_at: new Date().toISOString() }
    ],
    deepLink: '/connections'
  },
  {
    _id: 'noti_04',
    category: 'SESSION',
    title: 'Nhắc nhở buổi học sắp diễn ra',
    body: 'Buổi học "Toán đại số - Hệ thức Vi-ét" sẽ diễn ra lúc 19:30 tối nay. Vui lòng chuẩn bị tài liệu.',
    target_type: 'CLASS_SESSION',
    target_id: 'ses_toan_01',
    is_read: true,
    read_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    delivery_logs: [
      { channel: 'IN_APP', status: 'DELIVERED', sent_at: new Date().toISOString() },
      { channel: 'EMAIL', status: 'DELIVERED', sent_at: new Date().toISOString() },
      { channel: 'SMS', status: 'DELIVERED', sent_at: new Date().toISOString() }
    ],
    deepLink: '/calendar'
  },
  {
    _id: 'noti_05',
    category: 'ASSIGNMENT',
    title: 'Bài tập mới đã được giao',
    body: 'Gia sư đã giao bài tập trắc nghiệm chương 3 Hình học 9, hạn nộp trước 23:00 Chủ Nhật.',
    target_type: 'ASSIGNMENT',
    target_id: 'asm_hinh9',
    is_read: true,
    read_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 25).toISOString(),
    delivery_logs: [
      { channel: 'IN_APP', status: 'DELIVERED', sent_at: new Date().toISOString() }
    ],
    deepLink: '/classes'
  },
  {
    _id: 'noti_06',
    category: 'SYSTEM',
    title: 'Cộng credit hàng tháng thành công',
    body: 'Gói Pro của bạn đã được gia hạn tự động và cộng thêm 30 lượt liên hệ gia sư / nhận lớp.',
    target_type: 'CREDIT_WALLET',
    target_id: 'wal_01',
    is_read: true,
    read_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 50).toISOString(),
    delivery_logs: [
      { channel: 'IN_APP', status: 'DELIVERED', sent_at: new Date().toISOString() },
      { channel: 'EMAIL', status: 'DELIVERED', sent_at: new Date().toISOString() }
    ],
    deepLink: '/payment'
  }
];

let localNotifications = [...fallbackNotifications];

export const notificationService = {
  getNotifications: async (params = {}) => {
    try {
      const response = await api.get('/notifications/v1', { params });
      if (response.data && response.data.data) {
        return response.data.data;
      }
    } catch {
      // Fallback locally
    }

    let filtered = [...localNotifications];
    if (params.category && params.category !== 'ALL') {
      filtered = filtered.filter((n) => n.category === params.category);
    }
    if (params.is_read !== undefined) {
      filtered = filtered.filter((n) => n.is_read === params.is_read);
    }

    const unreadCount = localNotifications.filter((n) => !n.is_read).length;
    return {
      unreadCount,
      notifications: filtered
    };
  },

  markAsRead: async (notificationId) => {
    try {
      const response = await api.patch(`/notifications/v1/${notificationId}/read`);
      if (response.data && response.data.data) {
        return response.data.data;
      }
    } catch {
      // Fallback
    }

    localNotifications = localNotifications.map((n) =>
      n._id === notificationId ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
    );
    const updated = localNotifications.find((n) => n._id === notificationId);
    return updated;
  },

  markAllAsRead: async () => {
    try {
      const response = await api.post('/notifications/v1/mark-all-read');
      if (response.data && response.data.data) {
        return response.data.data;
      }
    } catch {
      // Fallback
    }

    localNotifications = localNotifications.map((n) => ({
      ...n,
      is_read: true,
      read_at: new Date().toISOString()
    }));
    return {
      success: true,
      message: 'Đã đánh dấu tất cả thông báo là đã đọc.'
    };
  },

  deleteNotification: async (notificationId) => {
    try {
      const response = await api.delete(`/notifications/v1/${notificationId}`);
      if (response.data && response.data.data) {
        return response.data.data;
      }
    } catch {
      // Fallback
    }

    localNotifications = localNotifications.filter((n) => n._id !== notificationId);
    return {
      success: true,
      message: 'Đã xóa thông báo thành công.'
    };
  }
};
