import client from './client';

export const getMyCharacters = () =>
  client.get('/characters');

export const getRecommendedCharacters = () =>
  client.get('/characters/recommended');

export const createCustomCharacter = (formData) =>
  client.post('/characters', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const deleteCharacter = (id) =>
  client.delete(`/characters/${id}`);

export const toggleFavorite = (id, isFavorite) =>
  client.put(`/characters/${id}/favorite`, { isFavorite });
