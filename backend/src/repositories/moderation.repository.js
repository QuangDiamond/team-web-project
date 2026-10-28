import { ContentReport } from '../models/ContentReport.js';
import { AdminAuditLog } from '../models/AdminAuditLog.js';
import { User } from '../models/User.js';

export const findReports = async (filter = {}) => {
  const query = {};
  if (filter.status && filter.status !== 'ALL') {
    query.status = filter.status;
  }
  if (filter.severity && filter.severity !== 'ALL') {
    query.severity = filter.severity;
  }
  if (filter.target_type && filter.target_type !== 'ALL') {
    query.target_type = filter.target_type;
  }

  return await ContentReport.find(query)
    .populate('reporter_user_id', 'full_name email avatar_url role')
    .populate('resolved_by_admin_id', 'full_name email')
    .sort({ created_at: -1 });
};

export const findReportById = async (reportId) => {
  return await ContentReport.findById(reportId)
    .populate('reporter_user_id', 'full_name email avatar_url role')
    .populate('resolved_by_admin_id', 'full_name email');
};

export const updateReport = async (reportId, updateData) => {
  return await ContentReport.findByIdAndUpdate(reportId, updateData, { new: true })
    .populate('reporter_user_id', 'full_name email avatar_url role')
    .populate('resolved_by_admin_id', 'full_name email');
};

export const createAuditLog = async (auditData) => {
  return await AdminAuditLog.create(auditData);
};

export const findAuditLogs = async (limit = 20) => {
  return await AdminAuditLog.find()
    .populate('admin_user_id', 'full_name email')
    .populate('target_user_id', 'full_name email role')
    .sort({ created_at: -1 })
    .limit(limit);
};

export const updateUserStatus = async (userId, accountStatus) => {
  return await User.findByIdAndUpdate(userId, { account_status: accountStatus }, { new: true });
};
