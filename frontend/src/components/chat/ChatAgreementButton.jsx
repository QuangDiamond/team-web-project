import { useState } from 'react';
import { FileSignature, LoaderCircle } from 'lucide-react';
import AgreementProposalModal from '../connections/AgreementProposalModal';
import { getConnections, proposeAgreement } from '../../services/agreementService';
import { useAuth } from '../../hooks/useAuth';

/*
 * UC16 Trigger: "Propose agreement" ngay trong hội thoại 1-1 (SC11 Messages).
 * Chỉ hiện với hội thoại đang mở. Mở AgreementProposalModal với đúng hội thoại hiện tại.
 * onProposed(message) được gọi sau khi gửi đề xuất thành công.
 */
export default function ChatAgreementButton({ conversationId, onProposed, onError }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [conversations, setConversations] = useState(null);

  const openModal = async () => {
    if (loading) {
      return;
    }
    setLoading(true);
    try {
      const data = await getConnections();
      let activeConversations = [];
      if (data && data.activeConversations) {
        activeConversations = data.activeConversations;
      }
      const currentConversation = activeConversations.filter((item) => item._id === conversationId);
      setConversations(currentConversation);
    } catch (error) {
      onError(error.message || 'Không thể tải thông tin hội thoại để đề xuất thỏa thuận.');
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setConversations(null);
  };

  const submitProposal = async (payload) => {
    const result = await proposeAgreement(payload);
    setConversations(null);
    let message = 'Đã gửi đề xuất thỏa thuận. Đang chờ đối tác xác nhận.';
    if (result && result.message) {
      message = result.message;
    }
    onProposed(message);
  };

  let role = '';
  if (user) {
    role = user.role;
  }

  return (
    <>
      <button type="button" className="btn-chat-agreement" onClick={openModal} disabled={loading} title="Đề xuất thỏa thuận dạy học">
        {loading ? <LoaderCircle size={14} className="spin" aria-hidden="true" /> : <FileSignature size={14} aria-hidden="true" />}
        <span>Đề xuất thỏa thuận</span>
      </button>
      {conversations && (
        <AgreementProposalModal
          conversations={conversations}
          role={role}
          onSubmit={submitProposal}
          onClose={closeModal}
        />
      )}
    </>
  );
}
