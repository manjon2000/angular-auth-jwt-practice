import { Role } from '../../types';

interface FakeUser {
  id: string;
  email: string;
  password: string;
  name: string;
  role: Role;
  tokenLifetimeSeconds: number;
}

const TOKEN_LIFETIME_SECONDS = 24 * 60 * 60;

export const SERVER_ERROR_EMAIL = 'fail@test.com';

export const FAKE_USERS: readonly FakeUser[] = [
  {
    id: 'fake-admin',
    email: 'admin@test.com',
    password: '1234',
    name: 'Admin',
    role: 'ADMIN',
    tokenLifetimeSeconds: TOKEN_LIFETIME_SECONDS,
  },
  {
    id: 'fake-user',
    email: 'user@test.com',
    password: '1234',
    name: 'User',
    role: 'USER',
    tokenLifetimeSeconds: TOKEN_LIFETIME_SECONDS,
  },
  {
    id: 'fake-expired',
    email: 'expired@test.com',
    password: '1234',
    name: 'Expired',
    role: 'USER',
    tokenLifetimeSeconds: -TOKEN_LIFETIME_SECONDS,
  },
];
