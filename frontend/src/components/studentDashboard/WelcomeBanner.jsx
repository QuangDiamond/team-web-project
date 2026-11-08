const pluralize = (count, singular, plural) => {
  if (count === 1) {
    return `${count} ${singular}`;
  }
  return `${count} ${plural}`;
};

// Banner chào mừng (Figma: SectionOverview). Tóm tắt lấy từ tổng số thật của API
export default function WelcomeBanner({ fullName, sessions, assignments }) {
  const isReady = !sessions.loading && !assignments.loading && !sessions.error && !assignments.error;

  let summary = 'Here is an overview of your learning.';
  if (isReady) {
    const sessionText = pluralize(sessions.total, 'upcoming session', 'upcoming sessions');
    const assignmentText = pluralize(assignments.total, 'pending assignment', 'pending assignments');
    summary = `You have ${sessionText} in the next 7 days and ${assignmentText}.`;
  }

  return (
    <div className="student-welcome-banner">
      <p className="student-welcome-eyebrow">Welcome back 👋</p>
      <h2 className="student-welcome-name">{fullName || 'Student'}</h2>
      <p className="student-welcome-summary">{summary}</p>
    </div>
  );
}
