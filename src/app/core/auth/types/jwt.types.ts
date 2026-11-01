import { Role } from './roles.types';

export interface JwtPayload {
  sub: string;
  name: string;
  email: string;
  role: Role;
  exp: number;
}

export interface JwtResponse {
  token: string;
}
