import { z } from 'zod';

// Body của POST /refresh: không nhận dữ liệu nào (gợi ý chỉ dựa trên môn học và khối lớp của request)
export const refreshSuggestionsSchema = z.strictObject({});
