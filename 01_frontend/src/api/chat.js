import client from './client';
import { ACCESS_TOKEN } from '../constants/storage';

// 채팅방 목록 조회
export const getChatRooms = (params = {}) =>
  client.get('/chat/rooms', { params });

// 채팅방 상세 조회
export const getChatRoom = (roomId) =>
  client.get(`/chat/rooms/${roomId}`);

// 채팅방 생성
export const createChatRoom = (characterId, title) =>
  client.post('/chat/rooms', { characterId, title });

// 채팅방 삭제
export const deleteChatRoom = (roomId) =>
  client.delete(`/chat/rooms/${roomId}`);

// 채팅방 고정/해제
export const pinChatRoom = (roomId, isPinned) =>
  client.put(`/chat/rooms/${roomId}/pin`, { isPinned });

// 채팅방 제목 수정
export const updateChatRoomTitle = (roomId, title) =>
  client.put(`/chat/rooms/${roomId}`, { title });

// 메시지 히스토리 조회
export const getMessages = (roomId, limit = 50, offset = 0) =>
  client.get(`/chat/rooms/${roomId}/messages`, { params: { limit, offset } });

// 메시지 전송
export const sendMessage = (roomId, content, messageType = 'TEXT') =>
  client.post(`/chat/rooms/${roomId}/messages`, { content, messageType });

// AI 첫 인사말 요청
export const requestInitialMessage = (roomId) =>
  client.post(`/chat/rooms/${roomId}/initial-message`, {});

// 현재 난이도 조회
export const getChatLevel = (roomId) =>
  client.get(`/chat/rooms/${roomId}/level`);

// SSE 스트림 URL 반환 (EventSource는 axios 대신 브라우저 내장 API 사용)
// EventSource는 헤더를 지원하지 않으므로 토큰을 query param으로 전달
export const getStreamUrl = (roomId, messageId) => {
  const token = import.meta.env.VITE_SKIP_AUTH === 'true'
    ? 'dev-token'
    : localStorage.getItem(ACCESS_TOKEN);
  return `${import.meta.env.VITE_API_BASE_URL}/chat/rooms/${roomId}/stream?messageId=${messageId}&access_token=${token}`;
};
