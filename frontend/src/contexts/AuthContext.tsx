import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing token on mount
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
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

    const { user, token } = response.data.data;
    
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    
    await mergeCart();
    setUser(user);
    return response.data;
  };

  const verifyOTP = async (userId: string, otp: string) => {
      const response = await authAPI.verify2FA(userId, otp);
      const { user, token } = response.data.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      await mergeCart();
      setUser(user);
  };

  const googleLogin = async (credential: string) => {
    const response = await authAPI.googleLogin(credential);
    const { user, token } = response.data.data;
    
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));

    await mergeCart();
    setUser(user);
  };

  const register = async (data: { username: string; email: string; password: string; full_name?: string }) => {
    const response = await authAPI.register(data);
    const { user, token } = response.data.data;
    
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));

    await mergeCart();
    setUser(user);
  };

  const logout = () => {
    localStorage.removeItem('token');
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
