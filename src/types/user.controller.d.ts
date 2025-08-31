export interface CreateUserResponse {
  message: string;
  user_id: string;
}

export interface UserPayload {
  id: number;
  email: string;
}