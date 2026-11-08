import { ParentRequest } from '../models/ParentRequest.js';
import { ApplyRequest } from '../models/ApplyRequest.js';
import { TutorInvitation } from '../models/TutorInvitation.js';
import { Conversation } from '../models/Conversation.js';
import { BookmarkedRequest } from '../models/BookmarkedRequest.js';
import { TutorPost } from '../models/TutorPost.js';
import { TutorProfile } from '../models/TutorProfile.js';
import { ENUMS } from '../models/enums.js';
import { assertRole } from '../common/utils/assertRole.js';
import { getRequestCutoff } from '../common/utils/requestRules.js';
import { getBalance } from './credit.service.js';
import { buildBrowseFilter } from './tutorRequest.service.js';

/**
 * Số liệu tổng hợp cho Parent Dashboard. Danh sách chi tiết lấy từ các API có phân trang sẵn có
 * @param {Object} user - req.user { id, role }
 * @returns {Promise<Object>} { open_requests, pending_applications, pending_invitations, active_conversations, credit_balance }
 */
export const getParentSummary = async (user) => {
  assertRole(user, ENUMS.UserRole.PARENT);

  // Request còn hiệu lực: OPEN và chưa quá 30 ngày (BR-05)
  const openRequestFilter = {
    parent_user_id: user.id,
    status: ENUMS.ParentRequestsStatus.OPEN,
    created_at: { $gte: getRequestCutoff() },
  };
  const openRequestIds = await ParentRequest.distinct('_id', openRequestFilter);

  const [pendingApplications, pendingInvitations, activeConversations, creditBalance] = await Promise.all([
    ApplyRequest.countDocuments({
      request_id: { $in: openRequestIds },
      status: ENUMS.ApplyRequestsStatus.PENDING,
    }),
    TutorInvitation.countDocuments({
      parent_user_id: user.id,
      status: ENUMS.TutorInvitationsStatus.PENDING,
    }),
    Conversation.countDocuments({
      parent_user_id: user.id,
      type: ENUMS.ConversationsType.DIRECT,
      is_active: true,
    }),
    getBalance(user.id),
  ]);

  return {
    open_requests: openRequestIds.length,
    pending_applications: pendingApplications,
    pending_invitations: pendingInvitations,
    active_conversations: activeConversations,
    credit_balance: creditBalance,
  };
};

/**
 * Số liệu tổng hợp cho Tutor Dashboard. Gia sư chưa có hồ sơ vẫn xem được dashboard (has_profile = false)
 * để giao diện nhắc hoàn thiện hồ sơ thay vì báo lỗi
 * @param {Object} user - req.user { id, role }
 * @returns {Promise<Object>} { has_profile, available_requests, pending_applications, accepted_applications,
 *   pending_invitations, saved_requests, published_posts, active_conversations, credit_balance }
 */
export const getTutorSummary = async (user) => {
  assertRole(user, ENUMS.UserRole.TUTOR);

  const creditBalance = await getBalance(user.id);
  const profile = await TutorProfile.findOne({ user_id: user.id }).select('_id').lean();
  if (!profile) {
    return {
      has_profile: false,
      available_requests: 0,
      pending_applications: 0,
      accepted_applications: 0,
      pending_invitations: 0,
      saved_requests: 0,
      published_posts: 0,
      active_conversations: 0,
      credit_balance: creditBalance,
    };
  }

  const [
    availableRequests,
    pendingApplications,
    acceptedApplications,
    pendingInvitations,
    savedRequests,
    publishedPosts,
    activeConversations,
  ] = await Promise.all([
    ParentRequest.countDocuments(buildBrowseFilter({})),
    ApplyRequest.countDocuments({ tutor_profile_id: profile._id, status: ENUMS.ApplyRequestsStatus.PENDING }),
    ApplyRequest.countDocuments({ tutor_profile_id: profile._id, status: ENUMS.ApplyRequestsStatus.CONTINUED }),
    TutorInvitation.countDocuments({ tutor_profile_id: profile._id, status: ENUMS.TutorInvitationsStatus.PENDING }),
    BookmarkedRequest.countDocuments({ tutor_profile_id: profile._id }),
    TutorPost.countDocuments({ profile_id: profile._id, status: ENUMS.TutorPostsStatus.PUBLISHED }),
    Conversation.countDocuments({
      tutor_profile_id: profile._id,
      type: ENUMS.ConversationsType.DIRECT,
      is_active: true,
    }),
  ]);

  return {
    has_profile: true,
    available_requests: availableRequests,
    pending_applications: pendingApplications,
    accepted_applications: acceptedApplications,
    pending_invitations: pendingInvitations,
    saved_requests: savedRequests,
    published_posts: publishedPosts,
    active_conversations: activeConversations,
    credit_balance: creditBalance,
  };
};
