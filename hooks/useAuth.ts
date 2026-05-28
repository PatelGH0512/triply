import { useAuthStore } from '@/store/authStore';

export function useAuth() {
  const { user, session, setUser, setSession, clearAuth } = useAuthStore();

  const isAuthenticated = !!session;

  return {
    user,
    session,
    isAuthenticated,
    setUser,
    setSession,
    clearAuth,
  };
}
