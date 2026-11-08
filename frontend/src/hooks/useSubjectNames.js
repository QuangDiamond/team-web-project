import { useEffect, useState } from 'react';
import { getSubjects } from '../services/subjectService';

/*
 * Tải danh sách tên môn học một lần cho ô chọn môn.
 * Trả về { subjectNames, loading, error }; lỗi thì subjectNames rỗng và error là thông báo.
 */
export function useSubjectNames() {
  const [state, setState] = useState({ subjectNames: [], loading: true, error: '' });

  useEffect(() => {
    let ignore = false;
    getSubjects()
      .then((response) => {
        if (!ignore) {
          const names = response.data.items.map((subject) => subject.name);
          setState({ subjectNames: names, loading: false, error: '' });
        }
      })
      .catch((error) => {
        if (!ignore) {
          setState({ subjectNames: [], loading: false, error: error.message });
        }
      });
    return () => {
      ignore = true;
    };
  }, []);

  return state;
}
