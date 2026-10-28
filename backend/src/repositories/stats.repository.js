import { User } from '../models/User.js';
import { ParentRequest } from '../models/ParentRequest.js';
import { TutoringAgreement } from '../models/TutoringAgreement.js';
import { PaymentOrder } from '../models/PaymentOrder.js';
import { Classroom } from '../models/Classroom.js';
import { ContentReport } from '../models/ContentReport.js';

export const getAggregatedStats = async (startDate, endDate) => {
  const dateFilter = {};
  if (startDate && endDate) {
    dateFilter.created_at = { $gte: new Date(startDate), $lte: new Date(endDate) };
  }

  // 1. Users by role
  const usersByRole = await User.aggregate([
    { $match: dateFilter },
    { $group: { _id: '$role', count: { $sum: 1 } } }
  ]);

  // Total active users
  const totalUsers = await User.countDocuments();
  const activeTutors = await User.countDocuments({ role: 'TUTOR', account_status: 'ACTIVE' });
  const activeParents = await User.countDocuments({ role: 'PARENT', account_status: 'ACTIVE' });
  const activeStudents = await User.countDocuments({ role: 'STUDENT', account_status: 'ACTIVE' });

  // 2. Parent Requests by status
  const requestsByStatus = await ParentRequest.aggregate([
    { $match: dateFilter },
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);

  // 3. Agreements by status
  const agreementsByStatus = await TutoringAgreement.aggregate([
    { $match: dateFilter },
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);

  // 4. Revenue & Payments
  const revenueStats = await PaymentOrder.aggregate([
    { $match: { ...dateFilter, status: 'SUCCESS' } },
    {
      $group: {
        _id: '$item_type',
        totalRevenue: { $sum: '$amount' },
        orderCount: { $sum: 1 }
      }
    }
  ]);

  // 5. Active Classrooms
  const activeClassrooms = await Classroom.countDocuments({ status: 'ACTIVE' });

  // 6. Content Reports
  const pendingReports = await ContentReport.countDocuments({ status: 'PENDING' });
  const totalReports = await ContentReport.countDocuments();

  return {
    usersByRole,
    counts: {
      totalUsers,
      activeTutors,
      activeParents,
      activeStudents,
      activeClassrooms,
      pendingReports,
      totalReports
    },
    requestsByStatus,
    agreementsByStatus,
    revenueStats
  };
};
