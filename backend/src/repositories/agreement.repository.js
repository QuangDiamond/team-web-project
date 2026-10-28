import { TutoringAgreement } from '../models/TutoringAgreement.js';
import { Conversation } from '../models/Conversation.js';
import { ParentRequest } from '../models/ParentRequest.js';
import { User } from '../models/User.js';
import { Notification } from '../models/Notification.js';

export const findAllAgreements = async () => {
  return await TutoringAgreement.find()
    .populate('proposer_user_id', 'full_name email phone avatar_url role')
    .populate('accepted_by_user_id', 'full_name email phone avatar_url role')
    .populate({
      path: 'conversation_id',
      populate: [
        { path: 'parent_user_id', select: 'full_name email avatar_url phone' },
        {
          path: 'tutor_profile_id',
          populate: { path: 'user_id', select: 'full_name email avatar_url phone' },
        },
        { path: 'request_id' },
      ],
    })
    .sort({ created_at: -1 });
};

export const findAgreementById = async (agreementId) => {
  return await TutoringAgreement.findById(agreementId)
    .populate('proposer_user_id')
    .populate('accepted_by_user_id')
    .populate({
      path: 'conversation_id',
      populate: [
        { path: 'parent_user_id' },
        { path: 'tutor_profile_id', populate: { path: 'user_id' } },
        { path: 'request_id' },
      ],
    });
};

export const createAgreement = async (data) => {
  return await TutoringAgreement.create(data);
};

export const updateAgreement = async (agreementId, updateData) => {
  return await TutoringAgreement.findByIdAndUpdate(
    agreementId,
    { ...updateData, updated_at: new Date() },
    { new: true }
  );
};

export const findActiveConversationById = async (conversationId) => {
  return await Conversation.findById(conversationId)
    .populate('parent_user_id')
    .populate({ path: 'tutor_profile_id', populate: { path: 'user_id' } })
    .populate('request_id');
};

export const updateParentRequestStatus = async (requestId, status) => {
  return await ParentRequest.findByIdAndUpdate(
    requestId,
    { status, updated_at: new Date() },
    { new: true }
  );
};

export const createNotification = async (data) => {
  return await Notification.create(data);
};
