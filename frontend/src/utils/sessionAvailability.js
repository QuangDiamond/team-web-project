const DAY_END_MINUTE = (24 * 60) - 1;

/**
 * Convert a minute offset to the value accepted by an HTML time input.
 * @param {number} minutes - Minutes since midnight
 * @returns {string} Time in HH:mm format
 */
export function formatMinuteTime(minutes) {
  const safeMinutes = Math.max(0, Math.min(DAY_END_MINUTE, minutes));
  const hours = Math.floor(safeMinutes / 60);
  const remainingMinutes = safeMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(remainingMinutes).padStart(2, '0')}`;
}

/**
 * Convert an HTML time input value to a minute offset.
 * @param {string} value - Time in HH:mm format
 * @returns {number} Minutes since midnight
 */
export function parseMinuteTime(value) {
  if (!value) {
    return null;
  }

  const [hours, minutes] = value.split(':').map(Number);
  return (hours * 60) + minutes;
}

/**
 * Get non-cancelled sessions on a selected local calendar date.
 * @param {Array<Object>} sessions - Tutor sessions
 * @param {string} dateValue - Date in YYYY-MM-DD format
 * @param {string|null} excludedSessionId - Session being edited
 * @returns {Array<Object>} Sessions that occupy time on the selected date
 */
export function getSessionsForDate(sessions, dateValue, excludedSessionId = null) {
  if (!dateValue) {
    return [];
  }

  return sessions
    .filter((session) => {
      if (session.status === 'CANCELLED' || String(session._id) === String(excludedSessionId)) {
        return false;
      }

      const startTime = new Date(session.start_time);
      return formatLocalDate(startTime) === dateValue;
    })
    .sort((first, second) => new Date(first.start_time) - new Date(second.start_time));
}

/**
 * Find free time windows between sessions on the selected date.
 * @param {Array<Object>} sessions - Sessions occupying time on the date
 * @returns {Array<{startMinute: number, endMinute: number}>} Free windows
 */
export function getAvailableTimeWindows(sessions) {
  const availableWindows = [];
  let nextFreeMinute = 0;

  for (const session of sessions) {
    const startTime = new Date(session.start_time);
    const endTime = new Date(session.end_time);
    const occupiedStart = (startTime.getHours() * 60) + startTime.getMinutes();
    const occupiedEnd = (endTime.getHours() * 60) + endTime.getMinutes();

    if (occupiedStart > nextFreeMinute) {
      availableWindows.push({ startMinute: nextFreeMinute, endMinute: occupiedStart });
    }
    nextFreeMinute = Math.max(nextFreeMinute, occupiedEnd);
  }

  if (nextFreeMinute < DAY_END_MINUTE) {
    availableWindows.push({ startMinute: nextFreeMinute, endMinute: DAY_END_MINUTE });
  }

  return availableWindows;
}

/**
 * Find a conflicting session for a proposed time range.
 * @param {Array<Object>} sessions - Sessions occupying time on the date
 * @param {number} startMinute - Proposed start in minutes since midnight
 * @param {number} endMinute - Proposed end in minutes since midnight
 * @returns {Object|null} First conflicting session, if any
 */
export function findSessionConflict(sessions, startMinute, endMinute) {
  if (startMinute === null || endMinute === null || endMinute <= startMinute) {
    return null;
  }

  return sessions.find((session) => {
    const startTime = new Date(session.start_time);
    const endTime = new Date(session.end_time);
    const sessionStart = (startTime.getHours() * 60) + startTime.getMinutes();
    const sessionEnd = (endTime.getHours() * 60) + endTime.getMinutes();
    return startMinute < sessionEnd && endMinute > sessionStart;
  }) || null;
}

/**
 * Format a date using the browser's local timezone.
 * @param {Date} date - Date to format
 * @returns {string} Date in YYYY-MM-DD format
 */
function formatLocalDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
