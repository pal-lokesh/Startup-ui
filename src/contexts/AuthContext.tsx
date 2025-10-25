import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthContextType, AuthUser, SignupRequest } from '../types';
import AuthService from '../services/authService';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const initializeAuth = () => {
      const storedUser = AuthService.getCurrentUser();
      const storedToken = AuthService.getToken();
      
      if (storedUser && storedToken) {
        setUser(storedUser);
        setToken(storedToken);
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (phoneNumber: string, password: string): Promise<AuthUser> => {
    try {
      const response = await AuthService.login({ phoneNumber, password });
      const userData: AuthUser = {
        userId: response.userId,
        phoneNumber: response.phoneNumber,
        email: response.email,
        firstName: response.firstName,
        lastName: response.lastName,
        userType: response.userType,
        role: response.role
      };
      
      setUser(userData);
      setToken(response.token);
      return userData;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const signup = async (signupData: SignupRequest): Promise<void> => {
    try {
      await AuthService.signup(signupData);
      // After successful signup, automatically log in the user
      await login(signupData.phoneNumber, signupData.password);
    } catch (error) {
      console.error('Signup failed:', error);
      throw error;
    }
  };

  const logout = (): void => {
    AuthService.logout();
    setUser(null);
    setToken(null);
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    signup,
    logout,
    isAuthenticated: !!user && !!token,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
