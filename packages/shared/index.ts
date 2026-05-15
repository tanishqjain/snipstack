export interface User {
  id: string;
  email: string;
  name?: string;
}

export interface Snippet {
  id: string;
  title: string;
  description?: string;
  content: string;
  language: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  tags: Tag[];
}

export interface Tag {
  id: string;
  name: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}
