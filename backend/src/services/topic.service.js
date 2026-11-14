import mongoose from 'mongoose';
import { Classroom } from '../models/Classroom.js';
import { ClassMaterial } from '../models/ClassMaterial.js';
import { ClassMember } from '../models/ClassMember.js';
import { ENUMS } from '../models/enums.js';
import { AppError } from '../common/utils/AppError.js';
import { buildPagination } from '../common/utils/pagination.js';
import { getTutorProfileOrThrow } from './tutorContext.service.js';

/**
 * Find an active classroom owned by the authenticated tutor using a normal query
 * @param {Object} user - Authenticated user { id, role }
 * @param {string} classId - Classroom ID
 * @returns {Promise<Object>} Classroom document
 */
export const getOwnedActiveClassroom = async (user, classId) => {
  // check tutor profile tồn tại hay ko ?
  const tutorProfile = await getTutorProfileOrThrow(user);

  // check xem classId truyền vào có hợp lệ ?
  if (!mongoose.isValidObjectId(classId)) {
    throw new AppError('Classroom not found', 404);
  }

  // check xem có classroom nào với id được truyền vào ko ?
  const classroom = await Classroom.findById(classId);
  if (!classroom) {
    throw new AppError('Classroom not found', 404);
  }

  // nếu có thì check xem tutor profile chỉnh sửa đúng ko
  if (String(classroom.tutor_profile_id) !== String(tutorProfile._id)) {
    throw new AppError('You do not own this classroom', 403);
  }

  // check status của lớp/classroom
  if (classroom.status !== ENUMS.ClassroomsStatus.ACTIVE) {
    throw new AppError('Archived classrooms cannot be changed', 409);
  }

  return classroom;
};

/**
 * Find an active classroom that the authenticated tutor owns or student belongs to
 * @param {Object} user - Authenticated user { id, role }
 * @param {string} classId - Classroom ID
 * @returns {Promise<Object>} Active classroom available for read-only access
 */
export const getStudentActiveClassroom = async (user, classId) => {
  if (user?.role !== ENUMS.UserRole.STUDENT || !mongoose.isValidObjectId(classId)) {
    throw new AppError('Classroom not found', 404);
  }

  const classroom = await Classroom.findById(classId);
  if (!classroom || classroom.status !== ENUMS.ClassroomsStatus.ACTIVE) {
    throw new AppError('Active classroom not found', 404);
  }

  const membership = await ClassMember.findOne({
    class_id: classroom._id,
    user_id: user.id,
    status: ENUMS.ClassMembersStatus.ACTIVE,
  }).select('_id').lean();

  if (!membership) {
    throw new AppError('You do not have access to this classroom', 403);
  }

  return classroom;
};

/**
 * Find a topic embedded in the classroom
 * @param {Object} classroom - Classroom Mongoose document
 * @param {string} topicId - Embedded topic ID
 * @returns {Object} Topic subdocument
 */
// check xem topic với id có tồn tại trong lớp đó ko ?
const getTopicOrThrow = (classroom, topicId) => {
  if (!mongoose.isValidObjectId(topicId)) {
    throw new AppError('Topic not found', 404);
  }

  const topic = classroom.topics.id(topicId);
  if (!topic) {
    throw new AppError('Topic not found', 404);
  }
  return topic;
};

/**
 * Convert an embedded topic to the API response shape
 * @param {Object} topic - Topic Mongoose subdocument
 * @returns {{ _id: string, name: string, created_at: Date|null }}
 */
const toTopicDto = (topic) => ({
  _id: String(topic._id),
  name: topic.name,
  created_at: topic.created_at,
});

/**
 * Get topics from an active classroom owned by the authenticated tutor
 * @param {Object} user - Authenticated user { id, role }
 * @param {string} classId - Classroom ID
 * @param {{ page: number, limit: number }} query - Pagination options
 * @returns {Promise<{ items: Object[], pagination: Object }>}
 */
