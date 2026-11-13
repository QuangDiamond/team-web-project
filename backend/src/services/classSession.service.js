import mongoose from 'mongoose';
import { AppError } from '../common/utils/AppError.js';
import { buildPagination } from '../common/utils/pagination.js';
import { ClassSession } from '../models/ClassSession.js';
import { Classroom } from '../models/Classroom.js';
import { ENUMS } from '../models/enums.js';
import { getOwnedActiveClassroom } from './topic.service.js';

/**
 * Find a class session that belongs to the classroom
 * @param {Object} classroom - Active classroom owned by the authenticated tutor
 * @param {string} sessionId - Class session ID
 * @returns {Promise<Object>} ClassSession document
 */
const getClassSessionOrThrow = async (classroom, sessionId) => {
  if (!mongoose.isValidObjectId(sessionId)) {
    throw new AppError('Class session not found', 404);
  }

  const classSession = await ClassSession.findOne({ _id: sessionId, class_id: classroom._id });
  if (!classSession) {
    throw new AppError('Class session not found', 404);
  }
  return classSession;
};

/**
 * Convert a Mongoose class session document or lean object to the API response shape
 * @param {Object} classSession - ClassSession document or lean object
 * @returns {Object} Class session DTO
 */
const toClassSessionDto = (classSession) => ({
  _id: String(classSession._id),
  class_id: String(classSession.class_id),
  tutor_profile_id: String(classSession.tutor_profile_id),
  rule_id: classSession.rule_id ? String(classSession.rule_id) : null,
  title: classSession.title,
  start_time: classSession.start_time,
  end_time: classSession.end_time,
  meeting_link: classSession.meeting_link,
  status: classSession.status,
  created_at: classSession.created_at,
  updated_at: classSession.updated_at,
});

/**
 * Ensure a newly scheduled session starts in the future
 * @param {Date} startTime - Session start time
 * @returns {void}
 */
const validateFutureStartTime = (startTime) => {
  if (startTime <= new Date()) {
    throw new AppError('Class session must start in the future', 422);
  }
};

/**
 * Reject a session time range that overlaps another non-cancelled session in any active classroom owned by the tutor
 * @param {Object} classroom - Active classroom being scheduled
 * @param {Date} startTime - Proposed session start time
 * @param {Date} endTime - Proposed session end time
 * @param {string | null} excludedSessionId - Session ID to ignore while updating
 * @returns {Promise<void>}
 */
const ensureNoSessionOverlap = async (classroom, startTime, endTime, excludedSessionId = null) => {
  const activeClassrooms = await Classroom.find({
    tutor_profile_id: classroom.tutor_profile_id,
    status: ENUMS.ClassroomsStatus.ACTIVE,
  })
    .select('_id')
    .lean();
  const activeClassIds = activeClassrooms.map((activeClassroom) => activeClassroom._id);
  if (!activeClassIds.some((classId) => String(classId) === String(classroom._id))) {
    activeClassIds.push(classroom._id);
  }

  const filter = {
    class_id: { $in: activeClassIds },
    status: { $ne: ENUMS.ClassSessionsStatus.CANCELLED },
    $or: [
      {
        start_time: { $lte: startTime },
        end_time: { $gte: startTime },
      },
      {
        start_time: { $lte: endTime },
        end_time: { $gte: endTime },
      },
      {
        start_time: { $gte: startTime },
        end_time: { $lte: endTime },
      },
    ],
  };

  if (excludedSessionId) {
    filter._id = { $ne: excludedSessionId };
  }

  const conflictingSession = await ClassSession.exists(filter);
  if (conflictingSession) {
    throw new AppError('Class session overlaps with another scheduled session in one of your active classes', 409);
  }
};

/**
 * List sessions from an active classroom owned by the authenticated tutor
 * @param {Object} user - Authenticated user { id, role }
 * @param {string} classId - Classroom ID
 * @param {{ page: number, limit: number }} query - Pagination options
 * @returns {Promise<{ items: Object[], pagination: Object }>}
 */
