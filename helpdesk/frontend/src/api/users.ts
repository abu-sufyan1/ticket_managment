import { axiosInstance } from './axiosInstance';
import type { User, PaginatedUsers } from '../types';

export const getUsers = (page = 1, limit = 20) =>
  axiosInstance
    .get<{ data: PaginatedUsers }>('/users', { params: { page, limit } })
    .then((r) => r.data.data);

export const createUser = (data: { name: string; email: string; password: string; role: string }) =>
  axiosInstance.post<{ data: User }>('/users', data).then((r) => r.data.data);

export const updateUser = (id: string, data: { name?: string; email?: string; role?: string }) =>
  axiosInstance.put<{ data: User }>(`/users/${id}`, data).then((r) => r.data.data);

export const deleteUser = (id: string) =>
  axiosInstance.delete(`/users/${id}`).then((r) => r.data);
