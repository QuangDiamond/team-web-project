import { AppError } from '../common/utils/AppError.js';
import mongoose from 'mongoose';
import { buildPagination } from '../common/utils/pagination.js';
import { getCloudinaryAssetDetailsFromUrl, getCloudinaryPublicUrl } from '../common/utils/cloudinaryUtils.js';
import { Assignment } from '../models/Assignment.js';
import { ClassMaterial } from '../models/ClassMaterial.js';
import { ENUMS } from '../models/enums.js';
import { getTutorProfileOrThrow } from './tutorContext.service.js';
import { getOwnedActiveClassroom, getStudentActiveClassroom } from './topic.service.js';
import { assertClassroomMemberOrOwner } from './classSession.service.js';
import { uploadClassMaterialToCloudinary, deleteClassMaterialFromCloudinary } from '../config/cloudinary.js';

/**
 * Add an uploaded file or external link to a classroom owned by the authenticated tutor
 * @param {Object} user - Authenticated user { id, role }
 * @param {string} classId - Classroom ID
 * @param {{ topic_id: string|null, title: string, material_type: string, visibility: string, file_url?: string }} data - Validated material fields
 * @param {Object|null} file - Uploaded file supplied by Multer, or null for link materials
 * @returns {Promise<Object>} Created class material
 */
export const createClassMaterial = async (user, classId, data, file) => {
  const classroom = await getOwnedActiveClassroom(user, classId);
  const tutorProfile = await getTutorProfileOrThrow(user);

  if (data.topic_id && !classroom.topics.id(data.topic_id)) {
    throw new AppError('Topic not found in this classroom', 404);
  }

  const isLinkMaterial = data.material_type === ENUMS.ClassMaterialsMaterialType.LINK;
  let uploadResult = null;
  let fileUrl = data.file_url;
  let fileSize = null;

  if (!isLinkMaterial) {
    if (!file || !file.buffer) {
      throw new AppError('A file is required for this material type', 422);
    }

    uploadResult = await uploadClassMaterialToCloudinary(file.buffer, file.originalname);
    fileUrl = getCloudinaryPublicUrl(uploadResult);
    fileSize = uploadResult.bytes;
    if (!fileUrl || !uploadResult.public_id || !uploadResult.resource_type) {
      throw new AppError('Cloudinary did not return the uploaded file details', 502);
    }
  }

  try {
    const [material] = await ClassMaterial.create([{
      class_id: classroom._id,
      topic_id: data.topic_id || null,
      uploader_profile_id: tutorProfile._id,
      title: data.title,
      material_type: data.material_type,
      file_url: fileUrl,
      file_size: fileSize,
      visibility: data.visibility,
    }]);

    return {
      _id: String(material._id),
      class_id: String(material.class_id),
      topic_id: material.topic_id ? String(material.topic_id) : null,
      title: material.title,
      material_type: material.material_type,
      file_url: material.file_url,
      file_size: material.file_size,
      visibility: material.visibility,
      created_at: material.created_at,
    };
  } catch (error) {
    if (uploadResult) {
      try {
        await deleteClassMaterialFromCloudinary(uploadResult.public_id, uploadResult.resource_type);
      } catch {
        // Keep the original database error; cleanup is best effort.
      }
    }
    throw error;
  }
};

/**
 * Get a material owned by the specified classroom
 * @param {Object} classroom - Active classroom owned by the authenticated tutor
 * @param {string} materialId - Class material ID
 * @returns {Promise<Object>} ClassMaterial document
 */
const getClassMaterialOrThrow = async (classroom, materialId) => {
  if (!mongoose.isValidObjectId(materialId)) {
    throw new AppError('Class material not found', 404);
  }

  const material = await ClassMaterial.findOne({ _id: materialId, class_id: classroom._id });
  if (!material) {
    throw new AppError('Class material not found', 404);
  }
  return material;
};

/**
 * Get paginated materials of a classroom: the owner tutor sees all, students see materials of their class,
 * parents see only materials shared with all members
 * @param {Object} user - Authenticated user { id, role }
 * @param {string} classId - Classroom ID
 * @param {{ page: number, limit: number }} query - Pagination options
 * @returns {Promise<{ items: Object[], pagination: Object }>}
 */