export const listClassSessions = async (user, classId, { page, limit }) => {
  const classroom = await getOwnedActiveClassroom(user, classId);
  const filter = { class_id: classroom._id };
  const [sessions, total] = await Promise.all([
    ClassSession.find(filter)
      .sort({ start_time: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    ClassSession.countDocuments(filter),
  ]);

  return {
    items: sessions.map((classSession) => toClassSessionDto(classSession)),
    pagination: buildPagination(page, limit, total),
  };
};

/**
 * Get one session from an active classroom owned by the authenticated tutor
 * @param {Object} user - Authenticated user { id, role }
 * @param {string} classId - Classroom ID
 * @param {string} sessionId - Class session ID
 * @returns {Promise<Object>} Class session DTO
 */
export const getClassSession = async (user, classId, sessionId) => {
  const classroom = await getOwnedActiveClassroom(user, classId);
  const classSession = await getClassSessionOrThrow(classroom, sessionId);
  return toClassSessionDto(classSession);
};

/**
 * Create a one-off session for an active classroom owned by the authenticated tutor
 * @param {Object} user - Authenticated user { id, role }
 * @param {string} classId - Classroom ID
 * @param {Object} data - Validated class session fields
 * @returns {Promise<Object>} Created class session DTO
 */
export const createClassSession = async (user, classId, data) => {
  const classroom = await getOwnedActiveClassroom(user, classId);
  validateFutureStartTime(data.start_time);
  await ensureNoSessionOverlap(classroom, data.start_time, data.end_time);

  const classSession = await ClassSession.create({
    class_id: classroom._id,
    tutor_profile_id: classroom.tutor_profile_id,
    rule_id: null,
    title: data.title,
    start_time: data.start_time,
    end_time: data.end_time,
    meeting_link: data.meeting_link,
    status: ENUMS.ClassSessionsStatus.SCHEDULED,
  });

  return toClassSessionDto(classSession);
};

/**
 * Update a session in an active classroom owned by the authenticated tutor
 * @param {Object} user - Authenticated user { id, role }
 * @param {string} classId - Classroom ID
 * @param {string} sessionId - Class session ID
 * @param {Object} data - Validated fields to update
 * @returns {Promise<Object>} Updated class session DTO
 */
export const updateClassSession = async (user, classId, sessionId, data) => {
  const classroom = await getOwnedActiveClassroom(user, classId);
  const classSession = await getClassSessionOrThrow(classroom, sessionId);

  if (classSession.start_time <= new Date()) {
    throw new AppError('Past class sessions cannot be updated', 422);
  }

  if (data.start_time) {
    validateFutureStartTime(data.start_time);
    await ensureNoSessionOverlap(
      classroom,
      data.start_time,
      data.end_time,
      classSession._id,
    );
  }

  const updatedSession = await ClassSession.findOneAndUpdate(
    { _id: classSession._id, class_id: classroom._id },
    { $set: data },
    { new: true, runValidators: true },
  );

  if (!updatedSession) {
    throw new AppError('Class session changed before update; reload and try again', 409);
  }
  return toClassSessionDto(updatedSession);
};

/**
 * Delete a future session from an active classroom owned by the authenticated tutor
 * @param {Object} user - Authenticated user { id, role }
 * @param {string} classId - Classroom ID
 * @param {string} sessionId - Class session ID
 * @returns {Promise<{ _id: string }>}
 */
export const deleteClassSession = async (user, classId, sessionId) => {
  const classroom = await getOwnedActiveClassroom(user, classId);
  const classSession = await getClassSessionOrThrow(classroom, sessionId);

  if (classSession.start_time <= new Date()) {
    throw new AppError('Past class sessions cannot be deleted', 422);
  }

  const deletedSession = await ClassSession.findOneAndDelete({
    _id: classSession._id,
    class_id: classroom._id,
  });

  if (!deletedSession) {
    throw new AppError('Class session changed before deletion; reload and try again', 409);
  }

  return { _id: String(deletedSession._id) };
};
