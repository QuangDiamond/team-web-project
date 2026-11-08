import { useState } from 'react';
import { EMPTY_TIME, WEEK_DAYS, formatSchedule, isValidTime, parseSchedule, toMinutes } from '../../utils/schedule';

function TimeFields({ idPrefix, legend, time, disabled, onChange }) {
  const handleField = (event) => {
    onChange({ ...time, [event.target.dataset.field]: event.target.value });
  };

  return (
    <div className="schedule-time" role="group" aria-label={legend}>
      <span className="schedule-time-label">{legend}</span>
      <input
        id={`${idPrefix}-hour`}
        type="number"
        min="1"
        max="12"
        inputMode="numeric"
        placeholder="giờ"
        aria-label={`${legend} - giờ`}
        data-field="hour"
        value={time.hour}
        disabled={disabled}
        onChange={handleField}
      />
      <span className="schedule-time-colon" aria-hidden="true">:</span>
      <input
        id={`${idPrefix}-minute`}
        type="number"
        min="0"
        max="59"
        inputMode="numeric"
        placeholder="phút"
        aria-label={`${legend} - phút`}
        data-field="minute"
        value={time.minute}
        disabled={disabled}
        onChange={handleField}
      />
      <select
        aria-label={`${legend} - AM hoặc PM`}
        data-field="period"
        value={time.period}
        disabled={disabled}
        onChange={handleField}
      >
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </select>
    </div>
  );
}

/*
 * Chọn lịch học: các ngày trong tuần + giờ bắt đầu / kết thúc (giờ, phút, AM/PM).
 * value / onChange là chuỗi lịch (xem utils/schedule.js); onChange nhận '' khi lịch chưa đủ hoặc chưa hợp lệ.
 * Id của nút ngày đầu tiên là `id` để form focus vào khi có lỗi.
 */
export default function SchedulePicker({ id, label, value, onChange, error, disabled }) {
  const [initialParsed] = useState(() => parseSchedule(value));
  const [days, setDays] = useState(initialParsed ? initialParsed.days : []);
  const [start, setStart] = useState(initialParsed ? initialParsed.start : EMPTY_TIME);
  const [end, setEnd] = useState(initialParsed ? initialParsed.end : EMPTY_TIME);
  // Lịch cũ nhập tay không đọc được: hiện lại để người dùng biết mình đang thay nó bằng lịch mới
  const [legacyText] = useState(() => {
    if (value && !initialParsed) {
      return value;
    }
    return '';
  });

  const update = (nextDays, nextStart, nextEnd) => {
    setDays(nextDays);
    setStart(nextStart);
    setEnd(nextEnd);
    onChange(formatSchedule(nextDays, nextStart, nextEnd));
  };

  const toggleDay = (day) => {
    let nextDays;
    if (days.includes(day)) {
      nextDays = days.filter((selectedDay) => selectedDay !== day);
    } else {
      nextDays = [...days, day];
    }
    update(nextDays, start, end);
  };

  let timeOrderError = '';
  if (isValidTime(start) && isValidTime(end) && toMinutes(end) <= toMinutes(start)) {
    timeOrderError = 'Giờ kết thúc phải sau giờ bắt đầu';
  }
  const message = error || timeOrderError;

  return (
    <div className="form-field">
      <p className="form-label" id={`${id}-label`}>{label}</p>
      <div className="schedule-days" role="group" aria-labelledby={`${id}-label`}>
        {WEEK_DAYS.map((day, index) => {
          let buttonId;
          if (index === 0) {
            buttonId = id;
          }
          const isSelected = days.includes(day);
          return (
            <button
              key={day}
              id={buttonId}
              type="button"
              className={isSelected ? 'schedule-day is-selected' : 'schedule-day'}
              aria-pressed={isSelected}
              disabled={disabled}
              onClick={() => toggleDay(day)}
            >
              {day}
            </button>
          );
        })}
      </div>
      <div className="schedule-times">
        <TimeFields idPrefix={`${id}-start`} legend="Từ" time={start} disabled={disabled} onChange={(nextStart) => update(days, nextStart, end)} />
        <TimeFields idPrefix={`${id}-end`} legend="Đến" time={end} disabled={disabled} onChange={(nextEnd) => update(days, start, nextEnd)} />
      </div>
      {legacyText && !message && <p className="form-hint-left">Lịch cũ: {legacyText}. Hãy chọn ngày và giờ để thay thế.</p>}
      {message && <p className="form-error">{message}</p>}
    </div>
  );
}
