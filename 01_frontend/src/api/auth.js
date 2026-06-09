import client from './client';

export const login = (email, password) =>
  client.post('/auth/login', { email, password });

export const signup = (username, email, password) =>
  client.post('/auth/signup', { username, email, password });

export const confirmSignup = (email, code) =>
  client.post('/auth/signup/confirm', { email, code });

export const loginWithGoogle = (credential) =>
  client.post('/auth/google', { credential });

export const logout = () =>
  client.post('/auth/logout');
