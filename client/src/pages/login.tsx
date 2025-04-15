import React from 'react';
import { Link, useLocation } from 'wouter';
import LoginForm from '@/components/LoginForm';
import { useAuth } from '@/lib/useAuth';

const LoginPage: React.FC = () => {
  const { userProfile, loading } = useAuth();
  const [_, setLocation] = useLocation();

  // Redirect to main page if already logged in
  React.useEffect(() => {
    if (userProfile && !loading) {
      setLocation('/');
    }
  }, [userProfile, loading, setLocation]);

  // Show loading indicator while checking auth status
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-netgray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex items-center justify-center bg-white p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="flex justify-center mb-6">
          <div className="text-center">
            <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center mx-auto mb-2">
              <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white">
                <path d="M32 16C23.2 16 16 23.2 16 32C16 36.1 17.4 39.9 19.7 42.9L17.5 48L23.3 46.1C26.2 48 29 49 32 49C40.8 49 48 41.8 48 33C48 24.2 40.8 16 32 16ZM39.7 39.7C39.2 40.7 37.4 41.6 36.5 41.7C35.6 41.8 34.8 42.1 30.5 40.4C25.2 38.3 22 33 21.8 32.7C21.6 32.4 19.8 30 19.8 27.5C19.8 25 21.1 23.8 21.5 23.3C21.9 22.8 22.5 22.7 22.8 22.7C23.1 22.7 23.5 22.7 23.8 22.7C24.1 22.7 24.5 22.6 24.9 23.5C25.3 24.4 26.2 26.9 26.3 27.1C26.4 27.3 26.5 27.5 26.3 27.8C26.1 28.1 26 28.3 25.8 28.5C25.6 28.7 25.3 29 25.1 29.2C24.9 29.4 24.7 29.6 24.9 30C25.1 30.4 26 31.9 27.4 33.1C29.2 34.6 30.7 35.1 31.1 35.3C31.5 35.5 31.7 35.4 32 35.1C32.3 34.8 33.1 33.9 33.4 33.5C33.7 33.1 34 33.2 34.4 33.3C34.8 33.4 37.3 34.6 37.7 34.8C38.1 35 38.4 35.1 38.5 35.3C38.6 35.7 38.6 36.6 38.1 37.6L39.7 39.7Z" fill="currentColor"/>
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-primary-dark">NetChat</h1>
          </div>
        </div>

        <LoginForm />

        <div className="text-center mt-6">
          <p className="text-netgray-500">
            Don't have an account? <Link href="/register" className="text-primary hover:underline">Register</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;