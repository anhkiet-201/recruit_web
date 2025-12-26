export interface RequestWithUser {
  user: {
    userId: string;
    id: string;
    email: string;
    role: string;
  };
}
