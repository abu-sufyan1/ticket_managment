import { axiosInstance } from './axiosInstance';

export const polishReply = (ticketId: string, draft: string) =>
  axiosInstance
    .post<{ data: { polishedReply: string } }>(`/tickets/${ticketId}/polish-reply`, { draft })
    .then((r) => r.data.data.polishedReply);

export const summarizeTicket = (ticketId: string) =>
  axiosInstance
    .post<{ data: { summary: string } }>(`/tickets/${ticketId}/summarize`)
    .then((r) => r.data.data.summary);
