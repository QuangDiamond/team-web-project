import { useCallback, useEffect, useState } from 'react';
import { getParentPublicProfile, getTutorPublicProfile } from '../services/discoveryService';

export function usePublicProfile(id, role, page) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const [version, setVersion] = useState(0);
  const reload = useCallback(() => setVersion((value) => value + 1), []);

  useEffect(() => {
    let ignore = false;
    setState({ data: null, loading: true, error: null });
    const getProfile = role === 'TUTOR' ? getTutorPublicProfile : getParentPublicProfile;
    getProfile(id, { page, limit: 10 })
      .then((response) => {
        if (!ignore) setState({ data: response.data, loading: false, error: null });
      })
      .catch((error) => {
        if (!ignore) setState({ data: null, loading: false, error });
      });
    return () => { ignore = true; };
  }, [id, role, page, version]);

  return { ...state, reload };
}
