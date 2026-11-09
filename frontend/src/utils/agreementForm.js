import { toNumber } from './formatCurrency.js';

export function getConnectedRequests(conversations) {
  const requests = new Map();
  for (const conversation of conversations) {
    if (conversation.request_id && !requests.has(conversation.request_id)) {
      requests.set(conversation.request_id, { value: conversation.request_id, label: conversation.request_title });
    }
  }
  return [...requests.values()];
}

export function createAgreementForm(conversation) {
  if (!conversation) return { requestId: '', conversationId: '', subject: '', schedule: '', price: '' };
  return {
    requestId: conversation.request_id || '',
    conversationId: conversation._id,
    subject: [conversation.subject_name, conversation.grade_level].filter(Boolean).join(' '),
    schedule: conversation.schedule || '',
    price: String(toNumber(conversation.budget)),
  };
}
