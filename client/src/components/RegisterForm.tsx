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
    <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-100">
      <h2 className="whatsapp-form-title flex items-center justify-center mb-6">
        <svg viewBox="0 0 32 32" className="h-7 w-7 mr-2 text-[#25d366]" fill="currentColor">
          <path d="M16 2C8.28 2 2 8.28 2 16C2 19.89 3.54 23.44 6.06 26.03L3.83 30.17L8.39 28.23C10.45 29.32 13.14 30 16 30C23.72 30 30 23.72 30 16C30 8.28 23.72 2 16 2ZM22.58 20.92C22.29 21.76 21.04 22.41 20.09 22.59C19.42 22.71 18.55 22.8 15.21 21.5C11.05 19.90 8.39 15.68 8.18 15.39C7.97 15.11 6.74 13.45 6.74 11.73C6.74 10.01 7.59 9.19 7.97 8.8C8.29 8.48 8.81 8.33 9.31 8.33C9.47 8.33 9.62 8.34 9.75 8.35C10.13 8.36 10.32 8.39 10.57 9.05C10.89 9.89 11.72 11.61 11.83 11.83C11.93 12.05 12.04 12.35 11.9 12.64C11.76 12.94 11.64 13.08 11.42 13.33C11.2 13.59 10.99 13.79 10.77 14.06C10.57 14.3 10.33 14.56 10.59 15C10.84 15.44 11.67 16.77 12.88 17.85C14.43 19.22 15.7 19.67 16.21 19.87C16.58 20.02 17.02 19.99 17.27 19.71C17.59 19.34 17.98 18.71 18.38 18.1C18.67 17.67 19.04 17.61 19.43 17.76C19.81 17.9 21.53 18.75 21.94 18.95C22.35 19.16 22.63 19.26 22.73 19.43C22.83 19.6 22.83 20.34 22.58 20.92Z"/>
        </svg>
        Create Account
      </h2>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex justify-center mb-6">
          <div className="relative group">
            <div className="h-24 w-24 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border-2 border-[#25d366] cursor-pointer">
              {profilePreview ? (
                <img src={profilePreview} alt="Profile preview" className="h-full w-full object-cover" />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              )}
            </div>
            <input 
              type="file" 
              id="profilePicture" 
              className="absolute inset-0 opacity-0 cursor-pointer" 
              accept="image/*"
              onChange={handleImageChange}
            />
            <div className="absolute bottom-0 right-0 bg-[#128c7e] text-white rounded-full p-2 shadow">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path>
                <circle cx="12" cy="13" r="3"></circle>
              </svg>
            </div>
          </div>
        </div>
        
        <div>
          <Input
            id="username"
            className="whatsapp-form-input"
            placeholder="Username"
            {...register('username')}
          />
          {errors.username && (
            <p className="mt-1 text-sm text-red-500">{errors.username.message}</p>
          )}
        </div>
        
        <div>
          <Input
            id="email"
            type="email"
            className="whatsapp-form-input"
            placeholder="Email address"
            {...register('email')}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
          )}
        </div>
        
        <div>
          <Input
            id="password"
            type="password"
            className="whatsapp-form-input"
            placeholder="Password (minimum 6 characters)"
            {...register('password')}
          />
          {errors.password && (
            <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
          )}
        </div>
        
        <Button
          type="submit"
          disabled={isSubmitting}
          className="whatsapp-form-button"
        >
          {isSubmitting ? 'CREATING ACCOUNT...' : 'REGISTER'}
        </Button>
      </form>
      
      <div className="mt-8 pt-6 border-t border-gray-200 text-center text-[#075e54] text-xs">
        <p className="mb-1">By registering, you agree to our <a href="#" className="underline">Terms of Service</a></p>
        <p>Your chats are secured with end-to-end encryption</p>
      </div>
    </div>
  );
};

export default RegisterForm;