export const getClassMaterials = async (user, classId, { page, limit }) => {
  let classroom;
  if (user.role === ENUMS.UserRole.TUTOR) {
    classroom = await getOwnedActiveClassroom(user, classId);
  } else {
    classroom = await assertClassroomMemberOrOwner(user, classId);
  }

  const filter = { class_id: classroom._id };
  if (user.role === ENUMS.UserRole.PARENT) {
    filter.visibility = ENUMS.ClassMaterialsVisibility.ALL_MEMBERS;
  }
  const [materials, total] = await Promise.all([
    ClassMaterial.find(filter)
      .sort({ created_at: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    ClassMaterial.countDocuments(filter),
  ]);

  return {
    items: materials.map((material) => ({
      _id: String(material._id),
      class_id: String(material.class_id),
      topic_id: material.topic_id ? String(material.topic_id) : null,
      title: material.title,
      material_type: material.material_type,
      file_url: material.file_url,
      file_size: material.file_size,
      visibility: material.visibility,
      created_at: material.created_at,
    })),
    pagination: buildPagination(page, limit, total),
  };
};

/**
 * Get student-visible materials from a classroom the student actively belongs to
 * @param {Object} user - Authenticated student { id, role }
 * @param {string} classId - Classroom ID
 * @param {{ page: number, limit: number }} query - Pagination options
 * @returns {Promise<{ items: Object[], pagination: Object }>}
 */
export const getStudentClassMaterials = async (user, classId, { page, limit }) => {
  const classroom = await getStudentActiveClassroom(user, classId);
  const filter = {
    class_id: classroom._id,
    visibility: {
      $in: [
        ENUMS.ClassMaterialsVisibility.ALL_MEMBERS,
        ENUMS.ClassMaterialsVisibility.STUDENTS_ONLY,
      ],
    },
  };
  const [materials, total] = await Promise.all([
    ClassMaterial.find(filter)
      .sort({ created_at: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    ClassMaterial.countDocuments(filter),
  ]);

  return {
    items: materials.map((material) => ({
      _id: String(material._id),
      class_id: String(material.class_id),
      topic_id: material.topic_id ? String(material.topic_id) : null,
      title: material.title,
      material_type: material.material_type,
      file_url: material.file_url,
      file_size: material.file_size,
      visibility: material.visibility,
      created_at: material.created_at,
    })),
    pagination: buildPagination(page, limit, total),
  };
};

/**
 * Partially update a class material and optionally replace its file or URL
 * @param {Object} user - Authenticated user { id, role }
 * @param {string} classId - Classroom ID
 * @param {string} materialId - Class material ID
 * @param {{ topic_id?: string|null, title?: string, material_type?: string, visibility?: string, file_url?: string }} data - Validated fields to update
 * @param {Object|null} file - Optional replacement file supplied by Multer
 * @returns {Promise<Object>} Updated class material
 */
export const updateClassMaterial = async (user, classId, materialId, data, file) => {
  const classroom = await getOwnedActiveClassroom(user, classId);
  const material = await getClassMaterialOrThrow(classroom, materialId);

  const topicId = data.topic_id === undefined ? material.topic_id : data.topic_id;
  const title = data.title === undefined ? material.title : data.title;
  const materialType = data.material_type === undefined ? material.material_type : data.material_type;
  const visibility = data.visibility === undefined ? material.visibility : data.visibility;

  if (topicId && !classroom.topics.id(topicId)) {
    throw new AppError('Topic not found in this classroom', 404);
  }

  const isLinkMaterial = materialType === ENUMS.ClassMaterialsMaterialType.LINK;
  const hasReplacementFile = Boolean(file && file.buffer);
  let uploadResult = null;
  let fileUrl = material.file_url;
  let fileSize = material.file_size;

  if (isLinkMaterial) {
    if (file) {
      throw new AppError('A link material must not include a file', 422);
    }
    if (material.material_type !== ENUMS.ClassMaterialsMaterialType.LINK && !data.file_url) {
      throw new AppError('A URL is required when replacing a file with a link', 422);
    }
    if (data.file_url !== undefined) {
      fileUrl = data.file_url;
    }
    fileSize = null;
  } else {
    if (data.file_url !== undefined) {
      throw new AppError('A URL can only be set for link materials', 422);
    }

    if (hasReplacementFile) {
      uploadResult = await uploadClassMaterialToCloudinary(file.buffer, file.originalname);
      fileUrl = getCloudinaryPublicUrl(uploadResult);
      fileSize = uploadResult.bytes;
      if (!fileUrl || !uploadResult.public_id || !uploadResult.resource_type) {
        throw new AppError('Cloudinary did not return the uploaded file details', 502);
      }
    } else if (material.material_type === ENUMS.ClassMaterialsMaterialType.LINK) {
      throw new AppError('A replacement file is required when changing to a file material type', 422);
    }
  }

  // Chỉ xóa asset cũ khi thay file hoặc chuyển tài liệu file thành link.
  const shouldDeleteOldAsset = material.material_type !== ENUMS.ClassMaterialsMaterialType.LINK &&
    (isLinkMaterial || hasReplacementFile);
  const oldAsset = shouldDeleteOldAsset ? getCloudinaryAssetDetailsFromUrl(material.file_url) : null;
  let updatedMaterial;
  try {
    updatedMaterial = await ClassMaterial.findOneAndUpdate(
      { _id: material._id, class_id: classroom._id },
      {
        $set: {
          topic_id: topicId || null,
          title,
          material_type: materialType,
          file_url: fileUrl,
          file_size: fileSize,
          visibility,
        },
      },
      { new: true, runValidators: true },
    );
    if (!updatedMaterial) {
      throw new AppError('Class material changed before update; reload and try again', 409);
    }
  } catch (error) {
    if (uploadResult) {
      try {
        await deleteClassMaterialFromCloudinary(uploadResult.public_id, uploadResult.resource_type);
      } catch {
        // Keep the original database error; cleanup is best effort.
      }
    }
    throw error;
  }

  let oldFileDeleted = true;
  if (oldAsset) {
    try {
      const deletion = await deleteClassMaterialFromCloudinary(oldAsset.publicId, oldAsset.resourceType);
      oldFileDeleted = deletion.result === 'ok' || deletion.result === 'not found';
    } catch {
      oldFileDeleted = false;
    }
  }

  return {
    _id: String(updatedMaterial._id),
    class_id: String(updatedMaterial.class_id),
    topic_id: updatedMaterial.topic_id ? String(updatedMaterial.topic_id) : null,
    title: updatedMaterial.title,
    material_type: updatedMaterial.material_type,
    file_url: updatedMaterial.file_url,
    file_size: updatedMaterial.file_size,
    visibility: updatedMaterial.visibility,
    created_at: updatedMaterial.created_at,
    old_file_deleted: oldFileDeleted,
  };
};

/**
 * Delete a classroom material, assignment references, and its Cloudinary file
 * @param {Object} user - Authenticated user { id, role }
 * @param {string} classId - Classroom ID
 * @param {string} materialId - Class material ID
 * @returns {Promise<{ _id: string, updated_assignments: number, cloudinary_deleted: boolean }>}
 */
export const deleteClassMaterial = async (user, classId, materialId) => {
  const classroom = await getOwnedActiveClassroom(user, classId);
  const material = await getClassMaterialOrThrow(classroom, materialId);
  const session = await mongoose.startSession();
  let updatedAssignments = 0;

  try {
    await session.withTransaction(async () => {
      const assignmentResult = await Assignment.updateMany(
        { class_id: classroom._id, 'attachments.material_id': material._id },
        { $pull: { attachments: { material_id: material._id } } },
        { session },
      );
      updatedAssignments = assignmentResult.modifiedCount;

      const materialResult = await ClassMaterial.deleteOne(
        { _id: material._id, class_id: classroom._id },
        { session },
      );
      if (materialResult.deletedCount === 0) {
        throw new AppError('Class material changed before deletion; reload and try again', 409);
      }
    });
  } finally {
    await session.endSession();
  }

  // Chỉ material dạng file mới có asset cần xóa trên Cloudinary.
  let asset = null;
  if (material.material_type !== ENUMS.ClassMaterialsMaterialType.LINK) {
    asset = getCloudinaryAssetDetailsFromUrl(material.file_url);
  }
  let cloudinaryDeleted = true;
  if (asset) {
    try {
      const deletion = await deleteClassMaterialFromCloudinary(asset.publicId, asset.resourceType);
      cloudinaryDeleted = deletion.result === 'ok' || deletion.result === 'not found';
    } catch {
      cloudinaryDeleted = false;
    }
  }

  return {
    _id: String(material._id),
    updated_assignments: updatedAssignments,
    cloudinary_deleted: cloudinaryDeleted,
  };
};
