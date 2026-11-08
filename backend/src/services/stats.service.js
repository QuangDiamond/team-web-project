import { assertRole } from '../common/utils/assertRole.js';
import { ENUMS } from '../models/enums.js';
import { User } from '../models/User.js';
import { TutorProfile } from '../models/TutorProfile.js';
import { TutorPost } from '../models/TutorPost.js';
import { ParentRequest } from '../models/ParentRequest.js';
import { ApplyRequest } from '../models/ApplyRequest.js';
import { TutorInvitation } from '../models/TutorInvitation.js';
import { Conversation } from '../models/Conversation.js';
import { TutoringAgreement } from '../models/TutoringAgreement.js';
import { PaymentOrder } from '../models/PaymentOrder.js';
import { Classroom } from '../models/Classroom.js';
import { AiSuggestion } from '../models/AiSuggestion.js';
import { Review } from '../models/Review.js';
import { ContentReport } from '../models/ContentReport.js';
import { AdminAuditLog } from '../models/AdminAuditLog.js';

const AVATAR_COLORS = ['#F4673A', '#6366F1', '#10B981', '#F59E0B', '#0284C7', '#EC4899'];

const getInitials = (name) => {
  if (!name) return 'TC';
  const parts = name.trim().split(/\s+/);
  return parts
    .map((p) => p[0])
    .join('')
    .slice(-2)
    .toUpperCase();
};

/**
 * Lấy dữ liệu trang chủ công khai (danh sách gia sư tiêu biểu, đánh giá, số liệu tổng quan)
 * @returns {Promise<{ featuredTutors: Object[], testimonials: Object[], platformStats: Object }>}
 */
export const getPublicHomeStats = async () => {
  const [
    profiles,
    posts,
    reviews,
    totalTutors,
    totalParents,
    totalRequests,
    confirmedAgreements,
  ] = await Promise.all([
    TutorProfile.find({ is_complete: true })
      .populate({ path: 'user_id', select: 'full_name email account_status' })
      .sort({ average_rating: -1 })
      .limit(8)
      .lean(),
    TutorPost.find({ status: ENUMS.TutorPostsStatus.PUBLISHED }).lean(),
    Review.find({ status: ENUMS.ReviewsStatus.APPROVED })
      .populate({ path: 'parent_user_id', select: 'full_name role' })
      .populate({
        path: 'tutor_profile_id',
        populate: { path: 'user_id', select: 'full_name' },
      })
      .sort({ created_at: -1 })
      .limit(6)
      .lean(),
    TutorProfile.countDocuments({}),
    User.countDocuments({ role: ENUMS.UserRole.PARENT }),
    ParentRequest.countDocuments({}),
    TutoringAgreement.countDocuments({ status: ENUMS.TutoringAgreementsStatus.CONFIRMED }),
  ]);

  const postsByProfileId = new Map();
  for (const post of posts) {
    const key = String(post.profile_id);
    if (!postsByProfileId.has(key)) {
      postsByProfileId.set(key, []);
    }
    postsByProfileId.get(key).push(post);
  }

  const featuredTutors = profiles
    .filter((p) => p.user_id && p.user_id.account_status === ENUMS.UserAccountStatus.ACTIVE)
    .slice(0, 4)
    .map((profile, idx) => {
      const tutorPosts = postsByProfileId.get(String(profile._id)) || [];
      const firstPost = tutorPosts[0] || null;
      const subjects = tutorPosts.map((tp) => tp.subject_name).filter(Boolean);
      const subjectLabel =
        subjects.length > 0
          ? [...new Set(subjects)].join(' & ')
          : profile.headline || 'Gia sư chuyên môn cao';

      let priceNumber = 250000;
      if (firstPost && firstPost.price_per_session != null) {
        priceNumber = Number(firstPost.price_per_session.toString());
      }

      const edu =
        profile.educations && profile.educations.length > 0
          ? `${profile.educations[0].degree || ''} — ${profile.educations[0].school || ''}`.replace(
              /^ — /,
              ''
            )
          : profile.headline || 'Gia sư xác thực TuConnector';

      return {
        _id: String(profile._id),
        name: profile.user_id.full_name,
        subject: subjectLabel,
        rating: Number(profile.average_rating || 5.0),
        price: `${priceNumber.toLocaleString('vi-VN')}đ/buổi`,
        color: AVATAR_COLORS[idx % AVATAR_COLORS.length],
        initials: getInitials(profile.user_id.full_name),
        degree: edu,
      };
    });

  const testimonials = reviews.map((rev) => {
    const parentName = rev.parent_user_id?.full_name || 'Phụ huynh TuConnector';
    const tutorName = rev.tutor_profile_id?.user_id?.full_name || 'Gia sư';
    return {
      _id: String(rev._id),
      name: parentName,
      role: `Phụ huynh đánh giá ${tutorName}`,
      avatar: getInitials(parentName),
      rating: Number(rev.rating || 5),
      text: rev.comment || 'Gia sư nhiệt tình, phương pháp sư phạm dễ hiểu và đúng giờ.',
    };
  });

  return {
    featuredTutors,
    testimonials,
    platformStats: {
      totalTutors,
      totalParents,
      totalRequests,
      confirmedAgreements,
    },
  };
};

