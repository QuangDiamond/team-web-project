import { useState } from 'react';
import { RefreshCw } from 'lucide-react';

const WEIGHT_FIELDS = [
  { name: 'budget', label: 'Price fit' },
  { name: 'rating', label: 'Rating' },
  { name: 'schedule', label: 'Schedule' },
  { name: 'area', label: 'Area' },
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
      <p className="ai-weights-hint">Adjust what matters most to you, then refresh the ranking.</p>
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
        <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
      </button>
      {total <= 0 && <p className="ai-weights-error">Set at least one weight above 0.</p>}
    </form>
  );
}
