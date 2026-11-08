import { useEffect, useState } from 'react';
import { getPublicCategoryNames } from '../services/categoryService';

/*
 * Tải danh mục môn học và cấp học/trình độ từ cùng API công khai.
 * Trả về { subjectNames, gradeNames, loading, error }; không dùng dữ liệu viết cứng khi lỗi.
 */
export function useSubjectNames() {
  const [state, setState] = useState({ subjectNames: [], gradeNames: [], loading: true, error: '' });

  useEffect(() => {
    let ignore = false;
    Promise.all([getPublicCategoryNames('subjects'), getPublicCategoryNames('grades')])
      .then(([subjectNames, gradeNames]) => {
        if (!ignore) {
          setState({ subjectNames, gradeNames, loading: false, error: '' });
        }
      })
      .catch((error) => {
        if (!ignore) {
          setState({ subjectNames: [], gradeNames: [], loading: false, error: error.message });
        }
      });
    return () => {
      ignore = true;
    };
  }, []);

  return state;
}
