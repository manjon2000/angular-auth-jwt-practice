import { Role } from './roles.types';

export interface User {
  name: string;
  email: string;
  role: Role;
}
