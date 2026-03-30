export type Role = 'customer' | 'agent' | 'admin';
export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedUsers {
  users: User[];
  total: number;
  page: number;
  limit: number;
}

export interface TicketAuthor {
  id: string;
  name: string;
  email?: string;
}

export interface Message {
  id: string;
  body: string;
  ticketId: string;
  authorId: string;
  isAiGenerated: boolean;
  createdAt: string;
  author: { id: string; name: string; role: Role };
}

export interface Ticket {
  id: string;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: string | null;
  customerId: string;
  assignedAgentId: string | null;
  createdAt: string;
  updatedAt: string;
  customer: TicketAuthor;
  assignedAgent: TicketAuthor | null;
  messages: Message[];
  _count?: { messages: number };
}

export interface PaginatedTickets {
  tickets: Ticket[];
  total: number;
  page: number;
  limit: number;
}
