import { axiosInstance } from './axiosInstance';
import type { Ticket, PaginatedTickets, Message } from '../types';

export const createTicket = (data: { subject: string; description: string; priority: string }) =>
  axiosInstance.post<{ data: Ticket }>('/tickets', data).then((r) => r.data.data);

export const getMyTickets = (page = 1, limit = 20) =>
  axiosInstance
    .get<{ data: PaginatedTickets }>('/tickets/mine', { params: { page, limit } })
    .then((r) => r.data.data);

export interface TicketFilters {
  page?: number;
  limit?: number;
  status?: string;
  priority?: string;
  assignedAgentId?: string;
  search?: string;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

export const getTickets = (filters: TicketFilters = {}) =>
  axiosInstance
    .get<{ data: PaginatedTickets }>('/tickets', { params: filters })
    .then((r) => r.data.data);

export const getTicket = (id: string) =>
  axiosInstance.get<{ data: Ticket }>(`/tickets/${id}`).then((r) => r.data.data);

export const updateTicket = (
  id: string,
  data: { status?: string; priority?: string; assignedAgentId?: string | null; category?: string }
) =>
  axiosInstance.put<{ data: Ticket }>(`/tickets/${id}`, data).then((r) => r.data.data);

export const assignTicket = (id: string) =>
  axiosInstance.post<{ data: Ticket }>(`/tickets/${id}/assign`).then((r) => r.data.data);

export const createMessage = (ticketId: string, body: string) =>
  axiosInstance
    .post<{ data: Message }>(`/tickets/${ticketId}/messages`, { body })
    .then((r) => r.data.data);
