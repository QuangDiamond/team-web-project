const pluralize = (count, singular, plural) => {
  if (count === 1) {
    return `${count} ${singular}`;
  }
  return `${count} ${plural}`;
};

// Banner chào mừng (Figma: SectionOverview). Tóm tắt lấy từ tổng số thật của API
export default function WelcomeBanner({ fullName, sessions, assignments }) {
  const isReady = !sessions.loading && !assignments.loading && !sessions.error && !assignments.error;

  let summary = "Tổng quan tình hình học tập của bạn.";
  if (isReady) {
    const sessionText = pluralize(sessions.total, "buổi học sắp tới", "buổi học sắp tới");
    const assignmentText = pluralize(assignments.total, "bài tập chưa hoàn thành", "bài tập chưa hoàn thành");
    summary = `Bạn có ${sessionText} trong 7 ngày tới và ${assignmentText}.`;
  }

  return (
    <div className="student-welcome-banner">
      <p className="student-welcome-eyebrow">Chào mừng bạn trở lại</p>
      <h2 className="student-welcome-name">{fullName || "Học sinh"}</h2>
      <p className="student-welcome-summary">{summary}</p>
    </div>
  );
}
