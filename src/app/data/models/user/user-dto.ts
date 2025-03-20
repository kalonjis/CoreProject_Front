import {UserRole} from './user-role';

export interface UserDTO {
  id: number;
  username: string;
  firstname?: string;
  lastname?: string;
  email: string;
  phoneNumber?: string;
  userRoles: UserRole[];
}
