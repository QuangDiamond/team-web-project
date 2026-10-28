import { TutorInvitation } from '../models/TutorInvitation.js';
import { ParentRequest } from '../models/ParentRequest.js';
import { TutorProfile } from '../models/TutorProfile.js';
import { User } from '../models/User.js';
import { CreditTransaction } from '../models/CreditTransaction.js';
import { Conversation } from '../models/Conversation.js';
import { Notification } from '../models/Notification.js';

export const findInvitationsByTutorProfileId = async (tutorProfileId) => {
  const query = tutorProfileId && tutorProfileId !== 'default' ? { tutor_profile_id: tutorProfileId } : {};
  return await TutorInvitation.find(query)
    .populate('parent_user_id', 'full_name email phone avatar_url')
    .populate('request_id')
    .populate({
      path: 'tutor_profile_id',
      populate: {
        path: 'user_id',
        select: 'full_name email phone avatar_url account_status credit_wallet subscription',
      },
    })
    .sort({ created_at: -1 });
};

export const findInvitationById = async (invitationId) => {
  return await TutorInvitation.findById(invitationId)
    .populate('parent_user_id')
    .populate('request_id')
    .populate({
      path: 'tutor_profile_id',
      populate: {
        path: 'user_id',
      },
    });
};

export const updateInvitationStatus = async (invitationId, status) => {
  return await TutorInvitation.findByIdAndUpdate(
    invitationId,
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
