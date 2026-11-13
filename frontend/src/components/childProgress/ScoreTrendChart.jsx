import { TrendingUp } from 'lucide-react';
import SectionCard from '../common/SectionCard';
import EmptyState from '../common/EmptyState';
import { formatPercent } from './progressLabels';

const CHART_WIDTH = 600;
const CHART_HEIGHT = 220;
const PADDING = { left: 40, right: 20, top: 20, bottom: 34 };
const GRID_VALUES = [0, 25, 50, 75, 100];

const formatShortDate = (value) => {
  if (!value) {
    return '';
  }
  return new Date(value).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
};

// Câu mô tả thay đổi giữa hai bài gần nhất, để phụ huynh nắm xu hướng mà không cần đọc biểu đồ
const describeChange = (points) => {
  if (points.length < 2) {
    return '';
  }
  const latest = points[points.length - 1].score_percent;
  const previous = points[points.length - 2].score_percent;
  const difference = Math.round((latest - previous) * 10) / 10;
  if (difference > 0) {
    return `Tăng ${difference} điểm phần trăm so với bài trước.`;
  }
  if (difference < 0) {
    return `Giảm ${Math.abs(difference)} điểm phần trăm so với bài trước.`;
  }
  return 'Không đổi so với bài trước.';
};

/*
 * Biểu đồ đường điểm các bài gần nhất (bước 3 của UC35). trend: { items: [{ assignment_title, score_percent, graded_at }] }
 * Vẽ bằng SVG thuần, mỗi điểm có chú thích (title) gồm tên bài và điểm.
 */
export default function ScoreTrendChart({ items }) {
  const points = items.filter((item) => item.score_percent !== null && item.score_percent !== undefined);

  if (points.length === 0) {
    return (
      <SectionCard title="Xu hướng điểm">
        <EmptyState icon={TrendingUp} title="Chưa có điểm để vẽ biểu đồ" description="Biểu đồ hiện khi gia sư công bố kết quả bài tập." />
      </SectionCard>
    );
  }

  const innerWidth = CHART_WIDTH - PADDING.left - PADDING.right;
  const innerHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom;
  const toY = (percent) => PADDING.top + innerHeight - (percent / 100) * innerHeight;
  const toX = (index) => {
    if (points.length === 1) {
      return PADDING.left + innerWidth / 2;
    }
    return PADDING.left + (index / (points.length - 1)) * innerWidth;
  };

  const coordinates = points.map((point, index) => ({ x: toX(index), y: toY(point.score_percent), point: point }));
  const linePoints = coordinates.map((coordinate) => `${coordinate.x},${coordinate.y}`).join(' ');
  const summaryText = points.map((point) => formatPercent(point.score_percent)).join(', ');
  const showValueLabels = points.length <= 8;

  return (
    <SectionCard title="Xu hướng điểm" action={<span className="progress-count">{points.length} bài gần nhất</span>}>
      <svg
        className="trend-chart"
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        role="img"
        aria-label={`Biểu đồ xu hướng điểm theo thời gian: ${summaryText}`}
      >
        {GRID_VALUES.map((value) => (
          <g key={value}>
            <line className="trend-grid" x1={PADDING.left} x2={CHART_WIDTH - PADDING.right} y1={toY(value)} y2={toY(value)} />
            <text className="trend-axis-label" x={PADDING.left - 8} y={toY(value) + 4} textAnchor="end">{value}</text>
          </g>
        ))}
        {points.length > 1 && <polyline className="trend-line" points={linePoints} />}
        {coordinates.map((coordinate, index) => (
          <g key={`${coordinate.point.assignment_id}-${index}`}>
            <circle className="trend-dot" cx={coordinate.x} cy={coordinate.y} r="5">
              <title>{`${coordinate.point.assignment_title}: ${formatPercent(coordinate.point.score_percent)}`}</title>
            </circle>
            {showValueLabels && (
              <text className="trend-value-label" x={coordinate.x} y={coordinate.y - 10} textAnchor="middle">
                {coordinate.point.score_percent}
              </text>
            )}
            <text className="trend-axis-label" x={coordinate.x} y={CHART_HEIGHT - 10} textAnchor="middle">
              {formatShortDate(coordinate.point.graded_at)}
            </text>
          </g>
        ))}
      </svg>
      <p className="item-meta">{describeChange(points)}</p>
    </SectionCard>
  );
}
