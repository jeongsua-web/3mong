import client from './client';

export const getWrongAnswers = () =>
  client.get('/wrong-answers');

export const deleteWrongAnswer = (id) =>
  client.delete(`/wrong-answers/${id}`);
