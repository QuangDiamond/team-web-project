import { useEffect, useRef, useState } from 'react';
import Alert from '../../components/common/Alert';
import ScheduleChangeFormModal from '../../components/common/ScheduleChangeFormModal';
import ScheduleChangeRequestsPanel from '../../components/common/ScheduleChangeRequestsPanel';
import StudentScheduleCalendar from '../../components/classroom/StudentScheduleCalendar';
import { getUserSessions } from '../../services/sessionService';
import { getWeekStart } from '../../utils/scheduleChangeDates';
import '../../styles/mySchedule.css';
import '../../styles/scheduleChangeRequests.css';

const PAGE_SIZE = 100;

async function getAllSessions() {
  const firstResponse = await getUserSessions({ page: 1, limit: PAGE_SIZE });
  const sessions = [...firstResponse.data.items];
  const totalPages = firstResponse.data.pagination.totalPages;
  const pageRequests = [];

  for (let page = 2; page <= totalPages; page += 1) {
    pageRequests.push(getUserSessions({ page, limit: PAGE_SIZE }));
  }

  const otherResponses = await Promise.all(pageRequests);
  for (const response of otherResponses) {
    sessions.push(...response.data.items);
  }

  return sessions.map((session) => ({
    ...session,
    class_name: session.classroom?.name || 'Lớp chưa đặt tên',
  }));
}

export default function StudentSchedule() {
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [scheduleChangeSession, setScheduleChangeSession] = useState(null);
  const [scheduleChangeRequests, setScheduleChangeRequests] = useState([]);
  const [selectedRequestId, setSelectedRequestId] = useState('');
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const calendarRef = useRef(null);
  const requestsRef = useRef(null);

  // Bấm "Xem trên lịch" ở thẻ yêu cầu: chuyển tới tuần của buổi gốc và cuộn lên lịch
  const showRequestOnCalendar = (request) => {
    setSelectedRequestId(request._id);
    setWeekStart(getWeekStart(request.session.start_time));
    if (calendarRef.current) calendarRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Bấm ô đề xuất trên lịch: làm nổi cặp ô và cuộn tới thẻ yêu cầu
  const selectRequestFromCalendar = (requestId) => {
    setSelectedRequestId(requestId);
    const card = document.getElementById(`schedule-change-request-${requestId}`);
    if (card) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  useEffect(() => {
    let isCurrentRequest = true;
    setIsLoading(true);
    setError('');

    getAllSessions()
      .then((allSessions) => {
        if (isCurrentRequest) {
          setSessions(allSessions);
        }
      })
      .catch((requestError) => {
        if (isCurrentRequest) {
          setError(requestError.message || 'Không thể tải lịch học của bạn.');
        }
      })
      .finally(() => {
        if (isCurrentRequest) {
          setIsLoading(false);
        }
      });

    return () => {
      isCurrentRequest = false;
    };
  }, [reloadKey]);

  return (
    <div className="page-stack my-schedule-page student-my-schedule-page">
      {error && (
        <Alert type="error">
          <p>{error}</p>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => setReloadKey((currentKey) => currentKey + 1)}>
            Thử lại
          </button>
        </Alert>
      )}
      {isLoading && (
        <div className="schedule-loading" role="status">Đang tải lịch học...</div>
      )}
      {!isLoading && !error && (
        <div ref={calendarRef}>
          <StudentScheduleCalendar
            sessions={sessions}
            onRequestChange={setScheduleChangeSession}
            scheduleChangeRequests={scheduleChangeRequests}
            selectedRequestId={selectedRequestId}
            onSelectRequest={selectRequestFromCalendar}
            weekStart={weekStart}
            onWeekChange={setWeekStart}
          />
        </div>
      )}
      <div ref={requestsRef}>
        <ScheduleChangeRequestsPanel
          reloadSignal={reloadKey}
          onRequestsLoaded={setScheduleChangeRequests}
          selectedRequestId={selectedRequestId}
          onShowOnCalendar={showRequestOnCalendar}
          onChanged={() => setReloadKey((key) => key + 1)}
        />
      </div>
      {scheduleChangeSession && (
        <ScheduleChangeFormModal
          session={scheduleChangeSession}
          mode="REQUEST"
          onClose={() => setScheduleChangeSession(null)}
          onSaved={() => {
            setScheduleChangeSession(null);
            setReloadKey((key) => key + 1);
            if (requestsRef.current) requestsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
        />
      )}
    </div>
  );
}
