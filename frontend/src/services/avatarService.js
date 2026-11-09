import api from './api';

export const uploadMyAvatar = (file) => {
  const data = new FormData();
  data.append('avatar', file);
  return api.post('/user/v1/me/avatar', data, { headers: { 'Content-Type': 'multipart/form-data' } });
};
