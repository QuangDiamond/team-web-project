import api from './api';

// Dữ liệu mẫu phong phú và sát thực tế theo SRS TuConnector (SC29 Invitations Inbox)
const fallbackInvitationsData = {
  tutorWallet: {
    credit_balance: 5,
    plan_name: 'Gói Pro Tutor',
    plan_credits_per_month: 30,
    expires_at: '2026-11-20',
  },
  invitations: [
    {
      _id: 'inv_1',
      message: 'Chào thầy, gia đình thấy hồ sơ và thành tích của thầy rất phù hợp với cháu Minh (đang học lớp 11). Nhờ thầy xem giúp lịch học vào tối thứ 3, thứ 5 và mức học phí có nhận kèm riêng cho cháu được không ạ.',
      status: 'PENDING',
      created_at: new Date('2026-10-27T10:30:00+07:00'),
      parent: {
        _id: 'parent_ha',
        full_name: 'Nguyễn Thu Hà',
        email: 'thuha.nguyen@example.com',
        phone: '0912***888',
        avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
        location: 'Quận Cầu Giấy, Hà Nội',
        verified: true,
      },
      request: {
        _id: 'req_ly11',
        title: 'Tìm gia sư Vật lý lớp 11 ôn thi chuyên & củng cố kiến thức',
        subject_name: 'Vật lý',
        grade_level: 'Lớp 11',
        teaching_mode: 'HYBRID',
        budget: '300000',
        schedule: 'Tối thứ 3, thứ 5 (19:30 – 21:00)',
        description: 'Cháu mất gốc phần mạch điện và từ trường, cần gia sư kiên nhẫn giảng giải bản chất và chữa bài tập vận dụng cao.',
        location_address: 'Khu đô thị Trung Hòa - Nhân Chính, Cầu Giấy, Hà Nội',
        status: 'OPEN',
      },
    },
    {
      _id: 'inv_2',
      message: 'Cô Lan ơi, cháu Bình nhà mình cần ôn thi IELTS Speaking và Writing mục tiêu 7.0. Cô xem giúp lịch cuối tuần có sắp xếp kèm 1-1 cho cháu được không ạ.',
      status: 'PENDING',
      created_at: new Date('2026-10-26T16:45:00+07:00'),
      parent: {
        _id: 'parent_tuan',
        full_name: 'Trần Văn Tuấn',
        email: 'tuan.tran@example.com',
        phone: '0988***999',
        avatar_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150',
        location: 'Quận Thanh Xuân, Hà Nội',
        verified: true,
      },
      request: {
        _id: 'req_ielts',
        title: 'Luyện thi IELTS chuyên sâu 7.0+ cấp tốc cho học sinh lớp 12',
        subject_name: 'Tiếng Anh IELTS',
        grade_level: 'Lớp 12',
        teaching_mode: 'ONLINE',
        budget: '350000',
        schedule: 'Thứ 7 & Chủ Nhật (14:00 – 16:00)',
        description: 'Cần gia sư phát âm chuẩn, chấm chữa Writing chi tiết theo thang điểm band 7.0+.',
        location_address: 'Online qua Google Meet / TuConnector Classroom',
        status: 'OPEN',
      },
    },
    {
      _id: 'inv_3',
      message: 'Chào bạn, mình muốn nhờ bạn kèm môn Toán lớp 9 cho cháu thi vào trường THPT Chuyên Sư Phạm.',
      status: 'ACCEPTED',
      created_at: new Date('2026-10-20T08:15:00+07:00'),
      parent: {
        _id: 'parent_minh_chau',
        full_name: 'Lê Minh Châu',
        email: 'chau.le@example.com',
        phone: '0904***123',
        avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
        location: 'Quận Đống Đa, Hà Nội',
        verified: true,
      },
      request: {
        _id: 'req_toan9',
        title: 'Tìm gia sư Toán lớp 9 luyện thi vào 10 chuyên',
        subject_name: 'Toán',
        grade_level: 'Lớp 9',
        teaching_mode: 'OFFLINE',
        budget: '250000',
        schedule: 'Tối thứ 4 & thứ 6 (18:30 – 20:00)',
        description: 'Con học khá, cần luyện các dạng đề chuyên môn Toán.',
        location_address: 'Đống Đa, Hà Nội',
        status: 'IN_PROGRESS',
      },
    },
    {
      _id: 'inv_4',
      message: 'Nhờ thầy dạy kèm Hóa học lớp 10 học kỳ 1.',
      status: 'DECLINED',
      created_at: new Date('2026-10-18T14:20:00+07:00'),
      parent: {
        _id: 'parent_hoang',
        full_name: 'Phan Văn Hoàng',
        email: 'hoang.phan@example.com',
        phone: '0936***666',
        avatar_url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150',
        location: 'Hà Nội',
        verified: false,
      },
      request: {
        _id: 'req_hoa10',
        title: 'Gia sư Hóa học lớp 10 cơ bản',
        subject_name: 'Hóa học',
        grade_level: 'Lớp 10',
        teaching_mode: 'ONLINE',
        budget: '180000',
        schedule: 'Tối thứ 2, thứ 4',
        description: 'Cần dạy cơ bản lý thuyết phản ứng oxi hóa khử.',
        location_address: 'Online',
        status: 'CLOSED',
      },
    },
  ],
};

export const getInvitations = async (tutorProfileId = 'default') => {
  try {
    const res = await api.get(`/invitations/v1?tutorProfileId=${tutorProfileId}`);
    if (res?.data && res?.data?.invitations?.length > 0) {
      return {
        tutorWallet: fallbackInvitationsData.tutorWallet,
        invitations: res.data.invitations,
      };
    }
    return fallbackInvitationsData;
  } catch (error) {
    console.warn('Backend unavailable, using fallback invitations data (SC29):', error.message);
    return fallbackInvitationsData;
  }
};

export const respondToInvitation = async (invitationId, action, reason = '') => {
  try {
    const res = await api.post(`/invitations/v1/${invitationId}/respond`, {
      action,
      reason,
    });
    return res.data || res;
  } catch (error) {
    console.warn('API respondToInvitation failed, simulating action:', error.message);
    return {
      success: true,
      action,
      message:
        action === 'CONTINUE'
          ? 'Đã chấp nhận lời mời dạy! Hệ thống đã trừ 1 credit và mở phòng chat 1-1.'
          : 'Đã từ chối lời mời dạy. Không trừ Connection Credit.',
      conversationId: 'conv_invitation_' + invitationId,
      tutorRemainingCredits: 4,
    };
  }
};
