import {UserRole} from './user-role';

export interface UserDTO {
  id: number;
  publicId: string;
  username: string;
  firstname?: string;
  lastname?: string;
  email: string;
  phoneNumber?: string;
  userRoles: UserRole[];
  enabled: boolean;
  createdAt: Date;
}
