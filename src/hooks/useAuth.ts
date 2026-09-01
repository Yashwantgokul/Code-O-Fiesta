'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export type User = {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'PARTICIPANT' | 'JUDGE';
  teamId: string | null;
  teamMember: string | null;
};

export type AuthState = {
  user: User | null;
  loading: boolean;
  error: string | null;
  authenticated: boolean;
};

const useAuth = () => {
  const router = useRouter();
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
    authenticated: false,
  });

  // Fetch current user
  const fetchUser = useCallback(async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));

      const response = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.user) {
          setAuthState({
            user: data.user,
            loading: false,
            error: null,
            authenticated: true,
          });
          return;
        }
      }
    } catch (apiError) {
      // Backend API offline
    }

    // Fallback: check sessionStorage
    if (typeof window !== 'undefined') {
      const sessionStr = sessionStorage.getItem('cof_session');
      if (sessionStr) {
        try {
          const session = JSON.parse(sessionStr);
          const userObj: User = session.user || {
            id: session.team?.id || 'team_team_014',
            name: session.team?.name || 'TEAM_014',
            email: 'team@test.com',
            role: session.role || 'PARTICIPANT',
            teamId: session.team?.id || 'team_team_014',
            teamMember: 'MEMBER_1',
          };
          setAuthState({
            user: userObj,
            loading: false,
            error: null,
            authenticated: true,
          });
          return;
        } catch (e) {
          // Invalid session JSON
        }
      }
    }

    setAuthState({
      user: null,
      loading: false,
      error: null,
      authenticated: false,
    });
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });

      setAuthState({
        user: null,
        loading: false,
        error: null,
        authenticated: false,
      });

      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      // Still redirect to login even if logout fails
      router.push('/login');
    }
  }, [router]);

  // Fetch user on mount
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return {
    ...authState,
    logout,
    refresh: fetchUser,
  };
};

export default useAuth;