export const getAllTopics = async (user, classId, { page, limit }) => {
  const classroom = await getOwnedActiveClassroom(user, classId);
  const total = classroom.topics.length;
  const startIndex = (page - 1) * limit;
  const topics = classroom.topics.slice(startIndex, startIndex + limit);

  return {
    items: topics.map((topic) => toTopicDto(topic)),
    pagination: buildPagination(page, limit, total),
  };
};

/**
 * Get topics for a student who is an active member of the classroom
 * @param {Object} user - Authenticated student { id, role }
 * @param {string} classId - Classroom ID
 * @param {{ page: number, limit: number }} query - Pagination options
 * @returns {Promise<{ items: Object[], pagination: Object }>}
 */
export const getStudentClassTopics = async (user, classId, { page, limit }) => {
  const classroom = await getStudentActiveClassroom(user, classId);
  const total = classroom.topics.length;
  const startIndex = (page - 1) * limit;
  const topics = classroom.topics.slice(startIndex, startIndex + limit);

  return {
    items: topics.map((topic) => toTopicDto(topic)),
    pagination: buildPagination(page, limit, total),
  };
};

/**
 * Create a topic inside an active classroom owned by the authenticated tutor
 * @param {Object} user - Authenticated user { id, role }
 * @param {string} classId - Classroom ID
 * @param {{ name: string }} data - Validated topic data
 * @returns {Promise<Object>} Created topic with its generated ID
 */
export const createTopic = async (user, classId, data) => {
  const classroom = await getOwnedActiveClassroom(user, classId);

  classroom.topics.push({
    name: data.name,
    created_at: new Date(),
  });
  await classroom.save();

  const createdTopic = classroom.topics[classroom.topics.length - 1];
  return toTopicDto(createdTopic);
};

/**
 * Update the name of a topic in an active classroom owned by the authenticated tutor
 * @param {Object} user - Authenticated user { id, role }
 * @param {string} classId - Classroom ID
 * @param {string} topicId - Embedded topic ID
 * @param {{ name: string }} data - Validated topic data
 * @returns {Promise<Object>} Updated topic
 */
export const updateTopic = async (user, classId, topicId, data) => {
  const classroom = await getOwnedActiveClassroom(user, classId);
  const topic = getTopicOrThrow(classroom, topicId);

  topic.name = data.name;
  await classroom.save();
  return toTopicDto(topic);
};

/**
 * Delete a topic and clear its references from class materials
 * @param {Object} user - Authenticated user { id, role }
 * @param {string} classId - Classroom ID
 * @param {string} topicId - Embedded topic ID
 * @returns {Promise<{ _id: string, name: string, detached_materials: number }>}
 */
export const deleteTopic = async (user, classId, topicId) => {
  // Kiểm tra quyền sở hữu lớp và topic trước khi bắt đầu transaction.
  const classroom = await getOwnedActiveClassroom(user, classId);
  const topic = getTopicOrThrow(classroom, topicId);
  const topicData = toTopicDto(topic);

  const session = await mongoose.startSession();
  let deletedTopic;

  try {
    // Transaction chỉ bao hai thao tác ghi: xóa topic và bỏ liên kết khỏi materials.
    // Nếu một thao tác ghi lỗi, MongoDB rollback thao tác ghi còn lại.
    await session.withTransaction(async () => {
      // Điều kiện trong câu ghi đảm bảo lớp/topic vẫn đúng trạng thái lúc kiểm tra.
      const classroomResult = await Classroom.updateOne(
        {
          _id: classroom._id,
          tutor_profile_id: classroom.tutor_profile_id,
          status: ENUMS.ClassroomsStatus.ACTIVE,
          'topics._id': topic._id,
        },
        { $pull: { topics: { _id: topic._id } } },
        { session },
      );

      if (classroomResult.matchedCount === 0) {
        throw new AppError('Classroom or topic changed before deletion; reload and try again', 409);
      }

      const materialResult = await ClassMaterial.updateMany(
        { class_id: classroom._id, topic_id: topic._id },
        { $set: { topic_id: null } },
        { session },
      );

      deletedTopic = {
        _id: topicData._id,
        name: topicData.name,
        detached_materials: materialResult.modifiedCount,
      };
    });
  } finally {
    await session.endSession();
  }
  return deletedTopic;
};
