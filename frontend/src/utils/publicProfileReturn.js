const RETURN_KEY = 'public-profile-return';

export const rememberPublicProfile = (path) => {
  try { sessionStorage.setItem(RETURN_KEY, path); } catch { /* Storage may be disabled. */ }
};

export const getPublicProfileReturn = () => {
  try {
    const path = sessionStorage.getItem(RETURN_KEY);
    return /^\/tutors\/[a-f\d]{24}$/i.test(path || '') ? path : null;
  } catch {
    return null;
  }
};

export const clearPublicProfileReturn = () => {
  try { sessionStorage.removeItem(RETURN_KEY); } catch { /* Storage may be disabled. */ }
};
