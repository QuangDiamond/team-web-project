import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  ExternalLink,
  LoaderCircle,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import { Link, useLocation, useParams } from 'react-router-dom';
import Alert from '../../components/common/Alert';
import FormInput from '../../components/common/FormInput';
import FormSelect from '../../components/common/FormSelect';
import Modal from '../../components/common/Modal';
import Toast from '../../components/common/Toast';
import ClassroomTopicsAndMaterials from '../../components/tutorClassroom/ClassroomTopicsAndMaterials';
import {
  createClassTopic,
  createClassMaterial,
  createClassSession,
  deleteClassMaterial,
  deleteClassSession,
  deleteClassTopic,
  getClassSessions,
  getClassMaterials,
  getClassTopics,
  updateClassMaterial,
  updateClassSession,
  updateClassTopic,
} from '../../services/classroomService';
import '../../styles/classDetail.css';
import '../../styles/mySchedule.css';

const SESSION_PAGE_SIZE = 100;
const HOUR_HEIGHT = 52;
const WEEKDAY_FORMATTER = new Intl.DateTimeFormat('en', { weekday: 'short' });
const DAY_FORMATTER = new Intl.DateTimeFormat('en', { day: 'numeric' });
const MONTH_YEAR_FORMATTER = new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' });
const TIME_FORMATTER = new Intl.DateTimeFormat('en', { hour: 'numeric', minute: '2-digit' });

const CLASS_TABS = [
  { id: 'materials', label: 'Materials & Topics', Icon: BookOpen },
  { id: 'schedule', label: 'Schedule of Class', Icon: CalendarDays },
];

function getWeekStart(date) {
  const weekStart = new Date(date);
  const daysSinceMonday = (weekStart.getDay() + 6) % 7;
  weekStart.setDate(weekStart.getDate() - daysSinceMonday);
  weekStart.setHours(0, 0, 0, 0);
  return weekStart;
}

function getWeekDays(weekStart) {
  const days = [];
  for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + dayIndex);
    days.push(day);
  }
  return days;
}

function isSameDay(firstDate, secondDate) {
  return firstDate.getFullYear() === secondDate.getFullYear()
    && firstDate.getMonth() === secondDate.getMonth()
    && firstDate.getDate() === secondDate.getDate();
}

function getSessionLayout(sessions, hourStart, hourEnd) {
  const events = sessions.map((session, index) => {
    const startTime = new Date(session.start_time);
    const endTime = new Date(session.end_time);
    const startOffset = (startTime.getHours() - hourStart) * 60 + startTime.getMinutes();
    const endOffset = Math.min(
      (hourEnd - hourStart) * 60,
      (endTime.getHours() * 60) + endTime.getMinutes() - (hourStart * 60),
    );

    return {
      session: session,
      top: (startOffset / 60) * HOUR_HEIGHT,
      height: Math.max(28, ((endOffset - startOffset) / 60) * HOUR_HEIGHT),
      colorIndex: index % 5,
    };
  });

  events.sort((first, second) => first.top - second.top);

  const positionedEvents = [];
  let overlappingGroup = [];
  let groupEnd = -1;

  const addGroupToLayout = () => {
    const laneEnds = [];
    for (const event of overlappingGroup) {
      let laneIndex = laneEnds.findIndex((laneEnd) => laneEnd <= event.top);
      if (laneIndex === -1) {
        laneIndex = laneEnds.length;
        laneEnds.push(event.top + event.height);
      } else {
        laneEnds[laneIndex] = event.top + event.height;
      }
      event.laneIndex = laneIndex;
    }

    for (const event of overlappingGroup) {
      event.laneCount = laneEnds.length;
      positionedEvents.push(event);
    }
    overlappingGroup = [];
    groupEnd = -1;
  };

  for (const event of events) {
    if (overlappingGroup.length > 0 && event.top >= groupEnd) {
      addGroupToLayout();
    }
    overlappingGroup.push(event);
    groupEnd = Math.max(groupEnd, event.top + event.height);
  }
  addGroupToLayout();

  return positionedEvents;
}

function formatSessionTime(session) {
  const startTime = new Date(session.start_time);
  const endTime = new Date(session.end_time);
  return `${TIME_FORMATTER.format(startTime)} – ${TIME_FORMATTER.format(endTime)}`;
}

