import { ApplyRequest } from '../models/ApplyRequest.js';
import { ParentRequest } from '../models/ParentRequest.js';
import { TutorProfile } from '../models/TutorProfile.js';
import { User } from '../models/User.js';
import { CreditTransaction } from '../models/CreditTransaction.js';
import { Conversation } from '../models/Conversation.js';
import { Notification } from '../models/Notification.js';

export const findParentRequestById = async (requestId) => {
  return await ParentRequest.findById(requestId).populate('parent_user_id', 'full_name email avatar_url');
};

export const findFirstOpenParentRequest = async () => {
  return await ParentRequest.findOne().sort({ created_at: -1 }).populate('parent_user_id', 'full_name email avatar_url');
};

export const findApplicationsByRequestId = async (requestId) => {
  return await ApplyRequest.find({ request_id: requestId })
    .populate({
      path: 'tutor_profile_id',
      populate: {
        path: 'user_id',
        select: 'full_name email phone avatar_url account_status credit_wallet',
      },
    })
    .sort({ match_score: -1, created_at: -1 });
};

export const findApplicationById = async (applicationId) => {
  return await ApplyRequest.findById(applicationId)
    .populate({
      path: 'tutor_profile_id',
      populate: {
        path: 'user_id',
      },
    })
    .populate('request_id');
};

export const updateApplicationStatus = async (applicationId, status) => {
  return await ApplyRequest.findByIdAndUpdate(
    applicationId,
    { status, updated_at: new Date() },
    { new: true }
  );
};

export const deductTutorCredit = async (userId) => {
  return await User.findByIdAndUpdate(
    userId,
    {
      $inc: { 'credit_wallet.balance': -1 },
      $set: { 'credit_wallet.updated_at': new Date() },
    },
    { new: true }
  );
};

export const createCreditTransaction = async (data) => {
  return await CreditTransaction.create(data);
};

export const findOrCreateDirectConversation = async ({ parent_user_id, tutor_profile_id, request_id }) => {
  let conversation = await Conversation.findOne({
    parent_user_id,
    tutor_profile_id,
    request_id,
    type: 'DIRECT',
  });

  if (!conversation) {
    conversation = await Conversation.create({
      parent_user_id,
      tutor_profile_id,
      request_id,
      type: 'DIRECT',
      is_active: true,
      read_states: [],
    });
  } else if (!conversation.is_active) {
    conversation.is_active = true;
    await conversation.save();
  }

  return conversation;
};

export const createNotification = async (data) => {
  return await Notification.create(data);
};
