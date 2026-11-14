import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import {
  getConnections,
  confirmAgreement,
  proposeAgreement,
  rateTutor,
} from '../../services/agreementService';
import Alert from '../../components/common/Alert';
import AgreementProposalModal from '../../components/connections/AgreementProposalModal';
import ConnectionCard from '../../components/connections/ConnectionCard';
import ConnectionStats from '../../components/connections/ConnectionStats';
import RateTutorModal from '../../components/connections/RateTutorModal';
import '../../styles/MyConnections.css';

const TABS = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'CONFIRMED', label: 'Đã xác nhận' },
  { value: 'PENDING', label: 'Đang chờ' },
  { value: 'RATEABLE', label: 'Cần đánh giá' },
];

const isRateable = (connection) => {
  return connection.canRate && !connection.hasRated;
};

const matchesTab = (connection, activeTab) => {
  if (activeTab === 'ALL') {
    return true;
  }
  if (activeTab === 'RATEABLE') {
    return isRateable(connection);
  }
  return connection.status === activeTab;
};

const matchesSearch = (connection, searchQuery) => {
  const query = searchQuery.trim().toLowerCase();
  if (!query) {
    return true;
  }
  const tutorName = (connection.tutor?.full_name || '').toLowerCase();
  const parentName = (connection.parent?.full_name || '').toLowerCase();
  const subject = (connection.agreed_subject || '').toLowerCase();
  return tutorName.includes(query) || parentName.includes(query) || subject.includes(query);
};

// UC16 – SC22 My Agreements: danh sách thỏa thuận, đề xuất / xác nhận / từ chối / hủy, đánh giá gia sư
export default function MyConnections() {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [connections, setConnections] = useState([]);
  const [activeConversations, setActiveConversations] = useState([]);
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [processingId, setProcessingId] = useState(null);
  const [proposeModalOpen, setProposeModalOpen] = useState(false);
  const [ratingModalTarget, setRatingModalTarget] = useState(null);

  let messagesBasePath = '/parent/messages';
  if (user && user.role === 'TUTOR') {
    messagesBasePath = '/tutor/messages';
  }

  const loadData = async () => {
    try {
      setLoading(true);
      setLoadError('');
      const data = await getConnections();
      setConnections(data?.connections || []);
      setActiveConversations(data?.activeConversations || []);
    } catch (err) {
      setLoadError(err.message || 'Lỗi tải danh sách kết nối');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleConfirmAction = async (agreement, action) => {
    if (processingId) return;
    setProcessingId(agreement._id);

    let fallbackMessage = 'Đã từ chối thỏa thuận.';
    if (action === 'CONFIRM') {
      fallbackMessage = 'Đã xác nhận thỏa thuận kết nối thành công!';
    } else if (action === 'CANCEL') {
      fallbackMessage = 'Đã hủy đề xuất thỏa thuận.';
    }

    try {
      const res = await confirmAgreement(agreement._id, action);
      toast.success(res?.message || fallbackMessage);
      await loadData();
    } catch (err) {
      toast.error(err.message || 'Lỗi cập nhật thỏa thuận');
    } finally {
      setProcessingId(null);
    }
  };

  const handleProposeSubmit = async (payload) => {
    const res = await proposeAgreement(payload);
    setProposeModalOpen(false);
    toast.success(res?.message || 'Đã gửi đề xuất thỏa thuận kết nối!');
    await loadData();
  };

  const handleRatingSubmit = async (payload) => {
    if (!ratingModalTarget) return;
    try {
      const res = await rateTutor(ratingModalTarget._id, payload);
      toast.success(res?.message || 'Cảm ơn bạn đã gửi đánh giá!');
      setRatingModalTarget(null);
      await loadData();
    } catch (err) {
      toast.error(err.message || 'Lỗi gửi đánh giá');
    }
  };

  const filteredConnections = connections.filter(
    (connection) => matchesTab(connection, activeTab) && matchesSearch(connection, searchQuery)
  );

  const tabCounts = {
    ALL: connections.length,
    CONFIRMED: connections.filter((connection) => connection.status === 'CONFIRMED').length,
    PENDING: connections.filter((connection) => connection.status === 'PENDING').length,
    RATEABLE: connections.filter(isRateable).length,
  };

  let listContent;
  if (loading) {
    listContent = (
      <div className="conn-empty-state">
        <p>Đang tải danh sách thỏa thuận kết nối từ hệ thống...</p>
      </div>
    );
  } else if (loadError) {
    listContent = (
      <Alert type="error">
        <p>{loadError}</p>
        <button type="button" className="btn btn-outline btn-sm" onClick={loadData}>Thử lại</button>
      </Alert>
    );
  } else if (filteredConnections.length === 0) {
    listContent = (
      <div className="conn-empty-state">
        <h3>Chưa có thỏa thuận kết nối nào</h3>
        <p className="conn-empty-hint">
          Sau khi mở hội thoại 1-1, bạn và đối tác có thể bấm &ldquo;Đề xuất thỏa thuận mới&rdquo; để ghi nhận hợp đồng dạy kèm tại đây.
        </p>
      </div>
    );
  } else {
    listContent = (
      <div className="conn-cards-grid">
        {filteredConnections.map((connection) => (
          <ConnectionCard
            key={connection._id}
            connection={connection}
            user={user}
            isProcessing={processingId === connection._id}
            messagesBasePath={messagesBasePath}
            onAction={handleConfirmAction}
            onRate={setRatingModalTarget}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="connections-page">

      <div className="conn-header-row">
        <div>
          <h2 className="conn-title">Hợp đồng &amp; Thỏa thuận kết nối</h2>
          <p className="conn-subtitle">Quản lý các thỏa thuận dạy kèm đã chốt và xác nhận kết nối hai bên</p>
        </div>
        <button type="button" className="btn-propose-new" onClick={() => setProposeModalOpen(true)}>
          <Plus size={18} aria-hidden="true" />
          Đề xuất thỏa thuận mới
        </button>
      </div>

      <ConnectionStats
        totalCount={tabCounts.ALL}
        confirmedCount={tabCounts.CONFIRMED}
        pendingCount={tabCounts.PENDING}
        rateableCount={tabCounts.RATEABLE}
      />

      <div className="conn-toolbar">
        <div className="conn-tabs">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              className={`conn-tab-btn ${activeTab === tab.value ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.value)}
            >
              {tab.label} <span className="conn-tab-pill">{tabCounts[tab.value]}</span>
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Tìm theo tên đối tác, môn học..."
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          className="conn-search-input"
        />
      </div>

      {listContent}

      {proposeModalOpen && (
        <AgreementProposalModal
          conversations={activeConversations}
          role={user?.role}
          onSubmit={handleProposeSubmit}
          onClose={() => setProposeModalOpen(false)}
        />
      )}

      {ratingModalTarget && (
        <RateTutorModal
          connection={ratingModalTarget}
          onSubmit={handleRatingSubmit}
          onClose={() => setRatingModalTarget(null)}
        />
      )}
    </div>
  );
}
