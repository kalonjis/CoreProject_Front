import {UserRole} from './user-role';

export interface User {
  id: number;
  username: string;
  firstname?: string;
  lastname?: string;
  email: string;
  phoneNumber?: string;
  userRoles: UserRole[];
}
