import type { Request } from 'express';

export interface RequestWithUser extends Request {
  user: {
    userId: string;
    id: string;
    email: string;
    role: string;
  };
}
