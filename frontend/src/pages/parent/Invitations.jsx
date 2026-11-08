import { useState } from 'react';
import TutorDirectory from '../../components/invitations/TutorDirectory';
import SentInvitations from './SentInvitations';
import '../../styles/invitations.css';

const TABS = [
  { value: 'tutors', label: 'Tìm gia sư' },
  { value: 'sent', label: 'Lời mời đã gửi' },
];

// UC14 – Invitations của phụ huynh: xem tất cả gia sư đang hoạt động để mời, hoặc xem lại lời mời đã gửi
export default function Invitations() {
  const [activeTab, setActiveTab] = useState('tutors');

  return (
    <div className="page-stack">
      <div className="invite-tabs" role="tablist" aria-label="Lời mời">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.value}
            className={activeTab === tab.value ? 'invite-tab is-active' : 'invite-tab'}
            onClick={() => setActiveTab(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'tutors' && <TutorDirectory />}
      {activeTab === 'sent' && <SentInvitations />}
    </div>
  );
}
