import { useState, useEffect, createContext, useContext } from 'react';
import { auth, loginUser, registerUser, logoutUser, updateUserProfile, uploadProfileImage } from './firebase';
import { User as FirebaseUser } from 'firebase/auth';
import { User } from '@/types';
import { useQueryClient } from '@tanstack/react-query';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<FirebaseUser>;
  register: (email: string, password: string, username: string) => Promise<FirebaseUser>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  uploadAvatar: (file: File) => Promise<string>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setCurrentUser(user);
      
      if (user) {
        try {
          // Convert Firebase user to our User type
          const userData = {
            id: parseInt(user.uid.substring(0, 8), 16) || Math.floor(Math.random() * 100000), // Generate a number ID from UID
            username: user.displayName || '',
            email: user.email || '',
            profilePicture: user.photoURL || undefined,
            about: 'Available',
            createdAt: new Date()
          };
          
          setUserProfile(userData);
        } catch (error) {
          console.error("Error setting user profile:", error);
          setUserProfile(null);
        }
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    setError(null);
    try {
      const user = await loginUser(email, password);
      return user;
    } catch (err: any) {
      setError(err.message || 'Failed to login');
      throw err;
    }
  };

  const register = async (email: string, password: string, username: string) => {
    setError(null);
    try {
      const user = await registerUser(email, password, username);
      return user;
    } catch (err: any) {
      setError(err.message || 'Failed to register');
      throw err;
    }
  };

  const logout = async () => {
    setError(null);
    try {
      await logoutUser();
      queryClient.clear();
    } catch (err: any) {
      setError(err.message || 'Failed to logout');
      throw err;
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    setError(null);
    if (!currentUser) {
      setError('No user logged in');
      throw new Error('No user logged in');
    }
    
    try {
      await updateUserProfile(currentUser.uid, data);
      
      if (userProfile) {
        setUserProfile({
          ...userProfile,
          ...data
        });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
      throw err;
    }
  };

  const uploadAvatar = async (file: File) => {
    setError(null);
    if (!currentUser) {
      setError('No user logged in');
      throw new Error('No user logged in');
    }
    
    try {
      const downloadURL = await uploadProfileImage(currentUser.uid, file);
      
      if (userProfile) {
        setUserProfile({
          ...userProfile,
          profilePicture: downloadURL
        });
      }
      
      return downloadURL;
    } catch (err: any) {
      setError(err.message || 'Failed to upload avatar');
      throw err;
    }
  };

  const value = {
    currentUser,
    userProfile,
    loading,
    error,
    login,
    register,
    logout,
    updateProfile,
    uploadAvatar
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
