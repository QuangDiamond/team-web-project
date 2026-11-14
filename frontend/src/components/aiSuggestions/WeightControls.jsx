import { useState } from 'react';
import { RefreshCw } from 'lucide-react';

const WEIGHT_FIELDS = [
  { name: 'budget', label: "Mức phù hợp học phí" },
  { name: 'rating', label: "Đánh giá" },
  { name: 'schedule', label: "Lịch học" },
  { name: 'area', label: "Khu vực" },
];

// Bộ chỉnh trọng số (UC09 A1 Refine). Khu vực không có nghĩa với request học online nên bị khóa
export default function WeightControls({ initialWeights, isOnlineRequest, refreshing, onRefresh }) {
  const [weights, setWeights] = useState(initialWeights);

  const handleChange = (name, value) => {
    setWeights({ ...weights, [name]: Number(value) });
  };

  const sendableWeights = { ...weights };
  if (isOnlineRequest) {
    sendableWeights.area = 0;
  }
  const total = Object.values(sendableWeights).reduce((sum, value) => sum + value, 0);
  const canRefresh = total > 0 && !refreshing;

  const handleSubmit = (event) => {
    event.preventDefault();
    onRefresh(sendableWeights);
  };

  return (
    <form className="ai-weights" onSubmit={handleSubmit}>
      <p className="ai-weights-hint">Điều chỉnh mức độ ưu tiên của bạn rồi cập nhật xếp hạng.</p>
      <div className="ai-weights-grid">
        {WEIGHT_FIELDS.map((field) => {
          const isDisabled = field.name === 'area' && isOnlineRequest;
          return (
            <label key={field.name} className="ai-weight-field">
              <span className="ai-weight-label">
                {field.label}
                <span className="ai-weight-value">{isDisabled ? '—' : weights[field.name]}</span>
              </span>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={weights[field.name]}
                disabled={isDisabled || refreshing}
                onChange={(event) => handleChange(field.name, event.target.value)}
              />
            </label>
          );
        })}
      </div>
      <button type="submit" className="btn btn-outline btn-sm" disabled={!canRefresh}>
        <RefreshCw size={14} aria-hidden="true" className={refreshing ? 'spin' : ''} />
        <span>{refreshing ? "Đang cập nhật..." : "Cập nhật"}</span>
      </button>
      {total <= 0 && <p className="ai-weights-error">Cần đặt ít nhất một trọng số lớn hơn 0.</p>}
    </form>
  );
}
