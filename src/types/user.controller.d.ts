export interface CreateUserRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  gender: 'MALE' | 'FEMALE' | 'RATHER_NOT_SAY';
  role: 'ROLE' | 'FACILITATOR' | 'STUDENT' | 'ADMIN' | 'SUPER_ADMIN';
  status?: 'ACTIVE' | 'INACTIVE' | 'DELETED';
  country: string;
  profile_image: string;
  date_of_birth?: Date;
}

export interface CreateUserResponse {
  message: string;
  user_id: string;
}

export interface UserPayload {
  id: number;
  email: string;
}