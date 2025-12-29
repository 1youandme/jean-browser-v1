import api from './index';
import { Message, Chat, User, ApiResponse, PaginatedResponse } from '../types';

export const messengerApi = {
  // Users
  getUsers: async (search?: string): Promise<ApiResponse<User[]>> => {
    const response = await api.get('/users', { params: { search } });
    return response.data;
  },

  getUser: async (id: string): Promise<ApiResponse<User>> => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  updateUserStatus: async (status: User['status']): Promise<ApiResponse<User>> => {
    const response = await api.patch('/users/status', { status });
    return response.data;
  },

  // Chats
  getChats: async (): Promise<ApiResponse<Chat[]>> => {
    const response = await api.get('/chats');
    return response.data;
  },

  getChat: async (id: string): Promise<ApiResponse<Chat>> => {
    const response = await api.get(`/chats/${id}`);
    return response.data;
  },

  createChat: async (participantId: string): Promise<ApiResponse<Chat>> => {
    const response = await api.post('/chats', { participantId });
    return response.data;
  },

  deleteChat: async (id: string): Promise<ApiResponse<void>> => {
    const response = await api.delete(`/chats/${id}`);
    return response.data;
  },

  markChatAsRead: async (id: string): Promise<ApiResponse<Chat>> => {
    const response = await api.patch(`/chats/${id}/read`);
    return response.data;
  },

  // Messages
  getMessages: async (chatId: string, params?: {
    page?: number;
    limit?: number;
    before?: string;
  }): Promise<ApiResponse<PaginatedResponse<Message>>> => {
    const response = await api.get(`/chats/${chatId}/messages`, { params });
    return response.data;
  },

  sendMessage: async (chatId: string, text: string): Promise<ApiResponse<Message>> => {
    const response = await api.post(`/chats/${chatId}/messages`, { text });
    return response.data;
  },

  markMessageAsRead: async (messageId: string): Promise<ApiResponse<Message>> => {
    const response = await api.patch(`/messages/${messageId}/read`);
    return response.data;
  },

  deleteMessage: async (messageId: string): Promise<ApiResponse<void>> => {
    const response = await api.delete(`/messages/${messageId}`);
    return response.data;
  },

  // For Phase 1, localStorage based methods
  getLocalChats: async (): Promise<ApiResponse<Chat[]>> => {
    const chats = localStorage.getItem('messenger-chats');
    return {
      success: true,
      data: chats ? JSON.parse(chats) : []
    };
  },

  saveLocalChats: async (chats: Chat[]): Promise<ApiResponse<Chat[]>> => {
    localStorage.setItem('messenger-chats', JSON.stringify(chats));
    return {
      success: true,
      data: chats
    };
  },

  sendLocalMessage: async (chatId: string, text: string): Promise<ApiResponse<Message>> => {
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      senderId: 'me',
      receiverId: 'other',
      text,
      timestamp: new Date(),
      isRead: false,
      isDelivered: true,
      chatId
    };

    const chats = localStorage.getItem('messenger-chats');
    const allChats: Chat[] = chats ? JSON.parse(chats) : [];
    
    const updatedChats = allChats.map(chat =>
      chat.id === chatId
        ? { ...chat, lastMessage: newMessage, updatedAt: new Date() }
        : chat
    );
    
    localStorage.setItem('messenger-chats', JSON.stringify(updatedChats));
    
    return {
      success: true,
      data: newMessage
    };
  }
};