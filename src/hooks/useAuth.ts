import { useState } from 'react';
import { useRouter } from 'next/navigation';

export const useAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  /**
   * Helper to handle API calls to our internal Next.js routes
   */
  const handleRequest = async (endpoint: string, body: any) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/auth/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // 1. LOGIN
  const login = async (credentials: any) => {
    await handleRequest('login', credentials);
    router.push('/dashboard'); // Redirect on success
  };

  // 2. SIGNUP
  const signup = async (userData: any) => {
    return await handleRequest('signup', userData);
        router.push('/login'); // Redirect on success

  };

  // 3. VERIFY EMAIL (OTP)
  const verifyEmail = async (email: string, otp: string) => {
    await handleRequest('verify-email', { email, otp });
  };

  // 4. FORGOT PASSWORD (Request OTP)
  const forgotPassword = async (email: string) => {
    return await handleRequest('forgot-password', { email });
  };

  // 5. VERIFY RESET OTP
  const verifyResetOtp = async (email: string, otp: string) => {
    return await handleRequest('verify-reset-otp', { email, otp });
  };

  // 6. RESET PASSWORD (Final Step)
  const resetPassword = async (passwordData: any) => {
    await handleRequest('reset-password', passwordData);
    router.push('/login');
  };

  // 7. LOGOUT
  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  return {
    login,
    signup,
    verifyEmail,
    forgotPassword,
    verifyResetOtp,
    resetPassword,
    logout,
    isLoading,
    error,
  };
};