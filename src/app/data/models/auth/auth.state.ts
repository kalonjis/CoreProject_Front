import {User} from '../user/user';
import {Device} from '../device/device';

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  currentDevice: Device | null;
}
