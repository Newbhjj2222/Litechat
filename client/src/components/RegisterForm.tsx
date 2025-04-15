import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/useAuth';
import { uploadProfileImage } from '@/lib/firebase';
import { useLocation } from 'wouter';

// Define the register form schema
const registerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

const RegisterForm = () => {
  const { register: registerUser } = useAuth();
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const [profileFile, setProfileFile] = useState<File | null>(null);
  
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
    },
  });
  
  const { register, handleSubmit, formState: { errors, isSubmitting } } = form;
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setProfilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const onSubmit = async (data: RegisterFormValues) => {
    try {
      console.log('Attempting registration for:', data.email);
      const user = await registerUser(data.email, data.password, data.username);
      
      // Handle profile picture upload
      if (profileFile && user) {
        try {
          await uploadProfileImage(user.uid, profileFile);
          console.log('Profile picture uploaded successfully');
        } catch (uploadError) {
          console.error('Error uploading profile picture:', uploadError);
          // Continue with registration even if picture upload fails
        }
      }
      
      toast({
        title: 'Registration successful',
        description: 'Welcome to NetChat!',
      });
      
      // Short delay to allow auth state to propagate
      setTimeout(() => {
        setLocation('/');
      }, 500);
    } catch (error: any) {
      console.error('Registration error:', error);
      let errorMessage = 'An error occurred during registration';
      
      // Handle specific Firebase auth errors
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already registered. Please use a different email.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address format.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please use a stronger password.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your connection.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: 'Registration failed',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="flex justify-center mb-4">
        <div className="relative group">
          <div className="h-24 w-24 rounded-full bg-netgray-200 flex items-center justify-center overflow-hidden border-2 border-primary cursor-pointer">
            {profilePreview ? (
              <img src={profilePreview} alt="Profile preview" className="h-full w-full object-cover" />
            ) : (
              <i className="fas fa-user text-netgray-400 text-4xl" aria-hidden="true">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              </i>
            )}
          </div>
          <input 
            type="file" 
            id="profilePicture" 
            className="absolute inset-0 opacity-0 cursor-pointer" 
            accept="image/*"
            onChange={handleImageChange}
          />
          <div className="absolute bottom-0 right-0 bg-primary-light text-white rounded-full p-2 shadow">
            <i className="fas fa-camera" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path><circle cx="12" cy="13" r="3"></circle></svg>
            </i>
          </div>
        </div>
      </div>
      
      <div>
        <label htmlFor="username" className="block text-sm font-medium text-netgray-600 mb-1">
          Username
        </label>
        <Input
          id="username"
          className="w-full p-3 border border-netgray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="Choose a username"
          {...register('username')}
        />
        {errors.username && (
          <p className="mt-1 text-sm text-red-500">{errors.username.message}</p>
        )}
      </div>
      
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
          placeholder="Create a password"
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
        {isSubmitting ? 'Registering...' : 'Register'}
      </Button>
    </form>
  );
};

export default RegisterForm;
