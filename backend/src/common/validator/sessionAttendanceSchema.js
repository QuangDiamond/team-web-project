import { z } from 'zod';
import { ENUMS } from '../../models/enums.js';

const attendanceRecordSchema = z.strictObject({
  student_user_id: z.string().regex(/^[a-f\d]{24}$/i, 'Student ID must be a valid object ID'),
  status: z.enum(Object.values(ENUMS.SessionAttendanceStatus), 'Choose a valid attendance status'),
  comment: z.preprocess(
    (value) => (value === '' || value === undefined ? null : value),
    z.string().trim().max(500, 'Comment must be at most 500 characters').nullable(),
  ),
});

export const saveSessionAttendanceSchema = z.strictObject({
  records: z.array(attendanceRecordSchema).min(1, 'At least one attendance record is required').max(100, 'At most 100 students can be submitted at once'),
}).refine((data) => {
  const studentIds = data.records.map((record) => record.student_user_id.toLowerCase());
  return new Set(studentIds).size === studentIds.length;
}, {
  path: ['records'],
  message: 'Each student can only appear once',
});
