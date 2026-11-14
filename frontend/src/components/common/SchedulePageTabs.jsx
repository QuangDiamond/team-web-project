export default function SchedulePageTabs({ activeTab, onChange }) {
  return (
    <div className="schedule-page-tabs" role="tablist" aria-label="Lịch học và yêu cầu đổi lịch">
      <button
        type="button"
        role="tab"
        aria-selected={activeTab === 'calendar'}
        className={activeTab === 'calendar' ? 'is-active' : ''}
        onClick={() => onChange('calendar')}
      >
        Lịch học
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={activeTab === 'requests'}
        className={activeTab === 'requests' ? 'is-active' : ''}
        onClick={() => onChange('requests')}
      >
        Yêu cầu đổi lịch
      </button>
    </div>
  );
}
