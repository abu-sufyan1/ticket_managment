import { axiosInstance } from './axiosInstance';
import type { AuthResponse } from '../types';

export const registerUser = (data: { name: string; email: string; password: string }) =>
  axiosInstance
    .post<{ data: AuthResponse }>('/auth/register', data)
    .then((r) => r.data.data);

export const loginUser = (data: { email: string; password: string }) =>
  axiosInstance
    .post<{ data: AuthResponse }>('/auth/login', data)
    .then((r) => r.data.data);
