import { useCallback, useEffect, useState } from 'react';
import {
  getJoinedClasses,
  getPendingAssignments,
  getPublishedGrades,
  getUpcomingSessions,
} from '../services/studentDashboardService.js';

// Dashboard chỉ hiện vài mục đầu của mỗi khối, tổng số lấy từ pagination.total
const SECTION_LIMIT = 5;

const LOADING_SECTION = { loading: true, error: null, items: [], total: 0 };

// Gọi 1 API danh sách và cập nhật state của khối tương ứng; lỗi khối này không ảnh hưởng khối khác
const loadSection = async (request, setSection) => {
  setSection(LOADING_SECTION);
  try {
    const response = await request({ page: 1, limit: SECTION_LIMIT });
    setSection({
      loading: false,
      error: null,
      items: response.data.items,
      total: response.data.pagination.total,
    });
  } catch (error) {
    setSection({ loading: false, error: error, items: [], total: 0 });
  }
};

// Dữ liệu 4 khối của Student Dashboard (UC36)
export function useStudentDashboard() {
  const [classes, setClasses] = useState(LOADING_SECTION);
  const [sessions, setSessions] = useState(LOADING_SECTION);
  const [assignments, setAssignments] = useState(LOADING_SECTION);
  const [grades, setGrades] = useState(LOADING_SECTION);

  const reloadClasses = useCallback(() => loadSection(getJoinedClasses, setClasses), []);
  const reloadSessions = useCallback(() => loadSection(getUpcomingSessions, setSessions), []);
  const reloadAssignments = useCallback(() => loadSection(getPendingAssignments, setAssignments), []);
  const reloadGrades = useCallback(() => loadSection(getPublishedGrades, setGrades), []);

  useEffect(() => {
    reloadClasses();
    reloadSessions();
    reloadAssignments();
    reloadGrades();
  }, [reloadClasses, reloadSessions, reloadAssignments, reloadGrades]);

  return {
    classes,
    sessions,
    assignments,
    grades,
    reloadClasses,
    reloadSessions,
    reloadAssignments,
    reloadGrades,
  };
}
