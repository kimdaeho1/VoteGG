// client/src/socket.js
import { io } from 'socket.io-client';

// 채팅 소켓 연결
export const chatSocket = io('/chat')

// 미디어 소켓 연결
export const mediaSocket = io('/mediasoup');
