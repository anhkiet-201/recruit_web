export interface UserDto {
  id: string;
  email: string;
  name: string | null;
  role: string;
  [key: string]: any;
}

export interface LoginResponseDto {
  access_token: string;
  user: {
    id: string;
    email: string;
    name: string | null;
    role: string;
  };
}
