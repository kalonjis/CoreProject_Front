import {UserRole} from './user-role';

export interface UserShortDTO {
  id: number;
  username: string;
  email: string;
  phoneNumber?: string;
  userRoles: UserRole[];
}
