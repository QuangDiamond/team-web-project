import api from './api';

const fallbackReports = [
  {
    _id: 'rep_01',
    target_type: 'POST',
    target_id: 'post_ly12_01',
    reason: 'Chứa số điện thoại và thông tin liên hệ cá nhân bên ngoài hệ thống (vi phạm BR-22)',
    severity: 'HIGH',
    status: 'PENDING',
    action_taken: 'NONE',
    admin_note: null,
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    reporter_user_id: {
      _id: 'user_rep_01',
      full_name: 'Trần Văn Hoàng',
      email: 'hoang.tran@example.com',
      avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      role: 'PARENT'
    },
    content_snippet: {
      title: 'Luyện thi Vật Lý 12 điểm 9+ tại Cầu Giấy',
      author: 'Lê Văn Đạt (Gia sư)',
      body_preview: 'Nhận dạy kèm Vật lý 12 cấp tốc, liên hệ Zalo số: 0988***123 để trao đổi học phí rẻ không qua trung gian.'
    }
  },
  {
    _id: 'rep_02',
    target_type: 'MESSAGE',
    target_id: 'msg_conv_09',
    reason: 'Ngôn từ xúc phạm, đe dọa phụ huynh khi không đạt được thỏa thuận học phí',
    severity: 'CRITICAL',
    status: 'PENDING',
    action_taken: 'NONE',
    admin_note: null,
    created_at: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    reporter_user_id: {
      _id: 'user_rep_02',
      full_name: 'Nguyễn Thị Thu',
      email: 'thunguyen@example.com',
      avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
      role: 'PARENT'
    },
    content_snippet: {
      title: 'Tin nhắn hội thoại #conv_09',
      author: 'Hoàng Nam (Gia sư)',
      body_preview: 'Nếu không đồng ý giá 300k/buổi thì đừng có tìm gia sư nữa, phụ huynh mà keo kiệt...'
    }
  },
  {
    _id: 'rep_03',
    target_type: 'REVIEW',
    target_id: 'rev_toan_99',
    reason: 'Đánh giá ảo 1 sao cố tình hạ uy tín của gia sư sau tranh chấp cá nhân',
    severity: 'MEDIUM',
    status: 'INVESTIGATING',
    action_taken: 'NONE',
    admin_note: 'Đang đối chiếu lịch sử buổi học giữa hai bên',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    reporter_user_id: {
      _id: 'user_rep_03',
      full_name: 'ThS. Nguyễn Văn Minh',
      email: 'minh.nguyen@example.com',
      avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      role: 'TUTOR'
    },
    content_snippet: {
      title: 'Đánh giá trên hồ sơ gia sư ThS. Nguyễn Văn Minh',
      author: 'Vũ Quốc Bảo',
      body_preview: 'Dạy dở tệ, hay đi trễ, không đáng 1 sao nào cả mọi người né ra nhé.'
    }
  },
  {
    _id: 'rep_04',
    target_type: 'REQUEST',
    target_id: 'req_hoa11_spam',
    reason: 'Yêu cầu tìm gia sư có nội dung spam, tuyển dụng đa cấp trá hình',
    severity: 'HIGH',
    status: 'RESOLVED',
    action_taken: 'CONTENT_REMOVED',
    admin_note: 'Đã xóa yêu cầu tuyển dụng sai mục đích theo điều khoản nền tảng',
    resolved_at: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    resolved_by_admin_id: {
      full_name: 'Chiến (Admin)'
    },
    reporter_user_id: {
      _id: 'user_rep_04',
      full_name: 'Lê Thanh Thảo',
      email: 'thao.le@example.com',
      avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      role: 'STUDENT'
    },
    content_snippet: {
      title: 'Tuyển bạn làm thêm tại nhà thu nhập 10-20tr không cần dạy học',
      author: 'Ẩn danh',
      body_preview: 'Công việc nhập liệu online nhẹ nhàng, liên hệ gấp qua đường link lạ...'
    }
  }
];

let localReports = [...fallbackReports];

const fallbackAuditLogs = [
  {
    _id: 'audit_01',
    action: 'MODERATE_CONTENT',
    reason: 'Đã xóa yêu cầu tuyển dụng sai mục đích theo điều khoản nền tảng',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
    admin_user_id: { full_name: 'Chiến (Admin)', email: 'admin.chien@tuconnector.vn' },
    details_json: { target_type: 'REQUEST', target_id: 'req_hoa11_spam', action_taken: 'CONTENT_REMOVED' }
  },
  {
    _id: 'audit_02',
    action: 'WARN_USER',
    reason: 'Cảnh cáo lần 1 về hành vi gửi link độc hại trong phòng chat lớp học',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
    admin_user_id: { full_name: 'Quang Anh (Admin)', email: 'admin.quanganh@tuconnector.vn' },
    details_json: { target_type: 'USER', action_taken: 'WARNING_SENT' }
  }
];

let localAuditLogs = [...fallbackAuditLogs];

export const moderationService = {
  getReports: async (params = {}) => {
    try {
      const response = await api.get('/moderation/v1', { params });
      if (response.data && response.data.data) {
        return response.data.data;
      }
    } catch {
      // Fallback
    }

    let filtered = [...localReports];
    if (params.status && params.status !== 'ALL') {
      filtered = filtered.filter((r) => r.status === params.status);
    }
    if (params.severity && params.severity !== 'ALL') {
      filtered = filtered.filter((r) => r.severity === params.severity);
    }
    if (params.target_type && params.target_type !== 'ALL') {
      filtered = filtered.filter((r) => r.target_type === params.target_type);
    }

    return {
      summary: {
        total: localReports.length,
        pendingCount: localReports.filter((r) => r.status === 'PENDING').length,
        criticalCount: localReports.filter((r) => r.severity === 'CRITICAL' && r.status === 'PENDING').length,
        resolvedCount: localReports.filter((r) => r.status === 'RESOLVED').length
      },
      reports: filtered
    };
  },

  getAuditLogs: async () => {
    try {
      const response = await api.get('/moderation/v1/audit-logs');
      if (response.data && response.data.data) {
        return response.data.data;
      }
    } catch {
      // Fallback
    }
    return localAuditLogs;
  },

  resolveReport: async (reportId, payload) => {
    try {
      const response = await api.post(`/moderation/v1/${reportId}/resolve`, payload);
      if (response.data && response.data.data) {
        return response.data.data;
      }
    } catch {
      // Fallback
    }

    const { action, admin_note } = payload;
    const finalStatus = action === 'NONE' ? 'DISMISSED' : 'RESOLVED';

    localReports = localReports.map((r) => {
      if (r._id === reportId) {
        return {
          ...r,
          status: finalStatus,
          action_taken: action,
          admin_note: admin_note,
          resolved_at: new Date().toISOString(),
          resolved_by_admin_id: { full_name: 'Chiến (Admin)' }
        };
      }
      return r;
    });

    const newAudit = {
      _id: `audit_${Date.now()}`,
      action: action === 'USER_BANNED' ? 'LOCK_USER' : action === 'WARNING_SENT' ? 'WARN_USER' : 'MODERATE_CONTENT',
      reason: admin_note,
      created_at: new Date().toISOString(),
      admin_user_id: { full_name: 'Chiến (Admin)', email: 'admin.chien@tuconnector.vn' },
      details_json: { reportId, action_taken: action }
    };
    localAuditLogs = [newAudit, ...localAuditLogs];

    return {
      success: true,
      message: `Đã xử lý báo cáo thành công với hành động: ${action}`
    };
  }
};
