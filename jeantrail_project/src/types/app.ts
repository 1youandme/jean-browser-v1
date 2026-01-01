import React from 'react';
import { User, LoginData, RegisterData } from './auth';
import { Theme, ToastState, ModalState, LoadingState } from './ui';

// Context types
export interface AppContext {
  user: User | null;
  isAuthenticated: boolean;
  theme: Theme;
  language: string;
  notifications: ToastState[];
  modals: ModalState[];
  loading: LoadingState;
}

export interface AuthContext {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginData) => Promise<void>;
  logout: () => void;
  register: (userData: RegisterData) => Promise<void>;
  refreshToken: () => Promise<void>;
}

// Route types
export interface RouteConfig {
  path: string;
  component: React.ComponentType;
  exact?: boolean;
  protected?: boolean;
  roles?: string[];
  layout?: React.ComponentType;
}

export interface NavigationItem {
  id: string;
  label: string;
  path: string;
  icon?: React.ReactNode;
  badge?: number | string;
  children?: NavigationItem[];
  disabled?: boolean;
  external?: boolean;
}
