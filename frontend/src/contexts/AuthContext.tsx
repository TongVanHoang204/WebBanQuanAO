import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { User } from '../types';
import { authAPI, cartAPI } from '../services/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<any>;
  verifyOTP: (userId: string, otp: string) => Promise<void>;
  googleLogin: (credential: string) => Promise<void>;
  register: (data: { username: string; email: string; password: string; full_name?: string }) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const hasInitializedAuth = useRef(false);

  useEffect(() => {
    if (hasInitializedAuth.current) {
      return;
    }
    hasInitializedAuth.current = true;

    const initializeAuth = async () => {
      const cachedUser = localStorage.getItem('user');
      if (cachedUser) {
        try {
          setUser(JSON.parse(cachedUser));
        } catch {
          localStorage.removeItem('user');
        }
      }

      try {
        const response = await authAPI.getMe({ skipAuthRedirect: true });
        const user = response.data.data || response.data;
        
        setUser(user);
        localStorage.setItem('user', JSON.stringify(user));
      } catch (error: any) {
        if (error?.response?.status !== 401) {
          console.error('Auth initialization failed:', error);
        }
        localStorage.removeItem('user');
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const mergeCart = async () => {
     const sessionId = localStorage.getItem('sessionId');
     if (sessionId) {
        try {
           await cartAPI.merge(sessionId);
        } catch (error) {
           console.error("Failed to merge cart", error);
        }
     }
  };

  const login = async (username: string, password: string) => {
    const response = await authAPI.login(username, password);
    
    // Check for 2FA
    if (response.data.require2fa) {
       return response.data;
    }

    const { user } = response.data.data;
    localStorage.setItem('user', JSON.stringify(user));
    
    await mergeCart();
    setUser(user);
    return response.data;
  };

  const verifyOTP = async (userId: string, otp: string) => {
      const response = await authAPI.verify2FA(userId, otp);
      const { user } = response.data.data;

      localStorage.setItem('user', JSON.stringify(user));

      await mergeCart();
      setUser(user);
  };

  const googleLogin = async (credential: string) => {
    const response = await authAPI.googleLogin(credential);
    const { user } = response.data.data;
    
    localStorage.setItem('user', JSON.stringify(user));

    await mergeCart();
    setUser(user);
  };

  const register = async (data: { username: string; email: string; password: string; full_name?: string }) => {
    const response = await authAPI.register(data);
    const { user } = response.data.data;
    
    localStorage.setItem('user', JSON.stringify(user));

    await mergeCart();
    setUser(user);
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout request failed:', error);
    }
    localStorage.removeItem('user');
    setUser(null);
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        isLoading,
        login,
        verifyOTP,
        googleLogin,
        register,
        logout,
        updateUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
