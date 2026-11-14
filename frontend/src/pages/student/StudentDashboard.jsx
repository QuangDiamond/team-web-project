import { useAuth } from '../../hooks/useAuth';
import { useStudentDashboard } from '../../hooks/useStudentDashboard';
import WelcomeBanner from '../../components/studentDashboard/WelcomeBanner';
import StudentStats from '../../components/studentDashboard/StudentStats';
import UpcomingSessionList from '../../components/studentDashboard/UpcomingSessionList';
import PendingAssignmentList from '../../components/studentDashboard/PendingAssignmentList';
import JoinedClassList from '../../components/studentDashboard/JoinedClassList';
import GradeFeedbackList from '../../components/studentDashboard/GradeFeedbackList';
import '../../styles/studentDashboard.css';

// UC36 – View Student Dashboard (hiển thị trong DashboardLayout với STUDENT_MENU)
export default function StudentDashboard() {
  const { user } = useAuth();
  const dashboard = useStudentDashboard();

  let fullName = '';
  if (user && user.full_name) {
    fullName = user.full_name;
  }

  return (
    <div className="student-dashboard">
      <WelcomeBanner fullName={fullName} sessions={dashboard.sessions} assignments={dashboard.assignments} />

      <StudentStats
        classes={dashboard.classes}
        sessions={dashboard.sessions}
        assignments={dashboard.assignments}
        grades={dashboard.grades}
      />

      <div className="student-dashboard-grid">
        <div className="student-dashboard-column">
          <UpcomingSessionList section={dashboard.sessions} onRetry={dashboard.reloadSessions} />
          <PendingAssignmentList section={dashboard.assignments} onRetry={dashboard.reloadAssignments} />
        </div>
        <div className="student-dashboard-column">
          <JoinedClassList section={dashboard.classes} onRetry={dashboard.reloadClasses} />
          <GradeFeedbackList section={dashboard.grades} onRetry={dashboard.reloadGrades} />
        </div>
      </div>
    </div>
  );
}
