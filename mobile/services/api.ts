import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000';
const TOKEN_KEY = 'dion_access_token';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export async function saveToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function deleteToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export interface AuthResponse {
  access_token: string;
}

export async function register(email: string, password: string): Promise<AuthResponse> {
  const res = await api.post<AuthResponse>('/auth/register', { email, password });
  return res.data;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const res = await api.post<AuthResponse>('/auth/login', { email, password });
  return res.data;
}

export async function getMe() {
  const res = await api.get('/auth/me');
  return res.data;
}

// ── Children ──────────────────────────────────────────────────────────────────

export interface Child {
  id: string;
  name: string;
  age: number;
  photo_url?: string;
}

export async function listChildren(): Promise<Child[]> {
  const res = await api.get<Child[]>('/children');
  return res.data;
}

export async function createChild(name: string, age: number): Promise<Child> {
  const res = await api.post<Child>('/children', { name, age });
  return res.data;
}

export async function getChild(id: string): Promise<Child> {
  const res = await api.get<Child>(`/children/${id}`);
  return res.data;
}

// ── Memories ──────────────────────────────────────────────────────────────────

export type MemoryType =
  | 'moment'
  | 'interest'
  | 'promise'
  | 'quote'
  | 'emotional_pattern'
  | 'milestone'
  | 'routine'
  | 'relationship';

export interface Memory {
  id: string;
  child_id: string;
  type: MemoryType;
  content: string;
  context?: string;
  timing?: string;
  weight: number;
  is_active: boolean;
  created_at: string;
}

export async function createMemory(payload: {
  child_id: string;
  type: MemoryType;
  content: string;
  context?: string;
  timing?: string;
}): Promise<Memory> {
  const res = await api.post<Memory>('/memories', payload);
  return res.data;
}

export async function listMemories(childId: string, type?: MemoryType): Promise<Memory[]> {
  const params = type ? { type } : {};
  const res = await api.get<Memory[]>(`/children/${childId}/memories`, { params });
  return res.data;
}

export async function getMemory(id: string): Promise<Memory> {
  const res = await api.get<Memory>(`/memories/${id}`);
  return res.data;
}

// ── Home ──────────────────────────────────────────────────────────────────────

export interface HomeContent {
  contextual_greeting: string;
  what_matters_headline: string;
  what_matters_support: string;
  promise_headline?: string;
  promise_support?: string;
  promise_soft_check?: string;
  reminder_headline?: string;
  reminder_support?: string;
  resurfacing_headline?: string;
  resurfacing_content?: string;
  reflection_cta: string;
  generated_at: string;
}

export async function getHome(childId: string): Promise<HomeContent> {
  const res = await api.get<HomeContent>(`/home/${childId}`);
  return res.data;
}

export async function refreshHome(childId: string): Promise<HomeContent> {
  const res = await api.post<HomeContent>(`/home/${childId}/refresh`);
  return res.data;
}

// ── Notifications ─────────────────────────────────────────────────────────────

export async function registerPushToken(expoToken: string): Promise<void> {
  await api.post('/notifications/token', { expo_token: expoToken });
}
