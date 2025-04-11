import { UserRole } from '../user/user-role';

export interface UserRegisterForm {
  username: string;
  firstname: string;
  lastname: string;
  email: string;
  phoneNumber: string;
  userRoles: UserRole[];
}
