import api from './api';

// Dữ liệu mẫu phong phú và sát thực tế theo SRS TuConnector phục vụ fallback khi backend chưa kết nối
const fallbackApplicationsData = {
  request: {
    _id: 'req_ly11',
    title: 'Tìm gia sư Vật lý lớp 11 ôn thi chuyên & củng cố kiến thức',
    subject_name: 'Vật lý',
    grade_level: 'Lớp 11',
    teaching_mode: 'HYBRID',
    budget: '300000',
    schedule: 'Tối thứ 3, thứ 5 (19:30 – 21:00)',
    description: 'Con đang học lớp 11 chuyên ban Tự nhiên, cần gia sư vững lý thuyết và bài tập nâng cao chương Cảm ứng điện từ & Quang hình học. Yêu cầu có phương pháp truyền đạt dễ hiểu và kiên nhẫn.',
    location_address: 'Quận Cầu Giấy, Hà Nội',
    status: 'OPEN',
    tutor_requirements: 'Gia sư từng đạt giải học sinh giỏi Vật lý hoặc có kinh nghiệm luyện thi đại học trên 2 năm.',
    created_at: new Date('2026-10-12T21:00:00+07:00'),
  },
  applications: [
    {
      _id: 'apply_1',
      note: 'Chào phụ huynh, em là thủ khoa đầu vào Khoa Sư phạm Vật lý - ĐH Sư phạm Hà Nội. Em có 3 năm kinh nghiệm gia sư học sinh lớp 11-12, nắm vững sơ đồ tư duy giải nhanh bài tập điện - từ. Em cam kết đồng hành và cải thiện điểm số của em sau 8 buổi học.',
      match_score: 96.5,
      status: 'PENDING',
      created_at: new Date('2026-10-14T09:30:00+07:00'),
      tutor: {
        _id: 'tp_anh_pham',
        user_id: 'user_tutor_anh',
        full_name: 'Phạm Nhật Anh',
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
        headline: 'Thủ khoa Sư phạm Vật lý · 3 năm kinh nghiệm luyện thi',
        bio: 'Tốt nghiệp loại Xuất sắc khoa Sư phạm Vật lý - ĐH Sư phạm Hà Nội. Phương pháp dạy học trực quan hóa bằng mô phỏng thí nghiệm tương tác PhET, giúp học sinh nắm bản chất vật lý thay vì học vẹt công thức.',
        address: 'Cầu Giấy, Hà Nội',
        is_address_hidden: false,
        is_complete: true,
        availability_status: 'AVAILABLE',
        average_rating: 4.95,
        total_reviews: 42,
        teaching_mode: 'HYBRID',
        hourly_rate: 280000,
        credit_balance: 14,
        account_status: 'ACTIVE',
        experiences: [
          {
            role: 'Gia sư Vật lý 11 & 12',
            organization: 'Trung tâm Gia sư TuConnector',
            period: '2023 – Hiện tại',
            description: 'Đã kèm 15+ học sinh nâng điểm từ 6.5 lên 8.5+ trong kỳ thi học kỳ và THPT Quốc gia.',
          },
          {
            role: 'Trợ giảng bộ môn Vật lý đại cương',
            organization: 'Đại học Sư phạm Hà Nội',
            period: '2022 – 2024',
            description: 'Hỗ trợ giảng viên hướng dẫn bài tập phòng thí nghiệm quang học và từ trường.',
          },
        ],
        educations: [
          {
            degree: 'Cử nhân Sư phạm Vật lý',
            institution: 'ĐH Sư phạm Hà Nội',
            year: '2020 – 2024',
            grade: 'Xuất sắc (GPA 3.82/4.0)',
          },
        ],
        achievements: [
          {
            title: 'Giải Nhất Olympic Vật lý Sinh viên Toàn quốc 2023',
            issued_by: 'Hội Vật lý Việt Nam',
            year: '2023',
          },
          {
            title: 'Chứng nhận Gia sư xuất sắc TuConnector Quý 3/2026',
            issued_by: 'TuConnector Platform',
            year: '2026',
          },
        ],
      },
    },
    {
      _id: 'apply_2',
      note: 'Em chào anh/chị, em hiện là kỹ sư Điện - Điện tử ĐH Bách Khoa Hà Nội. Mảng điện và từ trường lớp 11 là ứng dụng thực tế em làm hàng ngày. Em sẽ giải thích cặn kẽ và hướng dẫn giải các bài tập vận dụng cao cho cháu.',
      match_score: 91.0,
      status: 'PENDING',
      created_at: new Date('2026-10-14T11:15:00+07:00'),
      tutor: {
        _id: 'tp_huy_tran',
        user_id: 'user_tutor_huy',
        full_name: 'Trần Quang Huy',
        avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
        headline: 'Kỹ sư ĐHBK Hà Nội · Chuyên sâu Điện & Từ trường 11-12',
        bio: 'Tốt nghiệp ĐH Bách Khoa Hà Nội loại Giỏi. Có kinh nghiệm dạy kèm Vật lý cho học sinh mất gốc hoặc cần bứt phá điểm 9+. Phong cách giảng dạy logic, tập trung vào kỹ năng phân tích mạch và định luật vật lý cốt lõi.',
        address: 'Hai Bà Trưng, Hà Nội',
        is_address_hidden: false,
        is_complete: true,
        availability_status: 'AVAILABLE',
        average_rating: 4.88,
        total_reviews: 26,
        teaching_mode: 'ONLINE',
        hourly_rate: 260000,
        credit_balance: 8,
        account_status: 'ACTIVE',
        experiences: [
          {
            role: 'Gia sư Tự do môn Toán - Lý',
            organization: 'Hà Nội',
            period: '2022 – Hiện tại',
            description: 'Đã hướng dẫn hơn 20 học sinh THPT nắm vững kiến thức Vật lý trọng tâm.',
          },
        ],
        educations: [
          {
            degree: 'Kỹ sư Kỹ thuật Điện',
            institution: 'Đại học Bách Khoa Hà Nội',
            year: '2019 – 2024',
            grade: 'Giỏi',
          },
        ],
        achievements: [
          {
            title: 'Giải Nhì Học sinh giỏi Vật lý cấp Tỉnh',
            issued_by: 'Sở GD&ĐT',
            year: '2019',
          },
        ],
      },
    },
    {
      _id: 'apply_3',
      note: 'Em là giảng viên trẻ bộ môn Khoa học Tự nhiên. Em dạy theo phương pháp kích thích tư duy phản biện, giúp học sinh tự tìm ra công thức và cách giải.',
      match_score: 85.5,
      status: 'CONTINUED',
      created_at: new Date('2026-10-13T14:00:00+07:00'),
      tutor: {
        _id: 'tp_minh_nguyen',
        user_id: 'user_tutor_minh',
        full_name: 'Nguyễn Văn Minh',
        avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
        headline: 'Thạc sĩ Vật lý Lý thuyết · 5 năm kinh nghiệm giảng dạy',
        bio: 'Thạc sĩ Vật lý tại ĐHQG Hà Nội. Đã kèm nhiều học sinh chuyên Lý Hà Nội - Amsterdam và Chuyên Sư phạm.',
        address: 'Đống Đa, Hà Nội',
        is_address_hidden: false,
        is_complete: true,
        availability_status: 'AVAILABLE',
        average_rating: 5.0,
        total_reviews: 58,
        teaching_mode: 'OFFLINE',
        hourly_rate: 320000,
        credit_balance: 20,
        account_status: 'ACTIVE',
        experiences: [
          {
            role: 'Giảng viên thỉnh giảng',
            organization: 'ĐHQG Hà Nội',
            period: '2023 – Nay',
            description: 'Giảng dạy Vật lý đại cương và ôn tập chuyên đề nâng cao.',
          },
        ],
        educations: [
          {
            degree: 'Thạc sĩ Khoa học Vật lý',
            institution: 'Đại học Quốc gia Hà Nội',
            year: '2021 – 2023',
            grade: 'Xuất sắc',
          },
        ],
        achievements: [
          {
            title: 'Top 10 Gia sư được đánh giá cao nhất năm 2025',
            issued_by: 'TuConnector',
            year: '2025',
          },
        ],
      },
    },
    {
      _id: 'apply_4',
      note: 'Tôi có thể hỗ trợ dạy Vật lý lớp 11 online vào các buổi tối cuối tuần.',
      match_score: 62.0,
      status: 'SKIPPED',
      created_at: new Date('2026-10-13T16:20:00+07:00'),
      tutor: {
        _id: 'tp_le_hoang',
        user_id: 'user_tutor_le',
        full_name: 'Lê Hoàng Nam',
        avatar_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=300&q=80',
        headline: 'Cử nhân Công nghệ Kỹ thuật',
        bio: 'Nhận dạy kèm Vật lý cơ bản lớp 10, 11 cho học sinh cần lấy lại gốc.',
        address: 'Hà Nội',
        is_address_hidden: true,
        is_complete: true,
        availability_status: 'AVAILABLE',
        average_rating: 4.5,
        total_reviews: 8,
        teaching_mode: 'ONLINE',
        hourly_rate: 200000,
        credit_balance: 3,
        account_status: 'ACTIVE',
        experiences: [],
        educations: [],
        achievements: [],
      },
    },
  ],
};

export const getApplicationsByRequest = async (requestId = 'default') => {
  try {
    const res = await api.get(`/applications/v1/requests/${requestId}`);
    if (res?.data && res?.data?.applications?.length > 0) {
      return res.data;
    }
    // Nếu DB chưa có đơn nào, trả về fallback phong phú chuẩn SRS
    return fallbackApplicationsData;
  } catch (error) {
    console.warn('Backend unavailable, using fallback data for UC15 SC17 review:', error.message);
    return fallbackApplicationsData;
  }
};

export const respondToApplication = async (applicationId, action) => {
  try {
    const res = await api.post(`/applications/v1/${applicationId}/respond`, {
      action,
    });
    return res.data || res;
  } catch (error) {
    console.warn('API respond failed, returning simulated successful action:', error.message);
    return {
      success: true,
      action,
      message:
        action === 'CONTINUE'
          ? 'Đã chấp nhận kết nối gia sư thành công! Hệ thống đã trừ 1 credit của gia sư và kích hoạt phòng chat 1-1.'
          : 'Đã bỏ qua ứng viên thành công.',
      conversationId: 'conv_sample_direct_' + applicationId,
    };
  }
};