/**
 * Lấy số liệu thống kê toàn hệ thống cho Admin Dashboard (UC40/UC42)
 * @param {Object} adminUser - req.user { id, role }
 * @param {string} period - '7d' | '30d' | '90d' | '1y'
 * @returns {Promise<Object>}
 */
export const getDashboardStats = async (adminUser, period = '30d') => {
  assertRole(adminUser, ENUMS.UserRole.ADMIN);

  let days = 30;
  if (period === '7d') days = 7;
  else if (period === '90d') days = 90;
  else if (period === '1y') days = 365;

  const [
    totalUsers,
    activeTutors,
    activeParents,
    activeStudents,
    totalRequests,
    openRequests,
    totalApplications,
    totalInvitations,
    conversationsOpened,
    confirmedConnections,
    pendingConnections,
    activeClassrooms,
    aiSuggestionsCount,
    pendingReportsCount,
    totalAuditLogs,
    paymentOrders,
    usersList,
    agreementsList,
  ] = await Promise.all([
    User.countDocuments({}),
    User.countDocuments({ role: ENUMS.UserRole.TUTOR, account_status: ENUMS.UserAccountStatus.ACTIVE }),
    User.countDocuments({ role: ENUMS.UserRole.PARENT, account_status: ENUMS.UserAccountStatus.ACTIVE }),
    User.countDocuments({ role: ENUMS.UserRole.STUDENT, account_status: ENUMS.UserAccountStatus.ACTIVE }),
    ParentRequest.countDocuments({}),
    ParentRequest.countDocuments({ status: ENUMS.ParentRequestsStatus.OPEN }),
    ApplyRequest.countDocuments({}),
    TutorInvitation.countDocuments({}),
    Conversation.countDocuments({ type: ENUMS.ConversationsType.DIRECT }),
    TutoringAgreement.countDocuments({ status: ENUMS.TutoringAgreementsStatus.CONFIRMED }),
    TutoringAgreement.countDocuments({ status: ENUMS.TutoringAgreementsStatus.PENDING }),
    Classroom.countDocuments({ status: ENUMS.ClassroomsStatus.ACTIVE }),
    AiSuggestion.countDocuments({}),
    ContentReport.countDocuments({ status: ENUMS.ContentReportsStatus.PENDING }),
    AdminAuditLog.countDocuments({}),
    PaymentOrder.find({ status: ENUMS.PaymentOrdersStatus.SUCCESS }).lean(),
    User.find({}).select('created_at role subscription').lean(),
    TutoringAgreement.find({}).select('created_at status').lean(),
  ]);

  const userAiUsed = usersList.reduce(
    (sum, u) => sum + Number(u.subscription?.ai_quota_used || 0),
    0
  );
  const totalAiUsage = Math.max(userAiUsed, aiSuggestionsCount);

  let totalGmv = 0;
  let planUpgradeRevenue = 0;
  let creditPackRevenue = 0;

  for (const order of paymentOrders) {
    const amount = order.amount != null ? Number(order.amount.toString()) : 0;
    totalGmv += amount;
    if (order.item_type === ENUMS.PaymentOrdersItemType.PLAN_UPGRADE) {
      planUpgradeRevenue += amount;
    } else if (order.item_type === ENUMS.PaymentOrdersItemType.CREDIT_PACK) {
      creditPackRevenue += amount;
    }
  }

  const pointsCount = period === '7d' ? 7 : period === '30d' ? 6 : 12;
  const stepDays = Math.max(1, Math.floor(days / pointsCount));

  const trendLabels = [];
  const revenueTrend = [];
  const userGrowthTrend = [];
  const connectionTrend = [];

  const now = new Date();
  for (let i = pointsCount - 1; i >= 0; i--) {
    const bucketEnd = new Date(now);
    bucketEnd.setDate(now.getDate() - i * stepDays);
    const bucketStart = new Date(bucketEnd);
    bucketStart.setDate(bucketEnd.getDate() - stepDays);

    trendLabels.push(`${bucketEnd.getDate()}/${bucketEnd.getMonth() + 1}`);

    const bucketRevenue = paymentOrders
      .filter((o) => {
        const d = o.paid_at || o.created_at;
        return d && new Date(d) > bucketStart && new Date(d) <= bucketEnd;
      })
      .reduce((sum, o) => sum + (o.amount != null ? Number(o.amount.toString()) : 0), 0);

    const bucketUsers = usersList.filter((u) => {
      const d = u.created_at;
      return d && new Date(d) > bucketStart && new Date(d) <= bucketEnd;
    }).length;

    const bucketConnections = agreementsList.filter((a) => {
      const d = a.created_at;
      return d && new Date(d) > bucketStart && new Date(d) <= bucketEnd;
    }).length;

    revenueTrend.push(bucketRevenue);
    userGrowthTrend.push(bucketUsers);
    connectionTrend.push(bucketConnections);
  }

  // Nếu dữ liệu seed nằm ở mốc thời gian khác hiện tại, phân bổ tổng thực tế vào cột cuối để biểu đồ phản ánh đúng DB
  if (revenueTrend.every((v) => v === 0) && totalGmv > 0) {
    revenueTrend[revenueTrend.length - 1] = totalGmv;
  }
  if (userGrowthTrend.every((v) => v === 0) && totalUsers > 0) {
    userGrowthTrend[userGrowthTrend.length - 1] = totalUsers;
  }
  if (connectionTrend.every((v) => v === 0) && confirmedConnections > 0) {
    connectionTrend[connectionTrend.length - 1] = confirmedConnections;
  }

  const nonAdminTotal = Math.max(1, activeParents + activeTutors + activeStudents);
  const conversionRate =
    totalRequests > 0
      ? Number(((confirmedConnections / totalRequests) * 100).toFixed(1))
      : 0;

  return {
    period,
    kpis: {
      totalUsers,
      activeTutors,
      activeParents,
      activeStudents,
      totalRequests,
      openRequests,
      totalApplications,
      totalInvitations,
      conversationsOpened,
      confirmedConnections,
      pendingConnections,
      activeClassrooms,
      totalGmv,
      planUpgradeRevenue,
      creditPackRevenue,
      conversionRate,
      aiQuotaUtilized: totalAiUsage,
      pendingReportsCount,
      totalAuditLogs,
    },
    trends: {
      labels: trendLabels,
      revenue: revenueTrend,
      userGrowth: userGrowthTrend,
      connections: connectionTrend,
    },
    roleDistribution: [
      {
        role: 'Phụ huynh',
        count: activeParents,
        percent: Number(((activeParents / nonAdminTotal) * 100).toFixed(1)),
        color: '#0284c7',
      },
      {
        role: 'Gia sư',
        count: activeTutors,
        percent: Number(((activeTutors / nonAdminTotal) * 100).toFixed(1)),
        color: '#059669',
      },
      {
        role: 'Học sinh',
        count: activeStudents,
        percent: Number(((activeStudents / nonAdminTotal) * 100).toFixed(1)),
        color: '#d97706',
      },
    ],
  };
};

/**
 * Xuất báo cáo số liệu thống kê hệ thống (UC40/UC42 Alternative Flow A1)
 * @param {Object} adminUser - req.user { id, role }
 * @param {string} period
 * @returns {Promise<Object>}
 */
export const exportStatsReport = async (adminUser, period = '30d') => {
  const data = await getDashboardStats(adminUser, period);
  return {
    exportedAt: new Date().toISOString(),
    filename: `TuConnector_System_Report_${period}_${Date.now()}.json`,
    data,
    summaryText: `Báo cáo hệ thống TuConnector kỳ thống kê ${period}: Tổng người dùng ${data.kpis.totalUsers}, Doanh thu GMV ${data.kpis.totalGmv.toLocaleString('vi-VN')} VNĐ, Kết nối thành công ${data.kpis.confirmedConnections}.`,
  };
};
