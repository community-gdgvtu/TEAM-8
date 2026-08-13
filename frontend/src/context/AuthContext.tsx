import React, { createContext, useContext, useEffect, useState } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, details?: { name?: string; role?: string; phone?: string; assignedArea?: string }) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session from localStorage
    const getInitialSession = async () => {
      try {
        const storedToken = localStorage.getItem('auth_token');
        const storedUser = localStorage.getItem('user_data');

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);

      const { loginUser } = await import('../lib/api');
      const response = await loginUser(email, password);
      if (response && response.error) {
        return { error: response.error };
      }

      if (response && response.token && response.user) {
        setToken(response.token);
        setUser(response.user);

        // Store in localStorage
          try {
            localStorage.setItem('auth_token', response.token);
            localStorage.setItem('user_data', JSON.stringify(response.user));
          } catch (err) {
            console.error('Failed to write session to localStorage:', err);
          }

        return {};
      } else {
        return { error: 'Invalid response from server' };
      }
    } catch (error: any) {
      return { error: error.message || 'Login failed' };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, details?: { name?: string; role?: string; phone?: string; assignedArea?: string }) => {
    try {
      setLoading(true);

      const { registerUser } = await import('../lib/api');

      // Build payload compatible with backend
      const payload = {
        name: details?.name || '',
        email,
        password,
        role: details?.role || 'citizen',
        phone: details?.phone,
        assignedArea: details?.assignedArea,
      };

      const response = await registerUser(payload);

      if (response.message === 'User registered successfully') {
        // Auto login after successful registration
        return await signIn(email, password);
      } else {
        return { error: 'Registration failed' };
      }
    } catch (error: any) {
      return { error: error.message || 'Registration failed' };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      setUser(null);
      setToken(null);

      // Clear localStorage
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    token,
    loading,
    signIn,
    signUp,
    signOut,
    isAuthenticated: !!user && !!token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
