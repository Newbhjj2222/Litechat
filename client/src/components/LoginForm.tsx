import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/useAuth';
import { useLocation } from 'wouter';

// Define the login form schema
const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const LoginForm = () => {
  const { login } = useAuth();
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });
  
  const { register, handleSubmit, formState: { errors, isSubmitting } } = form;
  
  const onSubmit = async (data: LoginFormValues) => {
    try {
      console.log('Attempting login with:', data.email);
      await login(data.email, data.password);
      
      toast({
        title: 'Login successful',
        description: 'Welcome back to NetChat!',
      });
      
      // Short delay to allow auth state to propagate
      setTimeout(() => {
        setLocation('/');
      }, 500);
    } catch (error: any) {
      console.error('Login error:', error);
      let errorMessage = 'Please check your credentials and try again';
      
      // Handle specific Firebase auth errors
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        errorMessage = 'Invalid email or password';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed login attempts. Please try again later.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your connection.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: 'Login failed',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-netgray-600 mb-1">
          Email
        </label>
        <Input
          id="email"
          type="email"
          className="w-full p-3 border border-netgray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="Enter your email"
          {...register('email')}
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
        )}
      </div>
      
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-netgray-600 mb-1">
          Password
        </label>
        <Input
          id="password"
          type="password"
          className="w-full p-3 border border-netgray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="Enter your password"
          {...register('password')}
        />
        {errors.password && (
          <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
        )}
      </div>
      
      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-primary hover:bg-primary-dark text-white font-semibold p-3 rounded-md transition-colors duration-300"
      >
        {isSubmitting ? 'Logging in...' : 'Log In'}
      </Button>
    </form>
  );
};

export default LoginForm;
