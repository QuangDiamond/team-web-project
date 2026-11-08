import { Classroom } from '../models/Classroom.js';
import { TutorProfile } from '../models/TutorProfile.js';
import { ENUMS } from '../models/enums.js';

/**
 * Get active classrooms owned by the authenticated tutor
 * @param {string} userId - Authenticated user ID
 * @param {{ page: number, limit: number }} pagination - Page and page size
 * @returns {Promise<{ items: Object[], pagination: Object }>}
 */
export const getMyClassrooms = async (userId, { page, limit }) => {

  const tutorProfile = await TutorProfile.findOne({ user_id: userId }).select('_id').lean();
  if (!tutorProfile) {
    return {
      items: [],
      pagination: {
        page,
        limit,
        total: 0,
        totalPages: 0,
      },
    };
  }

  const filter = {
    tutor_profile_id: tutorProfile._id,
    status: ENUMS.ClassroomsStatus.ACTIVE,
  };
  
  const [classrooms, total] = await Promise.all([
    Classroom.find(filter)
      .select('name subject grade description capacity status created_at')
      .sort({ created_at: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Classroom.countDocuments(filter),
  ]);

  const items = classrooms.map((classroom) => ({
    _id: String(classroom._id),
    name: classroom.name,
    subject: classroom.subject,
    grade: classroom.grade,
    description: classroom.description,
    capacity: classroom.capacity,
    status: classroom.status,
    created_at: classroom.created_at,
  }));

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};
