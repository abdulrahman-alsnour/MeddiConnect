import React, { createContext, useContext, useState, ReactNode } from 'react';

export type UserType = 'patient' | 'doctor' | 'admin' | null;

interface User {
  type: UserType;
  token: string;
  username?: string;
  id?: number;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (userType: UserType, token: string, username?: string, id?: number) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    // Initialize from localStorage if available
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const login = (userType: UserType, token: string, username?: string, id?: number) => {
    const userData = {
      type: userType,
      token,
      username,
      id,
    };
    setUser(userData);
    // Persist to localStorage
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    // Clear localStorage
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated: user !== null, 
      user, 
      login, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 