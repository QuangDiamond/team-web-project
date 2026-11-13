import { useState, useEffect, useId, useMemo } from 'react';
import { TrendingUp, Award, CheckCircle2, BookOpen, Activity, Loader2, Calendar } from 'lucide-react';
import SectionCard from '../common/SectionCard';
import { getLearningActivity } from '../../services/studentDashboardService';

export default function LearningActivityChart() {
  const [periodWeeks, setPeriodWeeks] = useState(6);
  const [metricMode, setMetricMode] = useState('ALL'); // 'ALL' | 'SCORE' | 'ACTIVITY'
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const scoreGradId = useId();
  const activityGradId = useId();

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await getLearningActivity({ weeks: periodWeeks });
        if (isMounted && res?.data) {
          setData(res.data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err?.response?.data?.message || err.message || 'Không thể tải biểu đồ');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchData();
    return () => {
      isMounted = false;
    };
  }, [periodWeeks]);

  // Tọa độ tính toán cho biểu đồ SVG
  const chartCoordinates = useMemo(() => {
    if (!data?.points || data.points.length === 0) return null;

    const points = data.points;
    const width = 760;
    const height = 240;
    const paddingLeft = 50;
    const paddingRight = 40;
    const paddingTop = 30;
    const paddingBottom = 45;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;
    const stepX = chartWidth / (points.length - 1 || 1);

    // Max activity count (tối thiểu là 5 để trục nhìn thoáng)
    const maxActivity = Math.max(
      ...points.map((p) => p.activityCount || 0),
      5
    );

    const scoreCoords = [];
    const activityCoords = [];

    points.forEach((p, idx) => {
      const x = paddingLeft + idx * stepX;

      // Điểm số thang 0 - 10
      const scoreVal = typeof p.avgScore === 'number' ? p.avgScore : null;
      const scoreY = scoreVal !== null ? paddingTop + chartHeight - (scoreVal / 10) * chartHeight : null;
      scoreCoords.push({ x, y: scoreY, value: scoreVal, raw: p });

      // Hoạt động thang 0 - maxActivity
      const actVal = p.activityCount || 0;
      const actY = paddingTop + chartHeight - (actVal / maxActivity) * chartHeight;
      activityCoords.push({ x, y: actY, value: actVal, raw: p });
    });

    // Tạo SVG Path cho đường điểm số (nối các điểm có giá trị)
    const validScores = scoreCoords.filter((c) => c.y !== null);
    let scorePathD = '';
    let scoreAreaD = '';
    if (validScores.length > 0) {
      scorePathD = `M ${validScores[0].x} ${validScores[0].y}`;
      validScores.slice(1).forEach((c) => {
        scorePathD += ` L ${c.x} ${c.y}`;
      });

      const firstX = validScores[0].x;
      const lastX = validScores[validScores.length - 1].x;
      const groundY = paddingTop + chartHeight;
      scoreAreaD = `${scorePathD} L ${lastX} ${groundY} L ${firstX} ${groundY} Z`;
    }

    // Tạo SVG Path cho đường hoạt động
    let activityPathD = `M ${activityCoords[0].x} ${activityCoords[0].y}`;
    activityCoords.slice(1).forEach((c) => {
      activityPathD += ` L ${c.x} ${c.y}`;
    });

    const firstActX = activityCoords[0].x;
    const lastActX = activityCoords[activityCoords.length - 1].x;
    const groundY = paddingTop + chartHeight;
    const activityAreaD = `${activityPathD} L ${lastActX} ${groundY} L ${firstActX} ${groundY} Z`;

    return {
      width,
      height,
      paddingLeft,
      paddingRight,
      paddingTop,
      paddingBottom,
      chartHeight,
      scoreCoords,
      activityCoords,
      scorePathD,
      scoreAreaD,
      activityPathD,
      activityAreaD,
      maxActivity,
    };
  }, [data]);

  const summary = data?.summary || {
    totalSubmissions: 0,
    averageScore: 0,
    totalSessions: 0,
    totalActivities: 0,
  };

  return (
    <SectionCard
      title="Hoạt động học tập & Tiến trình"
      action={
        <div className="activity-chart-actions">
          {/* Chọn hiển thị chỉ số */}
          <div className="activity-mode-toggle" role="group" aria-label="Chọn chỉ số hiển thị">
            <button
              type="button"
              className={`activity-mode-btn ${metricMode === 'ALL' ? 'is-active' : ''}`}
              onClick={() => setMetricMode('ALL')}
            >
              Cả hai
            </button>
            <button
              type="button"
              className={`activity-mode-btn ${metricMode === 'SCORE' ? 'is-active' : ''}`}
              onClick={() => setMetricMode('SCORE')}
            >
              Điểm số
            </button>
            <button
              type="button"
              className={`activity-mode-btn ${metricMode === 'ACTIVITY' ? 'is-active' : ''}`}
              onClick={() => setMetricMode('ACTIVITY')}
            >
              Số hoạt động
            </button>
          </div>

          {/* Chọn số tuần */}
          <div className="activity-period-select-wrap">
            <select
              className="activity-period-select"
              value={periodWeeks}
              onChange={(e) => setPeriodWeeks(Number(e.target.value))}
              aria-label="Chọn khoảng thời gian"
            >
              <option value={4}>4 tuần gần nhất</option>
              <option value={6}>6 tuần gần nhất</option>
              <option value={8}>8 tuần gần nhất</option>
              <option value={12}>12 tuần gần nhất</option>
            </select>
          </div>
        </div>
      }
    >
      {/* Thẻ thống kê tổng quan (Summary stats) */}
      <div className="activity-summary-chips">
        <div className="activity-chip">
          <span className="activity-chip-icon tone-primary">
            <Award size={18} />
          </span>
          <div className="activity-chip-body">
            <p className="activity-chip-label">Điểm trung bình</p>
            <p className="activity-chip-val">{summary.averageScore > 0 ? `${summary.averageScore}/10` : 'Chưa có điểm'}</p>
          </div>
        </div>

        <div className="activity-chip">
          <span className="activity-chip-icon tone-success">
            <CheckCircle2 size={18} />
          </span>
          <div className="activity-chip-body">
            <p className="activity-chip-label">Bài tập đã hoàn thành</p>
            <p className="activity-chip-val">{summary.totalSubmissions} bài</p>
          </div>
        </div>

        <div className="activity-chip">
          <span className="activity-chip-icon tone-info">
            <BookOpen size={18} />
          </span>
          <div className="activity-chip-body">
            <p className="activity-chip-label">Buổi học đã diễn ra</p>
            <p className="activity-chip-val">{summary.totalSessions} buổi</p>
          </div>
        </div>

        <div className="activity-chip">
          <span className="activity-chip-icon tone-purple">
            <Activity size={18} />
          </span>
          <div className="activity-chip-body">
            <p className="activity-chip-label">Tổng hoạt động</p>
            <p className="activity-chip-val">{summary.totalActivities} lượt</p>
          </div>
        </div>
      </div>

      {/* Nội dung biểu đồ */}
      {loading ? (
        <div className="activity-chart-state">
          <Loader2 size={28} className="spin" color="var(--color-primary-strong)" />
          <p>Đang tổng hợp hoạt động học tập...</p>
        </div>
      ) : error ? (
        <div className="activity-chart-state">
          <p style={{ color: '#dc2626' }}>{error}</p>
        </div>
      ) : !chartCoordinates ? (
        <div className="activity-chart-state">
          <p>Chưa có dữ liệu hoạt động trong khoảng thời gian này.</p>
        </div>
      ) : (
        <div className="activity-svg-container">
          {/* Chú giải (Legend) */}
          <div className="activity-legend">
            {(metricMode === 'ALL' || metricMode === 'SCORE') && (
              <div className="activity-legend-item">
                <span className="legend-dot is-score" />
                <span>Điểm trung bình (Thang 10đ)</span>
              </div>
            )}
            {(metricMode === 'ALL' || metricMode === 'ACTIVITY') && (
              <div className="activity-legend-item">
                <span className="legend-dot is-activity" />
                <span>Số hoạt động (Bài nộp + Buổi học)</span>
              </div>
            )}
          </div>

          <svg
            viewBox={`0 0 ${chartCoordinates.width} ${chartCoordinates.height}`}
            className="activity-svg-chart"
            aria-label="Biểu đồ đường hoạt động học tập"
          >
            <defs>
              {/* Gradient cho vùng điểm số */}
              <linearGradient id={scoreGradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f26b3a" stopOpacity="0.28" />
                <stop offset="100%" stopColor="#f26b3a" stopOpacity="0.01" />
              </linearGradient>

              {/* Gradient cho vùng hoạt động */}
              <linearGradient id={activityGradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0284c7" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#0284c7" stopOpacity="0.01" />
              </linearGradient>
            </defs>

            {/* Trục Y và Đường lưới ngang (Grid lines) */}
            {[0, 2.5, 5, 7.5, 10].map((level) => {
              const y =
                chartCoordinates.paddingTop +
                chartCoordinates.chartHeight -
                (level / 10) * chartCoordinates.chartHeight;

              return (
                <g key={level} className="chart-grid-group">
                  <line
                    x1={chartCoordinates.paddingLeft}
                    y1={y}
                    x2={chartCoordinates.width - chartCoordinates.paddingRight}
                    y2={y}
                    stroke="#f1f5f9"
                    strokeWidth="1"
                    strokeDasharray={level === 0 ? 'none' : '4 4'}
                  />
                  {/* Nhãn điểm bên trái */}
                  <text
                    x={chartCoordinates.paddingLeft - 8}
                    y={y + 4}
                    textAnchor="end"
                    className="chart-axis-text"
                  >
                    {level}đ
                  </text>
                </g>
              );
            })}

            {/* Vùng mờ (Area Fill) cho Hoạt động */}
            {(metricMode === 'ALL' || metricMode === 'ACTIVITY') && chartCoordinates.activityAreaD && (
              <path d={chartCoordinates.activityAreaD} fill={`url(#${activityGradId})`} />
            )}

            {/* Vùng mờ (Area Fill) cho Điểm số */}
            {(metricMode === 'ALL' || metricMode === 'SCORE') && chartCoordinates.scoreAreaD && (
              <path d={chartCoordinates.scoreAreaD} fill={`url(#${scoreGradId})`} />
            )}

            {/* Đường biểu diễn (Line) Hoạt động */}
            {(metricMode === 'ALL' || metricMode === 'ACTIVITY') && chartCoordinates.activityPathD && (
              <path
                d={chartCoordinates.activityPathD}
                fill="none"
                stroke="#0284c7"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Đường biểu diễn (Line) Điểm số */}
            {(metricMode === 'ALL' || metricMode === 'SCORE') && chartCoordinates.scorePathD && (
              <path
                d={chartCoordinates.scorePathD}
                fill="none"
                stroke="#ea580c"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Các điểm tròn (Data circles) & Trục X */}
            {data.points.map((p, idx) => {
              const actCoord = chartCoordinates.activityCoords[idx];
              const scoreCoord = chartCoordinates.scoreCoords[idx];
              const isHovered = hoveredIndex === idx;

              return (
                <g
                  key={idx}
                  className="chart-point-group"
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  {/* Cột hướng dẫn dọc khi hover */}
                  {isHovered && (
                    <line
                      x1={actCoord.x}
                      y1={chartCoordinates.paddingTop}
                      x2={actCoord.x}
                      y2={chartCoordinates.paddingTop + chartCoordinates.chartHeight}
                      stroke="#cbd5e1"
                      strokeWidth="1.5"
                      strokeDasharray="3 3"
                    />
                  )}

                  {/* Điểm hoạt động */}
                  {(metricMode === 'ALL' || metricMode === 'ACTIVITY') && actCoord && (
                    <circle
                      cx={actCoord.x}
                      cy={actCoord.y}
                      r={isHovered ? 6 : 4}
                      fill="#ffffff"
                      stroke="#0284c7"
                      strokeWidth="2.5"
                      style={{ cursor: 'pointer', transition: 'r 0.15s ease' }}
                    />
                  )}

                  {/* Điểm số trung bình */}
                  {(metricMode === 'ALL' || metricMode === 'SCORE') && scoreCoord?.y !== null && (
                    <circle
                      cx={scoreCoord.x}
                      cy={scoreCoord.y}
                      r={isHovered ? 7 : 5}
                      fill="#ffffff"
                      stroke="#ea580c"
                      strokeWidth="3"
                      style={{ cursor: 'pointer', transition: 'r 0.15s ease' }}
                    />
                  )}

                  {/* Vùng cảm ứng hover vô hình rộng hơn */}
                  <rect
                    x={actCoord.x - 20}
                    y={chartCoordinates.paddingTop}
                    width={40}
                    height={chartCoordinates.chartHeight}
                    fill="transparent"
                    style={{ cursor: 'pointer' }}
                  />

                  {/* Nhãn trục X ở dưới */}
                  <text
                    x={actCoord.x}
                    y={chartCoordinates.height - 14}
                    textAnchor="middle"
                    className={`chart-axis-text ${isHovered ? 'is-active-label' : ''}`}
                  >
                    {p.label}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Tooltip khi hover vào một mốc tuần */}
          {hoveredIndex !== null && data.points[hoveredIndex] && (
            <div
              className="activity-chart-tooltip"
              style={{
                left: `${
                  (chartCoordinates.activityCoords[hoveredIndex].x / chartCoordinates.width) * 100
                }%`,
              }}
            >
              <p className="tooltip-week-label">
                <Calendar size={13} />
                <span>{data.points[hoveredIndex].label}</span>
              </p>
              <div className="tooltip-metrics">
                <div className="tooltip-metric-row">
                  <span className="tooltip-dot is-score" />
                  <span>Điểm TB:</span>
                  <strong>
                    {data.points[hoveredIndex].avgScore !== null
                      ? `${data.points[hoveredIndex].avgScore} / 10đ`
                      : 'Chưa có bài chấm'}
                  </strong>
                </div>
                <div className="tooltip-metric-row">
                  <span className="tooltip-dot is-activity" />
                  <span>Đã nộp:</span>
                  <strong>{data.points[hoveredIndex].submissionsCount} bài tập</strong>
                </div>
                <div className="tooltip-metric-row">
                  <span className="tooltip-dot is-session" />
                  <span>Buổi học:</span>
                  <strong>{data.points[hoveredIndex].sessionsCount} buổi</strong>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </SectionCard>
  );
}

