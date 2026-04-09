import axios from 'axios';
import { Domain, Account, TokenResponse, Message, MessageDetail } from '../types';

const API_BASE = 'https://api.mail.tm';

const api = axios.create({
  baseURL: API_BASE,
  adapter: 'xhr',
});

export const mailService = {
  async getDomains(): Promise<Domain[]> {
    const response = await api.get('/domains');
    return response.data['hydra:member'];
  },

  async createAccount(address: string, password: string): Promise<Account> {
    const response = await api.post('/accounts', { address, password });
    return response.data;
  },

  async getToken(address: string, password: string): Promise<TokenResponse> {
    const response = await api.post('/token', { address, password });
    return response.data;
  },

  async getMessages(token: string): Promise<Message[]> {
    const response = await api.get('/messages', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data['hydra:member'];
  },

  async getMessage(id: string, token: string): Promise<MessageDetail> {
    const response = await api.get(`/messages/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  async deleteMessage(id: string, token: string): Promise<void> {
    await api.delete(`/messages/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  async deleteAccount(id: string, token: string): Promise<void> {
    await api.delete(`/accounts/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
};

export const generateRandomString = (length: number) => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};
