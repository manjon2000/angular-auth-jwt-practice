import { JwtPayload } from './jwt.types';

export interface Session {
  token: string;
  payload: JwtPayload;
}