function formatDateInput(value) {
  const date = new Date(value);
  const pad = (number) => String(number).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function formatTimeInput(value) {
  const date = new Date(value);
  const pad = (number) => String(number).padStart(2, '0');
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

async function getAllClassSessions(classId) {
  const firstResponse = await getClassSessions(classId, { page: 1, limit: SESSION_PAGE_SIZE });
  const allSessions = [...firstResponse.data.items];
  const totalPages = firstResponse.data.pagination.totalPages;
  const otherPageNumbers = [];

  for (let page = 2; page <= totalPages; page += 1) {
    otherPageNumbers.push(page);
  }

  const otherPages = await Promise.all(otherPageNumbers.map((page) => (
    getClassSessions(classId, { page: page, limit: SESSION_PAGE_SIZE })
  )));

  for (const page of otherPages) {
    allSessions.push(...page.data.items);
  }

  return allSessions;
}

function ClassSessionFormModal({ session, initialValues, onClose, onSave, onSuccess }) {
  const [values, setValues] = useState(() => {
    if (!session) {
      return {
        title: '',
        date: initialValues ? initialValues.date : '',
        start_time: initialValues ? initialValues.start_time : '',
        end_time: initialValues ? initialValues.end_time : '',
        meeting_link: '',
        status: 'SCHEDULED',
      };
    }
    return {
      title: session.title || '',
      date: formatDateInput(session.start_time),
      start_time: formatTimeInput(session.start_time),
      end_time: formatTimeInput(session.end_time),
      meeting_link: session.meeting_link || '',
      status: session.status || 'SCHEDULED',
    };
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field, value) => {
    setValues((currentValues) => ({ ...currentValues, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError('');

    if (!values.title.trim()) {
      setFormError('Session title is required.');
      return;
    }

    const startTime = new Date(`${values.date}T${values.start_time}`);
    const endTime = new Date(`${values.date}T${values.end_time}`);
    if (startTime <= new Date()) {
      setFormError('Start time must be in the future.');
      return;
    }
    if (endTime <= startTime) {
      setFormError('End time must be after start time on the selected day.');
      return;
    }

    setIsSubmitting(true);
    const result = await onSave({
      title: values.title.trim(),
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      meeting_link: values.meeting_link.trim() || null,
      status: values.status,
    }, session ? session._id : null);
    setIsSubmitting(false);

    if (result.success) {
      onSuccess(startTime, result.session);
      onClose();
      return;
    }
    setFormError(result.message);
  };

  const isEditing = Boolean(session);

  return (
    <Modal title={isEditing ? 'Edit class session' : 'Create class session'} onClose={onClose}>
      <form className="class-create-form class-session-create-form" onSubmit={handleSubmit}>
        <FormInput
          id="class-session-title"
          label="Session title"
          value={values.title}
          onChange={(event) => handleChange('title', event.target.value)}
          placeholder="For example: Algebra lesson"
          maxLength={200}
          disabled={isSubmitting}
        />
        <div className="form-field">
          <label className="form-label" htmlFor="class-session-date">Date</label>
          <div className="form-control">
            <input
              id="class-session-date"
              type="date"
              value={values.date}
              onChange={(event) => handleChange('date', event.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>
        </div>
        <div className="class-session-time-fields">
          <div className="form-field">
            <label className="form-label" htmlFor="class-session-start-time">Start time</label>
            <div className="form-control">
              <input
                id="class-session-start-time"
                type="time"
                value={values.start_time}
                onChange={(event) => handleChange('start_time', event.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>
          </div>
          <div className="form-field">
            <label className="form-label" htmlFor="class-session-end-time">End time</label>
            <div className="form-control">
              <input
                id="class-session-end-time"
                type="time"
                value={values.end_time}
                onChange={(event) => handleChange('end_time', event.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>
          </div>
        </div>
        <FormInput
          id="class-session-meeting-link"
          label="Meeting link (optional)"
          value={values.meeting_link}
          onChange={(event) => handleChange('meeting_link', event.target.value)}
          placeholder="https://meet.google.com/..."
          maxLength={2048}
          disabled={isSubmitting}
        />
        <FormSelect
          id="class-session-status"
          label="Status"
          value={values.status}
          onChange={(event) => handleChange('status', event.target.value)}
          options={[
            { value: 'SCHEDULED', label: 'Scheduled' },
            { value: 'CANCELLED', label: 'Cancelled' },
            { value: 'COMPLETED', label: 'Completed' },
          ]}
          disabled={isSubmitting}
        />
        {formError && <Alert type="error"><p>{formError}</p></Alert>}
        <div className="class-session-form-actions">
          <button type="button" className="btn btn-outline btn-sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary btn-sm" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : isEditing ? 'Save changes' : 'Create session'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function ClassSchedule({ sessions, isLoading, error, onRetry, onSaveSession, onDeleteSession }) {
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [sessionToEdit, setSessionToEdit] = useState(null);
  const [sessionToDelete, setSessionToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const days = getWeekDays(weekStart);
  const today = new Date();
  const weekSessions = useMemo(() => sessions
    .filter((session) => {
      const startTime = new Date(session.start_time);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);
      return startTime >= weekStart && startTime < weekEnd;
    })
    .sort((first, second) => new Date(first.start_time) - new Date(second.start_time)), [sessions, weekStart]);

  let hourStart = 7;
  let hourEnd = 21;
  for (const session of weekSessions) {
    const startTime = new Date(session.start_time);
    const endTime = new Date(session.end_time);
    hourStart = Math.min(hourStart, startTime.getHours());
    const roundedEndHour = Math.ceil(endTime.getHours() + (endTime.getMinutes() > 0 ? 1 : 0));
    hourEnd = Math.max(hourEnd, Math.min(24, roundedEndHour));
  }

  const hourCount = Math.max(1, hourEnd - hourStart);
  const gridHeight = hourCount * HOUR_HEIGHT;
  const timeLabels = [];
  for (let hour = hourStart; hour < hourEnd; hour += 1) {
    const hourDate = new Date(2000, 0, 1, hour, 0, 0, 0);
    timeLabels.push(TIME_FORMATTER.format(hourDate));
  }

  const moveWeek = (amount) => {
    setWeekStart((currentWeekStart) => {
      const nextWeekStart = new Date(currentWeekStart);
      nextWeekStart.setDate(nextWeekStart.getDate() + (amount * 7));
      return nextWeekStart;
    });
    setSelectedSlot(null);
  };

  const goToCurrentWeek = () => {
    setWeekStart(getWeekStart(new Date()));
    setSelectedSlot(null);
  };

  const handleCalendarColumnClick = (event, day) => {
    const columnBounds = event.currentTarget.getBoundingClientRect();
    const minutesFromTop = Math.max(0, event.clientY - columnBounds.top) * 60 / HOUR_HEIGHT;
    const roundedMinutesFromTop = Math.floor(minutesFromTop / 15) * 15;
    const dayMinutes = Math.min((hourStart * 60) + roundedMinutesFromTop, (23 * 60) + 45);
    const startTime = new Date(day);
    startTime.setHours(0, dayMinutes, 0, 0);

    if (startTime <= new Date()) {
      setSelectedSlot(null);
      return;
    }

    const endTime = new Date(startTime);
    endTime.setMinutes(endTime.getMinutes() + 60);
    if (!isSameDay(startTime, endTime)) {
      endTime.setHours(23, 59, 0, 0);
    }

    setSelectedSlot({
      dayKey: day.toDateString(),
      top: (roundedMinutesFromTop / 60) * HOUR_HEIGHT,
      date: formatDateInput(startTime),
      start_time: formatTimeInput(startTime),
      end_time: formatTimeInput(endTime),
    });
  };

  const openCreateForm = (initialValues) => {
    setIsCreateOpen(true);
    if (!initialValues) {
      setSelectedSlot(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!sessionToDelete) {
      return;
    }
    setIsDeleting(true);
    setDeleteError('');
    const result = await onDeleteSession(sessionToDelete._id);
    setIsDeleting(false);
    if (result.success) {
      setSessionToDelete(null);
      return;
    }
    setDeleteError(result.message);
  };

  if (isLoading) {
    return (
      <div className="schedule-loading" role="status">
        <LoaderCircle size={24} className="spin" aria-hidden="true" />
        <span>Loading class sessions...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert type="error">
        <p>{error}</p>
        <button type="button" className="btn btn-outline btn-sm" onClick={onRetry}>Try again</button>
      </Alert>
    );
  }

  return (
    <section className="class-schedule-section" aria-labelledby="class-schedule-title">
      <div className="schedule-toolbar">
        <div className="schedule-toolbar-title">
          <span className="schedule-toolbar-icon" aria-hidden="true"><CalendarDays size={19} /></span>
          <div>
            <h2 id="class-schedule-title">{MONTH_YEAR_FORMATTER.format(weekStart)}</h2>
            <p>
              {weekStart.toLocaleDateString('en', { month: 'short', day: 'numeric' })}
              {' – '}
              {new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 6)
                .toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
        </div>
        <div className="schedule-toolbar-actions">
          <button type="button" className="btn btn-primary btn-sm" onClick={() => openCreateForm(null)}>
            <Plus size={15} aria-hidden="true" />
            Create session
          </button>
          <button type="button" className="btn btn-outline btn-sm" onClick={goToCurrentWeek}>Today</button>
          <div className="schedule-week-arrows" aria-label="Change week">
            <button type="button" className="btn btn-outline btn-sm" onClick={() => moveWeek(-1)} aria-label="Previous week">
              <ChevronLeft size={16} aria-hidden="true" />
            </button>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => moveWeek(1)} aria-label="Next week">
              <ChevronRight size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      <div className="schedule-calendar-card">
        {weekSessions.length === 0 && (
          <div className="schedule-week-empty">
            <span>No sessions this week. Use the arrows to browse another week.</span>
          </div>
        )}
        <div className="schedule-calendar-scroll">
          <div className="schedule-calendar" style={{ '--schedule-grid-height': `${gridHeight}px` }}>
            <div className="schedule-calendar-corner" aria-hidden="true" />
            {days.map((day) => (
              <div
                key={day.toISOString()}
                className={isSameDay(day, today) ? 'schedule-day-heading is-today' : 'schedule-day-heading'}
              >
                <span>{WEEKDAY_FORMATTER.format(day)}</span>
                <strong>{DAY_FORMATTER.format(day)}</strong>
              </div>
            ))}

            <div className="schedule-time-axis">
              {timeLabels.map((label) => <span key={label}>{label}</span>)}
            </div>

            {days.map((day) => {
              const daySessions = weekSessions.filter((session) => isSameDay(new Date(session.start_time), day));
              const events = getSessionLayout(daySessions, hourStart, hourEnd);
              const dayIsToday = isSameDay(day, today);

              return (
                <div
                  key={day.toISOString()}
                  className={dayIsToday ? 'schedule-day-column schedule-day-column-selectable is-today' : 'schedule-day-column schedule-day-column-selectable'}
                  style={{ height: `${gridHeight}px` }}
                  title="Click an empty time to create a session"
                  onClick={(event) => handleCalendarColumnClick(event, day)}
                >
                  {events.map((event) => {
                    const sessionHasStarted = new Date(event.session.start_time) <= new Date();
                    const eventStyle = {
                      top: `${event.top}px`,
                      height: `${event.height}px`,
                      left: `calc(${(100 / event.laneCount) * event.laneIndex}% + 4px)`,
                      width: `calc(${100 / event.laneCount}% - 8px)`,
                      right: 'auto',
                    };

                    return (
                      <article
                        key={event.session._id}
                        className={`schedule-event schedule-event-color-${event.colorIndex}`}
                        style={eventStyle}
                        onClick={(eventClick) => eventClick.stopPropagation()}
                      >
                        <div className="schedule-event-heading">
                          <strong className="schedule-event-title">{event.session.title || 'Class session'}</strong>
                          <div className="schedule-event-actions">
                            {event.session.meeting_link && (
                              <a
                                className="schedule-event-action"
                                href={event.session.meeting_link}
                                target="_blank"
                                rel="noreferrer"
                                aria-label={`Open meeting for ${event.session.title || 'class session'}`}
                                title="Open meeting"
                              >
                                <ExternalLink size={13} aria-hidden="true" />
                              </a>
                            )}
                            <button
                              type="button"
                              className="schedule-event-action"
                              onClick={() => setSessionToEdit(event.session)}
                              disabled={sessionHasStarted}
                              aria-label={sessionHasStarted ? 'Past sessions cannot be updated' : 'Edit session'}
                              title={sessionHasStarted ? 'Past sessions cannot be updated' : 'Edit session'}
                            >
                              <Pencil size={13} aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              className="schedule-event-action schedule-event-delete-action"
                              onClick={() => {
                                setDeleteError('');
                                setSessionToDelete(event.session);
                              }}
                              disabled={sessionHasStarted}
                              aria-label={sessionHasStarted ? 'Past sessions cannot be deleted' : 'Delete session'}
                              title={sessionHasStarted ? 'Past sessions cannot be deleted' : 'Delete session'}
                            >
                              <Trash2 size={13} aria-hidden="true" />
                            </button>
                          </div>
                        </div>
                        <span className="schedule-event-time">
                          <Clock3 size={12} aria-hidden="true" />
                          {formatSessionTime(event.session)}
                        </span>
                      </article>
                    );
                  })}
                  {selectedSlot && selectedSlot.dayKey === day.toDateString() && (
                    <button
                      type="button"
                      className="schedule-slot-create-button"
                      style={{ top: `${selectedSlot.top}px` }}
                      onClick={(event) => {
                        event.stopPropagation();
                        openCreateForm(selectedSlot);
                      }}
                    >
                      <Plus size={13} aria-hidden="true" />
                      Create session
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <p className="schedule-timezone-note">Times are shown in your device’s local timezone.</p>
      {isCreateOpen && (
        <ClassSessionFormModal
          key="create-session"
          session={null}
          initialValues={selectedSlot}
          onClose={() => setIsCreateOpen(false)}
          onSave={onSaveSession}
          onSuccess={(startTime) => {
            setWeekStart(getWeekStart(startTime));
            setSelectedSlot(null);
          }}
        />
      )}
      {sessionToEdit && (
        <ClassSessionFormModal
          key={sessionToEdit._id}
          session={sessionToEdit}
          onClose={() => setSessionToEdit(null)}
          onSave={onSaveSession}
          onSuccess={(startTime) => setWeekStart(getWeekStart(startTime))}
        />
      )}
      {sessionToDelete && (
        <Modal title="Delete class session" onClose={() => setSessionToDelete(null)}>
          <p className="class-session-delete-copy">
            Delete “{sessionToDelete.title || 'Class session'}”? This action cannot be undone.
          </p>
          {deleteError && <Alert type="error"><p>{deleteError}</p></Alert>}
          <div className="class-session-form-actions">
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => setSessionToDelete(null)}
              disabled={isDeleting}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-outline btn-sm class-delete-confirm-button"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete session'}
            </button>
          </div>
        </Modal>
      )}
    </section>
  );
}

export default function MyClassDetail() {
  const { classId } = useParams();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('materials');
  const [toast, setToast] = useState(null);
  const [topics, setTopics] = useState([]);
  const [topicsLoading, setTopicsLoading] = useState(true);
  const [topicsError, setTopicsError] = useState('');
  const [createTopicError, setCreateTopicError] = useState('');
  const [topicActionError, setTopicActionError] = useState('');
  const [createMaterialError, setCreateMaterialError] = useState('');
  const [materials, setMaterials] = useState([]);
  const [materialsLoading, setMaterialsLoading] = useState(true);
  const [materialsError, setMaterialsError] = useState('');
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessionsError, setSessionsError] = useState('');
  const classroom = location.state && location.state.classroom;
  const canLoadClassroom = classroom && String(classroom._id) === classId;

  const showToast = (type, message) => {
    setToast({ id: Date.now(), type: type, message: message });
  };

  const closeToast = () => setToast(null);

  useEffect(() => {
    if (!canLoadClassroom) {
      setTopicsLoading(false);
      setSessionsLoading(false);
      return;
    }

    let isCurrentRequest = true;
    setTopicsLoading(true);
    setTopicsError('');

    getClassTopics(classId, { page: 1, limit: 100 })
      .then((response) => {
        if (isCurrentRequest) {
          setTopics(response.data.items);
        }
      })
      .catch((error) => {
        if (isCurrentRequest) {
          setTopicsError(error.message);
        }
      })
      .finally(() => {
        if (isCurrentRequest) {
          setTopicsLoading(false);
        }
      });

    getClassMaterials(classId, { page: 1, limit: 100 })
      .then((response) => {
        if (isCurrentRequest) {
          setMaterials(response.data.items);
        }
      })
      .catch((error) => {
        if (isCurrentRequest) {
          setMaterialsError(error.message);
        }
      })
      .finally(() => {
        if (isCurrentRequest) {
          setMaterialsLoading(false);
        }
      });

    setSessionsLoading(true);
    setSessionsError('');
    getAllClassSessions(classId)
      .then((classSessions) => {
        if (isCurrentRequest) {
          setSessions(classSessions);
        }
      })
      .catch((error) => {
        if (isCurrentRequest) {
          setSessionsError(error.message);
        }
      })
      .finally(() => {
        if (isCurrentRequest) {
          setSessionsLoading(false);
        }
      });

    return () => {
      isCurrentRequest = false;
    };
  }, [classId, canLoadClassroom]);

  if (!canLoadClassroom) {
    return (
      <div className="class-detail-page">
        <Alert type="info">
          <p>Open this class from My Class to load its details.</p>
          <Link to="/tutor/classes" className="link">Back to My Class</Link>
        </Alert>
      </div>
    );
  }

  const handleCreateTopic = async (topicName) => {
    setCreateTopicError('');
    try {
      const response = await createClassTopic(classId, { name: topicName });
      setTopics((currentTopics) => [...currentTopics, response.data]);
      showToast('success', response.message);
      return true;
    } catch (error) {
      setCreateTopicError(error.message);
      showToast('error', error.message);
      return false;
    }
  };

  const handleUpdateTopic = async (topicId, topicName) => {
    setTopicActionError('');
    try {
      const response = await updateClassTopic(classId, topicId, { name: topicName });
      setTopics((currentTopics) => currentTopics.map((topic) => (
        topic._id === topicId ? response.data : topic
      )));
      showToast('success', response.message);
      return true;
    } catch (error) {
      setTopicActionError(error.message);
      showToast('error', error.message);
      return false;
    }
  };

  const handleDeleteTopic = async (topicId) => {
    setTopicActionError('');
    try {
      const response = await deleteClassTopic(classId, topicId);
      setTopics((currentTopics) => currentTopics.filter((topic) => topic._id !== topicId));
      showToast('success', response.message);
      return true;
    } catch (error) {
      setTopicActionError(error.message);
      showToast('error', error.message);
      return false;
    }
  };

  const handleCreateMaterial = async (formData) => {
    setCreateMaterialError('');
    try {
      const response = await createClassMaterial(classId, formData);
      setMaterials((currentMaterials) => [...currentMaterials, response.data]);
      showToast('success', response.message);
      return true;
    } catch (error) {
      setCreateMaterialError(error.message);
      showToast('error', error.message);
      return false;
    }
  };

  const handleUpdateMaterial = async (materialId, formData) => {
    setCreateMaterialError('');
    try {
      const response = await updateClassMaterial(classId, materialId, formData);
      setMaterials((currentMaterials) => currentMaterials.map((material) => (
        material._id === materialId ? response.data : material
      )));
      if (!response.data.old_file_deleted) {
        setCreateMaterialError(response.message);
        showToast('error', response.message);
      } else {
        showToast('success', response.message);
      }
      return true;
    } catch (error) {
      setCreateMaterialError(error.message);
      showToast('error', error.message);
      return false;
    }
  };

  const handleDeleteMaterial = async (materialId) => {
    setCreateMaterialError('');
    try {
      const response = await deleteClassMaterial(classId, materialId);
      setMaterials((currentMaterials) => currentMaterials.filter((material) => material._id !== materialId));
      if (!response.data.cloudinary_deleted) {
        setCreateMaterialError(response.message);
        showToast('error', response.message);
      } else {
        showToast('success', response.message);
      }
      return true;
    } catch (error) {
      setCreateMaterialError(error.message);
      showToast('error', error.message);
      return false;
    }
  };

  const handleRetryLoadingMaterials = () => {
    setMaterialsLoading(true);
    setMaterialsError('');
    getClassMaterials(classId, { page: 1, limit: 100 })
      .then((response) => setMaterials(response.data.items))
      .catch((error) => setMaterialsError(error.message))
      .finally(() => setMaterialsLoading(false));
  };

  const handleRetryLoadingTopics = () => {
    setTopicsLoading(true);
    setTopicsError('');
    getClassTopics(classId, { page: 1, limit: 100 })
      .then((response) => setTopics(response.data.items))
      .catch((error) => setTopicsError(error.message))
      .finally(() => setTopicsLoading(false));
  };

  const handleRetryLoadingSessions = () => {
    setSessionsLoading(true);
    setSessionsError('');
    getAllClassSessions(classId)
      .then((classSessions) => setSessions(classSessions))
      .catch((error) => setSessionsError(error.message))
      .finally(() => setSessionsLoading(false));
  };

  const handleSaveSession = async (sessionData, sessionId) => {
    try {
      let response;
      if (sessionId) {
        response = await updateClassSession(classId, sessionId, sessionData);
      } else {
        response = await createClassSession(classId, sessionData);
      }

      setSessions((currentSessions) => {
        if (sessionId) {
          return currentSessions.map((session) => (
            session._id === sessionId ? response.data : session
          ));
        }
        return [...currentSessions, response.data];
      });
      showToast('success', response.message);
      return { success: true, message: response.message, session: response.data };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const handleDeleteSession = async (sessionId) => {
    try {
      const response = await deleteClassSession(classId, sessionId);
      setSessions((currentSessions) => currentSessions.filter((session) => session._id !== sessionId));
      showToast('success', response.message);
      return { success: true, message: response.message };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const classMeta = [];
  if (classroom.subject) {
    classMeta.push(classroom.subject);
  }
  if (classroom.grade) {
    classMeta.push(classroom.grade);
  }

  return (
    <div className="class-detail-page">
      <Toast toast={toast} onClose={closeToast} />
      <Link to="/tutor/classes" className="class-detail-back-link">
        <ArrowLeft size={16} aria-hidden="true" />
        <span>Back to My Class</span>
      </Link>

      <section className="class-detail-hero">
        <div className="class-detail-hero-top">
          <div className="class-detail-icon" aria-hidden="true"><BookOpen size={22} /></div>
          <span className="status-badge tone-success">{classroom.status}</span>
        </div>
        <h1>{classroom.name || 'Untitled class'}</h1>
        {classMeta.length > 0 && <p className="class-detail-subtitle">{classMeta.join(' · ')}</p>}
        {classroom.description && <p className="class-detail-description">{classroom.description}</p>}
        {classroom.capacity !== null && classroom.capacity !== undefined && (
          <div className="class-detail-facts"><span>Capacity {classroom.capacity}</span></div>
        )}
      </section>

      <div className="class-detail-tabs" role="tablist" aria-label="Class details">
        {CLASS_TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            id={`tab-${id}`}
            className={activeTab === id ? 'class-detail-tab is-active' : 'class-detail-tab'}
            role="tab"
            aria-selected={activeTab === id}
            aria-controls={`panel-${id}`}
            onClick={() => setActiveTab(id)}
          >
            <Icon size={16} aria-hidden="true" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      <div
        id={`panel-${activeTab}`}
        className="class-detail-tab-panel"
        role="tabpanel"
        aria-labelledby={`tab-${activeTab}`}
        tabIndex={0}
      >
        {activeTab === 'materials' && (
          <ClassroomTopicsAndMaterials
            topics={topics}
            materials={materials}
            topicsLoading={topicsLoading}
            topicsError={topicsError}
            createTopicError={createTopicError}
            topicActionError={topicActionError}
            onRetryTopics={handleRetryLoadingTopics}
            onCreateTopic={handleCreateTopic}
            onUpdateTopic={handleUpdateTopic}
            onDeleteTopic={handleDeleteTopic}
            onCreateMaterial={handleCreateMaterial}
            createMaterialError={createMaterialError}
            materialsLoading={materialsLoading}
            materialsError={materialsError}
            onRetryMaterials={handleRetryLoadingMaterials}
            onUpdateMaterial={handleUpdateMaterial}
            onDeleteMaterial={handleDeleteMaterial}
          />
        )}
        {activeTab === 'schedule' && (
          <ClassSchedule
            sessions={sessions}
            isLoading={sessionsLoading}
            error={sessionsError}
            onRetry={handleRetryLoadingSessions}
            onSaveSession={handleSaveSession}
            onDeleteSession={handleDeleteSession}
          />
        )}
      </div>
    </div>
  );
}
