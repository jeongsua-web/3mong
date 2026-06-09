import client from './client';

export const getMyProfile = () =>
  client.get('/users/me');

export const updateProfileImage = (file) => {
  const formData = new FormData();
  formData.append('image', file);
  return client.put('/users/me/profile-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const updateSettings = ({ theme, notificationEnabled } = {}) =>
  client.put('/users/profile', { theme, notificationEnabled });

export const deleteAccount = () =>
  client.delete('/users/me');
