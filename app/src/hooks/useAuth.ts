import type { UserInputType, UserType } from "@project/types";
import pb from "@/pb";
import { useState, useEffect, useCallback } from "react";

const useAuth = () => {
  const [user, setUser] = useState<UserType | null>(pb.authStore.model as UserType | null);
  const [isLoading, setIsLoading] = useState(true);

  const Login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const authData = await pb.collection("Users").authWithPassword(email, password);
      if (authData) {
        setUser(authData.record);
        return true;
      }
    } catch (error) {
      console.error("Error logging in:", error);
    } finally {
      setIsLoading(false);
    }
    return false;
  };

  const refreshAuthData = async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      if (!pb.authStore.isValid) return false;
      setUser((await pb.collection("Users").authRefresh()).record);
      return true;
    } catch (error) {
      console.error("Error refreshing auth data:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const SignUpNewUser = async (newUserData: UserInputType) => {
    setIsLoading(true);
    try {
      const newUser = await pb.collection("Users").create(newUserData);
      if (!newUser) {
        return false;
      }
      const loginSuccess = await Login(newUserData.email, newUserData.password);
      return loginSuccess;
    } catch (error) {
      console.error("Error during sign up:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const Logout = async () => {
    setIsLoading(true);
    try {
      await pb.authStore.clear();
      setUser(null);
      window.location.reload();
    } finally {
      setIsLoading(false);
    }
  };

  // Check if user has a specific permission
  const hasPermission = useCallback(
    (_permission: string): boolean => {
      if (!user) return false;
      return true;
    },
    [user]
  );

  // Initial auth check
  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);
      try {
        // Check if we have a valid auth session
        if (pb.authStore.isValid) {
          // Refresh the user data if needed
          setUser(pb.authStore.model as UserType);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Auth check error:", error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  return {
    user,
    isLoading,
    Login,
    Logout,
    SignUpNewUser,
    hasPermission,
    isAuthenticated: !!user,
    refreshAuthData,
  };
};

export default useAuth;
