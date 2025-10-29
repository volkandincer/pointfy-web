export interface RequireAuthProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export interface AuthUser {
  id: string;
  email?: string;
  name?: string;
}
