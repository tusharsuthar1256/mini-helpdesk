export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export interface Ticket {
  id: string;
  reference: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  createdBy: User;
  assignedTo: User | null;
  commentCount: number;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  author: User;
  body: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  event: string;
  ticket: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}
