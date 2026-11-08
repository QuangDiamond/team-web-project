import { useEffect, useState } from 'react';
import { statsService } from '../services/statsService';
export default function useAdminStats(period) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState({
    data: null,
    loading: true,
    error: null
  });
  useEffect(() => {
    let active = true;
    setState({
      data: null,
      loading: true,
      error: null
    });
    statsService.getStats(period).then(data => {
      if (active) {
        setState({
          data,
          loading: false,
          error: null
        });
      }
    }).catch(error => {
      if (active) {
        setState({
          data: null,
          loading: false,
          error
        });
      }
    });
    return () => {
      active = false;
    };
  }, [period, attempt]);
  return {
    ...state,
    reload: () => setAttempt(value => value + 1)
  };
}
